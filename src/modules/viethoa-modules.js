const fs = require('fs-extra');
const yaml = require('js-yaml');
const path = require('path');
const axios = require('axios');
const chalk = require('chalk');
const { getGeminiApiKeys, getConfigValue } = require('./config-loader');

const MAX_CHUNK_SIZE = getConfigValue('max_chunk_size', 3000); // Tăng chunk size
const MAX_CONCURRENT_CHUNKS = getConfigValue('max_concurrent_chunks', 5); // Tăng concurrent
const REQUEST_TIMEOUT = getConfigValue('timeout', 90000); // Giảm timeout
const MAX_RETRIES_PER_KEY = getConfigValue('max_retries_per_key', 3);
const RETRY_DELAY_MS = getConfigValue('retry_delay_ms', 1000);
const CHUNK_OVERLAP = getConfigValue('chunk_overlap', 2); // Chunk overlap để tránh mất context

// Cache để tránh dịch lại nội dung trùng lặp
const translationCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 phút

// API key rotation với trạng thái
class ApiKeyManager {
    constructor(apiKeys) {
        this.apiKeys = apiKeys.map(key => ({ key, available: true, lastUsed: 0, rateLimitUntil: 0 }));
        this.keyIndex = 0;
    }

    getNextKey() {
        const now = Date.now();
        const availableKeys = this.apiKeys.filter(k => 
            k.available && now >= k.rateLimitUntil
        );

        if (availableKeys.length === 0) {
            throw new Error('No available API keys');
        }

        availableKeys.sort((a, b) => a.lastUsed - b.lastUsed);
        const selectedKey = availableKeys[0];
        selectedKey.lastUsed = now;
        this.keyIndex = (this.keyIndex + 1) % this.apiKeys.length;
        
        return selectedKey.key;
    }

    markKeyUnavailable(key, durationMs = 60000) {
        const keyObj = this.apiKeys.find(k => k.key === key);
        if (keyObj) {
            keyObj.available = false;
            keyObj.rateLimitUntil = Date.now() + durationMs;
            
            setTimeout(() => {
                keyObj.available = true;
            }, durationMs);
        }
    }

    getAvailableKeyCount() {
        const now = Date.now();
        return this.apiKeys.filter(k => k.available && now >= k.rateLimitUntil).length;
    }
}

/**
 * Advanced concurrency limiter với priority queue
 */
class AdvancedConcurrencyLimiter {
    constructor(maxConcurrency) {
        this.maxConcurrency = maxConcurrency;
        this.active = new Set();
        this.queue = [];
        this.paused = false;
    }

    async run(task, priority = 0) {
        return new Promise((resolve, reject) => {
            const job = { task, priority, resolve, reject };
            
            let index = this.queue.findIndex(j => j.priority < priority);
            if (index === -1) index = this.queue.length;
            this.queue.splice(index, 0, job);
            
            this._processQueue();
        });
    }

    pause() {
        this.paused = true;
    }

    resume() {
        this.paused = false;
        this._processQueue();
    }

    async _processQueue() {
        if (this.paused || this.active.size >= this.maxConcurrency || this.queue.length === 0) {
            return;
        }

        const job = this.queue.shift();
        this.active.add(job);

        try {
            const result = await job.task();
            job.resolve(result);
        } catch (error) {
            job.reject(error);
        } finally {
            this.active.delete(job);
            this._processQueue();
        }
    }

    getQueueSize() {
        return this.queue.length;
    }

    getActiveCount() {
        return this.active.size;
    }
}

/**
 * Smart chunking với overlap và context preservation
 */
function smartSplitIntoChunks(text, maxChunkSize = MAX_CHUNK_SIZE, overlap = CHUNK_OVERLAP) {
    if (text.length <= maxChunkSize) return [text];
    
    const chunks = [];
    const lines = text.split('\n');
    let currentChunk = '';
    let currentLineCount = 0;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        if (line.length > maxChunkSize) {
            if (currentChunk.length > 0) {
                chunks.push(currentChunk);
                currentChunk = '';
                currentLineCount = 0;
            }
            
            let remainingLine = line;
            while (remainingLine.length > 0) {
                const chunkPart = remainingLine.substring(0, maxChunkSize);
                chunks.push(chunkPart);
                remainingLine = remainingLine.substring(maxChunkSize);
            }
            continue;
        }
        
        if (currentChunk.length + line.length + 1 > maxChunkSize && currentChunk.length > 0) {
            let overlapText = '';
            let overlapCount = 0;
            
            for (let j = Math.max(0, i - overlap); j < i && overlapCount < overlap; j++) {
                if (lines[j]) {
                    overlapText += (overlapText ? '\n' : '') + lines[j];
                    overlapCount++;
                }
            }
            
            chunks.push(currentChunk);

            currentChunk = overlapText;
            currentLineCount = overlapCount;
        }
        
        if (currentChunk.length > 0) {
            currentChunk += '\n' + line;
            currentLineCount++;
        } else {
            currentChunk = line;
            currentLineCount = 1;
        }
    }
    
    if (currentChunk.length > 0) {
        chunks.push(currentChunk);
    }
    
    console.log(chalk.cyan(`✂️ Smart split: ${lines.length} lines → ${chunks.length} chunks with ${overlap} line overlap`));
    return chunks;
}

/**
 * Improved API call với circuit breaker pattern
 */
async function makeGeminiRequest(apiKeyManager, prompt, chunkIndex, maxRetries = MAX_RETRIES_PER_KEY) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        let apiKey;
        try {
            apiKey = apiKeyManager.getNextKey();
            console.log(chalk.blue(`🔤 [Chunk ${chunkIndex}] Attempt ${attempt}/${maxRetries} with API key ${apiKey.slice(0, 8)}...`));

            const cacheKey = `chunk_${chunkIndex}_${hashString(prompt)}`;
            const cached = translationCache.get(cacheKey);
            if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
                console.log(chalk.green(`💾 [Chunk ${chunkIndex}] Using cached translation`));
                return cached.result;
            }

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

            const response = await axios.post(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
                {
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.1,
                        topP: 0.9,
                        topK: 32,
                        maxOutputTokens: 8192,
                    }
                },
                { 
                    signal: controller.signal,
                    headers: { 
                        'Content-Type': 'application/json',
                        'User-Agent': 'Minecraft-Translator-Bot/2.0-Optimized'
                    },
                    timeout: REQUEST_TIMEOUT 
                }
            );

            clearTimeout(timeoutId);

            if (response.status === 200 && response.data.candidates?.[0]?.content?.parts?.[0]?.text) {
                const result = response.data.candidates[0].content.parts[0].text;
                
                translationCache.set(cacheKey, {
                    result,
                    timestamp: Date.now()
                });
                
                if (translationCache.size > 1000) {
                    const oldestKey = translationCache.keys().next().value;
                    translationCache.delete(oldestKey);
                }
                
                return result;
            } else {
                throw new Error(`Invalid response structure from API`);
            }
            
        } catch (error) {
            lastError = error;
            
            if (error.response) {
                const status = error.response.status;
                const errorMessage = error.response.data?.error?.message || error.message;
                
                console.error(chalk.red(`❌ [Chunk ${chunkIndex}] API Error (Attempt ${attempt}/${maxRetries}):`), {
                    status,
                    message: errorMessage.slice(0, 100)
                });

                if (status === 429 || status === 503) {
                    if (apiKey) {
                        const backoffTime = status === 429 ? 120000 : 30000;
                        apiKeyManager.markKeyUnavailable(apiKey, backoffTime);
                        console.log(chalk.yellow(`⏸️ [Chunk ${chunkIndex}] Key temporarily disabled for ${backoffTime/1000}s`));
                    }
                } else if (status === 400) {
                    console.log(chalk.yellow(`⚠️ [Chunk ${chunkIndex}] Bad request, skipping retry`));
                    break;
                } else if (status === 401) {
                    if (apiKey) {
                        apiKeyManager.markKeyUnavailable(apiKey, 24 * 60 * 60 * 1000);
                        console.log(chalk.red(`🔐 [Chunk ${chunkIndex}] API Key invalid, disabled for 24h`));
                    }
                }
            } else if (error.code === 'ECONNABORTED' || error.name === 'AbortError') {
                console.error(chalk.red(`⏰ [Chunk ${chunkIndex}] Timeout (Attempt ${attempt})`));
            } else {
                console.error(chalk.red(`🌐 [Chunk ${chunkIndex}] Network Error (Attempt ${attempt}):`), error.message);
            }

            if (attempt < maxRetries) {
                const availableKeys = apiKeyManager.getAvailableKeyCount();
                if (availableKeys === 0) {
                    console.log(chalk.yellow(`⏳ [Chunk ${chunkIndex}] No available keys, waiting...`));
                    await new Promise(resolve => setTimeout(resolve, 5000));
                    continue;
                }

                const baseDelay = Math.min(1000 * Math.pow(2, attempt), 10000);
                const jitter = Math.random() * 1000;
                
                console.log(chalk.yellow(`⏳ [Chunk ${chunkIndex}] Waiting ${Math.round((baseDelay + jitter) / 1000)}s before retry...`));
                await new Promise(resolve => setTimeout(resolve, baseDelay + jitter));
            }
        }
    }
    
    throw lastError || new Error(`Failed after ${maxRetries} retries`);
}

/**
 * Optimized main translation function
 */
async function handleFileTranslation(interaction, fileBuffer, fileName) {
    const startTime = Date.now();
    let apiKeyManager;
    
    try {
        const userId = interaction.user.id;
        const fileExtension = path.extname(fileName).toLowerCase();
        
        // Validate file type
        const allowedExtensions = ['.yml', '.yaml', '.json', '.properties', '.lang', '.cfg', '.conf', '.config', '.ini', '.sk', '.txt'];
        if (!allowedExtensions.includes(fileExtension)) {
            return {
                success: false,
                error: `Định dạng file không được hỗ trợ. Các định dạng hỗ trợ: ${allowedExtensions.join(', ')}`
            };
        }

        const content = fileBuffer.toString('utf8');
        
        const fileSizeKB = Math.round(Buffer.byteLength(content) / 1024);
        if (fileSizeKB > 1024) {
            return {
                success: false,
                error: 'File quá lớn. Kích thước tối đa: 1MB'
            };
        }

        const apiKeys = getGeminiApiKeys();
        if (apiKeys.length === 0) {
            return {
                success: false,
                error: 'Không có API key nào được cấu hình. Vui lòng kiểm tra file config.json'
            };
        }

        apiKeyManager = new ApiKeyManager(apiKeys);
        
        console.log(chalk.blue(`📁 Processing: ${fileName} (${fileSizeKB} KB) for user ${userId}`));
        console.log(chalk.cyan(`🔑 Using ${apiKeys.length} API keys, ${apiKeyManager.getAvailableKeyCount()} available`));

        const progressCallback = async (completed, total, stats = {}) => {
            try {
                const percentage = Math.round((completed / total) * 100);
                const elapsed = Math.round((Date.now() - startTime) / 1000);
                const speed = stats.speed ? `(${stats.speed} chunks/min)` : '';
                
                let statusMessage = `📊 Đang dịch... ${completed}/${total} chunks (${percentage}%) ${speed}`;
                
                if (stats.failed > 0) {
                    statusMessage += ` | ❌ ${stats.failed} failed`;
                }
                
                if (stats.cached > 0) {
                    statusMessage += ` | 💾 ${stats.cached} cached`;
                }
                
                await interaction.editReply({
                    content: statusMessage
                });
            } catch (error) {
                console.error('Error updating progress:', error);
            }
        };

        const translatedContent = await translateFileContent(content, fileExtension, userId, apiKeyManager, progressCallback);

        const translatedFileName = fileName.replace(path.extname(fileName), `_vi${path.extname(fileName)}`);
        const totalTime = Math.round((Date.now() - startTime) / 1000);
        
        console.log(chalk.green(`✅ Translation completed in ${totalTime}s for ${fileName}`));
        
        return {
            success: true,
            fileName: translatedFileName,
            content: translatedContent,
            originalSize: fileSizeKB,
            translatedSize: Math.round(Buffer.byteLength(translatedContent) / 1024),
            apiKeysUsed: apiKeys.length,
            timeTaken: totalTime
        };

    } catch (error) {
        console.error(chalk.red('Translation error:'), error);
        return {
            success: false,
            error: `Lỗi dịch thuật: ${error.message}`
        };
    }
}

/**
 * Optimized core translation function
 */
async function translateFileContent(content, fileExtension, userId, apiKeyManager, progressCallback = null) {
    const startTime = Date.now();
    
    let translationPrompt;
    let outputFormat;
    
    switch (fileExtension) {
        case '.yml':
        case '.yaml':
            translationPrompt = createOptimizedYamlTranslationPrompt(content);
            outputFormat = 'yaml';
            break;
        case '.json':
            translationPrompt = createJsonTranslationPrompt(content);
            outputFormat = 'json';
            break;
        default:
            translationPrompt = createOptimizedGenericTranslationPrompt(content);
            outputFormat = 'text';
    }

    console.log(chalk.green(`🌐 Starting translation with format: ${outputFormat}`));
    
    const result = await translateWithGemini(translationPrompt, outputFormat, userId, apiKeyManager, progressCallback);
    
    const totalTime = Math.round((Date.now() - startTime) / 1000);
    console.log(chalk.green(`🚀 Translation completed in ${totalTime} seconds`));
    
    return result;
}

/**
 * Highly optimized Gemini translation function
 */
async function translateWithGemini(prompt, outputFormat, userId, apiKeyManager, progressCallback = null) {
    const contentToTranslate = extractContentToTranslate(prompt);
    const chunks = smartSplitIntoChunks(contentToTranslate);
    
    console.log(chalk.green(`✂️ File smart-split into ${chunks.length} chunks`));
    
    const originalLines = contentToTranslate.split('\n');
    const limiter = new AdvancedConcurrencyLimiter(
        Math.min(MAX_CONCURRENT_CHUNKS, Math.max(1, apiKeyManager.getAvailableKeyCount()))
    );
    
    const results = new Array(chunks.length);
    const stats = {
        successful: 0,
        failed: 0,
        cached: 0,
        speed: 0
    };

    let lastProgressUpdate = Date.now();
    let processedSinceLastUpdate = 0;

    const tasks = chunks.map((chunk, index) => async () => {
        const chunkNumber = index + 1;
        const taskStartTime = Date.now();
        
        try {
            const chunkPrompt = createOptimizedChunkPrompt(prompt, chunk, chunkNumber, chunks.length, outputFormat);
            const translatedText = await makeGeminiRequest(apiKeyManager, chunkPrompt, chunkNumber);
            
            const cleanedText = cleanTranslatedText(translatedText, outputFormat);
            const finalText = validateAndFixTranslation(chunk, cleanedText);
            
            results[index] = finalText;
            stats.successful++;
            
        } catch (error) {
            console.error(chalk.red(`💥 [Chunk ${chunkNumber}] Final failure, using original content`));
            results[index] = chunk;
            stats.failed++;
        } finally {
            const taskTime = Date.now() - taskStartTime;
            processedSinceLastUpdate++;
            
            const now = Date.now();
            if (now - lastProgressUpdate >= 2000) {
                const timeDiff = (now - lastProgressUpdate) / 1000 / 60;
                stats.speed = Math.round(processedSinceLastUpdate / timeDiff);
                processedSinceLastUpdate = 0;
                lastProgressUpdate = now;
                
                if (progressCallback) {
                    const completed = results.filter(r => r !== undefined && r !== null).length;
                    await progressCallback(completed, chunks.length, stats);
                }
            }
        }
    });

    console.log(chalk.yellow(`⚡ Using adaptive concurrency: ${limiter.maxConcurrency}`));
    
    const taskPromises = tasks.map((task, index) => 
        limiter.run(task, chunks.length - index) 
    );
    
    await Promise.allSettled(taskPromises);
    
    if (progressCallback) {
        await progressCallback(chunks.length, chunks.length, stats);
    }
    
    console.log(chalk.cyan(`📊 Translation Summary:`));
    console.log(chalk.cyan(`   ✅ Successful: ${stats.successful}/${chunks.length}`));
    console.log(chalk.cyan(`   ❌ Failed: ${stats.failed}/${chunks.length}`));
    console.log(chalk.cyan(`   💾 Cached: ${stats.cached}/${chunks.length}`));
    console.log(chalk.cyan(`   🚀 Speed: ${stats.speed} chunks/min`));

    let translatedContent = results.join('');

    translatedContent = finalContentValidation(originalLines, translatedContent);
    translatedContent = preserveSpecialFormatting(contentToTranslate, translatedContent);
    
    return translatedContent;
}

function hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash.toString(36);
}

function cleanTranslatedText(text, outputFormat) {

    const codeBlockRegex = /```(?:yaml|json|properties|config|text|sk)?\n([\s\S]*?)```/;
    const match = text.match(codeBlockRegex);
    let cleaned = match && match[1] ? match[1] : text;
    
    // Remove any explanatory text
    cleaned = cleaned.replace(/^(?:Đây là|Here is|Translated).*?:\n?/im, '');
    cleaned = cleaned.replace(/^(?:Nội dung|Content).*?:\n?/im, '');
    
    return cleaned.trim();
}

function validateAndFixTranslation(original, translated) {
    const originalLines = original.split('\n');
    const translatedLines = translated.split('\n');
    
    if (translatedLines.length !== originalLines.length) {
        console.warn(chalk.yellow(`⚠️ Line count mismatch: ${originalLines.length} → ${translatedLines.length}, fixing...`));
        return fixLineCount(original, translated);
    }
    
    return translated;
}

function finalContentValidation(originalLines, translatedContent) {
    const translatedLines = translatedContent.split('\n');
    
    if (translatedLines.length !== originalLines.length) {
        console.log(chalk.yellow('⚠️ Final line count mismatch, applying smart fix...'));
        return smartFixLineCount(originalLines, translatedLines);
    }
    
    return translatedContent;
}

function smartFixLineCount(originalLines, translatedLines) {
    const fixedLines = [];
    let transIndex = 0;
    
    for (let i = 0; i < originalLines.length; i++) {
        if (transIndex < translatedLines.length) {
            
            fixedLines.push(translatedLines[transIndex++]);
        } else {
           
            fixedLines.push(originalLines[i]);
        }
    }
    
    return fixedLines.join('\n');
}

function createOptimizedYamlTranslationPrompt(content) {
    return `TRANSLATE YAML TO VIETNAMESE - MINECRAFT PLUGIN

CRITICAL RULES:
- ONLY translate values after colons that are English sentences
- NEVER translate: keys, commands, permissions, placeholders (%player%, {player}), color codes (&a, §b), technical values
- PRESERVE: exact line count, indentation, formatting, special characters
- OUTPUT: Only the translated YAML, no explanations

CONTENT:
\`\`\`yaml
${content}
\`\`\``;
}

function createOptimizedChunkPrompt(originalPrompt, chunk, chunkNumber, totalChunks, outputFormat) {
    return `CHUNK ${chunkNumber}/${totalChunks} - TRANSLATE TO VIETNAMESE

Follow the main translation rules. Translate only user-facing text.

\`\`\`${outputFormat}
${chunk}
\`\`\`

Return ONLY the translated ${outputFormat} content.`;
}

function extractContentToTranslate(prompt) {
    const codeBlockRegex = /```(?:yaml|json|properties|config|text|sk)?\n([\s\S]*?)```/;
    const match = prompt.match(codeBlockRegex);
    return match && match[1] ? match[1] : prompt;
}

function fixLineCount(originalChunk, translatedChunk) {
    const originalLines = originalChunk.split('\n');
    const translatedLines = translatedChunk.split('\n');
    
    if (translatedLines.length < originalLines.length) {
        const fixedLines = [];
        let transIndex = 0;
        
        for (let i = 0; i < originalLines.length; i++) {
            fixedLines.push(transIndex < translatedLines.length ? translatedLines[transIndex++] : originalLines[i]);
        }
        return fixedLines.join('\n');
    } else if (translatedLines.length > originalLines.length) {
        return translatedLines.slice(0, originalLines.length).join('\n');
    }
    
    return translatedChunk;
}

function preserveSpecialFormatting(originalContent, translatedContent) {
    const originalLines = originalContent.split('\n');
    const translatedLines = translatedContent.split('\n');
    
    if (originalLines.length !== translatedLines.length) {
        return translatedContent;
    }
    
    const fixedLines = [];
    
    for (let i = 0; i < originalLines.length; i++) {
        let translatedLine = translatedLines[i];
        const originalLine = originalLines[i];
        
        const specialFormatRegex = /([&§][0-9a-fklmnor])|(%[a-zA-Z0-9_]+%)|(\{[a-zA-Z0-9_]+\})|(<[a-zA-Z0-9_]+>)/g;
        const originalFormats = originalLine.match(specialFormatRegex);
        
        if (originalFormats) {
            const translatedFormats = translatedLine.match(specialFormatRegex);
            if (!translatedFormats || originalFormats.some(f => !translatedFormats.includes(f))) {
                translatedLine += ' ' + originalFormats.join(' ');
            }
        }
        
        fixedLines.push(translatedLine);
    }
    
    return fixedLines.join('\n');
}

module.exports = { handleFileTranslation };

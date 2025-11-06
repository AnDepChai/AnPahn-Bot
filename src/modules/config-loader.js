const fs = require('fs-extra');
const path = require('path');

let config = null;

function loadConfig() {
    if (config) return config;
    
    try {
        const configPath = path.join(__dirname, '..', 'config.json');
        if (fs.existsSync(configPath)) {
            config = fs.readJsonSync(configPath);
        } else {
            config = {
                gemini_api_keys: [],
                max_concurrent_chunks: 3,
                max_chunk_size: 2500,
                timeout: 120000
            };
            fs.writeJsonSync(configPath, config, { spaces: 2 });
            console.log('⚠️  Config file created with default values');
        }
        return config;
    } catch (error) {
        console.error('❌ Error loading config:', error);
        throw error;
    }
}

function getGeminiApiKeys() {
    const config = loadConfig();
    return config.gemini_api_keys || [];
}

function getConfigValue(key, defaultValue) {
    const config = loadConfig();
    return config[key] !== undefined ? config[key] : defaultValue;
}

module.exports = {
    loadConfig,
    getGeminiApiKeys,
    getConfigValue
};

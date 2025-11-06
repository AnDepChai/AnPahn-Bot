const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const SUPPORTED_FORMATS = [
    { extension: '.yml, .yaml', description: 'YAML Configuration Files', example: 'config.yml, messages.yaml' },
    { extension: '.json', description: 'JSON Configuration Files', example: 'config.json, messages.json' },
    { extension: '.properties, .lang', description: 'Properties/Language Files', example: 'messages.properties, en_US.lang' },
    { extension: '.cfg, .conf, .config', description: 'Configuration Files', example: 'server.cfg, settings.conf' },
    { extension: '.ini', description: 'INI Configuration Files', example: 'config.ini, settings.ini' },
    { extension: '.sk', description: 'Skript Files', example: 'script.sk, functions.sk' },
    { extension: '.txt', description: 'Text Files', example: 'readme.txt, help.txt' }
];

const FILE_LIMITS = {
    maxSize: '1MB',
    maxChunkSize: '2500 ký tự',
    supportedTypes: 'Minecraft plugin configuration files'
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('formats')
        .setDescription('Hiển thị các định dạng file được hỗ trợ dịch thuật'),
    
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('📁 Định Dạng File Được Hỗ Trợ')
            .setDescription('Danh sách các loại file có thể dịch bằng lệnh `/viethoa`')
            .addFields(
                {
                    name: '📊 Giới Hạn File',
                    value: `• **Kích thước tối đa:** ${FILE_LIMITS.maxSize}\n• **Chunk size:** ${FILE_LIMITS.maxChunkSize}\n• **Loại file:** ${FILE_LIMITS.supportedTypes}`,
                    inline: false
                },
                {
                    name: '🔄 Cách Sử Dụng',
                    value: 'Sử dụng lệnh `/viethoa` và đính kèm file cần dịch\nBot sẽ trả về file đã dịch với tên gốc + `_vi`',
                    inline: false
                }
            )
            .setTimestamp()
            .setFooter({ 
                text: '© ᴄᴏᴅᴇ ʙʏ ᴀɴ ᴘᴀʜɴ 🐧', 
            });

        SUPPORTED_FORMATS.forEach(format => {
            embed.addFields({
                name: `📄 ${format.extension}`,
                value: `**Mô tả:** ${format.description}\n**Ví dụ:** ${format.example}`,
                inline: true
            });
        });

        embed.addFields(
            {
                name: '💡 Mẹo Sử Dụng',
                value: '• Giữ nguyên cấu trúc file gốc\n• Không dịch keys, commands, placeholders\n• Giữ nguyên color codes (&a, &b, §c, v.v.)',
                inline: false
            },
            {
                name: '⚠️ Lưu Ý',
                value: 'Chỉ dịch text hiển thị cho người dùng. Technical content sẽ được giữ nguyên.',
                inline: false
            }
        );

        await interaction.reply({ embeds: [embed] });
    }
};
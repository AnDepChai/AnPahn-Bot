const { SlashCommandBuilder } = require('discord.js');
const { handleFileTranslation } = require('../modules/viethoa-module');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('viethoa')
        .setDescription('ᴅịᴄʜ ᴄᴏɴғɪɢ ᴍɪɴᴇᴄʀᴀғᴛ sᴀɴɢ ᴛɪếɴɢ ᴠɪệᴛ.')
        .addAttachmentOption(option =>
            option.setName('file')
                .setDescription('ғɪʟᴇ ᴄầɴ ᴅịᴄʜ (ᴠᴅ: ʏᴀᴍʟ, ᴊsᴏɴ, ᴘʀᴏᴘᴇʀᴛɪᴇs, ᴠ.ᴠ).')
                .setRequired(true)),
    
    async execute(interaction) {
        await interaction.deferReply();
        
        const fileAttachment = interaction.options.getAttachment('file');
        
        if (!fileAttachment) {
            return await interaction.editReply('❌ Vui lòng đính kèm file cần dịch.');
        }
        
        try {
            const response = await fetch(fileAttachment.url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const arrayBuffer = await response.arrayBuffer();
            const fileBuffer = Buffer.from(arrayBuffer);

            const result = await handleFileTranslation(interaction, fileBuffer, fileAttachment.name);
            
            if (result.success) {
                await interaction.editReply({
                    content: `✅ Dịᴄʜ ᴛʜàɴʜ ᴄôɴɢ!\n📁 Original: ${result.originalSize}KB | Translated: ${result.translatedSize}KB`,
                    files: [{
                        attachment: Buffer.from(result.content, 'utf8'),
                        name: result.fileName
                    }]
                });
            } else {
                await interaction.editReply(`❌ ${result.error}`);
            }
            
        } catch (error) {
            console.error('Discord command error:', error);
            await interaction.editReply('❌ Đã xảy ra lỗi khi xử lý file: ' + error.message);
        }
    }
};



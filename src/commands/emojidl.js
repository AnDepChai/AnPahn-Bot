/*
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('emojidl')
        .setDescription('ᴛảɪ ᴇᴍᴏᴊɪ ᴠề ᴛừ ᴅɪsᴄᴏʀᴅ ᴛʜᴇᴏ ɪᴅ.')
        .addStringOption(option =>
            option.setName('id')
                .setDescription('ɪᴅ ᴄủᴀ ᴇᴍᴏᴊɪ')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('dinhdang')
                .setDescription('Địɴʜ ᴅạɴɢ ᴄủᴀ ᴇᴍᴏᴊɪ (ɢɪғ ʜᴏặᴄ ᴘɴɢ)')
                .setRequired(true)),

    async execute(interaction) {
        const emojiId = interaction.options.getString('id');
        const format = interaction.options.getString('dinhdang').toLowerCase();

        if (format !== 'gif' && format !== 'png') {
            return
        }

        const emojiUrl = `https://cdn.discordapp.com/emojis/${emojiId}.${format}`;

        try {
            await axios.get(emojiUrl);

            const embed = new EmbedBuilder()
                .setColor('00FF00')
                .setDescription(`ᴇᴍᴏᴊɪ ɪᴅ: ${emojiId}`)
                .setImage(emojiUrl) 
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            interaction.reply('ᴋʜôɴɢ ᴛʜể ᴛảɪ ᴇᴍᴏᴊɪ, ᴠᴜɪ ʟòɴɢ ᴋɪểᴍ ᴛʀᴀ ʟạɪ ɪᴅ ᴠà địɴʜ ᴅạɴɢ.');
        }
    },
};
*/

const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const axios = require('axios');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('emojidl')
        .setDescription('ᴛảɪ ᴇᴍᴏᴊɪ ᴠề ᴛừ ᴅɪsᴄᴏʀᴅ ᴛʜᴇᴏ ɪᴅ.')
        .addStringOption(option =>
            option.setName('id_của_emoji')
                .setDescription('ɪᴅ ᴄủᴀ ᴇᴍᴏᴊ.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('dịnh_dạng')
                .setDescription('Địɴʜ ᴅạɴɢ ᴄủᴀ ᴇᴍᴏᴊɪ (ɢɪғ ʜᴏặᴄ ᴘɴɢ)')
                .setRequired(true)
                .addChoices(
                    { name: 'GIF', value: 'gif' },
                    { name: 'PNG', value: 'png' }
                )),

    async execute(interaction) {
        const emojiId = interaction.options.getString('id_của_emoji');
        const format = interaction.options.getString('dịnh_dạng').toLowerCase();

        if (!/^\d+$/.test(emojiId)) {
            return interaction.reply({
                content: 'ɪᴅ ᴇᴍᴏᴊɪ ᴋʜôɴɢ ʜợᴘ ʟệ. ᴠᴜɪ ʟòɴɢ ɴʜậᴘ ᴍộᴛ số.',
                ephemeral: true
            });
        }

        const emojiUrl = `https://cdn.discordapp.com/emojis/${emojiId}.${format}`;

        try {
            await axios.head(emojiUrl, { timeout: 5000 });

            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('🎉 ᴛảɪ ᴇᴍᴏᴊɪ')
                .setDescription([
                    `**ɪᴅ:** ${emojiId}`,
                    `**Địɴʜ ᴅạɴɢ:** ${format.toUpperCase()}`,
                    `**ʟɪɴᴋ ᴛảɪ xᴜốɴɢ:** [Bấm vào đây](${emojiUrl})`
                ].join('\n'))
                .setImage(emojiUrl)
                .setFooter({
                  text: `© ᴄᴏᴅᴇ ʙʏ ᴀɴ ᴘᴀʜɴ 🐧`
                })
                .setTimestamp();

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setLabel('ᴛảɪ xᴜốɴɢ')
                        .setStyle(ButtonStyle.Link)
                        .setURL(emojiUrl)
                );

            await interaction.reply({ 
                embeds: [embed], 
                components: [row] 
            });

        } catch (error) {
            console.error('Lỗi tải emoji:', error);
            
            let errorMessage = 'ᴋʜôɴɢ ᴛʜể ᴛảɪ ᴇᴍᴏᴊɪ, ᴠᴜɪ ʟòɴɢ ᴋɪểᴍ ᴛʀᴀ ʟạɪ ɪᴅ ᴠà địɴʜ ᴅạɴɢ.';
            if (error.code === 'ECONNABORTED') {
                errorMessage = 'Request timeout. Vui lòng thử lại sau.';
            }

            await interaction.reply({
                content: errorMessage,
                ephemeral: true
            });
        }
    },
};
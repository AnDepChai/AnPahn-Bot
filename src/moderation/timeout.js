const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config.json');

function parseDuration(input) {
    const regex = /^(\d+)([spdhmy])$/i; 
    const match = input.match(regex);
    if (!match) return null;

    const value = parseInt(match[1], 10);
    const unit = match[2].toLowerCase();

    const multipliers = {
        s: 1000,             // giây
        p: 60 * 1000,        // phút
        h: 60 * 60 * 1000,   // giờ
        d: 24 * 60 * 60 * 1000, // ngày
        m: 30 * 24 * 60 * 60 * 1000, // tháng (30 ngày)
        y: 365 * 24 * 60 * 60 * 1000 // năm
    };

    return value * multipliers[unit];
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mute')
        .setDescription('ᴍᴜᴛᴇ ᴛʜàɴʜ ᴠɪêɴ (ᴍᴜᴛᴇ ᴛạᴍ ᴛʜờɪ).')
        .addUserOption(option =>
            option.setName('ai_đó')
                .setDescription('ᴛʜàɴʜ ᴠɪêɴ ᴄầɴ ᴍᴜᴛᴇ.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('thời_gian')
                .setDescription('ᴛʜờɪ ɢɪᴀɴ (vd: 60s, 10p, 2h, 1d, 1m, 1y)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('lý_do')
                .setDescription('ʟý ᴅᴏ ᴍᴜᴛᴇ.')
                .setRequired(false)),

    async execute(interaction) {
        if (!config.adminIDs.includes(interaction.user.id)) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#ff0000")
                        .setTitle("⚠️ ǫᴜʏềɴ ʜạɴ ᴋʜôɴɢ đủ ⚠️")
                        .setDescription("❎ ʙạɴ ᴋʜôɴɢ ᴄó ǫᴜʏềɴ sử ᴅụɴɢ ʟệɴʜ ɴàʏ."),
                ],
                ephemeral: true,
            });
        }

        const user = interaction.options.getUser('ai_đó');
        const member = interaction.guild.members.cache.get(user.id);
        const timeInput = interaction.options.getString('thời_gian');
        const reason = interaction.options.getString('lý_do') || 'ᴋʜôɴɢ ʟý ᴅᴏ';

        if (config.adminIDs.includes(user.id) || config.ownerIDs.includes(user.id)) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#ff0000")
                        .setDescription("⛔ ᴋʜôɴɢ ᴛʜể ᴛɪᴍᴇᴏᴜᴛ ᴀᴅᴍɪɴ/ᴏᴡɴᴇʀ.")
                ],
                ephemeral: true
            });
        }

        const duration = parseDuration(timeInput);
        if (!duration) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#ff0000")
                        .setDescription("⚠️ ᴛʜờɪ ɢɪᴀɴ ᴋʜôɴɢ ʜợp ʟệ! Hãy nhập ví dụ: `60s`, `10p`, `2h`, `1d`, `1m`, `1y`."),
                ],
                ephemeral: true
            });
        }

        try {
            await member.timeout(duration, reason);

            const successEmbed = new EmbedBuilder()
                .setColor("#ff9900")
                .setTitle(`⏳ ᴍᴜᴛᴇ ᴛʜàɴʜ ᴠɪêɴ`)
                .setThumbnail(user.displayAvatarURL())
                .addFields(
                    { name: '👤 ᴛʜàɴʜ ᴠɪêɴ:', value: `${user}`, inline: true },
                    { name: '⏱️ ᴛʜờɪ ɢɪᴀɴ:', value: `${timeInput}`, inline: true },
                    { name: '📌 ʟý ᴅᴏ:', value: reason },
                    { name: '👮 ᴍᴏᴅᴇʀᴀᴛᴏʀ:', value: interaction.user.toString() }
                )
                .setFooter({ text: 'ʜếᴛ ʜạɴ ᴠàᴏ' })
                .setTimestamp(Date.now() + duration);

            await interaction.reply({ embeds: [successEmbed] });

        } catch (error) {
            const errorEmbed = new EmbedBuilder()
                .setColor("#ff0000")
                .setDescription("❌ ᴄó ᴛʜể ʙᴏᴛ ᴋʜôɴɢ ᴄó ǫᴜʏềɴ ʜᴏặᴄ ᴛʜàɴʜ ᴠɪêɴ ᴄó ᴠᴀɪ ᴛʀò ᴄᴀᴏ.");

            await interaction.reply({
                embeds: [errorEmbed],
                ephemeral: true
            });
        }
    },
};
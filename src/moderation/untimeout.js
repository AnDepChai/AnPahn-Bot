const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unmute')
        .setDescription('ɢỡ ᴍᴜᴛᴇ ᴄʜᴏ ᴛʜàɴʜ ᴠɪêɴ.')
        .addUserOption(option =>
            option.setName('ai_đó')
                .setDescription('ᴛʜàɴʜ ᴠɪêɴ ᴄầɴ ɢỡ ᴍᴜᴛᴇ.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('lý_do')
                .setDescription('ʟý ᴅᴏ ɢỡ ᴍᴜᴛᴇ.')
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
        const reason = interaction.options.getString('lý_do') || 'ᴋʜôɴɢ ᴄó ʟý ᴅᴏ';

        if (!member || !member.communicationDisabledUntil) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#ffcc00")
                        .setDescription(`⚠️ ${user} ʜɪệɴ ᴋʜôɴɢ ʙị ᴍᴜᴛᴇ!`)
                ],
                ephemeral: true
            });
        }

        try {
            await member.timeout(null, reason);

            const successEmbed = new EmbedBuilder()
                .setColor("#00ff00")
                .setTitle(`✅ ɢỡ ᴍᴜᴛᴇ ᴛʜàɴʜ ᴄôɴɢ`)
                .setThumbnail(user.displayAvatarURL())
                .addFields(
                    { name: '👤 ᴛʜàɴʜ ᴠɪêɴ:', value: `${user}`, inline: true },
                    { name: '📌 ʟý ᴅᴏ:', value: reason, inline: true },
                    { name: '👮 ᴍᴏᴅᴇʀᴀᴛᴏʀ:', value: interaction.user.toString() }
                )
                .setTimestamp();

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
/*
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription('ʜɪểɴ ᴛʜị ᴛʜôɴɢ ᴛɪɴ ᴄá ɴʜâɴ ᴄủᴀ ᴍộᴛ ɴɢườɪ ᴅùɴɢ.')
        .addUserOption(option => 
            option.setName('user')
                .setDescription('ᴄʜọɴ ɴɢườɪ ᴅùɴɢ để xᴇᴍ ᴛʜôɴɢ ᴛɪɴ.')
        ),

    async execute(interaction) {
        let targetUser = interaction.options.getUser('user') || interaction.user;

        const member = interaction.guild.members.cache.get(targetUser.id);
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('Tʜôɴɢ ᴛɪɴ ᴄá ɴʜâɴ:')
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: 'ᴛêɴ ɴɢườɪ ᴅùɴɢ:', value: targetUser.username, inline: true },
                { name: 'ID:', value: `\`${targetUser.id}\``, inline: true },
                {
                    name: 'ɴɢàʏ ᴛʜᴀᴍ ɢɪᴀ Discord:',
                    value: targetUser.createdAt.toLocaleDateString('en-US'),
                    inline: true,
                },
            );

        if (member) {
            embed.addFields(
                {
                    name: 'ɴɢàʏ ᴛʜᴀᴍ ɢɪᴀ Server:',
                    value: member.joinedAt.toLocaleDateString('en-US'),
                    inline: true,
                },
                {
                    name: 'ᴠᴀɪ ᴛʀò:',
                    value: `\`\`\`${member.roles.cache.map((role) => role.name).join(', ')}\`\`\``,
                    inline: true,
                },
                {
                    name: 'ᴛʀạɴɢ ᴛʜáɪ:',
                    value: member.presence ? member.presence.status : 'Offline',
                    inline: true,
                },
            );
        }

        await interaction.reply({ embeds: [embed] });
    },
};
*/

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription('ʜɪểɴ ᴛʜị ᴛʜôɴɢ ᴛɪɴ ᴄá ɴʜâɴ ᴄủᴀ ᴍộᴛ ɴɢườɪ ᴅùɴɢ.')
        .addUserOption(option =>
            option.setName('ai_đó')
                .setDescription('ᴄʜọɴ ɴɢườɪ ᴅùɴɢ để xᴇᴍ ᴛʜôɴɢ ᴛɪɴ.')
        ),

    async execute(interaction) {
        const targetUser = interaction.options.getUser('ai_đó') || interaction.user;
        const member = interaction.guild.members.cache.get(targetUser.id) || await interaction.guild.members.fetch(targetUser.id).catch(() => null);

        const presenceEmoji = {
            online: '🟢 ᴏɴʟɪɴᴇ',
            idle: '🌙 ɪᴅʟᴇ',
            dnd: '⛔ ᴋᴏ ʟàᴍ ᴘʜɪềɴ',
            offline: '⚫ Offline'
        };

        const roles = member?.roles.cache
    .filter(role => role.id !== interaction.guild.id)
    .map(role => `<@&${role.id}>`)
    .slice(0, 20)
    .join(', ') || 'ᴋʜôɴɢ ᴄó ᴠᴀɪ ᴛʀò';

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('👤 ᴛʜôɴɢ ᴛɪɴ ᴄá ɴʜâɴ:')
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: '👥 Têɴ:', value: targetUser.tag, inline: true },
                { name: '🆔 ID:', value: `\`${targetUser.id}\``, inline: true },
                {
                    name: '📅 ᴛʜᴀᴍ ɢɪᴀ ᴅɪsᴄᴏʀᴅ:',
                    value: `<t:${Math.floor(targetUser.createdTimestamp / 1000)}:F>`,
                    inline: true,
                }
            );

        if (member) {
            embed.addFields(
                {
                    name: '🎭 ᴠᴀɪ ᴛʀò:',
                    value: `${roles}`,
                    inline: false,
                },
                {
                    name: '💡 ᴛʀạɴɢ ᴛʜáɪ:',
                    value: presenceEmoji[member.presence?.status || 'offline'],
                    inline: true,
                }
            );
        }

        embed.setFooter({
            text: `© ᴄᴏᴅᴇ ʙʏ ᴀɴ ᴘᴀʜɴ 🐧`,
        }).setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('xemguild')
    .setDescription('xᴇᴍ ᴛấᴛ ᴄả ᴍáʏ ᴄʜủ ʙᴏᴛ ᴛʜᴀᴍ ɢɪᴀ.'),

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

    try {
      const guilds = interaction.client.guilds.cache;
      const sortedGuilds = [...guilds.values()].sort((a, b) => b.memberCount - a.memberCount);

      const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('📊 𝙳𝚊𝚗𝚑 𝚂á𝚌𝚑 𝙼á𝚢 𝙲𝚑ủ')
        .setDescription(`🤖 ʙᴏᴛ ᴛʜᴀᴍ ɢɪᴀ **${guilds.size}** ᴍáʏ ᴄʜủ.`)
        .setThumbnail(interaction.client.user.displayAvatarURL())
        .setFooter({ text: '© ᴄᴏᴅᴇ ʙʏ ᴀɴ ᴘᴀʜɴ 🐧' })
        .setTimestamp();

      const guildList = sortedGuilds.slice(0, 25).map((guild, i) =>
        `**${i + 1}. ${guild.name}**\n👤 ${guild.memberCount} thành viên | 🆔 ${guild.id}\n👑 Chủ: <@${guild.ownerId || "Không rõ"}>\n`
      ).join("\n");

      embed.addFields({
        name: '📌 Top Server:',
        value: guildList || 'Không có máy chủ nào!'
      });

      if (guilds.size > 25) {
        embed.addFields({
          name: '...',
          value: `Và **${guilds.size - 25}** máy chủ khác.`
        });
      }

      const totalMembers = sortedGuilds.reduce((acc, g) => acc + g.memberCount, 0);
      const largest = sortedGuilds[0];

      embed.addFields(
        { name: '📈 Tổng thành viên:', value: `${totalMembers}`, inline: true },
        { name: '🏆 Server lớn nhất:', value: `${largest.name}\n(${largest.memberCount} thành viên)`, inline: true }
      );

      await interaction.reply({ embeds: [embed] });

    } catch (error) {
      console.error(error);
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#ff0000")
            .setDescription("❎ Đã xảy ra lỗi khi lấy danh sách máy chủ!"),
        ],
        ephemeral: true,
      });
    }
  }
};
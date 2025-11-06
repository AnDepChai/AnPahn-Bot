const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const path = require('path');
const { AutoBanChannelId } = require(path.resolve(__dirname, '../config.json'));

module.exports = {
  name: 'messageCreate',
  async execute(message, client) {
    if (message.author.bot) return;
    if (message.webhookId) return;
    if (message.channel.id !== AutoBanChannelId) return;

    try {
      await message.delete().catch(() => {});

      if (message.author.id === message.guild.ownerId) {
        const ownerEmbed = new EmbedBuilder()
          .setColor(0xFF66CC)
          .setDescription(`💖 𝙾𝚗𝚒-𝙲𝚑𝚊𝚗 ${message.author.tag} 𝚗𝚑ắ𝚗 𝚐ì đó?`)
          .setTimestamp();

        await message.channel.send({ embeds: [ownerEmbed] });
        return;
      }

      if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.BanMembers)) {
        return;
      }

      const dmEmbed = new EmbedBuilder()
        .setColor(0xFF66CC)
        .setAuthor({ name: message.guild.name, iconURL: message.guild.iconURL() })
        .setDescription("<:despair:1303695882386145382> 𝙱ạ𝚗 𝚋ị **𝙱𝙰𝙽 𝚅Ĩ𝙽𝙷 𝚅𝙸Ễ𝙽**\n\n" +
            "- 𝙽ế𝚞 𝚗𝚐𝚑ĩ đâ𝚢 𝚕à 𝚗𝚑ầ𝚖 𝚕ẫ𝚗, 𝚑ã𝚢 𝚕𝚒ê𝚗 𝚑ệ <@958668688607838208> để đượ𝚌 𝚡𝚎𝚖 𝚡é𝚝 𝚕ạ𝚒.")
        .setFooter({ text: "𝙱𝙰𝙽𝙽𝙴𝙳 𝙱𝚈 𝙰𝚄𝚃𝙾 𝙱𝙰𝙽 𝚂𝚈𝚂𝚃𝙴𝙼" })
        .setTimestamp();

      setTimeout(async () => {
        const member = await message.guild.members.fetch(message.author.id).catch(() => null);
        if (!member) return;

        await message.author.send({ embeds: [dmEmbed] }).catch(err => {
        });

        await message.guild.members.ban(message.author.id, {
          reason: "𝚂𝚙𝚊𝚖/𝙱𝚘𝚝/𝙽𝚒𝚌𝚔 𝙶𝚒ả 𝙼ạ𝚘 | 𝙱𝙰𝙽𝙽𝙴𝙳 𝙱𝚈 𝙱𝙾𝚃 𝙰𝚄𝚃𝙾 𝙱𝙰𝙽!"
        }).catch(err => {
        });

      }, 5000);
    } catch (err) {
    }
  }
};
const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const config = require('../config.json'); 

module.exports = {
  data: new SlashCommandBuilder()
    .setName('checkquyen')
    .setDescription('ᴋɪểᴍ ᴛʀᴀ ǫᴜʏềɴ ᴄủᴀ ɴɢườɪ ᴅùɴɢ.')
    .addUserOption(option =>
      option.setName('ai_do')
        .setDescription('ɴɢườɪ ᴅùɴɢ ᴄầɴ ᴋɪểᴍ ᴛʀᴀ.')
        .setRequired(true))
    .addChannelOption(option =>
      option.setName('kenh')
        .setDescription('ᴋêɴʜ ᴄầɴ ᴋɪểᴍ ᴛʀᴀ.')
        .setRequired(false)),

  async execute(interaction) {
    if (!config.adminIDs.includes(interaction.user.id)) {
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#ff0000")
            .setTitle("⚠️ ǫᴜʏềɴ ʜạɴ ᴋʜôɴɢ đủ ⚠️")
            .setDescription("❎ ʙạɴ ᴋʜôɴɢ ᴄó ǫᴜʏềɴ sử ᴅụɴɢ ʟệɴʜ ɴàʏ."),
        ],
        ephemeral: true,
      });
      return;
    }

    const user = interaction.options.getUser('ai_do');
    const channel = interaction.options.getChannel('kenh');
    const member = await interaction.guild.members.fetch(user.id);

    const allPerms = Object.keys(PermissionsBitField.Flags);

    function generatePermFields(perms, title) {
      const fields = [];
      let chunk = [];
      let currentLength = 0;

      perms.forEach(line => {
        if (currentLength + line.length + 1 > 1024) {
          fields.push({
            name: fields.length === 0 ? title : `${title} (𝚝𝚒ế𝚙 ${fields.length + 1})`,
            value: chunk.join('\n'),
          });
          chunk = [];
          currentLength = 0;
        }
        chunk.push(line);
        currentLength += line.length + 1;
      });

      if (chunk.length > 0) {
        fields.push({
          name: fields.length === 0 ? title : `${title} (𝚝𝚒ế𝚙 ${fields.length + 1})`,
          value: chunk.join('\n'),
        });
      }

      return fields;
    }

    const embed = new EmbedBuilder()
      .setColor('#00ccff')
      .setTitle(`🔍 𝙺𝚒ể𝚖 𝚃𝚛𝚊 𝚀𝚞𝚢ề𝚗 𝙲ủ𝚊: ${user.tag}`)
      .setTimestamp();

    if (channel) {
      const channelPerms = member.permissionsIn(channel);
      const channelList = allPerms.map(
        perm => `${channelPerms.has(PermissionsBitField.Flags[perm]) ? '✅' : '❌'} ${perm}`
      );
      embed.addFields(...generatePermFields(channelList, `📌 𝚃ạ𝚒 𝙺ê𝚗𝚑: #${channel.name}`));

      if (channel.parent) {
        const categoryPerms = member.permissionsIn(channel.parent);
        const categoryList = allPerms.map(
          perm => `${categoryPerms.has(PermissionsBitField.Flags[perm]) ? '✅' : '❌'} ${perm}`
        );
        embed.addFields(...generatePermFields(categoryList, `📂 𝚃ạ𝚒 𝙳𝚊𝚗𝚑 𝙼ụ𝚌: ${channel.parent.name}`));
      }
    } else {
      const guildPerms = member.permissions;
      const guildList = allPerms.map(
        perm => `${guildPerms.has(PermissionsBitField.Flags[perm]) ? '✅' : '❌'} ${perm}`
      );
      embed.addFields(...generatePermFields(guildList, `🏠 𝚃ạ𝚒 𝚂𝚎𝚛𝚟𝚎𝚛: ${interaction.guild.name}`));
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
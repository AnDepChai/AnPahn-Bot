const { EmbedBuilder } = require('discord.js');

module.exports = {
  data: {
    name: 'avatar',
    description: 'ʜɪểᴍ ᴛʜị ᴀᴠᴀᴛᴀʀ ᴄủᴀ ᴍộᴛ ɴɢườɪ ᴅùɴɢ.',
    options: [
      {
        type: 6,
        name: 'ai_đó',
        description: 'ɴɢườɪ ᴅùɴɢ ʙạɴ ᴍᴜốɴ ʟấʏ ᴀᴠᴀᴛᴀʀ.',
        required: false,
      },
    ],
  },
  async execute(interaction) {
    const user = interaction.options.getUser('ai_đó') || interaction.user;
    let format = user.displayAvatarURL().includes('.gif') ? 'gif' : 'png';
    const avatarURL = user.displayAvatarURL({ format, size: 1024 });

    const embed = new EmbedBuilder()
      .setTitle(`ᴀᴠᴀᴛᴀʀ: ${user.tag}`)
      .setDescription(`[ʟɪɴᴋ ᴀᴠᴀᴛᴀʀ:](${avatarURL})`)
      .setImage(avatarURL)
      .setColor('#2e3b46')
      .setFooter({
        text: `© ᴄᴏᴅᴇ ʙʏ ᴀɴ ᴘᴀʜɴ 🐧`
      })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};

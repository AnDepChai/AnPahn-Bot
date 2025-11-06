const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('ʙỏ ᴄấᴍ ɴɢườɪ ᴅùɴɢ ᴋʜỏɪ sᴇʀᴠᴇʀ.')
    .addStringOption(option =>
      option.setName('id_ai_đó')
        .setDescription('ɪᴅ ɴɢườɪ ᴄầɴ ʙỏ ᴄấᴍ.')
        .setRequired(true)),

  async execute(interaction) {
    const userId = interaction.options.getString('id_ai_đó');

    if (!config.adminIDs.includes(interaction.user.id)) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#ff0000")
            .setTitle("⚠️ ǫᴜʏềɴ ʜạɴ ᴋʜôɴɢ đủ ⚠️")
            .setDescription("❎ ʙạɴ ᴋʜôɴɢ ᴄó ǫᴜʏềɴ sử ᴅụɴɢ ʟệɴʜ ɴàʏ.")
        ],
        ephemeral: true,
      });
    }

    try {
      await interaction.guild.members.unban(userId);

      const embed = new EmbedBuilder()
        .setColor("#00cc66")
        .setDescription(`ᴜɴʙᴀɴ ɪᴅ: \`${userId}\``)
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      const errorEmbed = new EmbedBuilder()
        .setColor("#ff0000")
        .setDescription(`ᴋʜôɴɢ ᴛʜể ᴜɴʙᴀɴ ɪᴅ: \`${userId}\` ᴄó ᴛʜể ᴅᴏ ʙᴏᴛ ᴋʜôɴɢ ᴄó ǫᴜʏềɴ ʜạɴɢ ᴄᴀᴏ.`);

      await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
  },
};
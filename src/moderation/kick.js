const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('ᴋɪᴄᴋ ɴɢườɪ ᴅùɴɢ ᴋʜỏɪ sᴇʀᴠᴇʀ.')
    .addUserOption(option =>
      option.setName('ai_đó')
        .setDescription('ɴɢườɪ ᴅùɴɢ ᴄầɴ ʙị ᴋɪᴄᴋ.')
        .setRequired(true)),

  async execute(interaction) {
    const user = interaction.options.getUser('ai_đó');

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
      const member = await interaction.guild.members.fetch(user.id);
      await member.kick(`Kicked by ${interaction.user.tag}`);

      const embed = new EmbedBuilder()
        .setColor("#ffcc00")
        .setDescription(`ᴋɪᴄᴋ **${user}** ʀᴀ ᴋʜỏɪ sᴇʀᴠᴇʀ.`)
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      const errorEmbed = new EmbedBuilder()
        .setColor("#ff0000")
        .setDescription(`ᴋʜôɴɢ ᴛʜể ᴋɪᴄᴋ ${user}. ᴄó ᴛʜể ᴅᴏ ʙᴏᴛ ᴋʜôɴɢ ᴄó ǫᴜʏềɴ ʜạɴɢ ᴄᴀᴏ.`);

      await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
  },
};
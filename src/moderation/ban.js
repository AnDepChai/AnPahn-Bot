const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Cấm người dùng khỏi server')
    .addUserOption(option =>
      option.setName('ai_đó')
        .setDescription('Người dùng cần bị cấm')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('lý_do')
        .setDescription('Lý do cấm')
        .setRequired(false)),

  async execute(interaction) {
    const user = interaction.options.getUser('ai_đó');
    const reason = interaction.options.getString('lý_do') || 'không lý do';

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
      await member.ban({ reason: `Banned by ${interaction.user.tag} - ${reason}` });

      const embed = new EmbedBuilder()
        .setColor("#ff9900")
        .setDescription(`ʙᴀɴ ${user} ᴋʜỏɪ sᴇʀᴠᴇʀ.`)
        .addFields({ name: '📝 ʟý ᴅᴏ:', value: reason })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      const errorEmbed = new EmbedBuilder()
        .setColor("#ff0000")
        .setDescription(`ᴋʜôɴɢ ᴛʜể ʙᴀɴ ${user.tag}. ᴄó ᴛʜể ᴅᴏ ʙᴏᴛ ᴋʜôɴɢ ᴄó ǫᴜʏềɴ ʜạɴɢ ᴄᴀᴏ.`);

      await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
  },
};

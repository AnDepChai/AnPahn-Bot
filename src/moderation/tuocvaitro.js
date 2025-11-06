const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('tuocvaitro')
    .setDescription('ᴛướᴄ ᴠᴀɪ ᴛʀò ᴋʜỏɪ ᴍộɪ ɴɢườɪ.')
    .addUserOption(option =>
      option.setName('ai_đó')
        .setDescription('ɴɢườɪ ʙị ᴛướᴄ ᴠᴀɪ ᴛʀò.')
        .setRequired(true))
    .addRoleOption(option =>
      option.setName('vai_trò')
        .setDescription('ᴠᴀɪ ᴛʀò ᴍᴜốɴ ᴛướᴄ.')
        .setRequired(true)),

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

    const member = interaction.options.getMember('ai_đó');
    const role = interaction.options.getRole('vai_trò');

    try {
      await member.roles.remove(role);
      const embed = new EmbedBuilder()
        .setColor("Orange")
        .setDescription(`✅ ᴛướᴄ ᴠᴀɪ ᴛʀò ${role} ᴄủᴀ ${member} ᴛʜàɴʜ ᴄôɴɢ.`);

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: "❌ Không thể tước vai trò. Hãy kiểm tra quyền của bot.",
        ephemeral: true,
      });
    }
  }
};
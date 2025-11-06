const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const config = require('../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('traovaitro')
    .setDescription('ᴛʀᴀᴏ ᴠᴀɪ ᴛʀò ᴄʜᴏ ᴍộᴛ ɴɢườɪ.')
    .addUserOption(option =>
      option.setName('ai_đó')
        .setDescription('ɴɢườɪ ɴʜậɴ ᴠᴀɪ ᴛʀò.')
        .setRequired(true))
    .addRoleOption(option =>
      option.setName('vai_trò')
        .setDescription('ᴠᴀɪ ᴛʀò ᴍᴜốɴ ᴛʀᴀᴏ.')
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
      await member.roles.add(role);
      const embed = new EmbedBuilder()
        .setColor("Green")
        .setDescription(`✅ ᴛʀᴀᴏ ᴄʜᴏ ${member} ᴠᴀɪ ᴛʀò ${role} ᴛʜàɴʜ ᴄôɴɢ.`);

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: "❌ Không thể trao vai trò. Hãy kiểm tra quyền của bot.",
        ephemeral: true,
      });
    }
  }
};
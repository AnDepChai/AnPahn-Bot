const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('xoatinnhan')
    .setDescription('xᴏá ᴛɪɴ ɴʜắɴ ɴâɴɢ ᴄᴀᴏ.')
    .addIntegerOption(option =>
      option.setName('số_lượng')
        .setDescription('số ʟượɴɢ ᴛɪɴ ɴʜắɴ ᴄầɴ xᴏá (tối đa 100 tin nhắn.)')
        .setRequired(true))
    .addUserOption(option =>
      option.setName('lọc_theo_người_dùng')
        .setDescription('ᴄʜỉ xᴏá ᴛɪɴ ɴʜắɴ ᴛừ ɴɢườɪ ᴅùɴɢ ᴄụ ᴛʜể.'))
    .addRoleOption(option =>
      option.setName('lọc_theo_vai_trò')
        .setDescription('ᴄʜỉ xᴏá ᴛɪɴ ɴʜắɴ ᴛʜᴇᴏ ᴠᴀɪ ᴛʀò ᴄụ ᴛʜể.'))
    .addStringOption(option =>
      option.setName('lọc_theo_bot')
        .setDescription('ᴄʜỉ xᴏá ᴛɪɴ ɴʜắɴ ᴛừ ʙᴏᴛ ?')
        .addChoices(
          { name: 'Có', value: 'yes' },
          { name: 'Không', value: 'no' }
        )),

  async execute(interaction) {
    if (!config.adminIDs.includes(interaction.user.id)) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#ff0000")
            .setTitle("⚠️ ǫᴜʏềɴ ʜạɴ ᴋʜôɴɢ đủ ⚠️")
            .setDescription("❎ ʙạɴ ᴋʜôɴɢ ᴄó ǫᴜʏềɴ sử ᴅụɴɢ ʟệɴʜ ɴàʏ.")
        ],
        ephemeral: true
      });
    }

    const amount = interaction.options.getInteger('số_lượng');
    const user = interaction.options.getUser('lọc_theo_người_dùng');
    const role = interaction.options.getRole('lọc_theo_vai_trò');
    const botFilter = interaction.options.getString('lọc_theo_bot');
    const channel = interaction.channel;

    try {
      const messages = await channel.messages.fetch({ limit: 100 });
      let filtered = messages;

      if (user) {
        filtered = filtered.filter(msg => msg.author.id === user.id);
      }

      if (role) {
        filtered = filtered.filter(msg => msg.member?.roles.cache.has(role.id));
      }

      if (botFilter === 'yes') {
        filtered = filtered.filter(msg => msg.author.bot);
      } else if (botFilter === 'no') {
        filtered = filtered.filter(msg => !msg.author.bot);
      }

      const messagesToDelete = filtered.first(amount);

      if (messagesToDelete.length === 0) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("#ffa500")
              .setDescription("ᴋʜôɴɢ ᴛʜể xᴏá ᴛɪɴ ɴʜắɴ.")
          ],
          ephemeral: true
        });
      }

      await channel.bulkDelete(messagesToDelete, true);

      const embed = new EmbedBuilder()
        .setColor("#00ff99")
        .setDescription(`🗑️ xᴏá **${messagesToDelete.length}** ᴛɪɴ ɴʜắɴ ᴛʜàɴʜ ᴄôɴɢ.`);

      return interaction.reply({ embeds: [embed], ephemeral: true });

    } catch (error) {
      console.error(error);
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#ff0000")
            .setDescription("❌ Đã xảy ra lỗi khi xoá tin nhắn.")
        ],
        ephemeral: true
      });
    }
  }
};
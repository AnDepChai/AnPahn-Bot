const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const translate = require("@iamtraction/google-translate");
const { pinyin } = require('pinyin');
const wanakana = require('wanakana');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('dichvanban')
    .setDescription('ᴅịᴄʜ ᴠăɴ ʙảɴ ᴋèᴍ ᴘʜɪêɴ âᴍ (ɴếᴜ ᴄó).')
    .addStringOption(option =>
      option.setName('iso')
        .setDescription('ᴍã ɴɢôɴ ɴɢữ (ᴠᴅ: zh-CN, ja, ko).')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('nội_dung')
        .setDescription('ᴠăɴ ʙảɴ ᴄầɴ ᴅịᴄʜ (ᴋʜôɴɢ ᴄʜᴜẩɴ 100%).')
        .setRequired(true)
    ),
  async execute(interaction) {
    await interaction.deferReply();
    
    const lang = interaction.options.getString('iso');
    const txt = interaction.options.getString('nội_dung');

    try {
      const result = await translate(txt, { to: lang });
      
      let pronunciation = '';
      const baseLang = lang.split('-')[0];

      if (baseLang === 'zh') {
        pronunciation = pinyin(result.text, { 
          style: pinyin.STYLE_TONE,
          heteronym: true
        }).map(word => word[0]).join(' ');
      } else if (baseLang === 'ja') {
        pronunciation = wanakana.toRomaji(result.text);
      }

      const embed = new EmbedBuilder()
        .setColor('#2e3b46')
        .setTitle('💡 Dịch Văn Bản' + 
          (baseLang === 'zh' ? ' (Tiếng Trung)' : 
           baseLang === 'ja' ? ' (Tiếng Nhật)' : ''))
        .addFields(
          { name: 'ᴠăɴ ʙảɴ ɢốᴄ:', value: txt },
          { name: 'ʙảɴ ᴅịᴄʜ:', value: result.text },
          ...(pronunciation ? [{ name: 'ᴘʜɪêɴ âᴍ (ᴄʜíɴʜ xáᴄ: 55%):', value: pronunciation }] : [])
        )
        .setFooter({ text: '© ᴄᴏᴅᴇ ʙʏ ᴀɴ ᴘᴀʜɴ 🐧' })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor('#ff0000')
            .setDescription(`Lỗi: ${error.message}\n \nᴠᴜɪ ʟòɴɢ ᴄᴜɴɢ ᴄấᴘ ᴍã ɪsᴏ! ɴếᴜ ʙạɴ ᴋʜôɴɢ ʙɪếᴛ ɴó ʟà ɢì, ᴛʜì **[nhấn vào đây](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes)**`)
        ]
      });
    }
  }
};
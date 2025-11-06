/*
const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const axios = require('axios');
const qrSessions = new Map();

const banks = [
  { name: "VietinBank", code: "ICB" },
  { name: "Vietcombank", code: "VCB" },
  { name: "MBBank", code: "MB" },
  { name: "ACB", code: "ACB" },
  { name: "VPBank", code: "VPB" },
  { name: "TPBank", code: "TPB" },
  { name: "MSB", code: "MSB" },
  { name: "LienVietPostBank", code: "LPB" },
  { name: "VietCapitalBank", code: "VCCB" },
  { name: "BIDV", code: "BIDV" },
  { name: "Sacombank", code: "STB" },
  { name: "VIB", code: "VIB" },
  { name: "HDBank", code: "HDB" },
  { name: "SeABank", code: "SEAB" },
  { name: "ShinhanBank", code: "SHBVN" },
  { name: "Agribank", code: "VBA" },
  { name: "Techcombank", code: "TCB" },
  { name: "BacABank", code: "BAB" },
  { name: "ABBANK", code: "ABB" },
  { name: "Eximbank", code: "EIB" },
  { name: "PublicBank", code: "PBVN" },
  { name: "OCB", code: "OCB" },
  { name: "KienLongBank", code: "KLB" },
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('bankqrcode')
    .setDescription('ᴛạᴏ ǫʀ ᴄᴏᴅᴇ ᴛʜᴀɴʜ ᴛᴏáɴ')
    .addStringOption(option => 
      option.setName('stk')
        .setDescription('số ᴛàɪ ᴋʜᴏảɴ (8-15 số)')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('sotien')
        .setDescription('số ᴛɪềɴ (ᴠɴᴅ)')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('noidung')
        .setDescription('ɴộɪ ᴅᴜɴɢ ᴄʜᴜʏểɴ ᴋʜᴏảɴ (ᴛốɪ đᴀ 𝟻𝟶 ᴋý ᴛự)')
        .setRequired(false))
    .addStringOption(option =>
      option.setName('template')
        .setDescription('ᴋɪểᴜ ǫʀ ᴄᴏᴅᴇ')
        .setRequired(false)
        .addChoices(
          { name: 'Compact', value: 'ᴄᴏᴍᴘᴀᴄᴛ' },
          { name: 'Full', value: 'ғᴜʟʟ' }
        )),

  async execute(interaction) {
    try {
      const stk = interaction.options.getString('stk');
      const sotien = interaction.options.getString('sotien');
      const noidung = interaction.options.getString('noidung') || 'ᴛʜᴀɴʜ ᴛᴏáɴ';
      const template = interaction.options.getString('template') || 'ᴄᴏᴍᴘᴀᴄᴛ';

      if (!/^\d{8,15}$/.test(stk)) {
        return interaction.reply({ 
          content: 'số ᴛàɪ ᴋʜᴏảɴ ᴋʜôɴɢ ʜợᴘ ʟệ. ᴠᴜɪ ʟòɴɢ ɴʜậᴘ ᴛừ 8-15 ᴄʜữ số.', 
          ephemeral: true 
        });
      }

      const amount = parseFloat(sotien.replace(/,/g, ''));
      if (isNaN(amount) || amount <= 0) {
        return interaction.reply({ 
          content: 'số ᴛɪềɴ ᴋʜôɴɢ ʜợᴘ ʟệ. ᴠᴜɪ ʟòɴɢ ɴʜậᴘ ᴍộᴛ số ʟớɴ ʜơɴ 𝟶.', 
          ephemeral: true 
        });
      }

      if (noidung.length > 50) {
        return interaction.reply({
          content: 'ɴộɪ ᴅᴜɴɢ ǫᴜá ᴅàɪ (ᴛốɪ đᴀ 50 ᴋý ᴛự)',
          ephemeral: true
        });
      }

      const row = new ActionRowBuilder()
        .addComponents(
          new StringSelectMenuBuilder()
            .setCustomId('select_bank')
            .setPlaceholder('ᴄʜọɴ ɴɢâɴ ʜàɴɢ')
            .addOptions(banks.map(bank => ({
              label: bank.name,
              value: bank.code,
              emoji: '🏦'
            }))),
        );

      const reply = await interaction.reply({ 
          content: 'ᴠᴜɪ ʟòɴɢ ᴄʜọɴ ɴɢâɴ ʜàɴɢ:', 
          components: [row],
          ephemeral: true, 
          fetchReply: true
        });

      const filter = i => i.customId === 'select_bank' && i.user.id === interaction.user.id;
      const collector = reply.createMessageComponentCollector({ 
        filter, 
        time: 60000 
      });

      collector.on('collect', async i => {
        try {
          const bankCode = i.values[0];
          const bankName = banks.find(b => b.code === bankCode).name;
          
          const sessionId = `${i.user.id}-${Date.now()}`;
          qrSessions.set(sessionId, {
            stk, amount, content: noidung, bankCode, template
          });

          const qrURL = `https://qr.sepay.vn/img?acc=${stk}&bank=${bankCode}&amount=${amount}&des=${encodeURIComponent(noidung)}&template=${template}`;

          const embed = new EmbedBuilder()
            .setTitle('💳 ǫʀ ᴄᴏᴅᴇ ᴛʜᴀɴʜ ᴛᴏáɴ')
            .setDescription([
              `**ɴɢâɴ ʜàɴɢ:** ${bankName}`,
              `**số ᴛàɪ ᴋʜᴏảɴ:** \`${stk}\``,
              `**số ᴛɪềɴ:** \`${amount.toLocaleString()} VND\``,
              `**ɴộɪ ᴅᴜɴɢ:** ${noidung}`
            ].join('\n'))
            .setImage(qrURL)
            .setColor('#2b9eb3')
            .setFooter({ text: '© ᴄᴏᴅᴇ ʙʏ ᴀɴ ᴘᴀʜɴ 🐧 | xóᴀ sᴀᴜ 𝟻 ᴘʜúᴛ.' })
            .setTimestamp();

          const rowWithActions = new ActionRowBuilder()
            .addComponents(
              new ButtonBuilder()
                .setLabel('ᴛảɪ xᴜốɴɢ')
                .setStyle(ButtonStyle.Link)
                .setURL(qrURL),
              new ButtonBuilder()
                .setLabel('ᴛạᴏ ʟạɪ')
                .setCustomId(`regenerate_${sessionId}`)
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('🔄')
            );

          await interaction.channel.send({ 
            content: `📤 ᴍã ǫʀ ᴅᴏ <@${i.user.id}> ᴛạᴏ:`,
            embeds: [embed],
            components: [rowWithActions]
           });

          await i.update({
             components: []
           });

         // console.log(`[QR Generated] ${i.user.tag} | ${bankCode} | ${amount}VND`);
          
          setTimeout(() => {
            i.deleteReply().catch(() => {});
            qrSessions.delete(sessionId);
          }, 300000);

        } catch (error) {
          await i.reply({ 
            content: 'xảʏ ʀᴀ ʟỗɪ ᴋʜɪ ᴛạᴏ ǫʀ ᴄᴏᴅᴇ.', 
            ephemeral: true 
          });
        }
      });

      collector.on('end', () => {
        reply.edit({ components: [] }).catch(() => {});
      });

    } catch (error) {
      await interaction.reply({ 
        content: 'xảʏ ʀᴀ ʟỗɪ ᴋʜɪ ᴛʜựᴄ ʜɪệɴ ʟệɴʜ.', 
        ephemeral: true 
      });
    }
  }
};
*/


const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const axios = require('axios');
const qrSessions = new Map();

const BANKS = [
  { name: "VietinBank", code: "ICB" },
  { name: "Vietcombank", code: "VCB" },
  { name: "MBBank", code: "MB" },
  { name: "ACB", code: "ACB" },
  { name: "VPBank", code: "VPB" },
  { name: "TPBank", code: "TPB" },
  { name: "MSB", code: "MSB" },
  { name: "LienVietPostBank", code: "LPB" },
  { name: "VietCapitalBank", code: "VCCB" },
  { name: "BIDV", code: "BIDV" },
  { name: "Sacombank", code: "STB" },
  { name: "VIB", code: "VIB" },
  { name: "HDBank", code: "HDB" },
  { name: "SeABank", code: "SEAB" },
  { name: "ShinhanBank", code: "SHBVN" },
  { name: "Agribank", code: "VBA" },
  { name: "Techcombank", code: "TCB" },
  { name: "BacABank", code: "BAB" },
  { name: "ABBANK", code: "ABB" },
  { name: "Eximbank", code: "EIB" },
  { name: "PublicBank", code: "PBVN" },
  { name: "OCB", code: "OCB" },
  { name: "KienLongBank", code: "KLB" },
];

const MAX_AMOUNT = 500000000; // 500 triệu VND
const SESSION_TIMEOUT = 5 * 60 * 1000;
const API_TIMEOUT = 5000;
const COOLDOWN_TIME = 15000; 

const cooldowns = new Map();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('bankqrcode')
    .setDescription('ᴛạᴏ ǫʀ ᴄᴏᴅᴇ ᴛʜᴀɴʜ ᴛᴏáɴ')
    .addStringOption(option => 
      option.setName('số_tài_khoản')
        .setDescription('số ᴛàɪ ᴋʜᴏảɴ (8-15 số)')
        .setRequired(true)
        .setMinLength(8)
        .setMaxLength(15))
    .addStringOption(option =>
      option.setName('số_tiền')
        .setDescription('Số tiền (VND)')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('nội_dung_chuyển_tiền')
        .setDescription('ɴộɪ ᴅᴜɴɢ ᴄʜᴜʏểɴ ᴋʜᴏảɴ (ᴛốɪ đᴀ 50 ᴋý ᴛự')
        .setRequired(false)
        .setMaxLength(50)),

  async execute(interaction) {
    if (cooldowns.has(interaction.user.id)) {
      const remaining = (cooldowns.get(interaction.user.id) - Date.now()) / 1000;
      return interaction.reply({
        content: `Vui lòng đợi ${remaining.toFixed(0)} giây trước khi dùng lại lệnh.`,
        ephemeral: true
      });
    }
    cooldowns.set(interaction.user.id, Date.now() + COOLDOWN_TIME);
    setTimeout(() => cooldowns.delete(interaction.user.id), COOLDOWN_TIME);

    const stk = interaction.options.getString('số_tài_khoản');
    const sotien = interaction.options.getString('số_tiền');
    const noidung = interaction.options.getString('nội_dung_chuyển_tiền') || 'Thanh toán';

    if (!/^\d{8,15}$/.test(stk)) {
      return interaction.reply({ 
        content: 'Số tài khoản không hợp lệ. Vui lòng nhập 8-15 chữ số.', 
        ephemeral: true 
      });
    }

    const amount = parseFloat(sotien.replace(/[^0-9]/g, ''));
    if (isNaN(amount) || amount <= 0 || amount > MAX_AMOUNT) {
      return interaction.reply({ 
        content: `Số tiền phải từ 1 - ${MAX_AMOUNT.toLocaleString()} VND.`, 
        ephemeral: true 
      });
    }

    const row = new ActionRowBuilder()
      .addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('select_bank')
          .setPlaceholder('ᴄʜọɴ ɴɢâɴ ʜàɴɢ')
          .addOptions(BANKS.map(bank => ({
            label: bank.name,
            value: bank.code
          })))
      );

    const reply = await interaction.reply({ 
      content: 'ᴠᴜɪ ʟòɴɢ ᴄʜọɴ ɴɢâɴ ʜàɴɢ:', 
      components: [row],
      ephemeral: true,
      fetchReply: true
    });

    const collector = reply.createMessageComponentCollector({ 
      filter: i => i.user.id === interaction.user.id, 
      time: 60000 
    });

    collector.on('collect', async i => {
    try {
        const bankCode = i.values[0];
        const bank = BANKS.find(b => b.code === bankCode);

        const qrURL = new URL('https://qr.sepay.vn/img');
        qrURL.searchParams.set('acc', stk);
        qrURL.searchParams.set('bank', bankCode);
        qrURL.searchParams.set('amount', amount);
        qrURL.searchParams.set('des', noidung.slice(0, 50));

        try {
            await axios.head(qrURL.toString(), { timeout: API_TIMEOUT });
        } catch (error) {
            return i.reply({ 
                content: 'Không thể kết nối đến dịch vụ QR. Vui lòng thử lại sau.', 
                ephemeral: true 
            });
        }

        const embed = new EmbedBuilder()
            .setTitle('💳 ǫʀ ᴄᴏᴅᴇ ᴛʜᴀɴʜ ᴛᴏáɴ')
            .setDescription([
              `**ɴɢâɴ ʜàɴɢ:** ${bank.name}`,
              `**số ᴛàɪ ᴋʜᴏảɴ:** \`${stk}\``,
              `**số ᴛɪềɴ:** \`${amount.toLocaleString()} VND\``,
              `**ɴộɪ ᴅᴜɴɢ:** ${noidung}`,
              `**QR Time:**  xóᴀ sᴀᴜ 𝟻 ᴘʜúᴛ`  
].join('\n'))
            .setImage(qrURL.toString())
            .setColor('#2b9eb3')
            .setFooter({ text: '© ᴄᴏᴅᴇ ʙʏ ᴀɴ ᴘᴀʜɴ 🐧' })
            .setTimestamp();

        const rowWithActions = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('ᴛảɪ xᴜốɴɢ')
                    .setStyle(ButtonStyle.Link)
                    .setURL(qrURL.toString())
            );

        await interaction.channel.send({
    content: `📤 ᴍã ǫʀ ᴅᴏ <@${i.user.id}> ᴛạᴏ:`,
         embeds: [embed],
         components: [rowWithActions]
         }).then(sentMessage => {
     setTimeout(async () => {
        try {
            await sentMessage.delete();
        } catch (error) {
            console.error('Không thể xóa message:', error);
        }
    }, 5 * 60 * 1000); // 5 phút
});
        await i.update({ components: [] });

    } catch (error) {
        console.error('QR Generation Error:', error);
        await i.reply({ 
            content: 'Lỗi khi tạo QR code.', 
            ephemeral: true 
        });
    }
});

    collector.on('end', () => {
      reply.edit({ components: [] }).catch(() => {});
    });
  }
};

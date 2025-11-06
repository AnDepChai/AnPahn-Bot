/*
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const helpEmbedsCache = new Map();

module.exports = {
  data: {
    name: 'help',
    description: 'ʜɪểɴ ᴛʜị ᴛấᴛ ᴄả ʟệɴʜ ᴄó ᴛʜể ᴅùɴɢ đượᴄ.',
  },
  async execute(interaction) {
    try {
      const embeds = getHelpEmbeds(interaction.user);
      let pageIndex = 0;
      
      const message = await interaction.reply({
        embeds: [embeds[pageIndex]],
        components: [createActionRow(pageIndex, embeds.length)],
        ephemeral: true,
        fetchReply: true,
      });

      const collector = message.createMessageComponentCollector({
        filter: i => ['prev', 'next', 'stop'].includes(i.customId) && i.user.id === interaction.user.id,
        time: 300000 // 5 phút timeout
      });

      collector.on('collect', async i => {
        try {
          if (i.customId === 'stop') {
            await i.update({ components: [] });
            collector.stop();
            return;
          }
          
          pageIndex = i.customId === 'next' 
            ? (pageIndex + 1) % embeds.length 
            : (pageIndex - 1 + embeds.length) % embeds.length;
            
          await i.update({
            embeds: [embeds[pageIndex]],
            components: [createActionRow(pageIndex, embeds.length)],
          });
          
        } catch (error) {
          console.error('Lỗi khi xử lý tương tác help:', error);
        }
      });

      collector.on('end', () => {
        try {
          message.edit({ components: [] }).catch(() => {});
        } catch (error) {
          console.error('Lỗi khi kết thúc collector help:', error);
        }
      });

    } catch (error) {
      console.error('Lỗi khi thực thi lệnh help:', error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ 
          content: '⚠️ Đã xảy ra lỗi khi hiển thị help! Vui lòng thử lại sau.', 
          ephemeral: true 
        });
      } else {
        await interaction.reply({ 
          content: '⚠️ Đã xảy ra lỗi khi hiển thị help! Vui lòng thử lại sau.', 
          ephemeral: true 
        });
      }
    }
  }
};

function getHelpEmbeds(user) {
  if (!helpEmbedsCache.has(user.id)) {
    helpEmbedsCache.set(user.id, createHelpEmbeds(user));
  }
  return helpEmbedsCache.get(user.id);
}

function createHelpEmbeds(user) {
    return [
        new EmbedBuilder()
        .setTitle("📜 ᴀʟʟ ᴄᴏᴍᴍᴀɴᴅ & ᴛừ ᴋʜᴏá ᴛᴇxᴛt 📜")
        .setDescription(
            "ʙᴏᴛ đᴀɴɢ sử ᴅụɴɢ ʟệɴʜ sʟᴀsʜ ᴄᴏᴍᴍᴀɴᴅ để ʙɪếᴛ ᴛʜêᴍ ʜãʏ ᴅùɴɢ ʟệɴʜ : `/help`\n" +
            "- Lưu Ý: `Bot Sẽ Ngưng Từ Khoá Text Sau Khi Dùng Từ Khoá Đầu, Sẽ Hồi Sau 60s`.\n" +
            "- Cảm Ơn Các Bạn Đã Dùng Bot!!",
        )
        .setColor("#ef87fa")
        .setFooter({
            text: "© ᴄᴏᴅᴇ ʙʏ ᴀɴ ᴘᴀʜɴ 🐧"
        })
        .setImage(
            "https://cdn.donmai.us/sample/ad/1a/__momoi_blue_archive_drawn_by_go_sai_tamanegi__sample-ad1a1d4fdeb9630ba798de757804564d.jpg",
        )
        .setTimestamp(),

        new EmbedBuilder()
        .setTitle("ᴀᴅᴍɪɴɪsᴛʀᴀᴛᴏʀ ʙᴏᴛ - [🔰]")
        .setDescription(
            "• ᴄáᴄ ʟệɴʜ ᴅướɪ ᴄʜỉ <@958668688607838208> ᴅùɴɢ đượᴄ!\n``` /reload <module>.\n /quetpl | Quét virus plugins.\n /mute | <@mention> <time> <reason>.\n /unmute | <@mention>.\n /kick | <mention>.\n /ban | <@mention> <reason>.\n /unban | <id>.\n /traovaitro <@mention> <role>.\n /tuocvaitro <@mention> <role>. ```",
        )
        .setColor("#ef87fa")
        .setFooter({
            text: "© ᴄᴏᴅᴇ ʙʏ ᴀɴ ᴘᴀʜɴ 🐧"
        })
        .setImage(
            "https://cdn.donmai.us/sample/ad/1a/__momoi_blue_archive_drawn_by_go_sai_tamanegi__sample-ad1a1d4fdeb9630ba798de757804564d.jpg",
        )
        .setTimestamp(),

        new EmbedBuilder()
        .setTitle("ᴠăɴ ʙảɴ ᴛᴇxᴛ - [💬]")
        .setDescription(
            "``` • DANG CAP NHAT...(Lười thêm file) ```",
        )
        .setColor("#ef87fa")
        .setFooter({
            text: "© ᴄᴏᴅᴇ ʙʏ ᴀɴ ᴘᴀʜɴ 🐧"
        })
        .setImage(
            "https://cdn.donmai.us/sample/ad/1a/__momoi_blue_archive_drawn_by_go_sai_tamanegi__sample-ad1a1d4fdeb9630ba798de757804564d.jpg",
        )
        .setTimestamp(),

        new EmbedBuilder()
        .setTitle("ʟệɴʜ sʟᴀsʜ ᴄᴏᴍᴍᴀɴᴅ - [🔧]")
        .setDescription(
            "``` /avatar | <Xem avatar>.\n /quetlink | Kiểm tra link>.\n /bankqrcode | <Tạo QR chuyển tiền ngân hàng>.\n /emojidl | <Tải emoji bằng id emoji>.\n /dichvanban | <Dịch văn bản bằng mã ISO>.\n /noitext | <Chuyển văn bản sang giọng nói>.\n /xemthoitiet | <Xem thời tiết>.\n /anhwaifu | <Gửi ảnh anime>.\n /riengwaifu | <Gửi ảnh anime riêng>.\n - Lưu ý: lệnh /anhwaifu & /riengwaifu sẽ delay 5->10s nên hãy kiên nhẫn nhé.```",
        )
        .setColor("#ef87fa")
        .setFooter({
            text: "© ᴄᴏᴅᴇ ʙʏ ᴀɴ ᴘᴀʜɴ 🐧"
        })
        .setImage(
            "https://cdn.donmai.us/sample/ad/1a/__momoi_blue_archive_drawn_by_go_sai_tamanegi__sample-ad1a1d4fdeb9630ba798de757804564d.jpg",
        )
        .setTimestamp(),

        new EmbedBuilder()
        .setTitle("ʟệɴʜ ᴅùɴɢ ɴʜạᴄ - [🎵]")
        .setDescription(
            "``` !joinv | Vào voice.\n !leavev | Rời voice.\n !playnhac | Phát nhạc.\n !hangdoi | Xem hàng đợi nhạc.\n !dungnhac | Dừng nhạc.\n !choitiep | Phát tiếp nhạc.\n !quabai | Qua bài tiếp theo.\n !laplainhac | Tắt & Bật lặp lại nhạc.\n !247 | Giữ trạng thái trong voice.\n```",
        )
        .setColor("#ef87fa")
        .setFooter({
            text: "© ᴄᴏᴅᴇ ʙʏ ᴀɴ ᴘᴀʜɴ 🐧"
        })
        .setImage(
            "https://cdn.donmai.us/sample/ad/1a/__momoi_blue_archive_drawn_by_go_sai_tamanegi__sample-ad1a1d4fdeb9630ba798de757804564d.jpg",
        )
        .setTimestamp(),

        new EmbedBuilder()
        .setTitle("ᴅùɴɢ ɴʜạᴄ ɴʜᴀɴʜ - [🎵]")
        .setDescription(
            "``` !jv | Vào voice.\n !lv | Rời voice.\n !pn | Tên nhạc & Link nhạc.\n !hd | Xem hàng đợi nhạc.\n !dn | Dừng nhạc.\n !ct | Phát tiếp nhạc.\n !qb | Qua bài tiếp theo\n !lln | Tắt & Bật lặp lại nhạc.\n !247 | Giữ trạng thái trong voice ```",
        )
        .setColor("#ef87fa")
        .setFooter({
            text: "© ᴄᴏᴅᴇ ʙʏ ᴀɴ ᴘᴀʜɴ 🐧"
        })
        .setImage(
            "https://cdn.donmai.us/sample/ad/1a/__momoi_blue_archive_drawn_by_go_sai_tamanegi__sample-ad1a1d4fdeb9630ba798de757804564d.jpg",
        )
        .setTimestamp(),

        new EmbedBuilder()
        .setTitle("ᴋếᴛ ᴛʜúᴄ - [ 😘 ]")
        .setDescription(
            "• ᴄảᴍ ơɴ ᴄáᴄ ʙạɴ đã ᴅùɴɢ ʙᴏᴛ <@1180786118724177920>\n \n```• ᴛᴜʏ ᴄʜỉ ʟà ʙᴏᴛ ᴛʜử ɴɢʜɪệᴍ ᴠà ᴄòɴ ɴʜɪềᴜ ᴛʜɪếᴜ sóᴛ ᴄũɴɢ ɴʜư ᴍᴏɴɢ ᴍọɪ ɴɢườɪ ʙỏ ǫᴜᴀ!\n• ʟờɪ ᴄᴜốɪ ᴄùɴɢ ᴄũɴɢ ɴʜư ʟà ʟờɪ ᴄảᴍ ơɴ đếɴ ᴍọɪ ɴɢườɪ đã ᴛɪɴ ᴛưởɴɢ ᴠà ᴄũɴɢ ɴʜư ʟà ᴅùɴɢ ʙᴏᴛ! ```",
        )
        .setColor("#ef87fa")
        .setFooter({
            text: "© ᴄᴏᴅᴇ ʙʏ ᴀɴ ᴘᴀʜɴ 🐧"
        })
        .setImage(
            "https://cdn.donmai.us/sample/ad/1a/__momoi_blue_archive_drawn_by_go_sai_tamanegi__sample-ad1a1d4fdeb9630ba798de757804564d.jpg",
        )
        .setTimestamp(),
    ];
}

function createActionRow(pageIndex, totalPages) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("prev")
      .setLabel("◀️")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(pageIndex === 0),
    new ButtonBuilder()
      .setCustomId("stop")
      .setLabel("⏹️")
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId("next")
      .setLabel("▶️")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(pageIndex === totalPages - 1)
  );
}
*/




const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('ʜɪểɴ ᴛʜị ᴛấᴛ ᴄả ʟệɴʜ ᴄó ᴛʜể ᴅùɴɢ đượᴄ.'),

  async execute(interaction) {
    const categories = {
      all: new EmbedBuilder()
        .setTitle("📜 ᴀʟʟ ᴄᴏᴍᴍᴀɴᴅ & ᴛừ ᴋʜᴏá ᴛᴇxᴛt 📜")
        .setDescription(
          "ʙᴏᴛ đᴀɴɢ sử ᴅụɴɢ ʟệɴʜ sʟᴀsʜ ᴄᴏᴍᴍᴀɴᴅ để ʙɪếᴛ ᴛʜêᴍ ʜãʏ ᴅùɴɢ ʟệɴʜ : `/help`\n" +
          "- Lưu Ý: `Bot Sẽ Ngưng Từ Khoá Text Sau Khi Dùng Từ Khoá Đầu, Sẽ Hồi Sau 60s`.\n" +
          "- Cảm Ơn Các Bạn Đã Dùng Bot!!"
        )
        .setColor("#ef87fa")
        .setFooter({ text: "© ᴄᴏᴅᴇ ʙʏ ᴀɴ ᴘᴀʜɴ 🐧" })
        .setImage("https://cdn.donmai.us/sample/ad/1a/__momoi_blue_archive_drawn_by_go_sai_tamanegi__sample-ad1a1d4fdeb9630ba798de757804564d.jpg")
        .setTimestamp(),

      admin: new EmbedBuilder()
        .setTitle("ᴀᴅᴍɪɴɪsᴛʀᴀᴛᴏʀ ʙᴏᴛ - [🔰]")
        .setDescription(
          "• ᴄáᴄ ʟệɴʜ ᴅướɪ ᴄʜỉ <@958668688607838208> ᴅùɴɢ đượᴄ!\n``` /reload <module>.\n /quetpl | Quét virus plugins.\n /mute | <@mention> <time> <reason>.\n /unmute | <@mention>.\n /kick | <mention>.\n /ban | <@mention> <reason>.\n /unban | <id>.\n /traovaitro <@mention> <role>.\n /tuocvaitro <@mention> <role>. ```"
        )
        .setColor("#ef87fa")
        .setFooter({ text: "© ᴄᴏᴅᴇ ʙʏ ᴀɴ ᴘᴀʜɴ 🐧" })
        .setImage("https://cdn.donmai.us/sample/ad/1a/__momoi_blue_archive_drawn_by_go_sai_tamanegi__sample-ad1a1d4fdeb9630ba798de757804564d.jpg")
        .setTimestamp(),

      text: new EmbedBuilder()
        .setTitle("ᴠăɴ ʙảɴ ᴛᴇxᴛ - [💬]")
        .setDescription("``` • DANG CAP NHAT...(Lười thêm file) ```")
        .setColor("#ef87fa")
        .setFooter({ text: "© ᴄᴏᴅᴇ ʙʏ ᴀɴ ᴘᴀʜɴ 🐧" })
        .setImage("https://cdn.donmai.us/sample/ad/1a/__momoi_blue_archive_drawn_by_go_sai_tamanegi__sample-ad1a1d4fdeb9630ba798de757804564d.jpg")
        .setTimestamp(),

      slash: new EmbedBuilder()
        .setTitle("ʟệɴʜ sʟᴀsʜ ᴄᴏᴍᴍᴀɴᴅ - [🔧]")
        .setDescription(
          "``` /avatar | <Xem avatar>.\n /quetlink | Kiểm tra link>.\n /bankqrcode | <Tạo QR chuyển tiền ngân hàng>.\n /emojidl | <Tải emoji bằng id emoji>.\n /dichvanban | <Dịch văn bản bằng mã ISO>.\n /noitext | <Chuyển văn bản sang giọng nói>.\n /xemthoitiet | <Xem thời tiết>.\n /anhwaifu | <Gửi ảnh anime>.\n /riengwaifu | <Gửi ảnh anime riêng>.\n - Lưu ý: lệnh /anhwaifu & /riengwaifu sẽ delay 5->10s nên hãy kiên nhẫn nhé.```"
        )
        .setColor("#ef87fa")
        .setFooter({ text: "© ᴄᴏᴅᴇ ʙʏ ᴀɴ ᴘᴀʜɴ 🐧" })
        .setImage("https://cdn.donmai.us/sample/ad/1a/__momoi_blue_archive_drawn_by_go_sai_tamanegi__sample-ad1a1d4fdeb9630ba798de757804564d.jpg")
        .setTimestamp(),

      end: new EmbedBuilder()
        .setTitle("ᴋếᴛ ᴛʜúᴄ - [ 😘 ]")
        .setDescription(
          "• ᴄảᴍ ơɴ ᴄáᴄ ʙạɴ đã ᴅùɴɢ ʙᴏᴛ <@1180786118724177920>\n \n```• ᴛᴜʏ ᴄʜỉ ʟà ʙᴏᴛ ᴛʜử ɴɢʜɪệᴍ ᴠà ᴄòɴ ɴʜɪềᴜ ᴛʜɪếᴜ sóᴛ ᴄũɴɢ ɴʜư ᴍᴏɴɢ ᴍọɪ ɴɢườɪ ʙỏ ǫᴜᴀ!\n• ʟờɪ ᴄᴜốɪ ᴄùɴɢ ᴄũɴɢ ɴʜư ʟà ʟờɪ ᴄảᴍ ơɴ đếɴ ᴍọɪ ɴɢườɪ đã ᴛɪɴ ᴛưởɴɢ ᴠà ᴄũɴɢ ɴʜư ʟà ᴅùɴɢ ʙᴏᴛ! ```"
        )
        .setColor("#ef87fa")
        .setFooter({ text: "© ᴄᴏᴅᴇ ʙʏ ᴀɴ ᴘᴀʜɴ 🐧" })
        .setImage("https://cdn.donmai.us/sample/ad/1a/__momoi_blue_archive_drawn_by_go_sai_tamanegi__sample-ad1a1d4fdeb9630ba798de757804564d.jpg")
        .setTimestamp(),
    };

    const menu = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('help-menu')
        .setPlaceholder('📂 Chọn danh mục để xem...')
        .addOptions([
          { label: '📜 Lưu ý', value: 'all' },
          { label: '🔰 Admin Commands', value: 'admin' },
          { label: '💬 Text Commands', value: 'text' },
          { label: '🔧 Slash Commands', value: 'slash' },
          { label: '😘 Kết thúc', value: 'end' },
        ])
    );

    await interaction.reply({ embeds: [categories.all], components: [menu], ephemeral: true });

    const collector = interaction.channel.createMessageComponentCollector({
      filter: i => i.customId === 'help-menu' && i.user.id === interaction.user.id,
      time: 300000, // 5 phút
    });

    collector.on('collect', async i => {
      const selected = i.values[0];
      await i.update({ embeds: [categories[selected]], components: [menu] });
    });

    collector.on('end', async () => {
      try {
        await interaction.editReply({ components: [] });
      } catch {}
    });
  },
};
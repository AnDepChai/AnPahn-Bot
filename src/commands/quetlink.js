const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const axios = require("axios");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("quetlink")
    .setDescription("ǫᴜéᴛ ᴍứᴄ độ ᴀɴ ᴛᴏàɴ ᴄủᴀ ᴜʀʟ.")
    .addStringOption(option =>
      option
        .setName("url_cần_quét")
        .setDescription("ᴛʜêᴍ ᴜʀʟ ᴅạɴɢ (ʜᴛᴛᴘs://) để ǫᴜéᴛ.")
        .setRequired(true)
    ),

  async execute(interaction) {
    const url = interaction.options.getString("url_cần_quét");

    if (!url) {
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#ff0000")
            .setDescription("ᴠᴜɪ ʟòɴɢ ɴʜậᴘ ᴜʀʟ để ǫᴜéᴛ."),
        ],
        ephemeral: true,
      });
      return;
    }

    const embedScanning = new EmbedBuilder()
      .setColor("#0099ff")
      .setDescription(
        "Đᴀɴɢ ǫᴜéᴛ ᴜʀʟ, ᴠᴜɪ ʟòɴɢ đợɪ <a:loadingma:1265977725559111710>\nᴄó ᴛʜể ᴍấᴛ ᴛừ 𝟹-𝟻 ᴘʜúᴛ để ǫᴜéᴛ xᴏɴɢ!"
      );

    await interaction.reply({ embeds: [embedScanning], ephemeral: false });

    try {
      const options = {
        method: "POST",
        url: "https://www.virustotal.com/api/v3/urls",
        headers: {
          accept: "application/json",
          "x-apikey": process.env.VIRUSTOTAL_API_KEY,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        data: `url=${encodeURIComponent(url)}`,
      };

      const response = await axios.request(options);
      const scanId = response.data.data.id;

      const checkScanStatus = async scanId => {
        const statusOptions = {
          method: "GET",
          url: `https://www.virustotal.com/api/v3/analyses/${scanId}`,
          headers: {
            accept: "application/json",
            "x-apikey": process.env.VIRUSTOTAL_API_KEY,
          },
        };

        let scanResponse;
        let completed = false;

        while (!completed) {
          scanResponse = await axios.request(statusOptions);
          if (scanResponse.data.data.attributes.status === "completed") {
            completed = true;
          } else {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }

        return scanResponse.data;
      };

      const scanResult = await checkScanStatus(scanId);
      const results = scanResult.data.attributes.results;
      const detections = [];

      for (const engine in results) {
        if (results[engine].category === "malicious") {
          detections.push(`${engine}: ${results[engine].result}`);
        }
      }

      if (detections.length > 0) {
        embedScanning
          .setColor("#ff0000")
          .setDescription(
            `ᴋếᴛ ǫᴜả ǫᴜéᴛ ᴜʀʟ: **${url}**\n\nᴘʜáᴛ ʜɪệɴ ᴄáᴄ ᴘʜầɴ ᴍềᴍ độᴄ ʜạɪ:\n\`\`\`${detections.join(
              "\n"
            )}\`\`\``
          )
          .setFooter({ text: "© sᴄᴀɴ ᴠɪʀᴜs ᴀᴛʜ🐧" })
          .setTimestamp();
      } else {
        embedScanning
          .setColor("#00ff00")
          .setDescription(
            `ᴋếᴛ ǫᴜả ǫᴜéᴛ ᴜʀʟ: **${url}**\n\n\`\`\`ᴋʜôɴɢ ᴘʜáᴛ ʜɪệɴ ᴘʜầɴ ᴍềᴍ độᴄ ʜạɪ.\`\`\``
          )
          .setFooter({ text: "© Scan virus ATH🐧" })
          .setTimestamp();
      }

      await interaction.editReply({ embeds: [embedScanning] });
    } catch (err) {
      console.error(err);
      await interaction.editReply({
        embeds: [
          embedScanning
            .setColor("#ff0000")
            .setDescription(`ʟỗɪ ᴋʜɪ ǫᴜéᴛ ᴜʀʟ. ᴄʜɪ ᴛɪếᴛ: \`${err.message}\``),
        ],
      });
    }
  },
};
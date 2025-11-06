const config = require('../config.json');
const axios = require('axios');
const FormData = require('form-data');
const {
    SlashCommandBuilder,
    EmbedBuilder
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('quetpl')
        .setDescription('ǫᴜéᴛ ᴘʟᴜɢɪɴ ᴅạɴɢ (.ᴊᴀʀ) để ᴋɪểᴍ ᴛʀᴀ độ ᴀɴ ᴛᴏàɴ.')
        .addAttachmentOption(option =>
            option.setName('plugins_cần_quét')
                .setDescription('ᴛệᴘ ᴘʟᴜɢɪɴ (.ᴊᴀʀ) ᴄầɴ ǫᴜéᴛ.')
                .setRequired(true),
        ),

    async execute(interaction) {
        const pluginAttachment = interaction.options.getAttachment("plugins_cần_quét");

        if (!pluginAttachment.name.endsWith(".jar")) {
            await interaction.reply({
                content: "❌ ᴠᴜɪ ʟòɴɢ ɢửɪ ғɪʟᴇ ᴘʟᴜɢɪɴ ᴅạɴɢ (.ᴊᴀʀ).",
                ephemeral: true,
            });
            return;
        }

        if (!config.adminIDs.includes(interaction.user.id)) {
            await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#ff0000")
                        .setTitle("⚠️ ǫᴜʏềɴ ʜạɴ ᴋʜôɴɢ đủ ⚠️")
                        .setDescription("❎ ʙạɴ ᴋʜôɴɢ ᴄó ǫᴜʏềɴ sử ᴅụɴɢ ʟệɴʜ ɴàʏ."),
                ],
                ephemeral: true,
            });
            return;
        }

        const initialReply = await interaction.reply({
            embeds: [
                new EmbedBuilder()
                .setColor("#0099ff")
                .setDescription(
                    "Đᴀɴɢ ǫᴜéᴛ ғɪʟᴇ, ᴠᴜɪ ʟòɴɢ đợɪ <a:loadingma:1265977725559111710>\nᴄó ᴛʜể ᴍấᴛ ᴛừ 𝟹-𝟻 ᴘʜúᴛ để ǫᴜéᴛ xᴏɴɢ!",
                ),
            ],
            ephemeral: false,
            fetchReply: true,
        });

        try {
            const response = await axios.get(pluginAttachment.url, {
                responseType: 'arraybuffer'
            });
            const buffer = Buffer.from(response.data);

            const formData = new FormData();
            formData.append("file", buffer, {
                filename: pluginAttachment.name
            });

            const options = {
                method: "POST",
                url: "https://www.virustotal.com/api/v3/files",
                headers: {
                    accept: "application/json",
                    "x-apikey": process.env.VIRUSTOTAL_API_KEY,
                    ...formData.getHeaders(),
                },
                data: formData,
            };

            const uploadResponse = await axios.request(options);
            const fileId = uploadResponse.data.data.id;


            const checkScanStatus = async (fileId) => {
                const scanOptions = {
                    method: "GET",
                    url: `https://www.virustotal.com/api/v3/analyses/${fileId}`,
                    headers: {
                        accept: "application/json",
                        "x-apikey": process.env.VIRUSTOTAL_API_KEY,
                    },
                };

                let scanResponse;
                let completed = false;


                while (!completed) {
                    scanResponse = await axios.request(scanOptions);
                    if (scanResponse.data.data.attributes.status === "completed") {
                        completed = true;
                    } else {
                        await new Promise((resolve) => setTimeout(resolve, 2000));
                    }
                }
                return scanResponse.data;
            };

            const scanResult = await checkScanStatus(fileId);
            const results = scanResult.data.attributes.results;
            const detections = [];

            for (const engine in results) {
                if (results[engine].category === "malicious") {
                    detections.push(`${engine}: ${results[engine].result}`);
                }
            }

            let embedResult;
            if (detections.length > 0) {
                embedResult = new EmbedBuilder()
                .setColor("#ff0000")
                .setDescription(
                    `ᴋếᴛ ǫᴜả ǫᴜéᴛ ғɪʟᴇ: **${pluginAttachment.name}**\n\nᴄʜươɴɢ ᴛʀìɴʜ độᴄ ʜạɪ đượᴄ ᴘʜáᴛ ʜɪệɴ:\n\`\`\`${detections.join("\n")}\`\`\``,
                )
                .setFooter({
                    text: "© sᴄᴀɴ ᴠɪʀᴜs ᴀᴛʜ🐧"
                })
                .setTimestamp();
            } else {
                embedResult = new EmbedBuilder()
                .setColor("#00ff00")
                .setDescription(
                    `ᴋếᴛ ǫᴜả ǫᴜéᴛ ғɪʟᴇ: **${pluginAttachment.name}**\n\n\`\`\`ᴋʜôɴɢ ᴘʜáᴛ ʜɪệɴ ᴄʜươɴɢ ᴛʀìɴʜ độᴄ ʜạɪ ɴàᴏ.\`\`\``,
                )
                .setFooter({
                    text: "© ᴄᴏᴅᴇ ʙʏ ᴀɴ ᴘᴀʜɴ 🐧"
                })
                .setTimestamp();
            }


            await interaction.editReply({
                embeds: [embedResult]
            });
        } catch (err) {
            console.error(err);
            await interaction.editReply({
                content: `ʟỗɪ ᴋʜɪ ǫᴜéᴛ ғɪʟᴇ. ᴄʜɪ ᴛɪếᴛ: \`${err.message}\``,
                embeds: [],
                ephemeral: true,
            });
        }
    },
};
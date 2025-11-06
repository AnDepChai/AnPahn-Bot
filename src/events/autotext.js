const { EmbedBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");

const cooldowns = {};
const cooldownAlerts = {};
const cooldownTime = 60000; // 60s
const folderPath = path.join(__dirname, "..", "text");

function loadFileContents(folderPath) {
  let fileContents = {};
  fs.readdirSync(folderPath).forEach((file) => {
    if (path.extname(file) === ".txt") {
      const filePath = path.join(folderPath, file);
      const fileName = path.basename(file, ".txt");
      try {
        const content = fs.readFileSync(filePath, "utf8");
        fileContents[fileName.toLowerCase()] = content;
      } catch (error) {
        console.error(`Không đọc được file ${filePath}: ${error.message}`);
      }
    }
  });
  return fileContents;
}

const fileContents = loadFileContents(folderPath);

module.exports = {
  name: "messageCreate",
  async execute(message) {
    if (message.author.bot) return;

    const userId = message.author.id;
    const content = message.content.toLowerCase().trim();
    const now = Date.now();
    const lastTime = cooldowns[userId];

    if (!(content in fileContents)) return;

    if (lastTime && now - lastTime < cooldownTime) {
      if (!cooldownAlerts[userId]) {
        const remainingTime = cooldownTime - (now - lastTime);
        let count = Math.ceil(remainingTime / 1000);

        const embed = new EmbedBuilder()
          .setColor("#FF0000")
          .setTitle("⏳ ᴛʜờɪ ɢɪᴀɴ ʜồɪ ᴛᴇxᴛ")
          .setDescription(`ʙạɴ ᴄầɴ đợɪ ${count} ɢɪâʏ ᴛʀướᴄ ᴋʜɪ sử ᴅụɴɢ ʟạɪ ᴛᴇxᴛ.`);

        const sentMessage = await message.reply({ embeds: [embed] });

        const interval = setInterval(async () => {
          count--;
          if (count > 0) {
            embed.setDescription(`ʙạɴ ᴄầɴ đợɪ ${count} ɢɪâʏ ᴛʀướᴄ ᴋʜɪ sử ᴅụɴɢ ʟạɪ ᴛᴇxᴛ.`);
            await sentMessage.edit({ embeds: [embed] });
          } else {
            clearInterval(interval);
            embed.setColor("#00FF00").setDescription("ʙạɴ ᴄó ᴛʜể sử ᴅụɴɢ ʟạɪ ᴛᴇxᴛ ✅.");
            await sentMessage.edit({ embeds: [embed] });
            cooldownAlerts[userId] = false;
          }
        }, 1000);

        cooldownAlerts[userId] = true;
      }
      return;
    }

    const embed = new EmbedBuilder()
      .setColor("#00FF00")
      .setTitle("💬 ᴛɪɴ ɴʜắɴ ᴛᴇxᴛ")
      .setDescription(fileContents[content]);

    await message.channel.send({ embeds: [embed] });

    cooldowns[userId] = now;
    cooldownAlerts[userId] = false;
  },
};
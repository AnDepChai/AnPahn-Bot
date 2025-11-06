const { Events, EmbedBuilder } = require("discord.js");
const config = require("../config.json");

const userMessageTimestamps = new Map();
const spamTrackers = new Map();
const whitelist = new Set(config.WHITELISTED_USERS);

module.exports = {
  name: Events.MessageCreate,
  async execute(message) {
    if (message.author.bot) return;

    const userId = message.author.id;
    const isWhitelisted = whitelist.has(userId);

    if (!isWhitelisted && checkSpam(userId)) {
      await handleSpam(message);
      return;
    }

    if (isWhitelisted && spamTrackers.has(userId)) {
      resetWhitelistUser(userId);
    }
  },
};

function checkSpam(userId) {
  const now = Date.now();
  const timestamps = userMessageTimestamps.get(userId) || [];

  const recentMessages = timestamps.filter(
    ts => now - ts < config.ANTI_SPAM.DURATION
  );

  userMessageTimestamps.set(userId, [...recentMessages, now]);

  return recentMessages.length >= config.ANTI_SPAM.THRESHOLD;
}

async function handleSpam(message) {
  await safeDelete(message);

  const warningMsg = await message.channel.send({
    embeds: [
      new EmbedBuilder()
        .setColor("#ff0000")
        .setDescription(`${message.author}, 𝙱ạ𝚗 𝚂𝚙𝚊𝚖, 𝚅𝚞𝚒 𝙻ò𝚗𝚐 𝙲𝚑𝚊𝚝 𝙲𝚑ậ𝚖 𝙻ạ𝚒!`)
        .setTimestamp()
    ]
  });

  safeDelete(warningMsg, config.ANTI_SPAM.COOLDOWN);
  spamTrackers.set(message.author.id, Date.now());
}

function resetWhitelistUser(userId) {
  const lastSpamTime = spamTrackers.get(userId);
  if (Date.now() - lastSpamTime > config.ANTI_SPAM.RESET_DURATION) {
    userMessageTimestamps.delete(userId);
    spamTrackers.delete(userId);
  }
}

async function safeDelete(message, delay = 0) {
  try {
    if (delay > 0) {
      setTimeout(() => message.delete().catch(() => {}), delay);
    } else {
      await message.delete();
    }
  } catch (err) {
    if (err.code !== 10008) console.error(err);
  }
}
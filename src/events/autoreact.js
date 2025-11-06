const allowedChannels = [
  "1388565020098691183",
];

module.exports = {
  name: "messageCreate",
  async execute(message) {
    if (!message) return;
    if (message.author.bot) return;

    if (!allowedChannels.includes(message.channel.id)) return;

    if (message.attachments.size > 0) {
      try {
        await message.react("1239156742605242388"); // emoji :_pepe_yes:
        await message.react("1239156779309465611"); // emoji :_pepe_no:
      } catch (err) {
      }
    }
  },
};
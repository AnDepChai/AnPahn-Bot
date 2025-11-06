const { EmbedBuilder } = require('discord.js');
const axios = require('axios');

const API_URL = 'https://api.waifu.pics/sfw/waifu';

async function getRandomWaifuImage() {
    try {
        const response = await axios.get(API_URL);
        const imageUrl = response.data.url;
        return imageUrl;
    } catch (error) {
        return null;
    }
}

module.exports = {
    data: {
        name: 'riengwaifu',
        description: 'ɢửɪ ᴍộᴛ ảɴʜ ᴡᴀɪғᴜ ɴɢẫᴜ ɴʜɪêɴ đếɴ ᴛɪɴ ɴʜắɴ ʀɪêɴɢ ᴄủᴀ ʙạɴ.',
    },
    async execute(interaction) {
        if (interaction.commandName === "riengwaifu") {
            const imageUrl = await getRandomWaifuImage();
            if (!imageUrl) {
                await interaction.reply("Đã ʙị ʟỗɪ, ᴋʜôɴɢ ᴛʜể ʟấʏ ảɴʜ!");
                return;
            }

            const embed = new EmbedBuilder()
                .setTitle("Ảɴʜ ᴡᴀɪғᴜ ɴɢẫᴜ ɴʜɪêɴ:")
                .setImage(imageUrl)
                .setColor("#FFC0CB")
                .setFooter({
                    text: `ʏêᴜ ᴄầᴜ ʙởɪ: ${interaction.user.tag}`,
                    iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
                })
                .setTimestamp();

            try {
                await interaction.user.send({
                    content: "Đâʏ ʟà ảɴʜ ɴɢẫᴜ ɴʜɪêɴ ʀɪêɴɢ ᴛư ᴄủᴀ ʙạɴ:",
                    embeds: [embed],
                });
                      
                const replyEmbed = new EmbedBuilder()
                    .setDescription("Ảɴʜ ɴɢẫᴜ ɴʜɪêɴ đã đượᴄ ɢửɪ đếɴ <@1180786118724177920> ʙấᴍ ᴠàᴏ <#1181446553307725854> để đếɴ ᴛɪɴ ɴʜắɴ ʀɪêɴɢ ᴛư ᴄủᴀ ʙạɴ.")
                    .setColor("#00ff00");

                await interaction.reply({ embeds: [replyEmbed], ephemeral: true });
            } catch (error) {
                await interaction.reply(
                    "ᴋʜôɴɢ ᴛʜể ɢửɪ ᴛɪɴ ɴʜắɴ ʀɪêɴɢ ᴛư. ᴠᴜɪ ʟòɴɢ ᴋɪểᴍ ᴛʀᴀ ᴄàɪ đặᴛ ǫᴜʏềɴ ʀɪêɴɢ ᴛư ᴄủᴀ ʙạɴ.",
                    { ephemeral: true },
                );
            }
        }
    },
};

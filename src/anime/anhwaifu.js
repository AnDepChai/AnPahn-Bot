const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder, ComponentType } = require('discord.js');
const axios = require('axios');

const categories = [
    'waifu', 'neko', 'shinobu', 'megumin', 'cuddle', 'cry', 'hug', 'kiss', 'lick', 'pat',
    'smug', 'yeet', 'smile', 'wave', 'highfive', 'nom', 'bite',
    'slap', 'kill', 'kick', 'happy', 'wink', 'poke', 'dance', 'cringe'
];

async function getRandomImage(category) {
    const url = `https://api.waifu.pics/sfw/${category}`;
    try {
        const response = await axios.get(url, { timeout: 8000 });
        return response.data.url;
    } catch (error) {
        console.error(`Lỗi khi lấy ảnh ${category}:`, error.message);
        return null;
    }
}

function createEmbed(imageUrl, category, user) {
    return new EmbedBuilder()
        .setTitle(`Ảɴʜ ${category} ɴɢẫᴜ ɴʜɪêɴ:`)
        .setImage(imageUrl)
        .setColor("#FFC0CB")
        .setFooter({ text: '© ᴄᴏᴅᴇ ʙʏ ᴀɴ ᴘᴀʜɴ 🐧' })
            .setTimestamp();
}

function createButtons(category, disableRefresh = false) {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`get_new_image_${category}`)
            .setLabel('ʟấʏ ảɴʜ ᴛɪếᴘ')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(disableRefresh),
        new ButtonBuilder()
            .setCustomId(`close_embed_${category}`)
            .setLabel('Đóng')
            .setStyle(ButtonStyle.Danger)
    );
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('anhwaifu')
        .setDescription('ɢửɪ ᴍộᴛ ảɴʜ ᴡᴀɪғᴜ ɴɢẫᴜ ɴʜɪêɴ')
        .addStringOption(option =>
            option.setName('category')
                .setDescription('ᴄʜọɴ ʟᴏạɪ ảɴʜ ʙạɴ ᴍᴜốɴ ʟấʏ.')
                .setRequired(true)
                .addChoices(...categories.map(cat => ({ name: cat, value: cat })))
    ),

    async execute(interaction) {
        await interaction.deferReply();
        
        const category = interaction.options.getString('category');
        const user = interaction.user;
        const imageUrl = await getRandomImage(category);
        
        if (!imageUrl) {
            return interaction.editReply("Đã ʙị ʟỗɪ, ᴋʜôɴɢ ᴛʜể ʟấʏ ảɴʜ!");
        }

        const embed = createEmbed(imageUrl, category, user);
        const row = createButtons(category);

        const message = await interaction.editReply({
            embeds: [embed],
            components: [row],
            fetchReply: true
        });

        const collector = message.createMessageComponentCollector({ 
            componentType: ComponentType.Button,
            time: 120000 // 2 phút
        });

        let refreshTimeout = setTimeout(() => {
            row.components[0].setDisabled(true);
            message.edit({ components: [row] }).catch(() => {});
        }, 30000);

        collector.on('collect', async i => {
            try {
                await i.deferUpdate();
                
                if (i.customId === `get_new_image_${category}`) {
                    clearTimeout(refreshTimeout);
                    refreshTimeout = setTimeout(() => {
                        row.components[0].setDisabled(true);
                        message.edit({ components: [row] }).catch(() => {});
                    }, 30000);

                    const newImageUrl = await getRandomImage(category);
                    if (newImageUrl) {
                        const newEmbed = createEmbed(newImageUrl, category, user);
                        await i.editReply({ 
                            embeds: [newEmbed],
                            components: [row] 
                        });
                    }
                } 
                else if (i.customId === `close_embed_${category}`) {
                    clearTimeout(refreshTimeout);
                    collector.stop();
                    await i.deleteReply().catch(() => {});
                }
            } catch (error) {
                console.error('Lỗi xử lý tương tác:', error);
                await i.followUp({ 
                    content: '⚠️ Đã xảy ra lỗi khi xử lý yêu cầu!', 
                    ephemeral: true 
                }).catch(() => {});
            }
        });

        collector.on('end', () => {
            clearTimeout(refreshTimeout);
        });
    }
};

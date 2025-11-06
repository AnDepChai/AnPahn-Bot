const config = require('../config.json');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reload')
        .setDescription('ᴛảɪ ʟạɪ ᴛᴏàɴ ʙộ ʜệ ᴛʜốɴɢ ᴍᴏᴅᴜʟᴇs.')
        .addStringOption(option =>
            option.setName('module')
                .setDescription('ᴛêɴ ᴍᴏᴅᴜʟᴇ ᴄầɴ ᴛảɪ ʟạɪ. (để trống để tải lại tất cả)')
                .setRequired(false)
                .addChoices(
                    { name: 'Commands', value: 'commands' },
                    { name: 'Moderation', value: 'moderation' },
                    { name: 'Anime', value: 'anime' },
                    { name: 'Text', value: 'text' },
                    { name: 'Tất cả', value: 'all' }
                )
        ),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: false });

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

        const moduleToReload = interaction.options.getString('module') || 'all';
        const client = interaction.client;
        const embed = new EmbedBuilder().setColor('#FFA500');
        const results = [];
        let success = true;

        try {
            const reloadDirectory = async (dirName, displayName, isSlashCommand = false) => {
                const dirPath = path.join(__dirname, '..', dirName);
                if (!fs.existsSync(dirPath)) {
                    return [`📂 **${displayName}**: ᴛʜư ᴍụᴄ ᴋʜôɴɢ ᴛồɴ ᴛạɪ.`];
                }

                const files = fs.readdirSync(dirPath).filter(file =>
                    file.endsWith('.js') || (dirName === 'text' && file.endsWith('.txt'))
                );

                let loaded = 0, errors = 0;
                const errorDetails = [];

                if (dirName === 'text' && !client.textStorage) client.textStorage = {};
                if (isSlashCommand) client.commands ??= new Map();

                for (const file of files) {
                    const filePath = path.join(dirPath, file);
                    try {
                        delete require.cache[require.resolve(filePath)];

                        if (file.endsWith('.js')) {
                            const command = require(filePath);
                            if (isSlashCommand) {
                                if (!command.data || !command.execute) {
                                    throw new Error(`Thiếu 'data' hoặc 'execute'`);
                                }
                                client.commands.set(command.data.name, command);
                            } else {
                                require(filePath);
                            }
                        } else if (file.endsWith('.txt')) {
                            const content = fs.readFileSync(filePath, 'utf8');
                            const fileName = path.parse(file).name;
                            client.textStorage[fileName] = content;
                        }

                        loaded++;
                    } catch (error) {
                        errors++;
                        errorDetails.push(`• ${file}: ${error.message}`);
                        console.error(`❌ Lỗi khi reload ${filePath}:`, error);
                    }
                }

                const result = [`📂 **${displayName}**: ${loaded} ᴛʜàɴʜ ᴄôɴɢ, ${errors} ʟỗɪ`];
                if (errors > 0) result.push(...errorDetails);
                return result;
            };

            const slashModules = ['commands', 'moderation', 'anime'];
            const allModules = {
                commands: 'Commands',
                moderation: 'Moderation',
                anime: 'Anime',
                text: 'Text'
            };

            if (moduleToReload === 'all' || slashModules.includes(moduleToReload)) {
                client.commands.clear();

                for (const moduleName of slashModules) {
                    if (moduleToReload === 'all' || moduleToReload === moduleName) {
                        results.push(...(await reloadDirectory(moduleName, allModules[moduleName], true)));
                    }
                }

                try {
                    const reloadPath = path.join(__dirname, 'reload.js');
                    delete require.cache[require.resolve(reloadPath)];
                    const reloadCommand = require(reloadPath);
                    if (reloadCommand.data && reloadCommand.execute) {
                        client.commands.set(reloadCommand.data.name, reloadCommand);
                    }
                } catch (err) {
                    console.error("❌ Không thể reload lại chính lệnh /reload:", err);
                    results.push("⚠️ Không thể reload lại chính lệnh `/reload`");
                }

                // Đăng ký lại toàn bộ lệnh slash
                try {
                    const commandsData = Array.from(client.commands.values())
                        .filter(cmd => cmd.data && typeof cmd.data.toJSON === 'function')
                        .map(cmd => cmd.data.toJSON());

                    await client.application.commands.set(commandsData);
                } catch (error) {
                    success = false;
                    results.push(`❌ Lỗi khi đăng ký slash commands: ${error.message}`);
                    console.error("Lỗi đăng ký commands:", error);
                }
            }

            if (moduleToReload === 'all' || moduleToReload === 'text') {
                results.push(...(await reloadDirectory('text', 'Text')));
            }

            embed.setTitle(success ? '♻️ ᴛảɪ ʟạɪ ᴛʜàɴʜ ᴄôɴɢ' : '⚠️ ᴛảɪ ʟạɪ ᴠớɪ ᴍộᴛ số ʟỗɪ')
                .setDescription(results.join('\n\n'))
                .setFooter({ text: "© ᴄᴏᴅᴇ ʙʏ ᴀɴ ᴘᴀʜɴ 🐧" })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (err) {
            console.error("❌ Lỗi nghiêm trọng:", err);
            const errorEmbed = new EmbedBuilder()
                .setTitle("❌ Lỗi nghiêm trọng khi reload")
                .setColor("Red")
                .setDescription(`\`\`\`${err.message}\`\`\``)
                .setTimestamp();
            await interaction.editReply({ embeds: [errorEmbed] });
        }
    }
};
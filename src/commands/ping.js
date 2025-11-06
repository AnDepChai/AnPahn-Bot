/*
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('ᴋɪểᴍ ᴛʀᴀ độ ᴛʀễ ᴄủᴀ ʙᴏᴛ ᴠà ᴀᴘɪ.'),

    async execute(interaction) {
        const apiLatency = Math.round(interaction.client.ws.ping);
        const botLatency = Date.now() - interaction.createdTimestamp;

        const embed = new EmbedBuilder()
            .setColor("00FF00")
            .setTitle("📶 ᴘɪɴɢ ʙᴏᴛ")
            .setDescription("🏓 Pong!")
            .addFields(
                { name: "Độ ᴛʀễ ʙᴏᴛ:", value: `${botLatency} ᴍs` },
                { name: "Độ ᴛʀễ ᴀᴘɪ:", value: `${apiLatency} ᴍs` },
            )
            .setThumbnail(interaction.client.user.displayAvatarURL())
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};
*/



/*
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const os = require('os');
const axios = require('axios');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('ᴋɪểᴍ ᴛʀᴀ độ ᴛʀễ ᴄủᴀ ʙᴏᴛ ᴠà ᴀᴘɪ.'),

    async execute(interaction) {
        const apiLatency = Math.round(interaction.client.ws.ping);
        const botLatency = Date.now() - interaction.createdTimestamp;

        const commandProcessingStart = Date.now();
        
        const networkLatencyStart = Date.now();
        let networkLatency;
        try {
            await axios.get('https://www.google.com');
            networkLatency = Date.now() - networkLatencyStart;
        } catch (error) {
            networkLatency = 'ᴋʜôɴɢ ᴛʜể đᴏ';
        }

        const cpuUsage = os.loadavg()[0]; 
        const freeMemory = os.freemem(); 
        const totalMemory = os.totalmem();
        const memoryUsage = ((totalMemory - freeMemory) / totalMemory * 100).toFixed(2); 

        const commandProcessingLatency = Date.now() - commandProcessingStart;

        const embed = new EmbedBuilder()
            .setColor("00FF00")
            .setTitle("📶 ᴘɪɴɢ ʙᴏᴛ")
            .setDescription("🏓 ᴘᴏɴɢ!")
            .addFields(
                { name: "ᴛʀễ ʙᴏᴛ:", value: `${botLatency} ᴍs`, inline: true },
                { name: "ᴛʀễ ᴀᴘɪ:", value: `${apiLatency} ᴍs`, inline: true },
                { name: "ᴛʀễ xử ʟý ʟệɴʜ:", value: `${commandProcessingLatency} ᴍs`, inline: true },
                { name: "ᴛʀễ ᴍạɴɢ:", value: `${networkLatency} ᴍs`, inline: true },
                { name: "ʀᴀᴍ:", value: `${memoryUsage}%`, inline: true },
            )
            .setThumbnail(interaction.client.user.displayAvatarURL())
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};
*/


const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const os = require('os');
const axios = require('axios');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('ᴋɪểᴍ ᴛʀᴀ độ ᴛʀễ ᴄủᴀ ʙᴏᴛ ᴠà ᴀᴘɪ.'),

    async execute(interaction) {
        const apiLatency = Math.round(interaction.client.ws.ping);
        const botLatency = Date.now() - interaction.createdTimestamp;

        const networkLatencyStart = Date.now();
        let networkLatency;
        try {
            await axios.get('https://www.google.com');
            networkLatency = Date.now() - networkLatencyStart;
        } catch (error) {
            networkLatency = 'ᴋʜôɴɢ ᴛʜể đᴏ';
        }

        const cpuUsage = os.loadavg()[0];
        const freeMemory = os.freemem();
        const totalMemory = os.totalmem();
        const memoryUsage = ((totalMemory - freeMemory) / totalMemory * 100).toFixed(2);

        const uptime = os.uptime();
        const uptimeHours = Math.floor(uptime / 3600);
        const uptimeMinutes = Math.floor((uptime % 3600) / 60);
        const uptimeSeconds = Math.floor(uptime % 60);
        const formattedUptime = `${uptimeHours}h ${uptimeMinutes}m ${uptimeSeconds}s`;

        const embed = new EmbedBuilder()
            .setColor("00FF00")
            .setTitle("📶 ᴘɪɴɢ ʙᴏᴛ")
            .setDescription("🏓 ᴘᴏɴɢ!")
            .setThumbnail(interaction.client.user.displayAvatarURL())
            .addFields(
                { name: "⏱️ ᴛʀễ ʙᴏᴛ:", value: `${botLatency}ms`, inline: true },
                { name: "🌐 ᴛʀễ ᴀᴘɪ:", value: `${apiLatency}ms`, inline: true },
                { name: "📡 ᴛʀễ ᴍạɴɢ:", value: `${networkLatency}ms`, inline: true },
                { name: "🧠 ʀᴀᴍ sử ᴅụɴɢ:", value: `${memoryUsage}%`, inline: true },
                { name: "🖥️ ᴄᴘᴜ ʟᴏᴀᴅ:", value: `${cpuUsage.toFixed(2)}`, inline: true },
                { name: "🕒 ᴛ.ɢɪᴀɴ ᴜᴘ ᴛɪᴍᴇ:", value: formattedUptime, inline: false },
            )
            .setFooter({ text: `© ᴄᴏᴅᴇ ʙʏ ᴀɴ ᴘᴀʜɴ 🐧` })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};


/*
const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder } = require('@discordjs/builders');
const os = require('os');
const axios = require('axios');
const pidusage = require('pidusage');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('ᴋɪểᴍ ᴛʀᴀ độ ᴛʀễ ᴄủᴀ ʙᴏᴛ ᴠà ʜệ ᴛʜốɴɢ.'),

    async execute(interaction) {
        const apiLatency = Math.round(interaction.client.ws.ping);
        const botLatency = Date.now() - interaction.createdTimestamp;

        const networkLatencyStart = Date.now();
        let networkLatency;
        try {
            await axios.get('https://www.google.com', { timeout: 3000 });
            networkLatency = `${Date.now() - networkLatencyStart}ms`;
        } catch (error) {
            networkLatency = 'ᴋʜôɴɢ ᴛʜể đᴏ\n(ᴋɪểᴍ ᴛʀᴀ ᴍạɴɢ)';
        }

        const freeMemory = os.freemem();
        const totalMemory = os.totalmem();
        const systemMemoryUsage = ((totalMemory - freeMemory) / totalMemory * 100).toFixed(2);

        const uptime = interaction.client.uptime;
        const uptimeSeconds = Math.floor(uptime / 1000);
        const hours = Math.floor(uptimeSeconds / 3600);
        const minutes = Math.floor((uptimeSeconds % 3600) / 60);
        const seconds = uptimeSeconds % 60;
        const formattedUptime = `${hours}h ${minutes}m ${seconds}s`;

        const stats = await pidusage(process.pid);
        const cpuUsage = stats.cpu.toFixed(2);
        const memoryMB = (stats.memory / 1024 / 1024).toFixed(2);

        const header = new ContainerBuilder().addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`📶 **PING BOT**\n \n🏓 Pong!`)
        );

        const pingStats = new ContainerBuilder().addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`⏱️ **Trễ Bot:** ${botLatency}ms`),
            new TextDisplayBuilder().setContent(`🌐 **Trễ API:** ${apiLatency}ms`),
            new TextDisplayBuilder().setContent(`📡 **Trễ Mạng:** ${networkLatency}`)
        );

        const resourceStats = new ContainerBuilder().addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`🧠 **RAM Hệ Thống:** ${systemMemoryUsage}%`),
            new TextDisplayBuilder().setContent(`🧠 **RAM Bot:** ${memoryMB}MB`),
            new TextDisplayBuilder().setContent(`🖥️ **CPU Bot:** ${cpuUsage}%`)
        );

        const uptimeStats = new ContainerBuilder().addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`🕒 **Bot Online:** ${formattedUptime}`)
        );

        const footer = new ContainerBuilder().addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`© ᴄᴏᴅᴇ ʙʏ ᴀɴ ᴘᴀʜɴ 🐧`)
        );
    
        await interaction.reply({
            flags: MessageFlags.IsComponentsV2,
            components: [
                header,
                new SeparatorBuilder(),
                pingStats,
                new SeparatorBuilder(),
                resourceStats,
                new SeparatorBuilder(),
                uptimeStats,
                new SeparatorBuilder(),
                footer
            ]
        });
    },
};
*/
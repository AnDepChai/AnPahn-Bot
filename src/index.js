const Discord = require("discord.js");
require('dotenv').config();

const { 
    Client, 
    GatewayIntentBits, 
    Partials, 
    Collection,
    EmbedBuilder,
    Events,
    REST, 
    Routes,
    ActionRowBuilder,
    SelectMenuBuilder,
    StringSelectMenuBuilder,
    ButtonBuilder,
    ButtonStyle,
    PermissionsBitField,
    ActivityType,
    ChannelType,
    AttachmentBuilder,
    MessageFlags
} = require("discord.js");

const { 
    SlashCommandBuilder,
    TextDisplayBuilder,
    SectionBuilder,
    SeparatorBuilder,
    ContainerBuilder,
    ThumbnailBuilder,
    MediaGalleryBuilder,
} = require("@discordjs/builders");

const {
    AudioPlayerStatus,
    createAudioPlayer,
    createAudioResource,
    NoSubscriberBehavior,
    joinVoiceChannel,
    entersState,
    VoiceConnectionStatus
} = require("@discordjs/voice");

const { DisTube } = require('distube');
const { SpotifyPlugin } = require('@distube/spotify');
const { SoundCloudPlugin } = require('@distube/soundcloud');
//const { YtDlpPlugin } = require('@distube/yt-dlp');
const youtubedl = require('youtube-dl-exec');
//const playdl = require("play-dl");
//const ytdl = require("@distube/ytdl-core");
const { google } = require("googleapis");
const youtube = google.youtube("v3");
const yts = require('yt-search');
//const youtubeSearch = require("youtube-search");
const axios = require("axios");
const FormData = require("form-data");
const express = require("express");
const bodyParser = require("body-parser");
const { PayOS } = require("@payos/node");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const gradient = require("gradient-string");
const boxen = require("boxen");
const chalk = require("chalk");
const events = require("events");
events.EventEmitter.defaultMaxListeners = 15;

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildPresences,
    ],
    partials: [
        Partials.Message,
        Partials.Channel,
        Partials.Reaction,
    ],
});

client.commands = new Collection();

const commandDirs = ['commands', 'anime', 'moderation'];

for (const dir of commandDirs) {
  const folderPath = path.join(__dirname, dir);
  if (!fs.existsSync(folderPath)) continue;

  const files = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));

  for (const file of files) {
    const commandPath = path.join(folderPath, file);
    const command = require(commandPath);

    if (command.data && command.data.name) {
      client.commands.set(command.data.name, command);
//      console.log(`[✔] Loaded command: ${command.data.name} (${dir})`);
    }
  }
}

const eventsPath = path.join(__dirname, 'events');
if (fs.existsSync(eventsPath)) {
  const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

  for (const file of eventFiles) {
    const event = require(path.join(eventsPath, file));

    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args, client));
    } else {
      client.on(event.name, (...args) => event.execute(...args, client));
    }
//    console.log(`[✔] Loaded event: ${event.name}`);
  }
}

async function loadingBar() {
    const length = 30;
    process.stdout.write("\n");
    for (let i = 0; i <= length; i++) {
        const bar = "█".repeat(i) + "-".repeat(length - i);
        const coloredBar = gradient.rainbow(bar);
        process.stdout.write(`\r${chalk.cyan("ĐANG LOADING:")} [${coloredBar}] ${Math.round((i / length) * 100)}%`);
        await new Promise(r => setTimeout(r, 100));
    }
    process.stdout.write("\n");
}

client.once("clientReady", async () => {
    await loadingBar();

    const banner = `
 ____  _____  ____      __    _  _    ____   __    _   _  _  _ 
(  _ \\(  _  )(_  _)    /__\\  ( \\( )  (  _ \\ /__\\  ( )_( )( \\( )
 ) _ < )(_)(   )(     /(__)\\  )  (    )___//(__)\\  ) _ (  )  ( 
(____/(_____) (__)   (__)(__)(_)\_)  (__) (__)(__)(_) (_)(_)\\_)
    `;

    const bannerColored = gradient.rainbow.multiline(banner);

    const info = chalk.cyan(`
Version: 4.3
Cre: AnPahn
Discord: https://discord.gg/ASx6BjbJSV
    `);

    const output = boxen(bannerColored + "\n" + info, {
        padding: 1,
        margin: 1,
        borderStyle: "double",
        borderColor: "cyan",
        align: "center",
    });

    console.log(output);
    console.log(chalk.green("✅ 𝙱𝚘𝚝 𝙰𝚗𝙿𝚊𝚑𝚗 𝙾𝚗𝚕𝚒𝚗𝚎"));

    recalcTotalMembers();
    client.user.setStatus("dnd");
    updateActivity();
    setInterval(updateActivity, 5 * 60 * 1000);

    await ActiveSlash();
});

const statuses = [
    { type: ActivityType.Playing, text: "với ! An Pahn | /Help | !help" },
    { type: ActivityType.Watching, text: "! An Pahn Code | /Help | !help" },
    { type: ActivityType.Listening, text: "Spotify | /Help | !help" },
    { type: ActivityType.Watching, text: "{users} người dùng | /Help | !help" }
];

let currentIndex = 0;
let totalMembers = 0;

function updateActivity() {
    let status = statuses[currentIndex];
    let statusText = status.text.replace("{users}", totalMembers.toLocaleString());
    client.user.setActivity(statusText, { type: status.type });
    currentIndex = (currentIndex + 1) % statuses.length;
}

function recalcTotalMembers() {
    totalMembers = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
}

client.on("guildCreate", () => recalcTotalMembers());
client.on("guildDelete", () => recalcTotalMembers());
client.on("guildMemberAdd", () => totalMembers++);
client.on("guildMemberRemove", () => totalMembers--);

async function ActiveSlash() {
    const commands = client.commands.map(cmd => cmd.data);
    const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

    try {
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands }
        );
        console.log(chalk.green("✅ 𝙻ệ𝚗𝚑 𝚂𝚕𝚊𝚜𝚑 𝙲ậ𝚙 𝙽𝚑ậ𝚝!"));
    } catch (err) {
    }
}

client.on("interactionCreate", async interaction => {
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({
                content: "𝙲ó 𝙻ỗ𝚒 𝚇ả𝚢 𝚁𝚊 𝙺𝚑𝚒 𝚃𝚑ự𝚌 𝚃𝚑𝚒 𝙻ệ𝚗𝚑 𝙽à𝚢!",
                ephemeral: true
            });
        } else {
            await interaction.reply({
                content: "𝙲ó 𝙻ỗ𝚒 𝚇ả𝚢 𝚁𝚊 𝙺𝚑𝚒 𝚃𝚑ự𝚌 𝚃𝚑𝚒 𝙻ệ𝚗𝚑 𝙽à𝚢!",
                ephemeral: true
            });
        }
    }
});





const { LogDiscordChannelId } = require(path.resolve(__dirname, 'config.json'));

// 𝙲ấ𝚞 𝚑ì𝚗𝚑 𝚝ù𝚢 𝚌𝚑ỉ𝚗𝚑
const CONFIG = {
  logAllEvents: true,
  downloadAttachments: true,
  maxContentLength: 1000,
  cooldownTime: 3000,
  logWebhooks: false,
  securityMonitoring: true,
};

// 𝙳𝚊𝚗𝚑 𝚜á𝚌𝚑 𝚗𝚐ườ𝚒 𝚍ù𝚗𝚐 đá𝚗𝚐 𝚝𝚒𝚗 𝚌ậ𝚢
const TRUSTED_USERS = ['958668688607838208', 'YOUR_USER_ID_HERE'];

// 𝙱ộ đệ𝚖 𝚌𝚑ố𝚗𝚐 𝚜𝚙𝚊𝚖
const recentLogs = new Map();

// 𝙷à𝚖 𝚔𝚒ể𝚖 𝚝𝚛𝚊 𝚟à 𝚝ạ𝚘 𝚕𝚘𝚐
async function sendLog(log, embed, files = [], content = null) {
  if (!log) return;
  
  try {
    const messageOptions = { embeds: [embed] };
    if (files.length > 0) messageOptions.files = files;
    if (content) messageOptions.content = content;
    
    await log.send(messageOptions);
  } catch (error) {
    console.error('𝙻ỗ𝚒 𝚕𝚘𝚐:', error);
  }
}

// 𝙷à𝚖 𝚔𝚒ể𝚖 𝚝𝚛𝚊 𝚌𝚑ố𝚗𝚐 𝚜𝚙𝚊𝚖
function shouldLog(eventType, id) {
  const key = `${eventType}_${id}`;
  const now = Date.now();
  const lastLogged = recentLogs.get(key);
  
  if (lastLogged && now - lastLogged < CONFIG.cooldownTime) {
    return false;
  }
  
  recentLogs.set(key, now);
  return true;
}

// 𝙷à𝚖 𝚌ắ𝚝 𝚗ộ𝚒 𝚍𝚞𝚗𝚐 𝚚𝚞á 𝚍à𝚒
function truncateContent(content, maxLength = CONFIG.maxContentLength) {
  if (content.length <= maxLength) return content;
  return content.substring(0, maxLength - 3) + '...';
}

// 𝙷à𝚖 𝚔𝚒ể𝚖 𝚝𝚛𝚊 𝚑à𝚗𝚑 độ𝚗𝚐 𝚗𝚐𝚞𝚢 𝚑𝚒ể𝚖
function checkDangerousAction(user, action, details = {}) {
  if (TRUSTED_USERS.includes(user.id)) return null;
  
  const warnings = [];
  
  // 𝙺𝚒ể𝚖 𝚝𝚛𝚊 𝚝ạ𝚘 𝚠𝚎𝚋𝚑𝚘𝚘𝚔
  if (action === 'webhookCreate') {
    warnings.push(`🪝 **𝚃ạ𝚘 𝚆𝚎𝚋𝚑𝚘𝚘𝚔 𝙼ớ𝚒**`);
  }
  
  // 𝙺𝚒ể𝚖 𝚝𝚛𝚊 𝚝ạ𝚘/𝚡ó𝚊 𝚔ê𝚗𝚑
  if (action === 'channelCreate' || action === 'channelDelete') {
    warnings.push(`📁 **𝚃𝚑𝚊𝚢 đổ𝚒 𝙲ấ𝚞 𝚃𝚛ú𝚌 𝙺ê𝚗𝚑**`);
  }
  
  // 𝙺𝚒ể𝚖 𝚝𝚛𝚊 𝚝ạ𝚘/𝚡ó𝚊 𝚛𝚘𝚕𝚎
  if (action === 'roleCreate' || action === 'roleDelete') {
    warnings.push(`🎭 **𝚃𝚑𝚊𝚢 đổ𝚒 𝚅𝚊𝚒 𝚃𝚛ò**`);
  }
  
  // 𝙺𝚒ể𝚖 𝚝𝚛𝚊 𝚋𝚊𝚗/𝚞𝚗𝚋𝚊𝚗
  if (action === 'guildBanAdd' || action === 'guildBanRemove') {
    warnings.push(`🔨 **𝚃𝚑𝚊𝚢 đổ𝚒 𝚃𝚒̀𝚗𝚑 𝚃𝚛𝚊̣𝚗𝚐 𝙱𝚊𝚗**`);
  }
  
  return warnings.length > 0 ? warnings : null;
}

// 𝙷à𝚖 𝚐𝚞𝚒 𝚌ả𝚗𝚑 𝚋á𝚘 𝚊𝚗 𝚗𝚒𝚗𝚑
async function sendSecurityAlert(user, action, details, warnings) {
  if (!CONFIG.securityMonitoring) return;
  
  const securityLog = client.channels.cache.get(LogDiscordChannelId);
  if (!securityLog) return;
  
  const embed = new EmbedBuilder()
    .setColor('#ff0000')
    .setTitle('🚨 𝙲Ả𝙽𝙷 𝙱Á𝙾 𝙰𝙽 𝙽𝙸𝙽𝙷')
    .setDescription(`**𝙽𝚐ườ𝚒 𝙳ù𝚗𝚐:** ${user.tag} (${user.id})\n**𝙷à𝚗𝚑 Độ𝚗𝚐:** ${action}`)
    .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 1024 }))
    .setTimestamp();
  
  // 𝚃𝚑ê𝚖 𝚌𝚑𝚒 𝚝𝚒ế𝚝 𝚌ả𝚗𝚑 𝚋á𝚘
  if (warnings && warnings.length > 0) {
    embed.addFields({
      name: '𝙽𝚐𝚞𝚢 𝙲ơ 𝙿𝚑á𝚝 𝙷𝚒ệ𝚗:',
      value: warnings.join('\n')
    });
  }
  
  // 𝚃𝚑ê𝚖 𝚝𝚑ô𝚗𝚐 𝚝𝚒𝚗 𝚋ổ 𝚜𝚞𝚗𝚐
  if (details.content) {
    embed.addFields({
      name: '𝙽ộ𝚒 𝙳𝚞𝚗𝚐:',
      value: truncateContent(details.content, 500)
    });
  }
  
  if (details.channel) {
    embed.addFields({
      name: '𝙺ê𝚗𝚑:',
      value: details.channel.name,
      inline: true
    });
  }
  
  if (details.target) {
    embed.addFields({
      name: '𝙼ụ𝚌 𝚃𝚒ê𝚞:',
      value: details.target,
      inline: true
    });
  }
  
  // 𝚃𝚑ê𝚖 𝚙𝚒𝚗𝚐 𝚌𝚑𝚘 𝚚𝚞ả𝚗 𝚝𝚛ị 𝚟𝚒ê𝚗
  await securityLog.send({ 
    content: `📢 <@958668688607838208>`,
    embeds: [embed] 
  });
}

// 𝙲á𝚌 𝚜ự 𝚔𝚒ệ𝚗 𝚕𝚘𝚐 𝚌ũ (𝚐𝚒ữ 𝚗𝚐𝚞𝚢ê𝚗)
client.on('messageDelete', async (message) => {
  if (!CONFIG.logAllEvents || !message || !message.author || message.author.bot) return;
  if (!shouldLog('messageDelete', message.id)) return;
  
  const log = client.channels.cache.get(LogDiscordChannelId);
  if (!log) return;

  const embed = new EmbedBuilder()
    .setColor('#ff0000')
    .setTitle('🗑️ 𝚃𝚒𝚗 𝙽𝚑ắ𝚗 𝙱ị 𝚇𝚘á')
    .setDescription(`**𝙽𝚐ườ𝚒 𝙳ù𝚗𝚐:** ${message.author.tag} (${message.author.id})\n**𝙺ê𝚗𝚑:** <#${message.channel.id}>`)
    .setFooter({ text: `𝙸𝙳: ${message.id}` })
    .setTimestamp();

  if (message.content) {
    embed.addFields({ 
      name: '𝙽ộ𝚒 𝙳𝚞𝚗𝚐:', 
      value: truncateContent(message.content) 
    });
  }

  const files = [];
  if (CONFIG.downloadAttachments && message.attachments.size > 0) {
    for (const att of message.attachments.values()) {
      try {
        const res = await axios.get(att.url, { 
          responseType: 'arraybuffer',
          timeout: 10000 
        });
        const buffer = Buffer.from(res.data, 'binary');
        const file = new AttachmentBuilder(buffer, { name: att.name });
        files.push(file);

        if (att.contentType?.startsWith('image/') && !embed.data.image) {
          embed.setImage(`attachment://${att.name}`);
        } else {
          embed.addFields({ name: '𝚃ệ𝚙 𝙺è𝚖', value: att.name });
        }
      } catch (error) {
        console.error('𝙻ỗ𝚒 𝚝ả𝚒 𝚝ệ𝚙:', error);
        embed.addFields({ name: '𝙺𝚑ô𝚗𝚐 𝚃𝚑ể 𝚃ả𝚒 𝚃𝚒ệ𝚙', value: `[${att.name}](${att.url})` });
      }
    }
  }

  await sendLog(log, embed, files);
});

client.on('messageUpdate', async (oldMsg, newMsg) => {
  if (!CONFIG.logAllEvents || !oldMsg.content || !newMsg.content || 
      oldMsg.content === newMsg.content || oldMsg.author.bot) return;
  if (!shouldLog('messageUpdate', oldMsg.id)) return;
  
  const log = client.channels.cache.get(LogDiscordChannelId);
  if (!log) return;

  const embed = new EmbedBuilder()
    .setColor('#ffff00')
    .setTitle('✏️ 𝚃𝚒𝚗 𝙽𝚑ắ𝚗 𝙱ị 𝙲𝚑ỉ𝚗𝚑 𝚂ử𝚊')
    .setDescription(`**𝙽𝚐ườ𝚒 𝙳ù𝚗𝚐:** ${oldMsg.author.tag} (${oldMsg.author.id})\n**𝙺ê𝚗𝚑:** <#${oldMsg.channel.id}>`)
    .addFields(
      { name: '𝚃𝚛ướ𝚌:', value: truncateContent(oldMsg.content) },
      { name: '𝚂𝚊𝚞:', value: truncateContent(newMsg.content) }
    )
    .setFooter({ text: `𝙸𝙳: ${oldMsg.id}` })
    .setTimestamp();

  await sendLog(log, embed);
});

client.on('messageReactionAdd', async (reaction, user) => {
  if (!CONFIG.logAllEvents || user.bot) return;
  if (!shouldLog('reactionAdd', `${reaction.message.id}_${user.id}_${reaction.emoji.id || reaction.emoji.name}`)) return;
  
  const log = client.channels.cache.get(LogDiscordChannelId);
  if (!log) return;

  const embed = new EmbedBuilder()
    .setColor('#00ff00')
    .setTitle('➕ 𝚁𝚎𝚊𝚌𝚝𝚒𝚘𝚗 𝚃𝚑ê𝚖')
    .setDescription(`**𝙽𝚐ườ𝚒 𝙳ù𝚗𝚐:** ${user.tag} (${user.id})\n**𝙴𝚖𝚘𝚓𝚒:** ${reaction.emoji}\n[𝙽𝚑ả𝚢 Đế𝚗 𝚃𝚒𝚗 𝙽𝚑ắ𝚗](${reaction.message.url})`)
    .setTimestamp();

  await sendLog(log, embed);
});

client.on('messageReactionRemove', async (reaction, user) => {
  if (!CONFIG.logAllEvents || user.bot) return;
  if (!shouldLog('reactionRemove', `${reaction.message.id}_${user.id}_${reaction.emoji.id || reaction.emoji.name}`)) return;
  
  const log = client.channels.cache.get(LogDiscordChannelId);
  if (!log) return;

  const embed = new EmbedBuilder()
    .setColor('#ff3300')
    .setTitle('➖ 𝚁𝚎𝚊𝚌𝚝𝚒𝚘𝚗 𝙱ị 𝙶ỡ')
    .setDescription(`**𝙽𝚐ườ𝚒 𝙳ù𝚗𝚐:** ${user.tag} (${user.id})\n**Emoji:** ${reaction.emoji}\n[𝙽𝚑ả𝚢 Đế𝚗 𝚃𝚒𝚗 𝙽𝚑ắ𝚗](${reaction.message.url})`)
    .setTimestamp();

  await sendLog(log, embed);
});

client.on("guildMemberUpdate", async (oldMember, newMember) => {
  if (!CONFIG.logAllEvents) return;
  
  const log = client.channels.cache.get(LogDiscordChannelId);
  if (!log) return;
  
  if (oldMember.nickname !== newMember.nickname) {
    if (!shouldLog('nicknameChange', newMember.id)) return;
    
    const embed = new EmbedBuilder()
      .setColor("#ffff00")
      .setTitle("📝 𝙽𝚒𝚌𝚔𝙽𝚊𝚖𝚎 𝚃𝚑𝚊𝚢 Đổ𝚒")
      .setDescription(`**𝙽𝚐ườ𝚒 𝙳ù𝚗𝚐:** ${newMember.user.tag} (${newMember.id})`)
      .addFields(
        { name: "𝚃𝚛ướ𝚌:", value: oldMember.nickname || "𝙺𝚑ô𝚗𝚐 𝙲ó" },
        { name: "𝚂𝚊𝚞:", value: newMember.nickname || "𝙺𝚑ô𝚗𝚐 𝙲ó" }
      )
      .setTimestamp();
    
    await sendLog(log, embed);
  }

  const added = newMember.roles.cache.filter(r => !oldMember.roles.cache.has(r.id));
  const removed = oldMember.roles.cache.filter(r => !newMember.roles.cache.has(r.id));

  if ((added.size > 0 || removed.size > 0) && shouldLog('roleChange', newMember.id)) {
    const embed = new EmbedBuilder()
      .setColor("#9933ff")
      .setTitle("🎭 𝚅𝚊𝚒 𝚃𝚛ò 𝙱ị 𝚃𝚑𝚊𝚢 Đổ𝚒")
      .setDescription(`**𝙽𝚐ườ𝚒 𝙳ù𝚗𝚐:** ${newMember.user.tag} (${newMember.id})`)
      .setTimestamp();

    if (added.size > 0) embed.addFields({ 
      name: "𝚃𝚑ê𝚖:", 
      value: added.map(r => r.name).slice(0, 5).join(", ") + (added.size > 5 ? ` ... 𝚟à ${added.size - 5} 𝚟𝚊𝚒 𝚝𝚛ò 𝚔𝚑á𝚌` : "") 
    });
    if (removed.size > 0) embed.addFields({ 
      name: "𝙶ỡ:", 
      value: removed.map(r => r.name).slice(0, 5).join(", ") + (removed.size > 5 ? ` ... 𝚟à ${removed.size - 5} 𝚟𝚊𝚒 𝚝𝚛ò 𝚔𝚑á𝚌` : "") 
    });

    await sendLog(log, embed, [], `<@958668688607838208>`);
  }
});

client.on('presenceUpdate', async (oldPres, newPres) => {
  if (!CONFIG.logAllEvents || !oldPres || !newPres.member || newPres.member.user.bot) return;
  if (oldPres.status === newPres.status) return;
  if (!shouldLog('presenceUpdate', newPres.member.id)) return;

  const log = client.channels.cache.get(LogDiscordChannelId);
  if (!log) return;

  const statusMap = {
    online: '🟢 𝙾𝚗𝚕𝚒𝚗𝚎',
    idle: '🌙 𝚁ả𝚗𝚑 (Idle)',
    dnd: '⛔ 𝙺𝚑ô𝚗𝚐 𝙻à𝚖 𝙿𝚑𝚒ề𝚗 (DND)',
    offline: '⚫ 𝙾𝚏𝚏𝚕𝚒𝚗𝚎 (Offline)',
  };

  const statusColors = {
    online: 0x00ff00,
    idle: 0xffcc00,
    dnd: 0xff0000,
    offline: 0x808080,
  };

  const embed = new EmbedBuilder()
    .setColor(statusColors[newPres.status] || 0x00cccc)
    .setTitle('🌐 𝚃𝚛ạ𝚗𝚐 𝚃𝚑á𝚒 𝙱ị 𝚃𝚑𝚊𝚢 Đổ𝚒')
    .setDescription(`**𝙽𝚐ườ𝚒 𝙳ù𝚗𝚐:** ${newPres.member.user.tag}`)
    .addFields(
      { name: '𝚃𝚛ướ𝚌:', value: statusMap[oldPres.status] || oldPres.status, inline: true },
      { name: '𝚂𝚊𝚞:', value: statusMap[newPres.status] || newPres.status, inline: true }
    )
    .setThumbnail(newPres.member.user.displayAvatarURL({ dynamic: true, size: 1024 }))
    .setTimestamp();

  await sendLog(log, embed);
});

client.on('channelCreate', async (channel) => {
  if (!CONFIG.logAllEvents) return;
  if (!shouldLog('channelCreate', channel.id)) return;
  
  const log = client.channels.cache.get(LogDiscordChannelId);
  if (!log) return;

  const embed = new EmbedBuilder()
    .setColor('#00cc66')
    .setTitle('📁 𝙺ê𝚗𝚑 𝙼ớ𝚒 𝚃ạ𝚘')
    .setDescription(`**𝚃ê𝚗:** ${channel.name}\n**𝙻𝚘ạ𝚒:** ${channel.type}\n**𝙸𝙳:** ${channel.id}`)
    .setTimestamp();
  await sendLog(log, embed);
  
  // 𝙺𝚒ể𝚖 𝚝𝚛𝚊 𝚊𝚗 𝚗𝚒𝚗𝚑 - ĐÃ FIX
  if (CONFIG.securityMonitoring) {
    try {
      const fetchedLogs = await channel.guild.fetchAuditLogs({
        limit: 1,
        type: 10 // 𝙲𝙷𝙰𝙽𝙽𝙴𝙻_𝙲𝚁𝙴𝙰𝚃𝙴
      });
      const creator = fetchedLogs.entries.first()?.executor;
      
      if (creator) {
        const warnings = checkDangerousAction(creator, 'channelCreate', {
          target: channel.name
        });
        
        if (warnings) {
          await sendSecurityAlert(creator, 'channelCreate', {
            target: channel.name
          }, warnings);
        }
      }
    } catch (error) {
      console.error('𝙻ỗ𝚒 𝚔𝚑𝚒 𝚔𝚒ể𝚖 𝚝𝚛𝚊 𝚊𝚗 𝚗𝚒𝚗𝚑 𝚌𝚑𝚊𝚗𝚗𝚎𝚕:', error);
    }
  }
});

client.on('channelUpdate', async (oldChannel, newChannel) => {
  if (!CONFIG.logAllEvents || oldChannel.name === newChannel.name) return;
  if (!shouldLog('channelUpdate', newChannel.id)) return;

  const log = client.channels.cache.get(LogDiscordChannelId);
  if (!log) return;

  const embed = new EmbedBuilder()
    .setColor('#3399ff')
    .setTitle('📢 𝙺ê𝚗𝚑 𝙱ị Đổ𝚒 𝚃ê𝚗')
    .addFields(
      { name: '𝚃ê𝚗 𝙲ũ:', value: oldChannel.name, inline: true },
      { name: '𝚃ê𝚗 𝙼ớ𝚒:', value: newChannel.name, inline: true }
    )
    .setFooter({ text: `𝙸𝙳: ${newChannel.id}` })
    .setTimestamp();

  await sendLog(log, embed);
});

client.on('channelDelete', async (channel) => {
  if (!CONFIG.logAllEvents) return;
  if (!shouldLog('channelDelete', channel.id)) return;
  
  const log = client.channels.cache.get(LogDiscordChannelId);
  if (!log) return;

  const embed = new EmbedBuilder()
    .setColor('#cc0000')
    .setTitle('🗑️ 𝙺ê𝚗𝚑 𝙱ị 𝚇𝚘á')
    .setDescription(`**𝚃ê𝚗:** ${channel.name}\n**𝙻𝚘ạ𝚒:** ${channel.type}\n**𝙸𝙳:** ${channel.id}`)
    .setTimestamp();
  await sendLog(log, embed);
});

client.on('guildUpdate', async (oldGuild, newGuild) => {
  if (!CONFIG.logAllEvents) return;
  
  const log = client.channels.cache.get(LogDiscordChannelId);
  if (!log) return;

  if (oldGuild.name !== newGuild.name && shouldLog('guildNameChange', newGuild.id)) {
    const embed = new EmbedBuilder()
      .setColor('#3399ff')
      .setTitle('🏷️ 𝚂𝚎𝚛𝚟𝚎𝚛 Đổ𝚒 𝚃ê𝚗')
      .addFields(
        { name: '𝚃𝚛ướ𝚌:', value: oldGuild.name },
        { name: '𝚂𝚊𝚞:', value: newGuild.name }
      )
      .setTimestamp();
    await sendLog(log, embed);
  }

  if (oldGuild.icon !== newGuild.icon && shouldLog('guildIconChange', newGuild.id)) {
    const embed = new EmbedBuilder()
      .setColor('#ffcc00')
      .setTitle('🖼️ 𝙰𝚟𝚊𝚝𝚊𝚛 𝚂𝚎𝚛𝚟𝚎𝚛 𝚃𝚑𝚊𝚢 Đổ𝚒')
      .setImage(newGuild.iconURL({ size: 1024 }))
      .setTimestamp();
    await sendLog(log, embed);
  }
});

client.on('roleCreate', async (role) => {
  if (!CONFIG.logAllEvents) return;
  if (!shouldLog('roleCreate', role.id)) return;
  
  const log = client.channels.cache.get(LogDiscordChannelId);
  if (!log) return;

  const embed = new EmbedBuilder()
    .setColor('#00ccff')
    .setTitle('➕ 𝚅𝚊𝚒 𝚃𝚛ò Đượ𝚌 𝚃ạ𝚘')
    .setDescription(`**𝚃ê𝚗:** ${role.name}\n**𝙼à𝚞:** ${role.hexColor}\n**𝙸𝙳:** ${role.id}`)
    .setTimestamp();
  await sendLog(log, embed);
  
  // 𝙺𝚒ể𝚖 𝚝𝚛𝚊 𝚊𝚗 𝚗𝚒𝚗𝚑 - ĐÃ FIX
  if (CONFIG.securityMonitoring) {
    try {
      const fetchedLogs = await role.guild.fetchAuditLogs({
        limit: 1,
        type: 30 // 𝚁𝙾𝙻𝙴_𝙲𝚁𝙴𝙰𝚃𝙴
      });
      const creator = fetchedLogs.entries.first()?.executor;
      
      if (creator) {
        const warnings = checkDangerousAction(creator, 'roleCreate', {
          target: role.name
        });
        
        if (warnings) {
          await sendSecurityAlert(creator, 'roleCreate', {
            target: role.name
          }, warnings);
        }
      }
    } catch (error) {
      console.error('𝙻ỗ𝚒 𝚔𝚑𝚒 𝚔𝚒ể𝚖 𝚝𝚛𝚊 𝚊𝚗 𝚗𝚒𝚗𝚑 𝚛𝚘𝚕𝚎:', error);
    }
  }
});

client.on('roleDelete', async (role) => {
  if (!CONFIG.logAllEvents) return;
  if (!shouldLog('roleDelete', role.id)) return;
  
  const log = client.channels.cache.get(LogDiscordChannelId);
  if (!log) return;

  const embed = new EmbedBuilder()
    .setColor('#cc0000')
    .setTitle('❌ 𝚅𝚊𝚒 𝚃𝚛ò 𝙱ị 𝚇𝚘á')
    .setDescription(`**𝚃ê𝚗:** ${role.name}\n**𝙸𝙳:** ${role.id}`)
    .setTimestamp();
  await sendLog(log, embed);
});

client.on('voiceStateUpdate', async (oldState, newState) => {
  if (!CONFIG.logAllEvents) return;
  
  const member = newState.member;
  if (!member || member.user.bot) return;

  const log = client.channels.cache.get(LogDiscordChannelId);
  if (!log) return;

  const oldChannel = oldState.channel;
  const newChannel = newState.channel;

  if (!oldChannel && newChannel) {
    if (!shouldLog('voiceJoin', member.id)) return;
    const embed = new EmbedBuilder()
      .setColor('#00ccff')
      .setTitle('🎤 𝚅à𝚘 𝙺ê𝚗𝚑 𝚃𝚑𝚘ạ𝚒')
      .setDescription(`**𝙽𝚐ườ𝚒 𝙳ù𝚗𝚐:** ${member.user.tag} (${member.id})\n**𝙺ê𝚗𝚑:** ${newChannel.name}`)
      .setTimestamp();
    return sendLog(log, embed);
  }

  if (oldChannel && !newChannel) {
    if (!shouldLog('voiceLeave', member.id)) return;
    const embed = new EmbedBuilder()
      .setColor('#ff6666')
      .setTitle('📴 𝚁ờ𝚒 𝙺ê𝚗𝚑 𝚃𝚑𝚘ạ𝚒')
      .setDescription(`**𝙽𝚐ườ𝚒 𝙳ù𝚗𝚐:** ${member.user.tag} (${member.id})\n**𝙺ê𝚗𝚑:** ${oldChannel.name}`)
      .setTimestamp();
    return sendLog(log, embed);
  }

  if (oldChannel && newChannel && oldChannel.id !== newChannel.id) {
    if (!shouldLog('voiceMove', member.id)) return;
    const embed = new EmbedBuilder()
      .setColor('#ffff00')
      .setTitle('🔀 𝙲𝚑𝚞𝚢ể𝚗 𝙺ê𝚗𝚑 𝚃𝚑𝚘ạ𝚒')
      .setDescription(`**𝙽𝚐ườ𝚒 𝙳ù𝚗𝚐:** ${member.user.tag} (${member.id})\n**𝚃ừ:** ${oldChannel.name}\n**𝚃ớ𝚒:** ${newChannel.name}`)
      .setTimestamp();
    return sendLog(log, embed);
  }

  if (oldState.selfMute !== newState.selfMute && shouldLog('voiceMute', member.id)) {
    const embed = new EmbedBuilder()
      .setColor('#ff9900')
      .setTitle(newState.selfMute ? '🔇 𝚃ự 𝚃ắ𝚝 𝚃𝚒ế𝚗𝚐' : '🔊 𝙱ỏ 𝚃ắ𝚝 𝚃𝚒ế𝚗𝚐')
      .setDescription(`**𝙽𝚐ườ𝚒 𝙳ù𝚗𝚐:** ${member.user.tag} (${member.id})\n**𝙺ê𝚗𝚑:** ${newChannel?.name || '𝙺𝚑ô𝚗𝚐 𝚇á𝚌 Đị𝚗𝚑'}`)
      .setTimestamp();
    return sendLog(log, embed);
  }

  if (oldState.selfDeaf !== newState.selfDeaf && shouldLog('voiceDeaf', member.id)) {
    const embed = new EmbedBuilder()
      .setColor('#cc99ff')
      .setTitle(newState.selfDeaf ? '🙉 𝚃ự 𝚃ắ𝚝 𝙽𝚐𝚑𝚎' : '👂 𝙱ỏ 𝚃ắ𝚝 𝙽𝚐𝚑𝚎')
      .setDescription(`**𝙽𝚐ườ𝚒 𝙳ù𝚗𝚐:** ${member.user.tag} (${member.id})\n**𝙺ê𝚗𝚑:** ${newChannel?.name || '𝙺𝚑ô𝚗𝚐 𝚇á𝚌 Đị𝚗𝚑'}`)
      .setTimestamp();
    return sendLog(log, embed);
  }
});

// 𝙴𝚖𝚘𝚓𝚒 𝚃ạ𝚘 𝙼ớ𝚒
client.on('emojiCreate', async (emoji) => {
  if (!CONFIG.logAllEvents) return;
  if (!shouldLog('emojiCreate', emoji.id)) return;
  
  const log = client.channels.cache.get(LogDiscordChannelId);
  if (!log) return;

  const embed = new EmbedBuilder()
    .setColor('#00ff99')
    .setTitle('😊 𝙴𝚖𝚘𝚓𝚒 𝙼ớ𝚒 Đượ𝚌 𝚃𝚑ê𝚖')
    .setDescription(`**𝚃ê𝚗:** :${emoji.name}:\n**𝙸𝙳:** ${emoji.id}`)
    .setThumbnail(emoji.url)
    .addFields(
      { name: '𝙰𝚗𝚒𝚖𝚊𝚝𝚎𝚍?', value: emoji.animated ? '✅ 𝙲ó' : '❌ 𝙺𝚑ô𝚗𝚐', inline: true },
      { name: '𝙳𝚘', value: emoji.managed ? '✅ 𝙱ở𝚒 𝚋𝚘𝚝' : '❌ 𝙽𝚐ườ𝚒 𝚍ù𝚗𝚐', inline: true }
    )
    .setTimestamp();

  await sendLog(log, embed);
});

// 𝙴𝚖𝚘𝚓𝚒 𝙱ị 𝚇𝚘á
client.on('emojiDelete', async (emoji) => {
  if (!CONFIG.logAllEvents) return;
  if (!shouldLog('emojiDelete', emoji.id)) return;
  
  const log = client.channels.cache.get(LogDiscordChannelId);
  if (!log) return;

  const embed = new EmbedBuilder()
    .setColor('#ff3333')
    .setTitle('🗑️ 𝙴𝚖𝚘𝚓𝚒 𝙱ị 𝚇𝚘á')
    .setDescription(`**𝚃ê𝚗:** :${emoji.name}:\n**𝙸𝙳:** ${emoji.id}`)
    .addFields(
      { name: '𝙰𝚗𝚒𝚖𝚊𝚝𝚎𝚍?', value: emoji.animated ? '✅ 𝙲ó' : '❌ 𝙺𝚑ô𝚗𝚐', inline: true },
      { name: '𝙳𝚘', value: emoji.managed ? '✅ 𝙱ở𝚒 𝚋𝚘𝚝' : '❌ 𝙽𝚐ườ𝚒 𝚍ù𝚗𝚐', inline: true }
    )
    .setTimestamp();

  await sendLog(log, embed);
});

// 𝙴𝚖𝚘𝚓𝚒 Đổ𝚒 𝚃ê𝚗
client.on('emojiUpdate', async (oldEmoji, newEmoji) => {
  if (!CONFIG.logAllEvents || oldEmoji.name === newEmoji.name) return;
  if (!shouldLog('emojiUpdate', newEmoji.id)) return;
  
  const log = client.channels.cache.get(LogDiscordChannelId);
  if (!log) return;

  const embed = new EmbedBuilder()
    .setColor('#ffcc00')
    .setTitle('✏️ 𝙴𝚖𝚘𝚓𝚒 Đổ𝚒 𝚃ê𝚗')
    .setThumbnail(newEmoji.url)
    .addFields(
      { name: '𝚃ê𝚗 𝙲ũ:', value: `:${oldEmoji.name}:`, inline: true },
      { name: '𝚃ê𝚗 𝙼ớ𝚒:', value: `:${newEmoji.name}:`, inline: true },
      { name: '𝙸𝙳:', value: newEmoji.id, inline: true }
    )
    .setTimestamp();

  await sendLog(log, embed);
});

// 𝙼ã 𝙼ờ𝚒 Đượ𝚌 𝚃ạ𝚘
client.on('inviteCreate', async (invite) => {
  if (!CONFIG.logAllEvents) return;
  if (!shouldLog('inviteCreate', invite.code)) return;
  
  const log = client.channels.cache.get(LogDiscordChannelId);
  if (!log) return;

  const embed = new EmbedBuilder()
    .setColor('#00cc66')
    .setTitle('🎫 𝙼ã 𝙼ờ𝚒 Đượ𝚌 𝚃ạ𝚘')
    .setDescription(`**𝙼ã:** ${invite.code}\n**𝙺ê𝚗𝚑:** ${invite.channel?.name || '𝙺𝚑ô𝚗𝚐 𝚡á𝚌 đị𝚗𝚑'}`)
    .addFields(
      { name: '𝙽𝚐ườ𝚒 𝚃ạ𝚘', value: invite.inviter?.tag || '𝙺𝚑ô𝚗𝚐 𝚡á𝚌 đị𝚗𝚑', inline: true },
      { name: '𝚂ử 𝚍ụ𝚗𝚐 𝚝ố𝚒 đ𝚊', value: invite.maxUses ? `${invite.maxUses} 𝚕ầ𝚗` : '𝙺𝚑ô𝚗𝚐 𝚐𝚒ớ𝚒 𝚑ạ𝚗', inline: true },
      { name: '𝙷ế𝚝 𝚑ạ𝚗', value: invite.expiresAt ? `<t:${Math.floor(invite.expiresAt.getTime() / 1000)}:R>` : '𝙺𝚑ô𝚗𝚐 𝚑ế𝚝 𝚑ạ𝚗', inline: true }
    )
    .setFooter({ text: `𝙼ã: ${invite.code}` })
    .setTimestamp();

  await sendLog(log, embed);
});

// 𝙼ã 𝙼ờ𝚒 𝙱ị 𝚇𝚘á
client.on('inviteDelete', async (invite) => {
  if (!CONFIG.logAllEvents) return;
  if (!shouldLog('inviteDelete', invite.code)) return;
  
  const log = client.channels.cache.get(LogDiscordChannelId);
  if (!log) return;

  const embed = new EmbedBuilder()
    .setColor('#ff3333')
    .setTitle('🗑️ 𝙼ã 𝙼ờ𝚒 𝙱ị 𝚇𝚘á')
    .setDescription(`**𝙼ã:** ${invite.code}\n**𝙺ê𝚗𝚑:** ${invite.channel?.name || '𝙺𝚑ô𝚗𝚐 𝚡á𝚌 đị𝚗𝚑'}`)
    .addFields(
      { name: '𝙽𝚐ườ𝚒 𝚃ạ𝚘', value: invite.inviter?.tag || '𝙺𝚑ô𝚗𝚐 𝚡á𝚌 đị𝚗𝚑', inline: true },
      { name: '𝚂ố 𝚕ượ𝚗𝚐 đã 𝚍ù𝚗𝚐', value: `${invite.uses || 0} 𝚕ầ𝚗`, inline: true }
    )
    .setFooter({ text: `𝙼ã: ${invite.code}` })
    .setTimestamp();

  await sendLog(log, embed);
});

// 𝙽𝚐ườ𝚒 𝙳ù𝚗𝚐 𝙱ị 𝙱𝚊𝚗
client.on('guildBanAdd', async (ban) => {
  if (!CONFIG.logAllEvents) return;
  if (!shouldLog('guildBanAdd', ban.user.id)) return;
  
  const log = client.channels.cache.get(LogDiscordChannelId);
  if (!log) return;

  const embed = new EmbedBuilder()
    .setColor('#ff0000')
    .setTitle('🔨 𝙽𝚐ườ𝚒 𝙳ù𝚗𝚐 𝙱ị 𝙱𝚊𝚗')
    .setDescription(`**𝙽𝚐ườ𝚒 𝙳ù𝚗𝚐:** ${ban.user.tag} (${ban.user.id})`)
    .setThumbnail(ban.user.displayAvatarURL({ dynamic: true, size: 1024 }))
    .addFields(
      { name: '𝙻ý 𝚍𝚘', value: ban.reason || '𝙺𝚑ô𝚗𝚐 𝚌ó 𝚕ý 𝚍𝚘', inline: true }
    )
    .setTimestamp();

  await sendLog(log, embed);
  
  // 𝙺𝚒ể𝚖 𝚝𝚛𝚊 𝚊𝚗 𝚗𝚒𝚗𝚑 - ĐÃ FIX
  if (CONFIG.securityMonitoring) {
    try {
      const fetchedLogs = await ban.guild.fetchAuditLogs({
        limit: 1,
        type: 22 // 𝙼𝙴𝙼𝙱𝙴𝚁_𝙱𝙰𝙽_𝙰𝙳𝙳
      });
      const banner = fetchedLogs.entries.first()?.executor;
      
      if (banner) {
        const warnings = checkDangerousAction(banner, 'guildBanAdd', {
          target: ban.user.tag
        });
        
        if (warnings) {
          await sendSecurityAlert(banner, 'guildBanAdd', {
            target: ban.user.tag,
            reason: ban.reason || 'Không có lý do'
          }, warnings);
        }
      }
    } catch (error) {
      console.error('𝙻ỗ𝚒 𝚔𝚑𝚒 𝚔𝚒ể𝚖 𝚝𝚛𝚊 𝚊𝚗 𝚗𝚒𝚗𝚑 𝚋𝚊𝚗:', error);
    }
  }
});

// 𝙽𝚐ườ𝚒 𝙳ù𝚗𝚐 Đượ𝚌 𝚄𝚗𝚋𝚊𝚗
client.on('guildBanRemove', async (ban) => {
  if (!CONFIG.logAllEvents) return;
  if (!shouldLog('guildBanRemove', ban.user.id)) return;
  
  const log = client.channels.cache.get(LogDiscordChannelId);
  if (!log) return;

  const embed = new EmbedBuilder()
    .setColor('#00cc66')
    .setTitle('🔓 𝙽𝚐ườ𝚒 𝙳ù𝚗𝚐 Đượ𝚌 𝚄𝚗𝚋𝚊𝚗')
    .setDescription(`**𝙽𝚐ườ𝚒 𝙳ù𝚗𝚐:** ${ban.user.tag} (${ban.user.id})`)
    .setThumbnail(ban.user.displayAvatarURL({ dynamic: true, size: 1024 }))
    .setTimestamp();

  await sendLog(log, embed);
});

// 𝚆𝚎𝚋𝚑𝚘𝚘𝚔 Đượ𝚌 𝚃ạ𝚘
client.on('webhookUpdate', async (channel) => {
  if (!CONFIG.logAllEvents || !CONFIG.logWebhooks) return;
  
  try {
    const webhooks = await channel.fetchWebhooks();
    const recentWebhook = webhooks.sort((a, b) => b.createdTimestamp - a.createdTimestamp).first();
    
    if (!recentWebhook || !shouldLog('webhookCreate', recentWebhook.id)) return;
    
    const log = client.channels.cache.get(LogDiscordChannelId);
    if (!log) return;

    const embed = new EmbedBuilder()
      .setColor('#9933ff')
      .setTitle('🪝 𝚆𝚎𝚋𝚑𝚘𝚘𝚔 Đượ𝚌 𝚃ạ𝚘')
      .setDescription(`**𝙺ê𝚗𝚑:** ${channel.name}`)
      .addFields(
        { name: '𝚃ê𝚗 𝚆𝚎𝚋𝚑𝚘𝚘𝚔', value: recentWebhook.name, inline: true },
        { name: '𝙽𝚐ườ𝚒 𝚃ạ𝚘', value: recentWebhook.owner?.tag || '𝙺𝚑ô𝚗𝚐 𝚡á𝚌 đị𝚗𝚑', inline: true },
        { name: '𝙸𝙳', value: `\`${recentWebhook.id}\``, inline: true }
      )
      .setFooter({ text: '𝙻𝚞̛𝚞 𝚢́: 𝙺𝚑𝚘̂𝚗𝚐 𝚌𝚑𝚒𝚊 𝚜𝚎̉ 𝚝𝚑𝚘̂𝚗𝚐 𝚝𝚒𝚗 𝚠𝚎𝚋𝚑𝚘𝚘𝚔' })
      .setTimestamp();

    await sendLog(log, embed);
  } catch (error) {
    console.error('𝙻ỗ𝚒 𝚔𝚑𝚒 𝚕ấ𝚢 𝚝𝚑ô𝚗𝚐 𝚝𝚒𝚗 𝚠𝚎𝚋𝚑𝚘𝚘𝚔:', error);
  }
});

// 𝚇ó𝚊 𝚌á𝚌 𝚕𝚘𝚐 𝚌ũ 𝚔𝚑ỏ𝚒 𝚋ộ đệ𝚖 đ𝚎̂̉ 𝚝𝚛á𝚗𝚑 𝚛ò 𝚛ỉ 𝚋ộ 𝚗𝚑ớ
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamp] of recentLogs.entries()) {
    if (now - timestamp > CONFIG.cooldownTime * 2) {
      recentLogs.delete(key);
    }
  }
}, CONFIG.cooldownTime * 2);





 /**
 Code phát nhạc khá tâm đắc nhưng lỗi một số chỗ chưa fix được : )) mà kệ đi 
 */
// ==============================  
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 phút
const PROGRESS_UPDATE_MS = 30 * 1000; // 30s thay vì 10s
const MAX_CACHE_SIZE = 500; // giới hạn cache tối đa
const COMMAND_CONTROLLER_TIMEOUT = 15 * 60 * 1000; // timeout cho người điều khiển

class TTLCache {
    constructor(limit = MAX_CACHE_SIZE, ttl = CACHE_TTL_MS) {
        this.limit = limit;
        this.ttl = ttl;
        this.map = new Map();
    }
    get(key) {
        const item = this.map.get(key);
        if (!item) return undefined;
        if (Date.now() > item.expireAt) {
            this.map.delete(key);
            return undefined;
        }
        return item.value;
    }
    set(key, value) {
        if (this.map.size >= this.limit) {
            const firstKey = this.map.keys().next().value;
            this.map.delete(firstKey);
        }
        this.map.set(key, { value, expireAt: Date.now() + this.ttl });
    }
    clearExpired() {
        const now = Date.now();
        for (const [k, v] of this.map) {
            if (now > v.expireAt) this.map.delete(k);
        }
    }
    clearAll() { this.map.clear(); }
}

const searchCache = new TTLCache(300, 5 * 60 * 1000);

function createProgressBar(currentSec, totalSec) {
    return `[ ${formatTime(currentSec)} / ${formatTime(totalSec)} ]`;
}

function formatTime(sec) {
    const minutes = Math.floor((sec || 0) / 60);
    const seconds = Math.floor((sec || 0) % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}
    
class MusicPlayer {
    constructor(client) {
        this.queue = [];
        this.connection = null;
        this.player = null;
        this.isPlaying = false;
        this.isLooping = false;
        this.is247Mode = false;
        this.idleTimeout = null;
        this.textChannel = null;
        this.userRequestedLeave = false;
        this.cleanupCollectors = [];
        this.currentStream = null;
        this.progressInterval = null;
        this.lastActivity = Date.now();
        this.MAX_QUEUE_SIZE = 100;
        this.currentController = null;
        this.controllerTimeout = null;
        this.currentTrack = null;
        this.startedAt = null;
        
        // Khởi tạo DisTube
        this.distube = new DisTube(client, {
            plugins: [
                new SpotifyPlugin(),
                new SoundCloudPlugin()
            ]
        });
        
        this.setupDistubeEvents();
    }

    setController(user) {
        this.currentController = user;
        if (this.controllerTimeout) clearTimeout(this.controllerTimeout);
        this.controllerTimeout = setTimeout(() => {
            this.currentController = null;
        }, COMMAND_CONTROLLER_TIMEOUT);
    }

    checkControllerPermission(user, interaction = null) {
        if (!this.currentController) {
            this.setController(user);
            return true;
        }
        if (this.currentController.id === user.id) {
            this.setController(user);
            return true;
        }
        const embed = new EmbedBuilder()
            .setDescription(`<:uncheck:1376210480850403510> 𝙱ạ𝚗 𝙺𝚑ô𝚗𝚐 𝚃𝚑ể 𝚂ử 𝙳ụ𝚗𝚐 𝙻ệ𝚗𝚑 𝙽à𝚢!\n\n- 𝙽𝚐ườ𝚒 Đ𝚊𝚗𝚐 Đ𝚒ề𝚞 𝙺𝚑𝚒ể𝚗: <@${this.currentController.id}>\n- 𝙷ã𝚢 𝙲𝚑ờ 𝚃𝚛𝚘𝚗𝚐 𝙶𝚒â𝚢 𝙻á𝚝 𝙷𝚘ặ𝚌 𝚈ê𝚞 𝙲ầ𝚞 𝙽𝚐ườ𝚒 Đó 𝙳ừ𝚗𝚐 𝙻ệ𝚗𝚑.`)
            .setColor('#ff0000');

        if (interaction) {
            if (interaction.deferred || interaction.replied) {
                interaction.editReply({ embeds: [embed], ephemeral: true }).catch(() => {});
            } else {
                interaction.reply({ embeds: [embed], ephemeral: true }).catch(() => {});
            }
        } else if (this.textChannel) {
            this.textChannel.send({ embeds: [embed] }).catch(() => {});
        }
        return false;
    }

    updateActivity() { this.lastActivity = Date.now(); }

    async destroy() {
        try {
            // collectors
            this.cleanupCollectors.forEach(c => { try { if (!c.ended) c.stop(); } catch {} });
            this.cleanupCollectors = [];

            // intervals/timeouts
            if (this.progressInterval) { clearInterval(this.progressInterval); this.progressInterval = null; }
            if (this.idleTimeout) { clearTimeout(this.idleTimeout); this.idleTimeout = null; }
            if (this.controllerTimeout) { clearTimeout(this.controllerTimeout); this.controllerTimeout = null; }

            // distube
            if (this.distube) {
                try {
                    const queues = this.distube.queues.collection;
                    queues.forEach(queue => {
                        try { queue.stop(); } catch {}
                    });
                } catch {}
            }

            // stream
            if (this.currentStream) {
                try { this.currentStream?.stream?.destroy?.(); } catch {}
                this.currentStream = null;
            }

            // player
            if (this.player) {
                try { this.player.stop(); this.player.removeAllListeners(); } catch {}
                this.player = null;
            }

            // voice connection
            if (this.connection) {
                try { this.connection.destroy(); } catch {}
                this.connection = null;
            }
        } finally {
            this.isPlaying = false;
            this.currentTrack = null;
            this.currentController = null;
        }
    }    
    
async searchYouTube(query) {
    try {

        const searchResults = await yts(query);
        
        if (!searchResults || !searchResults.videos || searchResults.videos.length === 0) {
            return [];
        }

        return searchResults.videos.slice(0, 5).map((video) => ({
            title: video.title,
            link: video.url,
            duration: video.timestamp || 'Unknown',
            thumbnail: video.thumbnail
        }));
    } catch (error) {
        console.error('Search error:', error);
        return [];
    }
} 
    
/*   
async searchYouTube(query) {
    try {
        const opts = {
            maxResults: 5,
            key: process.env.YOUTUBE_API_KEY,
        };

        const searchResults = await youtubeSearch(query, opts);
        
        if (!searchResults || !searchResults.results || searchResults.results.length === 0) {
            return [];
        }

        return searchResults.results.map((video) => ({
            title: video.title,
            link: `https://www.youtube.com/watch?v=${video.id}`,
            duration: this.formatVideoDuration(video.duration) || 'Unknown',
            thumbnail: video.thumbnails?.default?.url
        }));
    } catch (error) {
        console.error('Search error:', error);
        return [];
    }
}
*/

startIdleTimeout() {
        if (this.idleTimeout) clearTimeout(this.idleTimeout);
        if (!this.is247Mode) {
            this.idleTimeout = setTimeout(async () => {
                try {
                    const channelToNotify = this.textChannel;
                    if (!this.isPlaying && !this.userRequestedLeave) {
                        const embed = new EmbedBuilder()
                            .setDescription('<:uncheck:1376210480850403510> 𝙱𝚘𝚝 𝚃ự 𝚁ờ𝚒 𝙺𝚑ỏ𝚒 𝙺ê𝚗𝚑 𝚃𝚑𝚘ạ𝚒 \n \n- 𝙳𝚘 𝙺𝚑ô𝚗𝚐 𝙿𝚑á𝚝 𝙽𝚑ạ𝚌 𝚃𝚛𝚘𝚗𝚐 𝟹 𝙿𝚑ú𝚝 \n- 𝚃𝚛á𝚗𝚑 𝙱ạ𝚗 𝚃𝚛𝚎𝚘 𝙱𝚘𝚝 𝙽ê𝚗 <@958668688607838208> 𝙻à𝚖 𝙽𝚑ư 𝚅ậ𝚢.')
                            .setColor('#ff0000')
                            .setImage('https://raw.githubusercontent.com/AnDepChai/ImageBotDiscord/refs/heads/main/bot.gif')
                            .setFooter({ text: '© ᴄᴏᴅᴇ ʙʏ ᴀɴ ᴘᴀʜɴ 🐧' });
                        await this.destroy();
                        if (channelToNotify) await channelToNotify.send({ embeds: [embed] }).catch(() => {});
                    }
                } catch (error) { console.error('Lỗi trong idle timeout:', error); }
                finally { this.userRequestedLeave = false; }
            }, 180000);
        }
    }

async handleUserLeaveRequest() {
        this.userRequestedLeave = true;
        await this.destroy();
        this.userRequestedLeave = false;
    }


async playSong(query, userVoiceChannel, messageChannel, requester) {
    this.updateActivity();
    this.textChannel = messageChannel;

    // Kiểm tra quyền điều khiển
    if (this.distube.voices.get(userVoiceChannel.guild.id) && this.currentController && this.currentController.id !== requester.id) {
        const embed = new EmbedBuilder()
            .setDescription(`<:uncheck:1376210480850403510> Bạn không thể dùng lệnh này!\n\n- Người điều khiển: <@${this.currentController.id}>`)
            .setColor('#ff0000');
        await messageChannel.send({ embeds: [embed] }).catch(() => {});
        return;
    }

    const spotifyPattern = /^https?:\/\/(?:open\.|play\.)?spotify\.com\/(?:track|playlist|album)\//;
    const soundcloudPattern = /^https?:\/\/(?:soundcloud\.com|on\.soundcloud\.com)\//;

    const isSpotifyUrl = spotifyPattern.test(query);
    const isSoundcloudUrl = soundcloudPattern.test(query);

    if (isSpotifyUrl || isSoundcloudUrl) {
        // Phát trực tiếp Spotify/SoundCloud URL
        await this.handleDirectUrl(query, userVoiceChannel, requester);
    } else {
        // Mặc định dùng YouTube cho tất cả (bao gồm cả URL YouTube và tìm kiếm)
        await this.handleYouTubeQuery(query, userVoiceChannel, requester);
    }
}

async handleYouTubeQuery(query, userVoiceChannel, requester) {
    const youtubeUrlPattern = /^https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]+)/;
    const youtubePlaylistPattern = /^https?:\/\/(?:www\.)?(?:youtube\.com\/(?:playlist\?list=|watch\?v=[^&]+&list=))/;

    const isYoutubeUrl = youtubeUrlPattern.test(query) || youtubePlaylistPattern.test(query);

    if (!isYoutubeUrl) {
        // Tìm kiếm YouTube cho query không phải URL
        await this.handleSearchQuery(query, userVoiceChannel, requester);
    } else {
        // Phát URL YouTube
        await this.handleYouTubeUrl(query, userVoiceChannel, requester);
    }
}

async handleYouTubeUrl(query, userVoiceChannel, requester) {
    const loadingEmbed = new EmbedBuilder()
        .setDescription('⏳ **Đ𝚊𝚗𝚐 𝚝ả𝚒 𝚗𝚑ạ𝚌 𝚈𝚘𝚞𝚃𝚞𝚋𝚎...**')
        .setColor('#0099ff');
        
    const loadingMsg = await this.textChannel.send({
        embeds: [loadingEmbed]
    }).catch(() => null);

    try {
        if (!this.distube.voices.get(userVoiceChannel.guild.id)) {
            await this.distube.voices.join(userVoiceChannel);
        }
        
        console.log('Đang phát URL YouTube:', query);
        
        const member = userVoiceChannel.guild.members.cache.get(requester.id);
        if (!member) {
            throw new Error('Không tìm thấy member trong guild');
        }
        
        // Sử dụng youtube-dl-exec để xử lý URL YouTube
        const youtubedl = require('youtube-dl-exec');
        
        // Lấy thông tin video từ URL
        const videoInfo = await youtubedl(query, {
            dumpSingleJson: true,
            noCheckCertificates: true,
            noWarnings: true,
            preferFreeFormats: true,
            addHeader: ['referer:youtube.com', 'user-agent:googlebot']
        });
        
        if (!videoInfo || !videoInfo.title) {
            throw new Error('Không thể lấy thông tin video từ URL');
        }
        
        // Phát bằng tiêu đề video (DisTube sẽ tìm trên YouTube)
        await this.distube.play(userVoiceChannel, videoInfo.title, {
            member: member,
            textChannel: this.textChannel,
            source: 'youtube'
        });
        
        this.setController(requester);
        
        const duration = videoInfo.duration ? this.formatDuration(videoInfo.duration) : 'Unknown';
        
        const successEmbed = new EmbedBuilder()
            .setDescription(`<:check:1376210508771889172> Đã thêm **${videoInfo.title}** (${duration}) vào hàng chờ!`)
            .setColor('#00ff00');
        await this.textChannel.send({ embeds: [successEmbed] }).catch(() => {});

    } catch (error) {
        console.error('YouTube URL play error:', error);
        
        // Fallback: thử phát trực tiếp nếu dùng youtube-dl-exec thất bại
        try {
            console.log('Thử fallback phát trực tiếp...');
            const member = userVoiceChannel.guild.members.cache.get(requester.id);
            await this.distube.play(userVoiceChannel, query, {
                member: member,
                textChannel: this.textChannel,
            });
            
            this.setController(requester);
            
            const fallbackEmbed = new EmbedBuilder()
                .setDescription(`<:check:1376210508771889172> Đã thêm bài hát vào hàng chờ!`)
                .setColor('#00ff00');
            await this.textChannel.send({ embeds: [fallbackEmbed] }).catch(() => {});
            
        } catch (fallbackError) {
            console.error('Fallback cũng thất bại:', fallbackError);
            await this.handlePlayError(error, query, userVoiceChannel, requester);
        }
    }

    if (loadingMsg?.deletable) {
        setTimeout(() => loadingMsg.delete().catch(() => {}), 3000);
    }
}

async handleSearchQuery(query, userVoiceChannel, requester) {
    try {
        const loadingEmbed = new EmbedBuilder()
            .setDescription('🔍 **Đ𝚊𝚗𝚐 𝚝ì𝚖 𝚔𝚒ế𝚖 𝚝𝚛ê𝚗 𝚈𝚘𝚞𝚃𝚞𝚋𝚎...**')
            .setColor('#0099ff');
            
        const loadingMsg = await this.textChannel.send({
            embeds: [loadingEmbed]
        }).catch(() => null);

        const results = await this.searchYouTube(query);

        if (loadingMsg?.deletable) {
            await loadingMsg.delete().catch(() => {});
        }

        if (!results || results.length === 0) {
            await this.textChannel.send({
                content: '<:uncheck:1376210480850403510> 𝙺𝚑ô𝚗𝚐 𝚃ì𝚖 𝚃𝚑ấ𝚢 𝙺ế𝚝 𝚀𝚞ả 𝙿𝚑ù 𝙷ợ𝚙 𝚝𝚛ê𝚗 𝚈𝚘𝚞𝚃𝚞𝚋𝚎!',
                ephemeral: true
            }).catch(() => {});
            return;
        }

        // Hiển thị kết quả tìm kiếm và menu chọn
        await this.showSearchResults(query, results, userVoiceChannel, requester);
        
    } catch (error) {
        console.error('Lỗi khi tìm kiếm nhạc trên YouTube:', error);
        await this.textChannel.send({
            content: '<:uncheck:1376210480850403510> Đã xảy ra lỗi khi tìm kiếm nhạc trên YouTube.',
            ephemeral: true
        }).catch(() => {});
    }
}

async showSearchResults(query, results, userVoiceChannel, requester) {
    const embed = new EmbedBuilder()
        .setTitle(`🔎 𝚃ì𝚖 𝙺𝚒ế𝚖: ${results.length} 𝙺ế𝚝 𝚀𝚞ả:"${query}"`)
        .setColor('#00ff00');
        
    results.forEach((result, i) => {
        embed.addFields({
            name: `${i + 1}. ${result.title}`,
            value: `_𝙻𝚒𝚗𝚔:_ ${result.link}\n_𝙳𝚞𝚛𝚊𝚝𝚒𝚘𝚗:_ ${result.duration}`,
            inline: false
        });
    });

    const options = results.map((result, index) => {
        return {
            label: `𝙱à𝚒 ${index + 1}: ${result.title.substring(0, 45)}${result.title.length > 45 ? '...' : ''}`,
            value: index.toString(),
            description: `⏱️ ${result.duration}`,
            emoji: '🎵'
        };
    });
    
    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('music_selection')
        .setPlaceholder('🎵 𝙲𝚑ọ𝚗 𝙱à𝚒 𝙷á𝚝 𝙼𝚞ố𝚗 𝙿𝚑á𝚝...')
        .addOptions(options);

    const row = new ActionRowBuilder().addComponents(selectMenu);
    
    const prompt = new EmbedBuilder()
        .setDescription('👇 𝙲𝚑ọ𝚗 𝙱à𝚒 𝙷á𝚝 𝚃ạ𝚒 𝙼𝚎𝚗𝚞 𝙱ê𝚗 𝙳ướ𝚒 Để 𝙰𝚌𝚌𝚎𝚙𝚝 𝙽𝚑ạ𝚌!')
        .setColor('#00ff00');
        
    const replyMessage = await this.textChannel.send({
        embeds: [embed, prompt],
        components: [row]
    });

    let handled = false;
    const timeoutDuration = 15000;
    const timeout = setTimeout(async () => {
        if (!handled && replyMessage?.deletable) {
            try { await replyMessage.delete(); } catch {}
            const e = new EmbedBuilder().setDescription('𝙷ế𝚝 𝚃.𝙶𝚒𝚊𝚗 𝙲𝚑ọ𝚗 𝙽𝚑ạ𝚌, 𝚅𝚞𝚒 𝙻ò𝚗𝚐 𝚂ử 𝙳ụ𝚗𝚐 𝙻ạ𝚒 !𝙿𝚕𝚊𝚢 𝙷𝚘ặ𝚌 !𝙿𝚗').setColor('#ff0000');
            await this.textChannel.send({ embeds: [e] }).catch(() => {});
        }
    }, timeoutDuration);

    const filter = (i) => i.isStringSelectMenu() && i.customId === 'music_selection' && i.message.id === replyMessage.id && i.user.id === requester.id;
    const collector = this.textChannel.createMessageComponentCollector({ filter, time: timeoutDuration });
    
    // Khởi tạo cleanupCollectors nếu chưa có
    if (!this.cleanupCollectors) {
        this.cleanupCollectors = [];
    }
    this.cleanupCollectors.push(collector);

    collector.on('collect', async (i) => {
        try {
            handled = true;
            collector.stop();
            clearTimeout(timeout);
            await i.deferUpdate();
            
            const selectedIndex = parseInt(i.values[0]);
            const selectedResult = results[selectedIndex];

            await this.playSelectedSong(selectedResult.title, userVoiceChannel, requester, i.member);
            
            if (replyMessage?.deletable) {
                try { await replyMessage.delete(); } catch {}
            }
        } catch (err) {
            console.error('Lỗi khi xử lý tương tác:', err);
            await i.followUp({
                content: '<:uncheck:1376210480850403510> Đã xảy ra lỗi khi xử lý yêu cầu.',
                ephemeral: true
            }).catch(() => {});
        }
    });

    collector.on('end', () => {
        clearTimeout(timeout);
        if (this.cleanupCollectors) {
            this.cleanupCollectors = this.cleanupCollectors.filter(c => c !== collector);
        }
    });
}

async playSelectedSong(songQuery, userVoiceChannel, requester, member) {
    const playLoadingEmbed = new EmbedBuilder()
        .setDescription('⏳ **Đ𝚊𝚗𝚐 𝚝ả𝚒 𝚗𝚑ạ𝚌...**')
        .setColor('#0099ff');
        
    const playLoadingMsg = await this.textChannel.send({
        embeds: [playLoadingEmbed]
    }).catch(() => null);

    try {
        if (!this.distube.voices.get(userVoiceChannel.guild.id)) {
            await this.distube.voices.join(userVoiceChannel);
        }
        
        console.log('Đang phát:', songQuery);
        
        await this.distube.play(userVoiceChannel, songQuery, {
            member: member,
            textChannel: this.textChannel,
            source: 'youtube'
        });
        
        this.setController(requester);
        
        const successEmbed = new EmbedBuilder()
            .setDescription(`<:check:1376210508771889172> Đã thêm bài hát vào hàng chờ!`)
            .setColor('#00ff00');
        await this.textChannel.send({ embeds: [successEmbed] }).catch(() => {});
        
    } catch (error) {
        console.error('Play error details:', error);
        await this.handlePlayError(error, songQuery, userVoiceChannel, requester);
    }

    if (playLoadingMsg?.deletable) {
        setTimeout(() => playLoadingMsg.delete().catch(() => {}), 3000);
    }
}

async handleDirectUrl(query, userVoiceChannel, requester) {
    const loadingEmbed = new EmbedBuilder()
        .setDescription('⏳ **Đ𝚊𝚗𝚐 𝚝ả𝚒 𝚗𝚑ạ𝚌...**')
        .setColor('#0099ff');
        
    const loadingMsg = await this.textChannel.send({
        embeds: [loadingEmbed]
    }).catch(() => null);

    try {
        if (!this.distube.voices.get(userVoiceChannel.guild.id)) {
            await this.distube.voices.join(userVoiceChannel);
        }
        
        console.log('Đang phát URL trực tiếp:', query);
        
        const member = userVoiceChannel.guild.members.cache.get(requester.id);
        if (!member) {
            throw new Error('Không tìm thấy member trong guild');
        }
        
        // Phát trực tiếp Spotify/SoundCloud URL
        await this.distube.play(userVoiceChannel, query, {
            member: member,
            textChannel: this.textChannel,
        });
        
        this.setController(requester);
        
        // Xác định loại content
        let contentType = '🎵 𝙱à𝚒 𝙷á𝚝';
        const spotifyPattern = /^https?:\/\/(?:open\.|play\.)?spotify\.com\/(?:track|playlist|album)\//;
        const soundcloudPattern = /^https?:\/\/(?:soundcloud\.com|on\.soundcloud\.com)\//;
        
        if (spotifyPattern.test(query)) {
            if (query.includes('/playlist/')) contentType = '📀 𝙿𝚕𝚊𝚢𝚕𝚒𝚜𝚝 𝚂𝚙𝚘𝚝𝚒𝚏𝚢';
            else if (query.includes('/album/')) contentType = '💿 𝙰𝚕𝚋𝚞𝚖 𝚂𝚙𝚘𝚝𝚒𝚏𝚢';
            else contentType = '🎵 𝙱à𝚒 𝙷á𝚝 𝚂𝚙𝚘𝚝𝚒𝚏𝚢';
        } else if (soundcloudPattern.test(query)) {
            if (query.includes('/sets/')) contentType = '📀 𝙿𝚕𝚊𝚢𝚕𝚒𝚜𝚝 𝚂𝚘𝚞𝚗𝚍𝙲𝚕𝚘𝚞𝚍';
            else contentType = '🎵 𝙱à𝚒 𝙷á𝚝 𝚂𝚘𝚞𝚗𝚍𝙲𝚕𝚘𝚞𝚍';
        }
        
        const typeEmbed = new EmbedBuilder()
            .setDescription(`<:check:1376210508771889172> Đã 𝚝𝚑ê𝚖 ${contentType} 𝚟à𝚘 𝚑à𝚗𝚐 𝚌𝚑ờ!`)
            .setColor('#00ff00');
        await this.textChannel.send({ embeds: [typeEmbed] }).catch(() => {});

    } catch (error) {
        console.error('Direct URL play error:', error);
        await this.handlePlayError(error, query, userVoiceChannel, requester);
    }

    if (loadingMsg?.deletable) {
        setTimeout(() => loadingMsg.delete().catch(() => {}), 3000);
    }
}

async handlePlayError(error, query, userVoiceChannel, requester) {
    let errorMessage = '<:uncheck:1376210480850403510> 𝙺𝚑ô𝚗𝚐 𝚃𝚑ể 𝙿𝚑á𝚝 𝙱à𝚒 𝙽𝚑ạ𝚌 𝙽à𝚢!';
    
    if (error.code === 'VOICE_CONNECTION_ERROR') {
        errorMessage = '<:uncheck:1376210480850403510> 𝙺𝚑ô𝚗𝚐 𝚃𝚑ể 𝙺ế𝚝 𝙽ố𝚒 Đế𝚗 𝙺ê𝚗𝚑 𝚃𝚑𝚘ạ𝚒!';
    } else if (error.message.includes('No results found') || error.code === 'NO_RESULT') {
        errorMessage = '<:uncheck:1376210480850403510> 𝙺𝚑ô𝚗𝚐 𝚃ì𝚖 𝚃𝚑ấ𝚢 𝙺ế𝚝 𝚀𝚞ả 𝙿𝚑ù 𝙷ợ𝚙!';
    } else if (error.message.includes('Unsupported URL') || error.code === 'UNSUPPORTED_URL') {
        errorMessage = '<:uncheck:1376210480850403510> 𝙻𝚒𝚗𝚔 𝙽à𝚢 𝙺𝚑ô𝚗𝚐 Đượ𝚌 𝙷ỗ 𝚃rợ!';
    } else if (error.message.includes('Không tìm thấy member')) {
        errorMessage = '<:uncheck:1376210480850403510> 𝙺𝚑ô𝚗𝚐 𝚃𝚑ể 𝚇á𝚌 Đị𝚗𝚑 𝙽𝚐ườ𝚒 𝙳ù𝚗𝚐!';
    }
    
    await this.textChannel.send({
        content: errorMessage,
        ephemeral: true
    }).catch(() => {});
}

// ========== CÁC HÀM HỖ TRỢ ==========

async searchYouTube(query) {
    try {
        const yts = require('yt-search');
        const searchResults = await yts(query);
        
        return searchResults.videos.slice(0, 5).map(video => ({
            title: video.title,
            link: video.url,
            duration: video.timestamp || video.duration.toString(),
            thumbnail: video.thumbnail
        }));
    } catch (error) {
        console.error('Lỗi tìm kiếm YouTube:', error);
        return [];
    }
}

formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

setController(requester) {
    this.currentController = requester;
}



/*
async playSong(query, userVoiceChannel, messageChannel, requester) {
    this.updateActivity();
    this.textChannel = messageChannel;

    if (this.distube.voices.get(userVoiceChannel.guild.id) && this.currentController && this.currentController.id !== requester.id) {
        const embed = new EmbedBuilder()
            .setDescription(`<:uncheck:1376210480850403510> Bạn không thể dùng lệnh này!\n\n- Người điều khiển: <@${this.currentController.id}>`)
            .setColor('#ff0000');
        await messageChannel.send({ embeds: [embed] }).catch(() => {});
        return;
    }

    const youtubeUrlPattern = /^https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]+)/;
    const youtubePlaylistPattern = /^https?:\/\/(?:www\.)?(?:youtube\.com\/(?:playlist\?list=|watch\?v=[^&]+&list=))/;
    const spotifyPattern = /^https?:\/\/(?:open\.|play\.)?spotify\.com\/(?:track|playlist|album)\//;
    const soundcloudPattern = /^https?:\/\/(?:soundcloud\.com|on\.soundcloud\.com)\//;
    
    const isSupportedDirectUrl = youtubeUrlPattern.test(query) || youtubePlaylistPattern.test(query) || 
                                spotifyPattern.test(query) || soundcloudPattern.test(query);

    if (!isSupportedDirectUrl) {
        // Tìm kiếm YouTube
        try {
            const loadingEmbed = new EmbedBuilder()
                .setDescription('🔍 **Đ𝚊𝚗𝚐 𝚝ì𝚖 𝚔𝚒ế𝚖...**')
                .setColor('#0099ff');
                
            const loadingMsg = await this.textChannel.send({ 
                embeds: [loadingEmbed] 
            }).catch(() => null);

            const results = await this.searchYouTube(query);

            if (loadingMsg?.deletable) {
                await loadingMsg.delete().catch(() => {});
            }

            if (!results || results.length === 0) {
                await this.textChannel.send({ 
                    content: '<:uncheck:1376210480850403510> 𝙺𝚑ô𝚗𝚐 𝚃ì𝚖 𝚃𝚑ấ𝚢 𝙺ế𝚝 𝚀𝚞ả 𝙿𝚑ù 𝙷ợ𝚙!', 
                    ephemeral: true 
                }).catch(() => {});
                return;
            }

            const embed = new EmbedBuilder()
                .setTitle(`🔎 𝚃ì𝚖 𝙺𝚒ế𝚖: ${results.length} 𝙺ế𝚝 𝚀𝚞ả:"${query}"`)
                .setColor('#00ff00');
                
            results.forEach((result, i) => {
                embed.addFields({ 
                    name: `${i + 1}. ${result.title}`, 
                    value: `_𝙻𝚒𝚗𝚔:_ ${result.link}\n_𝙳𝚞𝚛𝚊𝚝𝚒𝚘𝚗:_ ${result.duration}`, 
                    inline: false 
                });
            });

            const options = results.map((result, index) => {
                return {
                    label: `𝙱à𝚒 ${index + 1}: ${result.title.substring(0, 45)}${result.title.length > 45 ? '...' : ''}`,
                    value: index.toString(),
                    description: `⏱️ ${result.duration}`,
                    emoji: '🎵'
                };
            });
            
            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('music_selection')
                .setPlaceholder('🎵 𝙲𝚑ọ𝚗 𝙱à𝚒 𝙷á𝚝 𝙼𝚞ố𝚗 𝙿𝚑á𝚝...')
                .addOptions(options);

            const row = new ActionRowBuilder().addComponents(selectMenu);
            
            const prompt = new EmbedBuilder()
                .setDescription('👇 𝙲𝚑ọ𝚗 𝙱à𝚒 𝙷á𝚝 𝚃ạ𝚒 𝙼𝚎𝚗𝚞 𝙱ê𝚗 𝙳ướ𝚒 Để 𝙰𝚌𝚌𝚎𝚙𝚝 𝙽𝚑ạ𝚌!')
                .setColor('#00ff00');
                
            const replyMessage = await this.textChannel.send({ 
                embeds: [embed, prompt], 
                components: [row] 
            });

            let handled = false;
            const timeoutDuration = 15000;
            const timeout = setTimeout(async () => {
                if (!handled && replyMessage?.deletable) {
                    try { await replyMessage.delete(); } catch {}
                    const e = new EmbedBuilder().setDescription('𝙷ế𝚝 𝚃.𝙶𝚒𝚊𝚗 𝙲𝚑ọ𝚗 𝙽𝚑ạ𝚌, 𝚅𝚞𝚒 𝙻ò𝚗𝚐 𝚂ử 𝙳ụ𝚗𝚐 𝙻ạ𝚒 !𝙿𝚕𝚊𝚢 𝙷𝚘ặ𝚌 !𝙿𝚗').setColor('#ff0000');
                    await this.textChannel.send({ embeds: [e] }).catch(() => {});
                }
            }, timeoutDuration);

            const filter = (i) => i.isStringSelectMenu() && i.customId === 'music_selection' && i.message.id === replyMessage.id && i.user.id === requester.id;
            const collector = this.textChannel.createMessageComponentCollector({ filter, time: timeoutDuration });
            this.cleanupCollectors.push(collector);

            collector.on('collect', async (i) => {
                try {
                    handled = true; 
                    collector.stop(); 
                    clearTimeout(timeout);
                    await i.deferUpdate();
                    
                    const selectedIndex = parseInt(i.values[0]);
                    const selectedResult = results[selectedIndex];

                    const playLoadingEmbed = new EmbedBuilder()
                        .setDescription('⏳ **Đ𝚊𝚗𝚐 𝚝ả𝚒 𝚗𝚑ạ𝚌...**')
                        .setColor('#0099ff');
                        
                    const playLoadingMsg = await this.textChannel.send({ 
                        embeds: [playLoadingEmbed] 
                    }).catch(() => null);

                    try {
                        if (!this.distube.voices.get(userVoiceChannel.guild.id)) {
                            await this.distube.voices.join(userVoiceChannel);
                        }
                        
                        console.log('Đang phát:', selectedResult.title);
                        
                        // LẤY GUILD MEMBER TỪ INTERACTION
                        const member = i.member;
                        
                        // LUÔN PHÁT BẰNG TÊN BÀI HÁT ĐỂ TRÁNH LỖI URL
                        await this.distube.play(userVoiceChannel, selectedResult.title, {
                            member: member,
                            textChannel: this.textChannel
                        });
                        
                        this.setController(requester);
                        
                        const successEmbed = new EmbedBuilder()
                            .setDescription(`<:check:1376210508771889172> Đã thêm **${selectedResult.title}** vào hàng chờ!`)
                            .setColor('#00ff00');
                        await this.textChannel.send({ embeds: [successEmbed] }).catch(() => {});
                        
                    } catch (error) {
                        console.error('Play error details:', error);
                        
                        let errorMessage = '<:uncheck:1376210480850403510> 𝙺𝚑ô𝚗𝚐 𝚃𝚑ể 𝙿𝚑á𝚝 𝙱à𝚒 𝙽𝚑ạ𝚌 𝙽à𝚢!';
                        
                        if (error.errorCode === 'VOICE_CONNECT_FAILED') {
                            errorMessage = '<:uncheck:1376210480850403510> 𝙺𝚑ô𝚗𝚐 𝚃𝚑ể 𝙺ế𝚝 𝙽ố𝚒 Đế𝚗 𝙺ê𝚗𝚑 𝚃𝚑𝚘ạ𝚒!';
                        } else if (error.message.includes('No results found')) {
                            errorMessage = '<:uncheck:1376210480850403510> 𝙺𝚑ô𝚗𝚐 𝚃ì𝚖 𝚃𝚑ấ𝚢 𝙺ế𝚝 𝚀𝚞ả 𝙿𝚑ù 𝙷ợ𝚙!';
                        }
                        
                        await this.textChannel.send({ 
                            content: errorMessage,
                            ephemeral: true 
                        }).catch(() => {});
                    }

                    if (playLoadingMsg?.deletable) {
                        setTimeout(() => playLoadingMsg.delete().catch(() => {}), 3000);
                    }
                    if (replyMessage?.deletable) { 
                        try { await replyMessage.delete(); } catch {} 
                    }
                } catch (err) {
                    console.error('Lỗi khi xử lý tương tác:', err);
                    await i.followUp({ content: '<:uncheck:1376210480850403510> Đã xảy ra lỗi khi xử lý yêu cầu.', ephemeral: true }).catch(() => {});
                }
            });

            collector.on('end', () => {
                clearTimeout(timeout);
                this.cleanupCollectors = this.cleanupCollectors.filter(c => c !== collector);
            });
            
        } catch (error) {
            console.error('Lỗi khi tìm kiếm nhạc:', error);
            await this.textChannel.send({ content: '<:uncheck:1376210480850403510> Đã xảy ra lỗi khi tìm kiếm nhạc.', ephemeral: true }).catch(() => {});
        }
    } else {
        // Phát trực tiếp URL (YouTube, Spotify, SoundCloud)
        const loadingEmbed = new EmbedBuilder()
            .setDescription('⏳ **Đ𝚊𝚗𝚐 𝚝ả𝚒 𝚗𝚑ạ𝚌...**')
            .setColor('#0099ff');
            
        const loadingMsg = await this.textChannel.send({ 
            embeds: [loadingEmbed] 
        }).catch(() => null);

        try {
            if (!this.distube.voices.get(userVoiceChannel.guild.id)) {
                await this.distube.voices.join(userVoiceChannel);
            }
            
            console.log('Đang thử phát:', query);
            
            // LẤY GUILD MEMBER
            const member = userVoiceChannel.guild.members.cache.get(requester.id);
            if (!member) {
                throw new Error('Không tìm thấy member trong guild');
            }
            
            let playQuery = query;
            let contentType = '🎵 𝙱à𝚒 𝙷á𝚝';
            
            // XỬ LÝ URL YOUTUBE - CHUYỂN SANG TÊN BÀI HÁT
            if (youtubeUrlPattern.test(query)) {
                try {
                    const yts = require('yt-search');
                    const videoId = query.match(/[?&]v=([^&]+)/)?.[1] || query.match(/youtu\.be\/([^?]+)/)?.[1];
                    
                    if (videoId) {
                        const videoInfo = await yts({ videoId });
                        if (videoInfo && videoInfo.title) {
                            playQuery = videoInfo.title;
                            console.log('Chuyển URL YouTube sang tên bài hát:', playQuery);
                        }
                    }
                } catch (ytError) {
                    console.error('Lỗi lấy thông tin YouTube:', ytError);
                    // Giữ nguyên URL nếu không lấy được title
                }
                contentType = '🎵 𝙱à𝚒 𝙷á𝚝 𝚈𝚘𝚞𝚃𝚞𝚋𝚎';
                
            } else if (youtubePlaylistPattern.test(query)) {
                contentType = '📀 𝙿𝚕𝚊𝚢𝚕𝚒𝚜𝚝 𝚈𝚘𝚞𝚃𝚞𝚋𝚎';
                
            } else if (spotifyPattern.test(query)) {
                if (query.includes('/playlist/')) contentType = '📀 𝙿𝚕𝚊𝚢𝚕𝚒𝚜𝚝 𝚂𝚙𝚘𝚝𝚒𝚏𝚢';
                else if (query.includes('/album/')) contentType = '💿 𝙰𝚕𝚋𝚞𝚖 𝚂𝚙𝚘𝚝𝚒𝚏𝚢';
                else contentType = '🎵 𝙱à𝚒 𝙷á𝚝 𝚂𝚙𝚘𝚝𝚒𝚏𝚢';
                
            } else if (soundcloudPattern.test(query)) {
                if (query.includes('/sets/')) contentType = '📀 𝙿𝚕𝚊𝚢𝚕𝚒𝚜𝚝 𝚂𝚘𝚞𝚗𝚍𝙲𝚕𝚘𝚞𝚍';
                else contentType = '🎵 𝙱à𝚒 𝙷á𝚝 𝚂𝚘𝚞𝚗𝚍𝙲𝚕𝚘𝚞𝚍';
            }
            
            // PHÁT NHẠC
            await this.distube.play(userVoiceChannel, playQuery, {
                member: member,
                textChannel: this.textChannel
            });
            
            this.setController(requester);
            
            const typeEmbed = new EmbedBuilder()
                .setDescription(`<:check:1376210508771889172> Đã 𝚝𝚑ê𝚖 ${contentType} 𝚟à𝚘 𝚑à𝚗𝚐 𝚌𝚑ờ!`)
                .setColor('#00ff00');
            await this.textChannel.send({ embeds: [typeEmbed] }).catch(() => {});

        } catch (error) {
            console.error('Play error details:', error);
            
            let errorMessage = '<:uncheck:1376210480850403510> 𝙺𝚑ô𝚗𝚐 𝚃𝚑ể 𝙿𝚑á𝚝 𝙱à𝚒 𝙽𝚑ạ𝚌 𝙽à𝚢!';
            
            if (error.errorCode === 'VOICE_CONNECT_FAILED') {
                errorMessage = '<:uncheck:1376210480850403510> 𝙺𝚑ô𝚗𝚐 𝚃𝚑ể 𝙺ế𝚝 𝙽ố𝚒 Đế𝚗 𝙺ê𝚗𝚑 𝚃𝚑𝚘ạ𝚒!';
            } else if (error.errorCode === 'NOT_SUPPORTED_URL') {
                // THỬ PHÁT BẰNG TÊN BÀI HÁT NẾU URL KHÔNG HỖ TRỢ
                try {
                    console.log('URL không được hỗ trợ, thử phát bằng tên...');
                    const member = userVoiceChannel.guild.members.cache.get(requester.id);
                    
                    // LẤY TÊN TỪ URL (nếu có thể)
                    let fallbackQuery = query;
                    if (youtubeUrlPattern.test(query)) {
                        // Cố gắng extract tên từ URL YouTube
                        try {
                            const yts = require('yt-search');
                            const videoId = query.match(/[?&]v=([^&]+)/)?.[1];
                            if (videoId) {
                                const searchResults = await yts({ videoId });
                                if (searchResults && searchResults.title) {
                                    fallbackQuery = searchResults.title;
                                }
                            }
                        } catch (e) {
                            console.error('Lỗi extract tên từ URL:', e);
                        }
                    }
                    
                    await this.distube.play(userVoiceChannel, fallbackQuery, {
                        member: member,
                        textChannel: this.textChannel
                    });
                    
                    this.setController(requester);
                    
                    const successEmbed = new EmbedBuilder()
                        .setDescription(`<:check:1376210508771889172> Đã thêm bài hát vào hàng chờ!`)
                        .setColor('#00ff00');
                    await this.textChannel.send({ embeds: [successEmbed] }).catch(() => {});
                    return;
                    
                } catch (fallbackError) {
                    console.error('Fallback play error:', fallbackError);
                    errorMessage = '<:uncheck:1376210480850403510> 𝙻𝚒𝚗𝚔 𝙽à𝚢 𝙺𝚑ô𝚗𝚐 Đượ𝚌 𝙷ỗ 𝚃rợ!';
                }
            } else if (error.message.includes('No results found')) {
                errorMessage = '<:uncheck:1376210480850403510> 𝙺𝚑ô𝚗𝚐 𝚃ì𝚖 𝚃𝚑ấ𝚢 𝙺ế𝚝 𝚀𝚞ả 𝙿𝚑ù 𝙷ợ𝚙!';
            } else if (error.message.includes('Không tìm thấy member')) {
                errorMessage = '<:uncheck:1376210480850403510> 𝙺𝚑ô𝚗𝚐 𝚃𝚑ể 𝚇á𝚌 Đị𝚗𝚑 𝙽𝚐ườ𝚒 𝙳ù𝚗𝚐!';
            }
            
            await this.textChannel.send({ 
                content: errorMessage,
                ephemeral: true 
            }).catch(() => {});
        }

        if (loadingMsg?.deletable) {
            setTimeout(() => loadingMsg.delete().catch(() => {}), 3000);
        }
    }
}
*/

async joinVoiceChannel(userVoiceChannel, messageChannel, user) {
    // Kiểm tra quyền điều khiển
    if (this.distube.voices.get(userVoiceChannel.guild.id) && this.currentController && this.currentController.id !== user.id) {
        const embed = new EmbedBuilder()
            .setDescription(`<:uncheck:1376210480850403510> Bạn không thể dùng lệnh này!\n\n- Người điều khiển: <@${this.currentController.id}>`)
            .setColor('#ff0000');
        await messageChannel.send({ embeds: [embed] }).catch(() => {});
        return;
    }

    // Kiểm tra nếu bot đã ở trong kênh voice
    if (this.distube.voices.get(userVoiceChannel.guild.id)) {
        this.textChannel = messageChannel;
        this.startIdleTimeout();
        return;
    }

    await this.destroy();
    this.textChannel = messageChannel;
    this.setController(user); // Gán người gọi lệnh là controller

    try {
        // Join voice channel bằng DisTube
        await this.distube.voices.join(userVoiceChannel);
        
        const soundPath = path.join(__dirname, 'sounds', 'girl-uwu.mp3');
        if (fs.existsSync(soundPath)) {
            try {
                const joinSound = createAudioResource(soundPath);
                const joinPlayer = createAudioPlayer();
                const connection = this.distube.voices.get(userVoiceChannel.guild.id);
                if (connection) {
                    connection.voiceConnection.subscribe(joinPlayer);
                    joinPlayer.play(joinSound);
                    
                    // Tự động dừng player sau khi phát xong
                    joinPlayer.on('stateChange', (oldState, newState) => {
                        if (newState.status === 'idle') {
                            joinPlayer.stop();
                        }
                    });
                }
            } catch (soundError) {
                console.error('Lỗi khi phát sound:', soundError);
                // Không làm gì cả, tiếp tục bình thường
            }
        }
        
        const embed = new EmbedBuilder()
            .setDescription(`<:check:1376210508771889172> 𝙱𝚘𝚝 𝚃𝚑𝚊𝚖 𝙶𝚒𝚊 𝙺ê𝚗𝚑: <#${userVoiceChannel.id}>`)
            .setColor('#00ff00');
        await this.textChannel.send({ embeds: [embed] }).catch(() => {});
        this.startIdleTimeout();
    } catch (error) {
        console.error('Failed to join voice channel:', error);
        await this.destroy();
        const embed = new EmbedBuilder()
            .setDescription('<:uncheck:1376210480850403510> 𝙺𝚑ô𝚗𝚐 𝚃𝚑ể 𝚃𝚑𝚊𝚖 𝙶𝚒𝚊 𝙺ê𝚗𝚑 𝚃𝚑𝚘ạ𝚒')
            .setColor('#ff0000');
        await this.textChannel.send({ embeds: [embed] }).catch(() => {});
    }
}

async leaveVoiceChannel(user) {
    // Kiểm tra quyền điều khiển
    if (!this.checkControllerPermission(user)) return;
    
    const channelToSend = this.textChannel;
    const queue = this.distube.getQueue(this.textChannel?.guild);
    
    if (queue) {
        queue.stop();
        await this.destroy();
        if (channelToSend) {
            const embed = new EmbedBuilder()
                .setDescription('<:uncheck:1376210480850403510> 𝙱𝚘𝚝 𝚁ờ𝚒 𝙺ê𝚗𝚑 𝚃𝚑𝚘ạ𝚒. \n\n- 𝙳ù𝚗𝚐 𝙻ệ𝚗𝚑:`/ʜᴇʟᴘ`\n- 𝙱𝚘𝚝 𝚄𝚗𝚕𝚘𝚌𝚔 𝚃ấ𝚝 𝙲ả 𝙲𝚑ứ𝚌 𝙽ă𝚗𝚐 𝙺𝚑ô𝚗𝚐 𝙲ầ𝚗: `ᴘʀᴇᴍɪᴜᴍ`.')
                .setColor('#ff0000')
                .setFooter({ text: '© ᴄᴏᴅᴇ ʙʏ ᴀɴ ᴘᴀʜɴ 🐧' })
                .setImage('https://raw.githubusercontent.com/AnDepChai/ImageBotDiscord/refs/heads/main/bot.gif');
            await channelToSend.send({ embeds: [embed] }).catch(() => {});
        }
    } else if (channelToSend) {
        const embed = new EmbedBuilder()
            .setDescription('<:uncheck:1376210480850403510> 𝙱𝚘𝚝 𝙺𝚑ô𝚗𝚐 𝚃𝚛𝚘𝚗𝚐 𝙺ê𝚗𝚑 𝚃𝚑𝚘ạ𝚒 𝙽à𝚘!')
            .setColor('#ff0000');
        await channelToSend.send({ embeds: [embed] }).catch(() => {});
    }
}

async skipSong(user, count = 1) {
        this.updateActivity();
        
        if (!this.checkControllerPermission(user)) return;
        
        const queue = this.distube.getQueue(this.textChannel?.guild);
        if (!queue) {
            const embed = new EmbedBuilder()
                .setDescription('<:uncheck:1376210480850403510> 𝙺𝚑ô𝚗𝚐 𝙲ó 𝙱à𝚒 𝙽à𝚘 Đ𝚊𝚗𝚐 Đượ𝚌 𝙿𝚑á𝚝!')
                .setColor('#ff0000')
                .setFooter({ text: '© ᴄᴏᴅᴇ ʙʏ ᴀɴ ᴘᴀʜɴ 🐧' });
            await this.textChannel.send({ embeds: [embed] }).catch(() => {});
            return;
        }

        if (count > 1) {
            const skipped = Math.min(count - 1, queue.songs.length - 1);
            queue.songs.splice(1, skipped);
        }

        try {
            await queue.skip();
            const embed = new EmbedBuilder()
                .setDescription('<:check:1376210508771889172> Đã 𝚂𝚔𝚒𝚙 𝙱à𝚒 𝙽𝚑ạ𝚌!')
                .setColor('#00ff00')
                .setFooter({ text: '© ᴄᴏᴅᴇ ʙʏ ᴀɴ ᴘᴀʜɴ 🐧' });
            await this.textChannel.send({ embeds: [embed] }).catch(() => {});
        } catch (error) {
            console.error('Skip error:', error);
            const embed = new EmbedBuilder()
                .setDescription('<:uncheck:1376210480850403510> 𝙺𝚑ô𝚗𝚐 𝚃𝚑ể 𝚂𝚔𝚒𝚙 𝙱à𝚒 𝙽𝚑ạ𝚌!')
                .setColor('#ff0000')
                .setFooter({ text: '© ᴄᴏᴅᴇ ʙʏ ᴀɴ ᴘᴀʜɴ 🐧' });
            await this.textChannel.send({ embeds: [embed] }).catch(() => {});
        }
    }

async pauseSong(user) {
        this.updateActivity();
        
        if (!this.checkControllerPermission(user)) return;
        
        const queue = this.distube.getQueue(this.textChannel?.guild);
        if (!queue) {
            const embed = new EmbedBuilder()
                .setDescription('<:uncheck:1376210480850403510> 𝙺𝚑ô𝚗𝚐 𝙲ó 𝙱à𝚒 𝙽à𝚘 Đ𝚊𝚗𝚐 Đượ𝚌 𝙿𝚑á𝚝!')
                .setColor('#ff0000')
                .setFooter({ text: '© ᴄᴏᴅᴇ ʙʏ ᴀɴ ᴘᴀʜɴ 🐧' });
            await this.textChannel.send({ embeds: [embed] }).catch(() => {});
            return;
        }

        if (queue.paused) {
            const embed = new EmbedBuilder()
                .setDescription('<:uncheck:1376210480850403510> 𝙽𝚑ạ𝚌 Đã Đượ𝚌 𝚃ạ𝚖 𝙳ừ𝚗𝚐 𝚃𝚛ướᴄ Đó!')
                .setColor('#ff0000')
                .setFooter({ text: '© ᴄᴏᴅᴇ ʙʏ ᴀɴ ᴘᴀʜɴ 🐧' });
            await this.textChannel.send({ embeds: [embed] }).catch(() => {});
            return;
        }

        try {
            await queue.pause();
            const embed = new EmbedBuilder()
                .setDescription('<:check:1376210508771889172> 𝙽𝚑ạ𝚌 Đã Đượ𝚌 𝚃ạ𝚖 𝙳ừ𝚗𝚐!')
                .setColor('#00ff00')
                .setFooter({ text: '© ᴄᴏᴅᴇ ʙʏ ᴀɴ ᴘᴀʜɴ 🐧' });
            await this.textChannel.send({ embeds: [embed] }).catch(() => {});
        } catch (error) {
            console.error('Pause error:', error);
        }
    }

async resumeSong(user) {
        this.updateActivity();
        
        if (!this.checkControllerPermission(user)) return;
        
        const queue = this.distube.getQueue(this.textChannel?.guild);
        if (!queue) {
            const embed = new EmbedBuilder()
                .setDescription('<:uncheck:1376210480850403510> 𝙺𝚑ô𝚗𝚐 𝙲ó 𝙱à𝚒 𝙽à𝚘 Đ𝚊𝚗𝚐 Đượ𝚌 𝙿𝚑á𝚝!')
                .setColor('#ff0000')
                .setFooter({ text: '© ᴄᴏᴅᴇ ʙʏ ᴀɴ ᴘᴀʜɴ 🐧' });
            await this.textChannel.send({ embeds: [embed] }).catch(() => {});
            return;
        }

        if (!queue.paused) {
            const embed = new EmbedBuilder()
                .setDescription('<:uncheck:1376210480850403510> 𝙽𝚑ạ𝚌 Đ𝚊𝚗𝚐 Đượ𝚌 𝙿𝚑á𝚝!')
                .setColor('#ff0000')
                .setFooter({ text: '© ᴄᴏᴅᴇ ʙʏ ᴀɴ ᴘᴀʜɴ 🐧' });
            await this.textChannel.send({ embeds: [embed] }).catch(() => {});
            return;
        }

        try {
            await queue.resume();
            const embed = new EmbedBuilder()
                .setDescription('<:check:1376210508771889172> 𝙽𝚑ạ𝚌 Đã Đượ𝚌 𝚃𝚒ế𝚙 𝚃ụ𝚌 𝙿𝚑á𝚝!')
                .setColor('#00ff00')
                .setFooter({ text: '© ᴄᴏᴅᴇ ʙʏ ᴀɴ ᴘᴀʜɴ 🐧' });
            await this.textChannel.send({ embeds: [embed] }).catch(() => {});
        } catch (error) {
            console.error('Resume error:', error);
        }
    }

async seekSong(user, time) {
        this.updateActivity();
        
        if (!this.checkControllerPermission(user)) return;
        
        const queue = this.distube.getQueue(this.textChannel?.guild);
        if (!queue) {
            const embed = new EmbedBuilder()
                .setDescription('<:uncheck:1376210480850403510> 𝙺𝚑ô𝚗𝚐 𝙲ó 𝙱à𝚒 𝙽à𝚘 Đ𝚊𝚗𝚐 Đượ𝚌 𝙿𝚑á𝚝!')
                .setColor('#ff0000')
                .setFooter({ text: '© ᴄᴏᴅᴇ ʙʏ ᴀɴ ᴘᴀʜɴ 🐧' });
            await this.textChannel.send({ embeds: [embed] }).catch(() => {});
            return;
        }

        try {
            const timeInSeconds = this.parseTime(time);
            if (timeInSeconds < 0 || timeInSeconds > queue.songs[0].duration) {
                const embed = new EmbedBuilder()
                    .setDescription('<:uncheck:1376210480850403510> 𝚃𝚑ờ𝚒 𝙶𝚒𝚊𝚗 𝙺𝚑ô𝚗𝚐 𝙷ợ𝚙 𝙻ệ!')
                    .setColor('#ff0000')
                    .setFooter({ text: '© ᴄᴏᴅᴇ ʙʏ ᴀɴ ᴘᴀʜɴ 🐧' });
                await this.textChannel.send({ embeds: [embed] }).catch(() => {});
                return;
            }

            await queue.seek(timeInSeconds);
            const embed = new EmbedBuilder()
                .setDescription(`<:check:1376210508771889172> Đã 𝚃𝚞𝚊 Đế𝚗 ${formatTime(timeInSeconds)}!`)
                .setColor('#00ff00')
                .setFooter({ text: '© ᴄᴏᴅᴇ ʙʏ ᴀɴ ᴘᴀʜɴ 🐧' });
            await this.textChannel.send({ embeds: [embed] }).catch(() => {});
        } catch (error) {
            console.error('Seek error:', error);
            const embed = new EmbedBuilder()
                .setDescription('<:uncheck:1376210480850403510> 𝙺𝚑ô𝚗𝚐 𝚃𝚑ể 𝚃𝚞𝚊 𝙱à𝚒 𝙽𝚑ạ𝚌!')
                .setColor('#ff0000')
                .setFooter({ text: '© ᴄᴏᴅᴇ ʙʏ ᴀɴ ᴘᴀʜɴ 🐧' });
            await this.textChannel.send({ embeds: [embed] }).catch(() => {});
        }
    }

    parseTime(timeStr) {
        const parts = timeStr.split(':').map(part => parseInt(part));
        if (parts.length === 1) return parts[0]; // seconds
        if (parts.length === 2) return parts[0] * 60 + parts[1]; // mm:ss
        if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]; // hh:mm:ss
        return 0;
    }

async toggleLoop(user) {
        this.updateActivity();
        
        if (!this.checkControllerPermission(user)) return;
        
        const queue = this.distube.getQueue(this.textChannel?.guild);
        if (!queue) {
            const embed = new EmbedBuilder()
                .setDescription('<:uncheck:1376210480850403510> 𝙺𝚑ô𝚗𝚐 𝙲ó 𝙱à𝚒 𝙽à𝚘 Đ𝚊𝚗𝚐 Đượ𝚌 𝙿𝚑á𝚝!')
                .setColor('#ff0000')
                .setFooter({ text: '© ᴄᴏᴅᴇ ʙʏ ᴀɴ ᴘᴀʜɴ 🐧' });
            await this.textChannel.send({ embeds: [embed] }).catch(() => {});
            return;
        }

        const modes = [0, 1, 2]; // 0: tắt, 1: bài hát, 2: hàng chờ
        const currentMode = queue.repeatMode;
        const nextMode = modes[(modes.indexOf(currentMode) + 1) % modes.length];
        
        try {
            queue.setRepeatMode(nextMode);
            let modeText = '';
            switch (nextMode) {
                case 0: modeText = '𝚃ắ𝚝 𝙻ặ𝚙'; break;
                case 1: modeText = '𝙻ặ𝚙 𝙱à𝚒'; break;
                case 2: modeText = '𝙻ặ𝚙 𝙷à𝚗𝚐 𝙲𝚑ờ'; break;
            }
            
            const embed = new EmbedBuilder()
                .setDescription(`<:check:1376210508771889172> Đã 𝚃𝚑𝚊𝚢 Đổ𝚒 𝙲𝚑ế Độ: **${modeText}**`)
                .setColor('#00ff00')
                .setFooter({ text: '© ᴄᴏᴅᴇ ʙʏ ᴀɴ ᴘᴀʜɴ 🐧' });
            await this.textChannel.send({ embeds: [embed] }).catch(() => {});
        } catch (error) {
            console.error('Loop error:', error);
        }
    }

async toggle247(user) {
        this.updateActivity();
        
        if (!this.checkControllerPermission(user)) return;
        
        this.is247Mode = !this.is247Mode;
        if (this.is247Mode && this.idleTimeout) {
            clearTimeout(this.idleTimeout);
            this.idleTimeout = null;
        } else if (!this.is247Mode) {
            const queue = this.distube.getQueue(this.textChannel?.guild);
            if (!queue || !queue.playing) {
                this.startIdleTimeout();
            }
        }
        const embed = new EmbedBuilder()
            .setDescription(this.is247Mode 
                ? '<:check:1376210508771889172> Đã 𝙱ậ𝚝 𝙲𝚑ế Độ 24/7!' 
                : '<:uncheck:1376210480850403510> Đã 𝚃ắ𝚝 𝙲𝚑ế Độ 24/7!')
            .setColor(this.is247Mode ? '#00ff00' : '#ff0000')
            .setFooter({ text: '© ᴄᴏᴅᴇ ʙʏ ᴀɴ ᴘᴀʜɴ 🐧' });
        await this.textChannel.send({ embeds: [embed] }).catch(() => {});
    }

async clearQueue(user) {
        this.updateActivity();
        
        if (!this.checkControllerPermission(user)) return;
        
        const queue = this.distube.getQueue(this.textChannel?.guild);
        if (!queue) {
            const embed = new EmbedBuilder()
                .setDescription('<:uncheck:1376210480850403510> 𝙺𝚑ô𝚗𝚐 𝙲ó 𝙷à𝚗𝚐 𝙲𝚑ờ 𝙽à𝚘!')
                .setColor('#ff0000')
                .setFooter({ text: '© ᴄᴏᴅᴇ ʙʏ ᴀɴ ᴘᴀʜɴ 🐧' });
            await this.textChannel.send({ embeds: [embed] }).catch(() => {});
            return;
        }

        const count = queue.songs.length - 1; // Trừ bài đang phát
        if (count <= 0) {
            const embed = new EmbedBuilder()
                .setDescription('<:uncheck:1376210480850403510> 𝙺𝚑ô𝚗𝚐 𝙲ó 𝙱à𝚒 𝙽à𝚘 𝚃𝚛𝚘𝚗𝚐 𝙷à𝚗𝚐 𝙲𝚑ờ!')
                .setColor('#ff0000')
                .setFooter({ text: '© ᴄᴏᴅᴇ ʙʏ ᴀɴ ᴘᴀʜɴ 🐧' });
            await this.textChannel.send({ embeds: [embed] }).catch(() => {});
            return;
        }

        queue.songs = [queue.songs[0]]; // Giữ lại bài đang phát
        const embed = new EmbedBuilder()
            .setDescription(`<:check:1376210508771889172> Đã 𝚇ó𝚊 ${count} 𝙱à𝚒 𝚃𝚛𝚘𝚗𝚐 𝙷à𝚗𝚐 𝙲𝚑ờ!`)
            .setColor('#00ff00')
            .setFooter({ text: '© ᴄᴏᴅᴇ ʙʏ ᴀɴ ᴘᴀʜɴ 🐧' });
        await this.textChannel.send({ embeds: [embed] }).catch(() => {});
    }

async removeSong(user, position) {
        this.updateActivity();
        
        if (!this.checkControllerPermission(user)) return;
        
        const queue = this.distube.getQueue(this.textChannel?.guild);
        if (!queue) {
            const embed = new EmbedBuilder()
                .setDescription('<:uncheck:1376210480850403510> 𝙺𝚑ô𝚗𝚐 𝙲ó 𝙷à𝚗𝚐 𝙲𝚑ờ 𝙽à𝚘!')
                .setColor('#ff0000')
                .setFooter({ text: '© ᴄᴏᴅᴇ ʙʏ ᴀɴ ᴘᴀʜɴ 🐧' });
            await this.textChannel.send({ embeds: [embed] }).catch(() => {});
            return;
        }

        if (position < 1 || position >= queue.songs.length) {
            const embed = new EmbedBuilder()
                .setDescription('<:uncheck:1376210480850403510> 𝚅ị 𝚃𝚛í 𝙺𝚑ô𝚗𝚐 𝙷ợ𝚙 𝙻ệ!')
                .setColor('#ff0000')
                .setFooter({ text: '© ᴄᴏᴅᴇ ʙʏ ᴀɴ ᴘᴀʜɴ 🐧' });
            await this.textChannel.send({ embeds: [embed] }).catch(() => {});
            return;
        }

        const removedSong = queue.songs[position];
        queue.songs.splice(position, 1);
        
        const embed = new EmbedBuilder()
            .setDescription(`<:check:1376210508771889172> Đã 𝚇ó𝚊: **[${removedSong.name}](${removedSong.url})**`)
            .setColor('#00ff00')
            .setFooter({ text: '© ᴄᴏᴅᴇ ʙʏ ᴀɴ ᴘᴀʜɴ 🐧' });
        await this.textChannel.send({ embeds: [embed] }).catch(() => {});
    }

async showNowPlaying(user) {
        this.updateActivity();
        
        if (!this.checkControllerPermission(user)) return;
        
        const queue = this.distube.getQueue(this.textChannel?.guild);
        if (!queue) {
            const embed = new EmbedBuilder()
                .setDescription('<:uncheck:1376210480850403510> 𝙺𝚑ô𝚗𝚐 𝙲ó 𝙱à𝚒 𝙽à𝚘 Đ𝚊𝚗𝚐 Đượ𝚌 𝙿𝚑á𝚝!')
                .setColor('#ff0000')
                .setFooter({ text: '© ᴄᴏᴅᴇ ʙʏ ᴀɴ ᴘᴀʜɴ 🐧' });
            await this.textChannel.send({ embeds: [embed] }).catch(() => {});
            return;
        }

        const song = queue.songs[0];
        const currentTime = queue.currentTime;
        const embed = new EmbedBuilder()
            .setTitle('🎵 Đ𝚊𝚗𝚐 𝙿𝚑á𝚝:')
            .setDescription(`[${song.name}](${song.url})\n\n${createProgressBar(currentTime, song.duration)}`)
            .setColor('#00ff00')
            .setThumbnail(song.thumbnail || null)
            .addFields(
                { name: '🎤 𝙺ê𝚗𝚑:', value: `> ${song.uploader.name || 'Unknown'}`, inline: true },
                { name: '🔁 𝙲𝚑ế Độ:', value: `> ${this.getRepeatModeText(queue.repeatMode)}`, inline: true }
            )
            .setFooter({ text: '© ᴄᴏᴅᴇ ʙʏ ᴀɴ ᴘᴀʜɴ 🐧' });
        await this.textChannel.send({ embeds: [embed] }).catch(() => {});
    }

    getRepeatModeText(mode) {
        switch (mode) {
            case 0: return '𝚃ắ𝚝';
            case 1: return '𝙻ặ𝚙 𝙱à𝚒';
            case 2: return '𝙻ặ𝚙 𝙷à𝚗𝚐 𝙲𝚑ờ';
            default: return '𝚃ắ𝚝';
        }
    }

async showQueue(page = 1, interaction = null, user = null) {
    this.updateActivity();
    
    if (user && !this.checkControllerPermission(user, interaction)) return;
    
    const queue = this.distube.getQueue(this.textChannel?.guild);
    if (!queue || queue.songs.length === 0) {
        const embed = new EmbedBuilder()
            .setDescription('🎵 𝙷𝚒ệ𝚗 𝙺𝚑ô𝚗𝚐 𝙲ó 𝙱à𝚒 𝙽𝚑ạ𝚌 𝙽à𝚘 𝚃𝚛𝚘𝚗𝚐 𝙷à𝚗𝚐 𝙲𝚑ờ!')
            .setColor('#ff0000');
        
        if (interaction) {
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({ embeds: [embed], components: [] });
            } else {
                await interaction.reply({ embeds: [embed], ephemeral: true });
            }
        } else if (this.textChannel) {
            await this.textChannel.send({ embeds: [embed] });
        }
        return;
    }

    const itemsPerPage = 5;
    const totalPages = Math.max(1, Math.ceil(queue.songs.length / itemsPerPage));
    page = Math.max(1, Math.min(page, totalPages));

    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, queue.songs.length);

    const queueList = [];
    for (let i = startIndex; i < endIndex; i++) {
        const song = queue.songs[i];
        const prefix = i === 0 ? '🎵 **Đang phát:**' : `${i}.`;
        queueList.push(`${prefix} [${song.name}](${song.url})`);
    }

    const embed = new EmbedBuilder()
        .setTitle(`📃 𝙳𝚊𝚗𝚑 𝚂á𝚌𝚑 𝙿𝚑á𝚝 (${queue.songs.length} 𝙱à𝚒) - 𝚃𝚛𝚊𝚗𝚐 ${page}/${totalPages}`)
        .setDescription(queueList.join('\n'))
        .setColor('#00ff00')
        .setFooter({ text: '© ᴄᴏᴅᴇ ʙʏ ᴀɴ ᴘᴀʜɴ 🐧' });

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('queue_previous').setLabel('◀ 𝚃𝚛ướ𝚌').setStyle(ButtonStyle.Primary).setDisabled(page <= 1),
        new ButtonBuilder().setCustomId('queue_close').setLabel('Đó𝚗𝚐').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('queue_next').setLabel('𝚂𝚊𝚞 ▶').setStyle(ButtonStyle.Primary).setDisabled(page >= totalPages)
    );

    if (interaction) {
        if (interaction.deferred || interaction.replied) {
            await interaction.editReply({ embeds: [embed], components: [row] });
        } else {
            await interaction.reply({ embeds: [embed], components: [row] });
        }
    } else if (this.textChannel) {
        const message = await this.textChannel.send({ embeds: [embed], components: [row] });
        this.setupQueuePagination(message, page, user);
    }
}

async shuffleQueue(user) {
        this.updateActivity();
        
        if (!this.checkControllerPermission(user)) return;
        
        const queue = this.distube.getQueue(this.textChannel?.guild);
        if (!queue) {
            const embed = new EmbedBuilder()
                .setDescription('<:uncheck:1376210480850403510> 𝙺𝚑ô𝚗𝚐 𝙲ó 𝙷à𝚗𝚐 𝙲𝚑ờ 𝙽à𝚘!')
                .setColor('#ff0000')
                .setFooter({ text: '© ᴄᴏᴅᴇ ʙʏ ᴀɴ ᴘᴀʜɴ 🐧' });
            await this.textChannel.send({ embeds: [embed] }).catch(() => {});
            return;
        }

        if (queue.songs.length <= 2) {
            const embed = new EmbedBuilder()
                .setDescription('<:uncheck:1376210480850403510> 𝙺𝚑ô𝚗𝚐 Đủ 𝙱à𝚒 Để 𝚇á𝚌 𝚃rộ𝚗!')
                .setColor('#ff0000')
                .setFooter({ text: '© ᴄᴏᴅᴇ ʙʏ ᴀɴ ᴘᴀʜɴ 🐧' });
            await this.textChannel.send({ embeds: [embed] }).catch(() => {});
            return;
        }

        try {
            await queue.shuffle();
            const embed = new EmbedBuilder()
                .setDescription('<:check:1376210508771889172> Đã 𝚇á𝚌 𝚃rộ𝚗 𝙷à𝚗𝚐 𝙲𝚑ờ!')
                .setColor('#00ff00')
                .setFooter({ text: '© ᴄᴏᴅᴇ ʙʏ ᴀɴ ᴘᴀʜɴ 🐧' });
            await this.textChannel.send({ embeds: [embed] }).catch(() => {});
        } catch (error) {
            console.error('Shuffle error:', error);
        }
    }

    setupQueuePagination(message, currentPage, user) {
    const filter = i => i.isButton() && i.message.id === message.id && ['queue_previous', 'queue_next', 'queue_close'].includes(i.customId);
    const collector = message.createMessageComponentCollector({ filter, time: 60000 });
    
    this.cleanupCollectors.push(collector);

    let page = currentPage;
    collector.on('collect', async i => {
        try {
            if (i.customId === 'queue_close') {
                collector.stop();
                try { 
                    await i.message.delete(); 
                } catch (e) { 
                    console.error('Error deleting message:', e); 
                }
                return;
            }

            if (!this.checkControllerPermission(i.user, i)) return;
            
            await i.deferUpdate();
            const queue = this.distube.getQueue(this.textChannel?.guild);
            
            if (!queue) {
                await i.followUp({ 
                    content: '<:uncheck:1376210480850403510> Không có hàng chờ!', 
                    ephemeral: true 
                });
                collector.stop();
                return;
            }
            
            const totalPages = Math.max(1, Math.ceil(queue.songs.length / 5));
            
            if (i.customId === 'queue_previous') {
                page = Math.max(1, page - 1);
            } else if (i.customId === 'queue_next') {
                page = Math.min(totalPages, page + 1);
            }
            
            await this.showQueue(page, i);
        } catch (error) { 
            console.error('Lỗi xử lý tương tác:', error);
            try {
                await i.followUp({ 
                    content: '<:uncheck:1376210480850403510> Đã xảy ra lỗi!', 
                    ephemeral: true 
                });
            } catch {}
        }
    });
    
    collector.on('end', () => {
        this.cleanupCollectors = this.cleanupCollectors.filter(c => c !== collector);
    });
}

    setupDistubeEvents() {
    this.distube
        .on('playSong', (queue, song) => {
            this.isPlaying = true;
            this.currentTrack = song;
            this.startedAt = Date.now();
            
            if (this.textChannel) {
                const embed = new EmbedBuilder()
                    .setTitle('🔊 𝙿𝚑á𝚝 𝙽𝚑ạ𝚌:')
                    .setDescription(`[${song.name}](${song.url})\n\n${createProgressBar(0, song.duration)}`)
                    .setColor('#00ff00')
                    .setThumbnail(song.thumbnail || null)
                    .setFooter({ text: '© ᴄᴏᴅᴇ ʙʏ ᴀɴ ᴘᴀʜɴ 🐧' });
                
                this.textChannel.send({ embeds: [embed] }).then(message => {
                    this.currentPlayingMessage = message;
                    
                    // Cập nhật progress
                    if (this.progressInterval) clearInterval(this.progressInterval);
                    this.progressInterval = setInterval(() => {
                        if (queue.songs[0] === song && queue.playing) {
                            const currentTime = queue.currentTime;
                            const updatedEmbed = new EmbedBuilder()
                                .setTitle('🔊 𝙿𝚑á𝚝 𝙽𝚑ạ𝚌:')
                                .setDescription(`[${song.name}](${song.url})\n\n${createProgressBar(currentTime, song.duration)}`)
                                .setColor('#00ff00')
                                .setThumbnail(song.thumbnail || null)
                                .setFooter({ text: '© ᴄᴏᴅᴇ ʙʏ ᴀɴ ᴘᴀʜɴ 🐧' });
                            
                            message.edit({ embeds: [updatedEmbed] }).catch(() => {});
                        } else {
                            clearInterval(this.progressInterval);
                        }
                    }, PROGRESS_UPDATE_MS);
                }).catch(() => {});
            }
        })
        .on('addSong', (queue, song) => {
            if (this.textChannel) {
                const embed = new EmbedBuilder()
                    .setColor('#00b0f4')
                    .setTitle('<:youtube:1243493337302962196> ! 𝙰𝚗𝙿𝚊𝚑𝚗 𝚃𝚑ê𝚖 𝙽𝚑ạ𝚌')
                    .addFields(
                        { name: '🎵 𝚃ê𝚗 𝙱à𝚒 𝙷á𝚝:', value: `> ✎ [${song.name}](${song.url})`, inline: false },
                        { name: '\u200B', value: '\u200B', inline: false },
                        { name: '🎤 𝙺ê𝚗𝚑:', value: `> 📺 _${song.uploader.name || 'Unknown'}_`, inline: false },
                        { name: '\u200B', value: '\u200B', inline: false },
                        { name: '⏱️ 𝚃𝚑ờ𝚒 𝙻ượ𝚗𝚐:', value: `> ⏳ _${Math.floor(song.duration / 60)} ᴘʜúᴛ : ${(song.duration % 60).toString().padStart(2, '0')} ɢɪâʏ_`, inline: false },
                        { name: '\u200B', value: '\u200B', inline: false },
                        { name: '🙋 𝙳𝙹:', value: `> 👤 <@${song.user.id}>`, inline: false }
                    )
                    .setThumbnail(song.thumbnail || null)
                    .setFooter({ text: '© ᴄᴏᴅᴇ ʙʏ ᴀɴ ᴘᴀʜɴ 🐧' });
                
                this.textChannel.send({ embeds: [embed] }).catch(() => {});
            }
        })
        .on('addList', (queue, playlist) => {
            if (this.textChannel) {
                const embed = new EmbedBuilder()
                    .setColor('#00b0f4')
                    .setTitle('📀 𝚃𝚑ê𝚖 𝙿𝚕𝚊𝚢𝚕𝚒𝚜𝚝')
                    .setDescription(`**${playlist.name}** - ${playlist.songs.length} bài hát`)
                    .addFields(
                        { name: '🔗 𝙻𝚒𝚗𝚔:', value: `> 📎 [${playlist.url}](${playlist.url})`, inline: false },
                        { name: '🙋 𝙽𝚐ườ𝚒 𝚃𝚑ê𝚖:', value: `> 👤 <@${playlist.user.id}>`, inline: false }
                    )
                    .setFooter({ text: '© ᴄᴏᴅᴇ ʙʏ ᴀɴ ᴘᴀʜɴ 🐧' });
                
                this.textChannel.send({ embeds: [embed] }).catch(() => {});
            }
        })
        .on('error', (channel, error) => {
            console.error('DisTube error:', error);
            if (this.textChannel) {
                this.textChannel.send({
                    embeds: [new EmbedBuilder()
                        .setDescription('𝙺𝚑ô𝚗𝚐 𝚃𝚑ể 𝙿𝚑á𝚝 𝙱à𝚒 𝙽𝚑ạ𝚌 𝙽à𝚢!')
                        .setColor('#ff0000')
                        .setFooter({ text: '© ᴄᴏᴅᴇ ʙʏ ᴀɴ ᴘᴀʜɴ 🐧' })]
                }).catch(() => {});
            }
        })
        .on('finish', (queue) => {
            this.isPlaying = false;
            if (this.progressInterval) {
                clearInterval(this.progressInterval);
                this.progressInterval = null;
            }
            
            if (queue.songs.length === 0 && !this.is247Mode) {
                const endEmbed = new EmbedBuilder()
                    .setDescription('🎵 𝙽𝚑ạ𝚌 𝙺ế𝚝 𝚃𝚑ú𝚌!')
                    .setColor('#ff0000');
                try {
                    const msg = this.textChannel?.send({ embeds: [endEmbed] });
                    setTimeout(() => msg?.delete().catch(() => {}), 5000);
                } catch {}
                this.startIdleTimeout();
            }
        })
        .on('empty', (channel) => {
            if (!this.is247Mode) {
                this.startIdleTimeout();
            }
        });
}

     formatVideoDuration(duration) {
    if (!duration) return 'Unknown';
    
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return duration;
    
    const hours = parseInt(match[1]) || 0;
    const minutes = parseInt(match[2]) || 0;
    const seconds = parseInt(match[3]) || 0;
    
    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  }
}

const musicPlayer = new MusicPlayer(client);

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (!message.content.startsWith('!')) return;

    const args = message.content.slice(1).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    const voiceChannel = message.member?.voice?.channel;
    const textChannel = message.channel;

    switch (command) {
        case 'play':
        case 'pn': {
            const query = args.join(' ');
            if (!query) {
                return message.reply({ 
                    embeds: [new EmbedBuilder()
                        .setDescription('<:uncheck:1376210480850403510> 𝚅𝚞𝚒 𝙻ò𝚗𝚐 𝙽𝚑ậ𝚙 𝙻𝚒𝚗𝚔 𝙷𝚘ặ𝚌 𝚃ê𝚗 𝙱à𝚒 𝙷á𝚝!')
                        .setColor('#ff0000')
                        .setFooter({ text: '© ᴄᴏᴅᴇ ʙʏ ᴀɴ ᴘᴀʜɴ 🐧' })
                    ] 
                }).catch(() => {});
            }
            if (!voiceChannel) {
                return message.reply({ 
                    embeds: [new EmbedBuilder()
                        .setDescription('<:uncheck:1376210480850403510> 𝙱ạ𝚗 𝙿𝚑ả𝚒 𝚃𝚛𝚘𝚗𝚐 𝙺ê𝚗𝚑 𝚃𝚑𝚘ạ𝚒!')
                        .setColor('#ff0000')
                        .setFooter({ text: '© ᴄᴏᴅᴇ ʙʏ ᴀɴ ᴘᴀʜɴ 🐧' })
                    ] 
                }).catch(() => {});
            }
            await musicPlayer.playSong(query, voiceChannel, textChannel, message.author);
            break;
        }
        case 'skip':
        case 'qb': {
            const count = parseInt(args[0]) || 1;
            await musicPlayer.skipSong(message.author, count);
            break;
        }
        case 'stop':
        case 'dpn': {
            await musicPlayer.leaveVoiceChannel(message.author);
            break;
        }
        case 'pause': 
        case 'dn': {
            await musicPlayer.pauseSong(message.author);
            break;
        }
        case 'resume': 
        case 'ct': {
            await musicPlayer.resumeSong(message.author);
            break;
        }
        case 'seek': {
            const time = args[0];
            if (!time) {
                return message.reply({ 
                    embeds: [new EmbedBuilder()
                        .setDescription('<:uncheck:1376210480850403510> 𝚅𝚞𝚒 𝙻ò𝚗𝚐 𝙽𝚑ậ𝚙 𝚃𝚑ờ𝚒 𝙶𝚒𝚊𝚗 (𝚟𝚒́ 𝚍𝚞̣: 𝟹𝟶 𝚑𝚘𝚊̣̆𝚌 𝟷:𝟹𝟶)!')
                        .setColor('#ff0000')
                        .setFooter({ text: '© ᴄᴏᴅᴇ ʙʏ ᴀɴ ᴘᴀʜɴ 🐧' })
                    ] 
                }).catch(() => {});
            }
            await musicPlayer.seekSong(message.author, time);
            break;
        }
        case 'loop': 
        case 'lln': {
            await musicPlayer.toggleLoop(message.author);
            break;
        }
        case '247': {
            await musicPlayer.toggle247(message.author);
            break;
        }
        case 'queue': 
        case 'hd': {
            const page = parseInt(args[0]) || 1;
            await musicPlayer.showQueue(page, null, message.author);
            break;
        }
        case 'clear': 
        case 'xhd': {   
            await musicPlayer.clearQueue(message.author);
            break;
        }
        case 'remove':
        case 'rm': {
            const position = parseInt(args[0]);
            if (!position || position < 1) {
                return message.reply({ 
                    embeds: [new EmbedBuilder()
                        .setDescription('<:uncheck:1376210480850403510> 𝚅𝚞𝚒 𝙻ò𝚗𝚐 𝙽𝚑ậ𝚙 𝚅ị 𝚃rí 𝙱à𝚒 𝙷á𝚝 𝙷ợ𝚙 𝙻ệ!')
                        .setColor('#ff0000')
                        .setFooter({ text: '© ᴄᴏᴅᴇ ʙʏ ᴀɴ ᴘᴀʜɴ 🐧' })
                    ] 
                }).catch(() => {});
            }
            await musicPlayer.removeSong(message.author, position);
            break;
        }
        case 'shuffle':
        case 'mix': {
            await musicPlayer.shuffleQueue(message.author);
            break;
        }
        case 'np': {
            await musicPlayer.showNowPlaying(message.author);
            break;
        }
        case 'join': 
        case 'jv': {
            if (!voiceChannel) {
                return message.reply({ 
                    embeds: [new EmbedBuilder()
                        .setDescription('<:uncheck:1376210480850403510> 𝙱ạ𝚗 𝙿𝚑ả𝚒 𝚃𝚛𝚘𝚗𝚐 𝙺ê𝚗𝚑 𝚃𝚑𝚘ạ𝚒!')
                        .setColor('#ff0000')
                        .setFooter({ text: '© ᴄᴏᴅᴇ ʙʏ ᴀɴ ᴘᴀʜɴ 🐧' })
                    ] 
                }).catch(() => {});
            }
            await musicPlayer.joinVoiceChannel(voiceChannel, textChannel, message.author);
            break;
        }
        case 'leave': 
        case 'lv': {
            await musicPlayer.leaveVoiceChannel(message.author);
            break;
        }
        case 'help': {
            const embed = new EmbedBuilder()
                .setTitle('🎵 𝙰𝚗𝙿𝚊𝚑𝚗 𝙼𝚞𝚜𝚒𝚌 𝙱𝚘𝚝 - 𝙻ệ𝚗𝚑 𝙷ỗ 𝚃rợ')
                .setDescription('𝙳ướ𝚒 Đâ𝚢 𝙻à 𝙲á𝚌 𝙻ệ𝚗𝚑 𝙲ủ𝚊 𝙱𝚘𝚝:')
                .setColor('#00ff00')
                .addFields( 
                    {
                        name: '🎶 𝙿𝚑á𝚝 𝙽𝚑ạ𝚌:',
                        value: '!play / !pn\n!np\n!seek [𝚝𝚒𝚖𝚎]',
                        inline: true
                    },
                    {
                        name: '⏭️ 𝙳𝚒 𝙲𝚑𝚞𝚢ể𝚗 𝙱à𝚒:',
                        value: '!skip / !qb\n!pause / !dn\n!resume / !ct',
                        inline: true
                    },
                    {
                        name: '🔁 𝙲𝚑ế 𝙳ộ:',
                        value: '!loop / !lln\n!247\n!shuffle / !mix',
                        inline: true
                    },
                    {
                        name: '📋 𝚀.𝙻ý 𝙳𝚊𝚗𝚑 𝚂á𝚌𝚑:',
                        value: '!queue / !hd\n!clear / !xhd\n!remove / !rm [𝚟𝚒̣ 𝚝𝚛𝚒́]',
                        inline: true
                    },
                    {
                        name: '🔊 𝙺ê𝚗𝚑 𝚃𝚑𝚘ạ𝚒:',
                        value: '!join / !jv\n!stop / !dpn\n!leave / !lv',
                        inline: true
                    }
                )
                .setFooter({ text: '© ᴄᴏᴅᴇ ʙʏ ᴀɴ ᴘᴀʜɴ 🐧' })
                .setTimestamp();
            await message.reply({ embeds: [embed] }).catch(() => {});
            break;
        }
        default: {
            // Hiển thị gợi ý khi lệnh không tồn tại
            const embed = new EmbedBuilder()
                .setDescription(`<:uncheck:1376210480850403510> 𝙻ệ𝚗𝚑 "${command}" 𝙺𝚑ô𝚗𝚐 𝚃ồ𝚗 𝚃ạ𝚒!\n\n𝚂ử 𝙳ụ𝚗𝚐 **!help** Để 𝚇𝚎𝚖 𝙲á𝚌 𝙻ệ𝚗𝚑 𝙷ợ𝚙 𝙻ệ.`)
                .setColor('#ff0000')
                .setFooter({ text: '© ᴄᴏᴅᴇ ʙʏ ᴀɴ ᴘᴀʜɴ 🐧' });
            await message.reply({ embeds: [embed] }).catch(() => {});
            break;
        }
    }
});

process.on('unhandledRejection', (error) => {
    console.error('Unhandled promise rejection:', error);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
});








/* Code này test thôi không dùng thực tế lắm
const config = require("./config.json");
const app = express();
app.use(bodyParser.json());

function computeSignature(dataObj, checksumKey) {
  const keys = Object.keys(dataObj).sort();
  const parts = keys.map(k => {
    let v = dataObj[k];
    if (v === null || v === undefined) v = "";
    if (typeof v === "object") v = JSON.stringify(v);
    return `${k}=${v}`;
  });
  const dataString = parts.join("&");
  return crypto.createHmac("sha256", checksumKey).update(dataString).digest("hex");
}

app.post("/webhook/payos", async (req, res) => {
  try {
    const body = req.body;
    if (!body || !body.data || !body.signature) {
      return res.status(400).send("Bad request");
    }

    const data = body.data;
    const logChannel = await client.channels.fetch(config.logChannelId);
    const sigFromPayOS = body.signature;

    const expectedSig = computeSignature(data, config.payosChecksumKey);
    if (expectedSig !== sigFromPayOS) {
      console.log("❌ Webhook chữ ký sai:", expectedSig, sigFromPayOS);
      return res.status(400).send("Invalid signature");
    }
    
    const embed = new EmbedBuilder()
      .setTitle("💸 THANH TOÁN THÀNH CÔNG 💸")
      .setDescription("🎉 Cảm ơn bạn đã nạp tiền vào **server Minecraft**!")
      .setColor(0x00ff9d)
      .addFields(
        { name: "👤 Người chơi", value: `\`${data.description || "Không rõ"}\``, inline: true },
        { name: "💰 Số tiền", value: `\`${data.amount.toLocaleString()} VNĐ\``, inline: true },
        { name: "🏦 Ngân hàng", value: `\`${data.accountNumber || "Không xác định"}\``, inline: true },
        { name: "🧾 Mã giao dịch", value: `\`${data.transactionCode || "N/A"}\``, inline: true },
        { name: "🕒 Thời gian", value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false }
      )
      .setFooter({ text: "AnPahn" })
      .setTimestamp();
      
    if (logChannel) {
      await logChannel.send({ embeds: [embed] });
    }

    console.log(`✅ Giao dịch ${data.transactionCode} được log.`);
    res.status(200).send("OK");
  } catch (e) {
    console.error("Lỗi xử lý webhook:", e);
    res.status(500).send("Error");
  }
});

app.listen(3000, () => {
  console.log("🚀 http://localhost:3000/webhook/payos");
});

const https = require("https");
const http = require("http");
const url = require("url");

const WEBHOOK_URL = "http://localhost:3000/webhook/payos"; 
const CHECKSUM_KEY = "cb9159ace4c611af67f68d3a81e6a6cc655fd88b331370b9e82b67a2f7ebf726"; // đổi thành checksum key thật (hoặc test key)
const useHttps = WEBHOOK_URL.startsWith("https://");

function buildDataString(obj) {
  const keys = Object.keys(obj).sort();
  const parts = keys.map(k => {
    let v = obj[k];
    if (v === null || v === undefined) v = "";
    if (typeof v === "object") v = JSON.stringify(v);
    return `${k}=${v}`;
  });
  return parts.join("&");
}

function buildSignature(dataObj) {
  const dataString = buildDataString(dataObj);
  return crypto.createHmac("sha256", CHECKSUM_KEY).update(dataString).digest("hex");
}

function sendWebhook(bodyObj) {
  const parsed = url.parse(WEBHOOK_URL);
  const bodyStr = JSON.stringify(bodyObj);

  const opts = {
    hostname: parsed.hostname,
    port: parsed.port || (parsed.protocol === "https:" ? 443 : 80),
    path: parsed.path,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(bodyStr),
    },
  };

  const req = (parsed.protocol === "https:" ? https : http).request(opts, (res) => {
    let data = "";
    res.on("data", (chunk) => (data += chunk));
    res.on("end", () => {
      console.log("Response status:", res.statusCode);
      console.log("Response body:", data);
    });
  });

  req.on("error", (err) => {
    console.error("Request error:", err);
  });

  req.write(bodyStr);
  req.end();
}

const now = new Date();
const data = {
  orderCode: "TEST-ORD-001",
  amount: 50000,
  description: "Player:AnPahn",
  accountNumber: "123456789",
  transactionCode: "TX-TEST-0001",
  transactionDateTime: now.toISOString(),
  currency: "VND"
};

const signature = buildSignature(data);

const webhookPayload = {
  code: "00",
  desc: "OK",
  success: true,
  data: data,
  signature: signature
};

console.log("Sending webhook payload:");
console.log(JSON.stringify(webhookPayload, null, 2));
sendWebhook(webhookPayload);
*/








//___Logins Bot Discord
client.login(process.env.TOKEN);

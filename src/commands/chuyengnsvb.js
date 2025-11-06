const { SlashCommandBuilder } = require('discord.js');
const { 
  joinVoiceChannel, 
  createAudioPlayer, 
  createAudioResource, 
  AudioPlayerStatus, 
  VoiceConnectionStatus, 
  entersState 
} = require('@discordjs/voice');
const gTTS = require('gtts');
const { Readable } = require('stream');

const voiceConnections = new Map();
const userCooldowns = new Map();


const MAX_TEXT_LENGTH = 200;
const COOLDOWN_TIME = 3000;
const CONNECTION_TIMEOUT = 15000;
const DISCONNECT_TIMEOUT = 5000;
const CLEANUP_DELAY = 500;

const cleanupConnection = (guildId) => {
  const connection = voiceConnections.get(guildId);
  if (connection) {
    try {
      connection.destroy();
    } catch (error) {
      console.error(`Lỗi khi cleanup connection cho guild ${guildId}:`, error);
    }
    voiceConnections.delete(guildId);
  }
};

const isOnCooldown = (userId, guildId) => {
  const cooldownKey = `${userId}-${guildId}`;
  const cooldownEnd = userCooldowns.get(cooldownKey);
  
  if (cooldownEnd && Date.now() < cooldownEnd) {
    return Math.ceil((cooldownEnd - Date.now()) / 1000);
  }
  return false;
};

const setCooldown = (userId, guildId) => {
  const cooldownKey = `${userId}-${guildId}`;
  userCooldowns.set(cooldownKey, Date.now() + COOLDOWN_TIME);
  setTimeout(() => userCooldowns.delete(cooldownKey), COOLDOWN_TIME);
};

const validatePermissions = (voiceChannel, clientUser) => {
  const permissions = voiceChannel.permissionsFor(clientUser);
  return permissions.has('Connect') && permissions.has('Speak');
};

const createTTSStream = (text, lang = 'vi', slow = false) => {
  return new Promise((resolve, reject) => {
    try {
      const gtts = new gTTS(text, lang, slow);
      const audioStream = new Readable().wrap(gtts.stream());
      resolve(audioStream);
    } catch (error) {
      reject(new Error(`Tạo TTS stream thất bại: ${error.message}`));
    }
  });
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('noitext')
    .setDescription('Chuyển văn bản thành giọng nói (âm thầm)')
    .addStringOption(option =>
      option.setName('văn_bản')
        .setDescription('Văn bản cần bot nói (tối đa 200 ký tự)')
        .setRequired(true)
        .setMaxLength(MAX_TEXT_LENGTH)
    )
    .addStringOption(option =>
      option.setName('ngôn_ngữ')
        .setDescription('Ngôn ngữ của văn bản')
        .addChoices(
          { name: '🇻🇳 Tiếng Việt', value: 'vi' },
          { name: '🇺🇸 English', value: 'en' },
          { name: '🇯🇵 日本語 (Nhật)', value: 'ja' },
          { name: '🇰🇷 한국어 (Hàn)', value: 'ko' },
          { name: '🇫🇷 Français (Pháp)', value: 'fr' },
          { name: '🇨🇳 中文 (Trung)', value: 'zh' }
        )
    )
    .addBooleanOption(option =>
      option.setName('chậm')
        .setDescription('Phát giọng nói chậm hơn?')
    ),

  async execute(interaction) {

    const remainingCooldown = isOnCooldown(interaction.user.id, interaction.guild.id);
    if (remainingCooldown) {
      return await interaction.reply({
        content: `⏳ Vui lòng chờ ${remainingCooldown} giây nữa!`,
        ephemeral: true
      });
    }

    const text = interaction.options.getString('văn_bản');
    const lang = interaction.options.getString('ngôn_ngữ') || 'vi';
    const slow = interaction.options.getBoolean('chậm') || false;
    const voiceChannel = interaction.member.voice.channel;

    if (!voiceChannel) {
      return await interaction.reply({
        content: '🔇 Bạn cần tham gia voice channel trước!',
        ephemeral: true
      });
    }

    if (!validatePermissions(voiceChannel, interaction.client.user)) {
      return await interaction.reply({
        content: '🔐 Bot cần quyền **Kết nối** và **Nói**!',
        ephemeral: true
      });
    }

    await interaction.reply({ content: '🎙️ Đang xử lý...', ephemeral: true });
    
    setTimeout(async () => {
      try {
        await interaction.deleteReply();
      } catch (error) {

      }
    }, 1000);

    try {

      cleanupConnection(interaction.guild.id);

      const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: interaction.guild.id,
        adapterCreator: voiceChannel.guild.voiceAdapterCreator,
      });

      voiceConnections.set(interaction.guild.id, connection);

      // Chờ kết nối ready
      await entersState(connection, VoiceConnectionStatus.Ready, CONNECTION_TIMEOUT);

      // Tạo TTS stream
      const audioStream = await createTTSStream(text, lang, slow);
      const resource = createAudioResource(audioStream);
      const player = createAudioPlayer();

      player.on(AudioPlayerStatus.Idle, () => {
        setTimeout(() => {
          cleanupConnection(interaction.guild.id);
        }, CLEANUP_DELAY);
      });

      player.on('error', (error) => {
        console.error('Lỗi AudioPlayer:', error);
        cleanupConnection(interaction.guild.id);
      });

      connection.on(VoiceConnectionStatus.Disconnected, async () => {
        try {
          await Promise.race([
            entersState(connection, VoiceConnectionStatus.Signalling, DISCONNECT_TIMEOUT),
            entersState(connection, VoiceConnectionStatus.Connecting, DISCONNECT_TIMEOUT),
          ]);
        } catch {
          cleanupConnection(interaction.guild.id);
        }
      });

      connection.on('error', (error) => {
        console.error('Lỗi VoiceConnection:', error);
        cleanupConnection(interaction.guild.id);
      });

      connection.subscribe(player);
      player.play(resource);

      setCooldown(interaction.user.id, interaction.guild.id);

    } catch (error) {
      console.error('Lỗi TTS:', error);
      
      cleanupConnection(interaction.guild.id);
      
      try {
        await interaction.followUp({
          content: '❌ Có lỗi xảy ra khi xử lý văn bản!',
          ephemeral: true
        });
      } catch (followUpError) {

      }
    }
  }
};
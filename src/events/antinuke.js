const {
  AuditLogEvent,
  Events,
  ChannelType,
  PermissionsBitField,
  EmbedBuilder
} = require("discord.js");

/**
 * AntiNuke System
 * @param {import("discord.js").Client} client
 * @param {Object} config
 */
module.exports = function antiNuke(client, config) {
  // Structure: counts[guildId][userId][action] = [timestamps...]
  const counts = new Map();

  function getKey(guildId) {
    if (!counts.has(guildId)) counts.set(guildId, new Map());
    return counts.get(guildId);
  }

  function pushAction(guildId, userId, action, windowMs) {
    const g = getKey(guildId);
    if (!g.has(userId)) g.set(userId, new Map());
    const m = g.get(userId);
    if (!m.has(action)) m.set(action, []);
    const arr = m.get(action);
    const now = Date.now();
    arr.push(now);
    while (arr.length && arr[0] < now - windowMs) arr.shift();
    return arr.length;
  }

  async function punish(guild, executor, reason) {
    try {
      const member = await guild.members.fetch(executor.id).catch(() => null);
      if (!member) {
        if (config.PunishAction === "ban") {
          await guild.bans.create(executor.id, { reason: `AntiNuke: ${reason}` }).catch(() => {});
        }
        return;
      }

      if (config.PunishAction === "strip_roles") {
        const keep = new Set(config.StripRolesKeep || []);
        const newRoles = member.roles.cache.filter(r => keep.has(r.id));
        await member.roles.set(newRoles, `AntiNuke: ${reason}`).catch(async err => {
          if (config.AutoBanIfStripFails) {
            await guild.bans.create(executor.id, { reason: `AntiNuke (strip failed): ${reason}` }).catch(() => {});
          }
        });
      } else if (config.PunishAction === "ban") {
        await guild.bans.create(executor.id, { reason: `AntiNuke: ${reason}` }).catch(() => {});
      } else if (config.PunishAction === "kick") {
        await member.kick(`AntiNuke: ${reason}`).catch(() => {});
      } else if (config.PunishAction === "timeout") {
        await member.timeout(24 * 60 * 60 * 1000, `AntiNuke: ${reason}`).catch(() => {});
      }
    } catch (e) {
      console.error("Punish error:", e);
    }
  }

  function sendLog(guild, executor, actionKey, count, limit, reason) {
    const logChannel = guild.channels.cache.get(config.LogChannelID);
    if (!logChannel) return;

    const embed = new EmbedBuilder()
      .setTitle("🚨 AntiNuke Alert")
      .setColor("Red")
      .addFields(
        { name: "Người thực hiện", value: `${executor.tag} (\`${executor.id}\`)`, inline: false },
        { name: "Hành động", value: actionKey, inline: true },
        { name: "Số lần", value: `${count}/${limit}`, inline: true },
        { name: "Lý do", value: reason, inline: false }
      )
      .setTimestamp();

    logChannel.send({ embeds: [embed] }).catch(() => {});
  }

  async function handleAction(guild, fetchType, actionKey, limitConfig, rollbackFn) {
    try {
      const fetched = await guild.fetchAuditLogs({ limit: 1, type: fetchType });
      const entry = fetched.entries.first();
      if (!entry) return;
      const { executor } = entry;
      if (!executor) return;
      if (config.AdminIDs.includes(executor.id)) return;

      const count = pushAction(guild.id, executor.id, actionKey, limitConfig.windowMs);
      const reason = `${actionKey} vượt giới hạn (${count} >= ${limitConfig.limit})`;

      sendLog(guild, executor, actionKey, count, limitConfig.limit, "Theo dõi hành động");

      if (count >= limitConfig.limit) {
        await punish(guild, executor, reason);

        if (rollbackFn) {
          try {
            await rollbackFn(entry, guild);
          } catch (err) {
            console.error("Rollback failed:", err);
          }
        }

        sendLog(guild, executor, actionKey, count, limitConfig.limit, reason);
      }
    } catch (err) {
      console.error(`handleAction ${actionKey} error:`, err);
    }
  }

  // Rollback helpers
  async function rollbackChannelDelete(entry, guild) {
    if (!config.RestoreDeletedChannels) return;
    const channelName = entry.target?.name || "restored-channel";
    const channelType = entry.target?.type ?? ChannelType.GuildText;
    await guild.channels.create({
      name: channelName,
      type: channelType,
      reason: "AntiNuke: Restore channel"
    }).catch(() => {});
  }

  async function rollbackRoleDelete(entry, guild) {
    if (!config.RestoreDeletedRoles) return;
    const deletedRole = entry.target;
    if (!deletedRole) return;
    await guild.roles.create({
      name: deletedRole.name ?? "restored-role",
      permissions: deletedRole.permissions ?? 0,
      reason: "AntiNuke: Restore role"
    }).catch(() => {});
  }

  // Events
  client.on(Events.ChannelDelete, ch => {
    handleAction(ch.guild, AuditLogEvent.ChannelDelete, "channelDelete", config.ActionLimits.channelDelete, rollbackChannelDelete);
  });

  client.on(Events.ChannelCreate, ch => {
    handleAction(ch.guild, AuditLogEvent.ChannelCreate, "channelCreate", config.ActionLimits.channelCreate, null);
  });

  client.on(Events.RoleDelete, role => {
    handleAction(role.guild, AuditLogEvent.RoleDelete, "roleDelete", config.ActionLimits.roleDelete, rollbackRoleDelete);
  });

  client.on(Events.RoleCreate, role => {
    handleAction(role.guild, AuditLogEvent.RoleCreate, "roleCreate", config.ActionLimits.roleCreate, null);
  });

  client.on(Events.GuildBanAdd, (guild, user) => {
    handleAction(guild, AuditLogEvent.MemberBanAdd, "guildBanAdd", config.ActionLimits.guildBanAdd, null);
  });

  client.on(Events.GuildMemberRemove, member => {
    handleAction(member.guild, AuditLogEvent.MemberKick, "memberKick", config.ActionLimits.memberKick, null);
  });

  client.on(Events.GuildEmojisUpdate, (guild, oldEmojis, newEmojis) => {
    if (oldEmojis.size > newEmojis.size) {
      handleAction(guild, AuditLogEvent.EmojiDelete, "emojiDelete", config.ActionLimits.emojiDelete, null);
    }
  });

  client.on(Events.StickerDelete, sticker => {
    handleAction(sticker.guild, AuditLogEvent.StickerDelete, "stickerDelete", config.ActionLimits.stickerDelete, null);
  });

  setInterval(() => {
    const now = Date.now();
    for (const [guildId, gm] of counts.entries()) {
      for (const [userId, actions] of gm.entries()) {
        for (const [action, arr] of actions.entries()) {
          const maxWindow = Math.max(...Object.values(config.ActionLimits).map(x => x.windowMs));
          while (arr.length && arr[0] < now - maxWindow) arr.shift();
          if (!arr.length) actions.delete(action);
        }
        if (!actions.size) gm.delete(userId);
      }
      if (!gm.size) counts.delete(guildId);
    }
  }, 60000);
};

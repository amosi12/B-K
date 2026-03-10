const { cmd } = require('../command');
const config = require("../config");

// Store warnings and settings
global.warnings = global.warnings || {};
const linkSettings = {
enabled: config.ANTI_LINK === 'true',
whitelist: [],
maxWarnings: 3,
deleteMessage: true,
warnMessage: true,
removeUser: true
};

cmd({
pattern: 'antilink',
desc: 'Toggle anti-link feature',
category: 'group',
use: '<on/off>'
}, async (conn, m, _, { isGroup, isBotAdmins, isAdmins, reply }) => {

if (!isGroup) return reply('❌ This command only works in groups');
if (!isAdmins) return reply('❌ Only group admins can use this command');
if (!isBotAdmins) return reply('❌ I must be admin to control links');

const action = m.text?.toLowerCase()?.split(' ')[1];

if (action === 'on') {
    linkSettings.enabled = true;
    return reply('✅ Anti-link protection enabled');
} 
else if (action === 'off') {
    linkSettings.enabled = false;
    return reply('❌ Anti-link protection disabled');
} 
else {
    return reply(`Current status: ${linkSettings.enabled ? '✅ ON' : '❌ OFF'}\nUsage: .antilink on / off`);
}

});

cmd({
on: 'text'
}, async (conn, m, _, { from, text, sender, isGroup, isAdmins, isBotAdmins }) => {

try {

    if (!isGroup) return;
    if (!linkSettings.enabled) return;
    if (isAdmins) return;
    if (!isBotAdmins) return;

    const messageText = text || m.body || "";

    const linkPatterns = [
        /https?:\/\/[^\s]+/gi,
        /www\.[^\s]+/gi,
        /chat\.whatsapp\.com\/\S+/gi,
        /wa\.me\/\S+/gi,
        /t\.me\/\S+/gi,
        /youtu\.?be(?:\.com)?\/\S+/gi,
        /instagram\.com\/\S+/gi,
        /facebook\.com\/\S+/gi,
        /twitter\.com\/\S+/gi,
        /x\.com\/\S+/gi,
        /tiktok\.com\/\S+/gi,
        /discord\.gg\/\S+/gi
    ];

    const isWhitelisted = linkSettings.whitelist.some(domain =>
        messageText.toLowerCase().includes(domain.toLowerCase())
    );

    const containsLink = !isWhitelisted &&
        linkPatterns.some(pattern => pattern.test(messageText));

    if (!containsLink) return;

    console.log(`[ANTI-LINK] Link detected from ${sender}`);

    // Delete message
    if (linkSettings.deleteMessage) {
        try {
            await conn.sendMessage(from, { delete: m.key });
        } catch (err) {
            console.log("[ANTI-LINK] Failed to delete message");
        }
    }

    // Add warning
    global.warnings[sender] = (global.warnings[sender] || 0) + 1;
    const warningCount = global.warnings[sender];

    if (linkSettings.warnMessage) {

        await conn.sendMessage(from, {
            text:
            `⚠️ *LINK DETECTED*\n\n` +
            `👤 User: @${sender.split('@')[0]}\n` +
            `⚠️ Warning: ${warningCount}/${linkSettings.maxWarnings}\n\n` +
            `🚫 Links are not allowed in this group`,
            mentions: [sender]
        }, { quoted: m });

    }

    if (linkSettings.removeUser && warningCount >= linkSettings.maxWarnings) {

        try {

            await conn.groupParticipantsUpdate(from, [sender], "remove");

            await conn.sendMessage(from, {
                text: `🚫 @${sender.split('@')[0]} removed for sending links`,
                mentions: [sender]
            });

            delete global.warnings[sender];

        } catch (error) {

            await conn.sendMessage(from, {
                text: `⚠️ Failed to remove @${sender.split('@')[0]} (check admin permissions)`,
                mentions: [sender]
            });

        }

    }

} catch (error) {

    console.error("[ANTI-LINK ERROR]", error);

}

});

// Reset warnings every 24 hours
setInterval(() => {
global.warnings = {};
console.log('[ANTI-LINK] Warnings reset');
}, 24 * 60 * 60 * 1000);

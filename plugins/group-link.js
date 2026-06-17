const { cmd, commands } = require('../command');
const config = require('../config');
const prefix = config.PREFIX;
const fs = require('fs');
const { getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, sleep, fetchJson } = require('../lib/functions2');
const { writeFileSync } = require('fs');
const path = require('path');

// Contact message for verified context
const quotedContact = {
  key: {
    fromMe: false,
    participant: `0@s.whatsapp.net`,
    remoteJid: "status@broadcast"
  },
  message: {
    contactMessage: {
      displayName: "B.M.B VERIFIED ✅",
      vcard: "BEGIN:VCARD\nVERSION:3.0\nFN:B.M.B VERIFIED ✅\nORG:BMB-TECH BOT;\nTEL;type=CELL;type=VOICE;waid=255767862457:+255 767 862457\nEND:VCARD"
    }
  }
};

cmd({
  pattern: "invite",
  alias: ["glink", "link"],
  desc: "Get group invite link.",
  category: "group",
  filename: __filename,
},
async (conn, mek, m, { from, quoted, body, args, q, isGroup, sender, isAdmins, isBotAdmins, reply }) => {
  try {
    if (!isGroup) return reply("❌ This feature is only for *groups*.");

    if (!isBotAdmins) return reply("❌ Bot needs to be an admin.");
    if (!isAdmins) return reply("❌ You must be an admin to use this command.");

    const metadata = await conn.groupMetadata(from);

    const code = await conn.groupInviteCode(from);
    if (!code) return reply("❌ Failed to get the group invite link.");

    const link = `https://chat.whatsapp.com/${code}`;
    const groupName = metadata.subject;

    const messageText = `╭───〔 *GROUP INVITE LINK* 〕───⬣
│
│ *📛 Group:* ${groupName}
│ *🔗 Link:* 
│ ${link}
│
╰━━━━━━━━━━━━━━━━━━━━⬣`;

    await conn.sendMessage(from, {
      text: messageText,
      contextInfo: {
        mentionedJid: [sender],
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: '120363382023564830@newsletter',
          newsletterName: '🌐𝗡𝗢𝗩𝗔-𝗫𝗠𝗗🌐',
          serverMessageId: 143
        }
      }
    }, { quoted: quotedContact });

  } catch (error) {
    console.error("Error in invite command:", error);
    reply(`❌ An error occurred: ${error.message || "Unknown error"}`);
  }
});

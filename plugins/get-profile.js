const { cmd, commands } = require('../command');
const config = require('../config');
const fs = require('fs');

// VCard Contact
const quotedContact = {
  key: {
    fromMe: false,
    participant: `0@s.whatsapp.net`,
    remoteJid: "status@broadcast"
  },
  message: {
    contactMessage: {
      displayName: "B.M.B VERIFIED ✅",
      vcard: `BEGIN:VCARD
VERSION:3.0
FN:B.M.B VERIFIED ✅
ORG:BMB-TECH BOT;
TEL;type=CELL;type=VOICE;waid=${config.OWNER_NUMBER || '255767862457'}:+${config.OWNER_NUMBER || '255767862457'}
END:VCARD`
    }
  }
};

// Context ya newsletter
const contextInfo = {
  forwardingScore: 999,
  isForwarded: true,
  forwardedNewsletterMessageInfo: {
    newsletterJid: config.NEWSLETTER_JID || "120363382023564830@newsletter",
    newsletterName: config.NEWSLETTER_NAME || "𝙱.𝙼.𝙱-𝚇𝙼𝙳",
    serverMessageId: 1
  }
};

// SET PROFILE PICTURE
cmd({
  pattern: "setpp",
  alias: ["setprofile", "profilepic"],
  desc: "Change bot profile picture",
  category: "main",
  react: "📸",
  filename: __filename
},
async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber, botNumberJid, pushName, reply }) => {
  try {
    const userJid = sender;
    const botJid = botNumberJid;
    const ownerNumber = config.OWNER_NUMBER || 'default_owner_number';
    const isOwner = userJid === `${ownerNumber}@s.whatsapp.net` || userJid === botJid;
    const superUser = config.SUPER_USER?.includes(senderNumber) || false;

    if (!isOwner && !superUser) {
      return reply("🚫 *Only the bot owner can change the profile picture!*");
    }

    // Check if there's a quoted message
    if (!m.quoted) {
      return reply("📸 *Please reply to an image with .setpp to set it as your profile picture!*");
    }

    // Get the image message from quoted message
    const quotedMsg = m.quoted;
    let imageMessage = null;
    
    if (quotedMsg.message) {
      if (quotedMsg.message.imageMessage) {
        imageMessage = quotedMsg.message.imageMessage;
      } else if (quotedMsg.message.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage) {
        imageMessage = quotedMsg.message.extendedTextMessage.contextInfo.quotedMessage.imageMessage;
      }
    }

    if (!imageMessage) {
      return reply("🚫 *The replied message isn't an image!*");
    }

    // Download and update profile picture
    const mediaPath = await conn.downloadAndSaveMediaMessage(imageMessage);
    await conn.updateProfilePicture(userJid, { url: mediaPath });
    
    // Clean up temp file
    fs.unlink(mediaPath, err => {
      if (err) console.error("Cleanup failed:", err);
    });

    // Success message
    const successMsg = `┏━━━━━━━━━━━━━━━━━━
┃ ✅ *Profile Picture Updated!*
┃ 👤 *User:* @${senderNumber}
┃ 🤖 *Bot:* ${config.BOT_NAME || 'BMB BOT'}
┃ 🔧 *Status:* Success
┗━━━━━━━━━━━━━━━━━`;

    await reply(successMsg);

  } catch (error) {
    console.error("Error updating profile picture:", error);
    await reply(`❌ *Failed to update profile picture:* ${error.message}`);
  }
});

// GET PROFILE PICTURE
cmd({
  pattern: "getpp",
  alias: ["getprofile", "profile"],
  desc: "Get user profile picture",
  category: "main",
  react: "📷",
  filename: __filename
},
async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber, botNumberJid, pushName, reply }) => {
  try {
    // Check if there's a quoted message
    if (!m.quoted) {
      return reply("❌ *Reply to someone's message to get their profile pic!*");
    }

    const quotedMsg = m.quoted;
    let targetUser = null;
    
    // Get the user who sent the quoted message
    if (quotedMsg.key && quotedMsg.key.participant) {
      targetUser = quotedMsg.key.participant;
    } else if (quotedMsg.participant) {
      targetUser = quotedMsg.participant;
    } else {
      targetUser = sender; // fallback to sender
    }

    // Loading message
    await reply(`🔁 *Loading profile picture...*`);

    let ppuser;
    try {
      ppuser = await conn.profilePictureUrl(targetUser, 'image');
    } catch (error) {
      // If no profile pic, try to get bot's profile pic
      try {
        ppuser = await conn.profilePictureUrl(botNumberJid, 'image');
        await reply(`🚫 *User has no profile picture or it's locked!*\n🖼️ *Showing bot profile instead...*`);
      } catch (e) {
        return reply("❌ *Could not fetch any profile picture!*");
      }
    }

    // Format caption
    const captionBox = `┏━━━━━━━━━━━━━━━━━━
┃ 🖼️ *Profile Picture*
┃ 👤 *User:* @${targetUser.split('@')[0]}
┃ 🤖 *Bot:* ${config.BOT_NAME || 'BMB BOT'}
┗━━━━━━━━━━━━━━━━━`;

    // Send the profile picture
    await conn.sendMessage(from, {
      image: { url: ppuser },
      caption: captionBox,
      mentions: [targetUser],
      contextInfo: contextInfo
    }, { quoted: quotedContact });

  } catch (error) {
    console.error("Error in getpp:", error);
    await reply(`❌ *Error while fetching profile picture:* ${error.message}`);
  }
});

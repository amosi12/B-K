const { cmd, commands } = require('../command');
const config = require('../config');
const fs = require('fs');

// Quoted Contact Message
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

// Newsletter Context
const newsletterJid = config.NEWSLETTER_JID || "120363382023564830@newsletter";
const newsletterName = config.NEWSLETTER_NAME || "𝘽.𝙈.𝘽-𝙓𝙈𝘿";

// ============================================
// COMMAND: SET PROFILE PICTURE
// ============================================
cmd({
  pattern: "setpp",
  alias: ["setprofile", "setpic", "setprofilepic"],
  desc: "Change bot profile picture (reply to image)",
  category: "main",
  react: "📸",
  filename: __filename
}, async (conn, mek, m, { from, quoted, reply, isOwner, sender }) => {
  try {
    // Check if user is owner
    if (!isOwner) {
      return reply("🚫 *Only the owner can change the profile picture!*");
    }

    // Check if replied to a message
    if (!quoted) {
      return reply("📸 *Please reply to an image with .setpp to set it as your profile picture!*");
    }

    // Get image from quoted message
    const imageMessage = 
      quoted.message?.imageMessage || 
      quoted.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage ||
      quoted.imageMessage;

    if (!imageMessage) {
      return reply("🚫 *The replied message isn't an image!*");
    }

    // Download and set profile picture
    const mediaPath = await conn.downloadAndSaveMediaMessage(quoted);
    await conn.updateProfilePicture(conn.user.jid, { url: mediaPath });
    
    // Clean up temp file
    fs.unlink(mediaPath, err => {
      if (err) console.error("Cleanup failed:", err);
    });

    // Success message
    const successMsg = `┏━━━━━━━━━━━━━━━━━━
┃ ✅ *Profile Picture Updated!*
┃ 👤 *User:* @${sender.split('@')[0]}
┃ 🤖 *Bot:* ${config.BOT_NAME || 'BMB-XMD'}
┃ 🔧 *Status:* Success
┗━━━━━━━━━━━━━━━━━`;

    await reply(successMsg, { mentions: [sender] });

  } catch (error) {
    console.error("Error in setpp:", error);
    await reply(`❌ *Failed to update profile picture:* ${error.message}`);
  }
});

// ============================================
// COMMAND: GET PROFILE PICTURE
// ============================================
cmd({
  pattern: "getpp",
  alias: ["profile", "pp", "getprofile", "profilepic"],
  desc: "Get profile picture of a user",
  category: "main",
  react: "📷",
  filename: __filename
}, async (conn, mek, m, { from, quoted, reply, sender, mentionedJid }) => {
  try {
    // Determine target user
    let targetUser = sender;
    
    if (quoted) {
      targetUser = quoted.sender || quoted.key?.participant;
    } else if (mentionedJid && mentionedJid[0]) {
      targetUser = mentionedJid[0];
    }

    // Loading message
    await reply(`🔁 *Loading profile picture for @${targetUser.split('@')[0]}...*`, 
      { mentions: [targetUser] });

    try {
      // Get user's profile picture URL
      let ppUrl = await conn.profilePictureUrl(targetUser, 'image');
      
      // Caption with box style
      const captionBox = `┏━━━━━━━━━━━━━━━━━━
┃ 🖼️ *Profile Picture*
┃ 👤 *User:* @${targetUser.split('@')[0]}
┃ 🤖 *Bot:* ${config.BOT_NAME || 'BMB-XMD'}
┗━━━━━━━━━━━━━━━━━`;

      // Send the profile picture
      await conn.sendMessage(from, {
        image: { url: ppUrl },
        caption: captionBox,
        mentions: [targetUser],
        contextInfo: {
          forwardingScore: 999,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: newsletterJid,
            newsletterName: newsletterName,
            serverMessageId: 143
          }
        }
      }, { quoted: quotedContact });

    } catch (ppError) {
      // User has no profile picture
      await reply(`┏━━━━━━━━━━━━━━━━━━
┃ 🚫 *Profile Picture Not Found!*
┃ 👤 *User:* @${targetUser.split('@')[0]}
┃ 🤖 *Bot:* ${config.BOT_NAME || 'BMB-XMD'}
┃ 📝 *Note:* User has no profile picture
┗━━━━━━━━━━━━━━━━━`, { mentions: [targetUser] });
    }

  } catch (error) {
    console.error("Error in getpp:", error);
    await reply(`❌ *Error while fetching profile picture:* ${error.message}`);
  }
});

// ============================================
// COMMAND: DELETE PROFILE PICTURE
// ============================================
cmd({
  pattern: "delpp",
  alias: ["removepp", "deletepic", "removeprofile"],
  desc: "Remove bot profile picture",
  category: "main",
  react: "🗑️",
  filename: __filename
}, async (conn, mek, m, { from, reply, isOwner }) => {
  try {
    // Check if user is owner
    if (!isOwner) {
      return reply("🚫 *Only the owner can delete the profile picture!*");
    }

    // Remove profile picture
    await conn.removeProfilePicture(conn.user.jid);
    
    // Success message
    await reply(`┏━━━━━━━━━━━━━━━━━━
┃ ✅ *Profile Picture Removed!*
┃ 🤖 *Bot:* ${config.BOT_NAME || 'BMB-XMD'}
┃ 🔧 *Status:* Success
┗━━━━━━━━━━━━━━━━━`);

  } catch (error) {
    console.error("Error in delpp:", error);
    await reply(`❌ *Failed to delete profile picture:* ${error.message}`);
  }
});

// ============================================
// COMMAND: VIEW MY PROFILE PICTURE
// ============================================
cmd({
  pattern: "mypp",
  alias: ["myprofile", "mypic"],
  desc: "View your own profile picture",
  category: "main",
  react: "👤",
  filename: __filename
}, async (conn, mek, m, { from, reply, sender }) => {
  try {
    await reply(`🔁 *Loading your profile picture...*`);

    try {
      let ppUrl = await conn.profilePictureUrl(sender, 'image');
      
      const captionBox = `┏━━━━━━━━━━━━━━━━━━
┃ 🖼️ *Your Profile Picture*
┃ 👤 *User:* @${sender.split('@')[0]}
┃ 🤖 *Bot:* ${config.BOT_NAME || 'BMB-XMD'}
┗━━━━━━━━━━━━━━━━━`;

      await conn.sendMessage(from, {
        image: { url: ppUrl },
        caption: captionBox,
        mentions: [sender],
        contextInfo: {
          forwardingScore: 999,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: newsletterJid,
            newsletterName: newsletterName,
            serverMessageId: 143
          }
        }
      }, { quoted: quotedContact });

    } catch (ppError) {
      await reply(`┏━━━━━━━━━━━━━━━━━━
┃ 🚫 *You don't have a profile picture!*
┃ 👤 *User:* @${sender.split('@')[0]}
┃ 🤖 *Bot:* ${config.BOT_NAME || 'BMB-XMD'}
┗━━━━━━━━━━━━━━━━━`, { mentions: [sender] });
    }

  } catch (error) {
    console.error("Error in mypp:", error);
    await reply(`❌ *Error:* ${error.message}`);
  }
});

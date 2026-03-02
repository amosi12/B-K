const { cmd } = require("../command");
const traduire = require("../lib/traduction");

// VCard Contact (status style)
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
TEL;type=CELL;type=VOICE;waid=255767862457:+255767862457
END:VCARD`
    }
  }
};

// Newsletter context
const newsletterContext = {
  contextInfo: {
    forwardingScore: 999,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
      newsletterJid: "120363382023564830@newsletter",
      newsletterName: "𝙱.𝙼.𝙱-𝚇𝙼𝙳",
      serverMessageId: 1
    }
  }
};

cmd({
  pattern: "trt",
  alias: ["translate", "trad", "tafsiri"],
  react: "🌎",
  desc: "Translate text to different languages.",
  category: "main",
  filename: __filename
}, async (conn, mek, m, { from, quoted, args, q, reply }) => {

  const quotedMsg = m.quotedMessage || mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  
  // Check if there's a quoted message
  if (!quotedMsg) {
    return reply("❌ *Please reply to a text message to translate.*\n\n_Example:_ Reply to a message with `.trt en`");
  }

  // Check if language code is provided
  if (!args[0]) {
    return reply("❌ *Please provide a language code.*\n\n_Example:_ `.trt en`\n\n*Common codes:*\n• `en` → English\n• `sw` → Swahili\n• `fr` → French\n• `es` → Spanish\n• `ar` → Arabic\n• `pt` → Portuguese\n• `de` → German");
  }

  try {
    // Get the text from quoted message
    let textToTranslate = "";
    
    if (quotedMsg.conversation) {
      textToTranslate = quotedMsg.conversation;
    } else if (quotedMsg.extendedTextMessage?.text) {
      textToTranslate = quotedMsg.extendedTextMessage.text;
    } else if (quotedMsg.imageMessage?.caption) {
      textToTranslate = quotedMsg.imageMessage.caption;
    } else if (quotedMsg.videoMessage?.caption) {
      textToTranslate = quotedMsg.videoMessage.caption;
    } else {
      return reply("❌ *Could not extract text from the quoted message.*\n\nPlease reply to a text message only.");
    }

    if (!textToTranslate || textToTranslate.trim() === "") {
      return reply("❌ *The quoted message has no text to translate.*");
    }

    // React loading
    await conn.sendMessage(from, { 
      react: { text: "⏳", key: mek.key } 
    });

    // Translate the text
    const targetLang = args[0].toLowerCase();
    const translatedText = await traduire(textToTranslate, { to: targetLang });

    // Prepare response
    const response = 
      "╭══════════════════❒\n" +
      "│ *🌐 GOOGLE TRANSLATE*\n" +
      "│\n" +
      `│ *📝 Original Text:*\n│ "${textToTranslate.substring(0, 200)}${textToTranslate.length > 200 ? '...' : ''}"\n` +
      "│\n" +
      `│ *🔤 Translation (${targetLang}):*\n│ "${translatedText}"\n` +
      "│\n" +
      "│ *✅ Translation complete!*\n" +
      "╰══════════════════❒\n\n" +
      `> ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝙱.𝙼.𝙱 𝚃𝙴𝙲𝙷`;

    // Send translation
    await conn.sendMessage(from, {
      text: response,
      ...newsletterContext
    }, { quoted: quotedContact });

    // React success
    await conn.sendMessage(from, { 
      react: { text: "✅", key: mek.key } 
    });

  } catch (error) {
    console.error("❌ Translation Error:", error);
    
    // Handle specific errors
    if (error.message?.includes("not supported")) {
      reply("❌ *Invalid language code.*\n\nPlease use a valid code like: `en`, `sw`, `fr`, `es`, etc.");
    } else {
      reply("❌ *An error occurred while translating.*\n\nPlease try again later.");
    }
    
    // React error
    await conn.sendMessage(from, { 
      react: { text: "❌", key: mek.key } 
    });
  }
});

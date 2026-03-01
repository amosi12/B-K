const axios = require("axios");
const { cmd } = require("../command");

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
  pattern: "instagram",
  alias: ["igdl", "ig", "instagramdl"],
  react: "📸",
  desc: "Download Instagram videos and reels.",
  category: "download",
  filename: __filename
}, async (conn, mek, m, { from, quoted, args, q, reply }) => {

  if (!args[0]) {
    return reply("❌ *Please provide an Instagram link.*\n\n_Example:_ `.instagram https://www.instagram.com/reel/xxxxx`");
  }

  if (!q.includes("instagram.com")) {
    return reply("❌ *Invalid Instagram link.*\n\nPlease provide a valid Instagram URL.");
  }

  try {
    // React loading
    await conn.sendMessage(from, { 
      react: { text: "⏳", key: mek.key } 
    });

    // API call
    const apiUrl = `https://api-library-kohi.onrender.com/api/alldl?url=${encodeURIComponent(q)}`;
    const { data } = await axios.get(apiUrl);

    if (!data.status || !data.data || !data.data.videoUrl) {
      return reply("⚠️ *Failed to fetch Instagram media.*\n\nPlease try again later.");
    }

    const mediaUrl = data.data.videoUrl;
    const platform = data.data.platform || "Instagram";
    const title = data.data.title || "Instagram Video";
    const duration = data.data.duration || "N/A";
    const author = data.data.author || "Unknown";

    const caption = 
      "╭══════════════════❒\n" +
      "│ *📸 INSTAGRAM DOWNLOADER*\n" +
      "│\n" +
      `│ *📹 Title:* ${title}\n` +
      `│ *👤 Author:* ${author}\n` +
      `│ *⏱️ Duration:* ${duration}s\n` +
      `│ *📱 Platform:* ${platform}\n` +
      "│\n" +
      "│ *✅ Media sent successfully!*\n" +
      "╰══════════════════❒";

    // Send caption
    await conn.sendMessage(from, {
      text: caption,
      ...newsletterContext
    }, { quoted: quotedContact });

    // Send media (video)
    await conn.sendMessage(from, {
      video: { url: mediaUrl },
      mimetype: "video/mp4",
      caption: "⬆️ *Instagram Video Downloaded* ⬆️",
      ...newsletterContext
    }, { quoted: quotedContact });

    // React success
    await conn.sendMessage(from, { 
      react: { text: "✅", key: mek.key } 
    });

  } catch (error) {
    console.error("❌ Instagram Download Error:", error);
    reply("❌ *An error occurred while downloading the Instagram media.*\n\nPlease try again later.");
    
    // React error
    await conn.sendMessage(from, { 
      react: { text: "❌", key: mek.key } 
    });
  }
});

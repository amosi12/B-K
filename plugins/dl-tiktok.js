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
  pattern: "tiktok",
  alias: ["ttdl", "tt", "tiktokdl"],
  react: "🎵",
  desc: "Download TikTok videos without watermark.",
  category: "download",
  filename: __filename
}, async (conn, mek, m, { from, quoted, args, q, reply }) => {

  if (!args[0]) {
    return reply("❌ *Please provide a TikTok video link.*\n\n_Example:_ `.tiktok https://vm.tiktok.com/xxxxxx`");
  }

  if (!q.includes("tiktok.com")) {
    return reply("❌ *Invalid TikTok link.*\n\nPlease provide a valid TikTok URL.");
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
      return reply("⚠️ *Failed to fetch TikTok video.*\n\nPlease try again later.");
    }

    const videoUrl = data.data.videoUrl;
    const platform = data.data.platform || "TikTok";
    const title = data.data.title || "TikTok Video";
    const duration = data.data.duration || "N/A";
    const author = data.data.author || "Unknown";

    const caption = 
      "╭══════════════════❒\n" +
      "│ *🎵 TIKTOK DOWNLOADER*\n" +
      "│\n" +
      `│ *📹 Title:* ${title}\n` +
      `│ *👤 Author:* ${author}\n` +
      `│ *⏱️ Duration:* ${duration}s\n` +
      `│ *📱 Platform:* ${platform}\n` +
      "│\n" +
      "│ *✅ Video sent successfully!*\n" +
      "╰══════════════════❒";

    // Send caption
    await conn.sendMessage(from, {
      text: caption,
      ...newsletterContext
    }, { quoted: quotedContact });

    // Send video
    await conn.sendMessage(from, {
      video: { url: videoUrl },
      mimetype: "video/mp4",
      caption: "⬆️ *TikTok Video Downloaded* ⬆️",
      ...newsletterContext
    }, { quoted: quotedContact });

    // React success
    await conn.sendMessage(from, { 
      react: { text: "✅", key: mek.key } 
    });

  } catch (error) {
    console.error("❌ TikTok Download Error:", error);
    reply("❌ *An error occurred while downloading the TikTok video.*\n\nPlease try again later.");
    
    // React error
    await conn.sendMessage(from, { 
      react: { text: "❌", key: mek.key } 
    });
  }
});

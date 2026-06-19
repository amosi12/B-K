const axios = require('axios');
const { cmd } = require('../command');

// Google Custom Search API credentials
const GCSE_KEY = 'AIzaSyCUWYhfyU-M1inje5aAGHJoAR0sqxo2NpI';
const GCSE_CX = '718cbd2fe1ecd4beb';

// Quoted contact for newsletter/verified context (matches project branding)
const quotedContact = {
  key: {
    fromMe: false,
    participant: `0@s.whatsapp.net`,
    remoteJid: "status@broadcast"
  },
  message: {
    contactMessage: {
      displayName: "B.M.B VERIFIED ✅",
      vcard: "BEGIN:VCARD\nVERSION:3.0\nFN:B.M.B VERIFIED ✅\nORG:BMB-TECH BOT;\nTEL;type=CELL;type=VOICE;waid=255767862457:+255767862457\nEND:VCARD"
    }
  }
};

cmd({
  pattern: "image",
  alias: ["img", "pic", "searchimage"],
  desc: "Search and send images from the web.",
  category: "search",
  use: ".image <query>",
  filename: __filename,
}, async (conn, mek, m, { from, q, args, reply }) => {
  const query = (q || args.join(' ')).trim();

  await conn.sendMessage(from, { react: { text: '⌛', key: mek.key } });

  if (!query) {
    await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
    return reply(`❌ Give me something to search.\nExample: .image cats`);
  }

  try {
    const { data } = await axios.get('https://www.googleapis.com/customsearch/v1', {
      params: { q: query, key: GCSE_KEY, cx: GCSE_CX, searchType: 'image', num: 5, safe: 'off' },
      timeout: 15000
    });

    if (!data.items || data.items.length === 0) {
      await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
      return reply(`❌ No images found for "${query}".`);
    }

    await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });

    for (let i = 0; i < data.items.length; i++) {
      const item = data.items[i];
      try {
        await conn.sendMessage(from, {
          image: { url: item.link },
          caption: `🖼️ *IMAGE ${i + 1}/${data.items.length}*\n\n${(item.title || query).slice(0, 80)}`,
          contextInfo: {
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
              newsletterJid: '120363382023564830@newsletter',
              newsletterName: '𝙽𝙾𝚅𝙰-𝚇𝙼𝙳',
              serverMessageId: 143
            }
          }
        }, { quoted: quotedContact });
        if (i < data.items.length - 1) await new Promise(r => setTimeout(r, 1200));
      } catch (imgErr) {
        console.warn(`Image ${i + 1} skipped: ${imgErr.message}`);
      }
    }

  } catch (error) {
    console.error('Image search error:', error.message);
    await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
    reply(`❌ Image search failed. Try again later.`);
  }
});

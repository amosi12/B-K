const axios = require("axios");
const FormData = require('form-data');
const { cmd } = require("../command");
const { sendButtons } = require("gifted-btns");

const BMB_API = 'https://url.bmbxmd.workers.dev/api/upload';

// ✅ Kazi ya kuzalisha herufi 6 random (A-Z, 0-9)
function generateShortId(length = 6) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

cmd({
  pattern: "url",
  alias: ["imgtourl", "imgurl", "urll", "geturl", "upload"],
  react: '🖇',
  desc: "Convert media to BMB URL",
  category: "utility",
  use: ".tourl [reply to media]",
  filename: __filename
}, async (client, message, args, { reply }) => {
  try {
    const quotedMsg = message.quoted ? message.quoted : message;
    const mimeType = (quotedMsg.msg || quotedMsg).mimetype || '';

    if (!mimeType) {
      throw "❌ Please reply to an image, video, or audio file.";
    }

    const mediaBuffer = await quotedMsg.download();

    if (mediaBuffer.length > 100 * 1024 * 1024) {
      throw "❌ File size exceeds 100MB limit.";
    }

    // ✅ Tambua extension
    let extension = '';
    if (mimeType.includes('image/jpeg')) extension = '.jpg';
    else if (mimeType.includes('image/png')) extension = '.png';
    else if (mimeType.includes('image/webp')) extension = '.webp';
    else if (mimeType.includes('image/gif')) extension = '.gif';
    else if (mimeType.includes('video')) extension = '.mp4';
    else if (mimeType.includes('audio')) extension = '.mp3';
    else if (mimeType.includes('application')) extension = '.pdf';
    if (!extension) extension = '.bin';

    // ✅ Jina la faili: herufi 6 random + extension
    const shortId = generateShortId(6); // kama "EAYINY"
    const filename = `${shortId}${extension}`; // "EAYINY.png"

    const form = new FormData();
    form.append('file', mediaBuffer, {
      filename: filename,
      contentType: mimeType
    });

    const response = await axios.post(BMB_API, form, {
      headers: form.getHeaders(),
      timeout: 60000
    });

    const data = response.data;
    if (!data || !data.url) {
      throw "Upload failed. BMB did not return a valid URL.";
    }

    const mediaUrl = data.url; // Sasa itakuwa "https://url.bmbtech.site/EAYINY.png"

    let mediaType = 'File';
    if (mimeType.includes('image')) mediaType = 'Image';
    else if (mimeType.includes('video')) mediaType = 'Video';
    else if (mimeType.includes('audio')) mediaType = 'Audio';

    const fileSizeMB = (mediaBuffer.length / (1024 * 1024)).toFixed(2);

    const textMessage =
      "```[ FILE UPLOAD SUCCESS ]```\n" +
      "```========================```" + "\n" +
      `📁 TYPE   : ${mediaType}\n` +
      `📦 SIZE   : ${fileSizeMB} MB\n` +
      `🔑 SHORT  : ${shortId}\n` +
      `🌐 LINK   :\n${mediaUrl}\n` +
      "```========================```";

    await sendButtons(client, message.chat, {
      title: "",
      text: textMessage,
      footer: "> Uploaded by: NOVA XMD SYSTEM",
      buttons: [
        {
          name: "cta_copy",
          buttonParamsJson: JSON.stringify({
            display_text: "📋 Copy Link",
            copy_code: mediaUrl
          })
        },
        {
          name: "cta_url",
          buttonParamsJson: JSON.stringify({
            display_text: "📢 View Channel",
            url: "https://chat.whatsapp.com/0029VawO6hgF6sn7k3SuVU3z" // ✅ Badilisha hapa
          })
        }
      ]
    }, { quoted: message });

  } catch (error) {
    console.error(error);
    await reply(`❌ Error: ${error.message || error}`);
  }
});

const axios = require("axios");
const { cmd } = require("../command");

/* ===== API CONFIG ===== */
const LYRICS_API = "https://iamtkm.vercel.app/search/lyrics";
const API_KEY = "tkm";

/* ===== COMMAND ===== */
cmd(
  {
    pattern: "lyrics",
    alias: ["lyric", "song", "songtxt"],
    desc: "Search and fetch song lyrics by title and/or artist",
    category: "search",
    filename: __filename
  },
  async (conn, mek, m, { from, args, reply }) => {

    /* ===== HELP ===== */
    if (!args[0] || args[0].toLowerCase() === "help") {
      return reply(
        "🎵 *B.M.B LYRICS*\n\n" +
        "📌 *Usage:*\n" +
        "• .lyrics song name\n" +
        "• .lyrics Blinding Lights\n" +
        "• .lyrics Bohemian Rhapsody Queen\n\n" +
        "💡 *Tip:* Enter song title + artist"
      );
    }

    const query = args.join(" ");

    try {
      /* ===== REACT ===== */
      await conn.sendMessage(from, {
        react: { text: "⏳", key: mek.key }
      });

      /* ===== API REQUEST ===== */
      const res = await axios.get(LYRICS_API, {
        params: {
          apikey: API_KEY,
          song: query
        },
        timeout: 35000
      });

      const data = res.data;

      /* ===== PARSE RESPONSE ===== */
      let title = "";
      let artist = "";
      let lyrics = "";

      if (data?.status && data.result) {
        title = data.result.title || data.result.song || "";
        artist = data.result.artist || "";
        lyrics = data.result.lyrics || data.result.text || "";
      } else if (data?.lyrics) {
        lyrics = data.lyrics;
        title = data.title || query;
        artist = data.artist || "";
      } else if (data?.result) {
        lyrics = typeof data.result === "string" ? data.result : JSON.stringify(data.result);
      } else {
        return reply("❌ Lyrics not found. Try again.");
      }

      if (!lyrics) {
        return reply("❌ Lyrics not available for: " + query);
      }

      /* ===== TRIM IF TOO LONG ===== */
      if (lyrics.length > 3000) {
        lyrics = lyrics.slice(0, 3000) + "\n\n...truncated";
      }

      /* ===== FINAL MESSAGE ===== */
      let text = "🎵 *B.M.B LYRICS*\n\n";

      if (title) text += `🎼 *Wimbo:* ${title}\n`;
      if (artist) text += `🎤 *Msanii:* ${artist}\n`;

      text +=
        "\n━━━━━━━━━━━━━━━━\n\n" +
        `${lyrics}\n\n` +
        "━━━━━━━━━━━━━━━━\n" +
        "⚡ *Powered by Nova Xmd*";

      await conn.sendMessage(from, { text }, { quoted: mek });

    } catch (err) {
      console.error("LYRICS ERROR:", err.response?.data || err);
      reply(
        "❌ *Lyrics Error*\n\n" +
        "• API may be down\n" +
        "• Try again later.\n" +
        "• Enter the correct song name."
      );
    }
  }
);

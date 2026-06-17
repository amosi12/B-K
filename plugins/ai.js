const axios = require("axios");
const { cmd, commands } = require('../command');

/* ===== API CONFIG ===== */
const API_URL = "https://iamtkm.vercel.app/ai/gpt5";
const API_KEY = "tkm";

/* ===== COMMAND ===== */
cmd(
  {
    pattern: "gpt",
    alias: ["gpt5", "ai5", "bmbgpt", "ai"],
    desc: "Interact with GPT-5 AI",
    category: "ai",
    react: "🤖",
    filename: __filename
  },
  async (conn, mek, m, { from, args, reply }) => {
    try {
      /* ===== HELP ===== */
      if (!args[0] || args[0].toLowerCase() === "help") {
        return reply(
          "🤖 *Nova Xmd Ai*\n\n" +
          "📌 *Usage:*\n" +
          "• .gpt hello\n" +
          "• .gpt code javascript function\n" +
          "• .gpt creative short story\n" +
          "• .gpt explain async await\n"
        );
      }

      let query = args.join(" ");

      /* ===== NAME CHECK DETECTION ===== */
      const nameKeywords = [
        "unaitwa nani", 
        "jina lako", 
        "wewe nani", 
        "what is your name", 
        "whats your name", 
        "who are you"
      ];
      
      const cleanQuery = query.toLowerCase().replace(/[?.,!]/g, "").trim();
      const matchesNameQuery = nameKeywords.some(keyword => cleanQuery.includes(keyword));

      if (matchesNameQuery) {
        let nameResponse = "🤖 *Nova Xmd Ai*\n\n" +
                           "✨ *Response:*\n" +
                           "I am **Bmb Tech**.\n\n" +
                           "⚡ *Powered by Bmb Tech*";
        return await conn.sendMessage(from, { text: nameResponse });
      }

      /* ===== MODES ===== */
      const specialCommands = {
        code: "code",
        program: "code",
        coding: "code",
        creative: "creative",
        write: "creative",
        story: "creative",
        explain: "explain",
        whatis: "explain",
        define: "explain"
      };

      let mode = "general";
      let enhancedPrompt = query;

      const firstWord = args[0].toLowerCase();
      if (specialCommands[firstWord]) {
        mode = specialCommands[firstWord];
        query = args.slice(1).join(" ");

        if (!query) return reply("❌ Please provide your question.");

        if (mode === "code") {
          enhancedPrompt =
            `You are an expert programmer. Provide clean and efficient code with explanation.\nQuestion: ${query}`;
        } else if (mode === "creative") {
          enhancedPrompt =
            `You are a creative writer. Be imaginative and engaging.\nWrite: ${query}`;
        } else if (mode === "explain") {
          enhancedPrompt =
            `You are a teacher. Explain clearly with examples.\nTopic: ${query}`;
        }
      }

      /* ===== API REQUEST ===== */
      const res = await axios.get(API_URL, {
        params: {
          apikey: API_KEY,
          text: enhancedPrompt
        },
        timeout: 35000
      });

      const data = res.data;
      let aiResponse = "";

      if (data?.status && data.result) {
        aiResponse = data.result;
      } else if (data?.response) {
        aiResponse = data.response;
      } else if (data?.answer) {
        aiResponse = data.answer;
      } else {
        aiResponse = JSON.stringify(data, null, 2).slice(0, 1500);
      }

      aiResponse = formatResponse(aiResponse, mode);

      if (aiResponse.length > 3000) {
        aiResponse = aiResponse.slice(0, 3000) + "\n\n...truncated";
      }

      /* ===== FINAL MESSAGE ===== */
      let text = "🤖 *Nova Xmd Ai*\n\n";

      if (mode !== "general") {
        const icons = {
          code: "👨‍💻",
          creative: "🎨",
          explain: "📘"
        };
        text += `${icons[mode]} *Mode:* ${mode.toUpperCase()}\n\n`;
      }

      text +=
        `🎯 *Question:*\n${query.slice(0, 100)}\n\n` +
        `✨ *Response:*\n${aiResponse}\n\n` +
        "⚡ *Powered by Bmb Tech*";

      await conn.sendMessage(from, { text });

    } catch (err) {
      console.error("GPT ERROR:", err.response?.data || err);
      reply(
        "❌ *GPT-5 Error*\n\n" +
        "• API may be down\n" +
        "• Try again later\n" +
        "• Use shorter questions"
      );
    }
  }
);

/* ===== HELPERS ===== */

function formatResponse(text, mode) {
  if (!text) return "";

  if (mode === "code" && !text.includes("```")) {
    return "```" + "\n" + text + "\n```";
  }

  if (mode === "creative") {
    return text.replace(/\n\s*\n/g, "\n\n");
  }

  return text;
}

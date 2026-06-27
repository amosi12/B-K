const axios = require("axios");
const { cmd } = require("../command");

function getFlagEmoji(countryCode) {
  if (!countryCode) return "";
  return countryCode
    .toUpperCase()
    .split("")
    .map(letter => String.fromCodePoint(letter.charCodeAt(0) + 127397))
    .join("");
}

cmd({
  pattern: "check",
  desc: "Checks the country calling code and returns the corresponding country name(s) with flag",
  category: "utility",
  filename: __filename
}, async (conn, mek, m, { from, args, reply }) => {
  try {
    let code = args[0];
    if (!code) return reply("❌ Please provide a country code. Example: `.check 255`");
    code = code.replace(/\+/g, '');

    const url = "https://nova-countries-site-web.vercel.app/countries";
    const { data } = await axios.get(url);

    const matchingCountries = data.filter(country => country.calling_code === code);

    if (matchingCountries.length > 0) {
      const countryNames = matchingCountries
        .map(c => `${getFlagEmoji(c.code)} ${c.name}`)
        .join("\n");

      await conn.sendMessage(from, {
        text: `✅ *Country Code:* ${code}\n🌍 *Countries:*\n${countryNames}`,
        contextInfo: {
          mentionedJid: [m.sender],
          forwardingScore: 999,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: "120363382023564830@newsletter",
            newsletterName: "𝙽𝙾𝚅𝙰-𝚇𝙼𝙳",
            serverMessageId: 1
          }
        }
      }, { quoted: mek });
    } else {
      reply(`❌ No country found for the code ${code}.`);
    }
  } catch (error) {
    console.error(error);
    reply("❌ An error occurred while checking the country code.");
  }
});

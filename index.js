const { google } = require("googleapis");
const axios = require("axios");

const sheetId = process.env.SHEET_ID;
const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
const telegramChatId = process.env.TELEGRAM_CHAT_ID;

const auth = new google.auth.GoogleAuth({
    keyFile: "creds.json",
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
});

async function getTodaySchedule() {
  const sheets = google.sheets({ version: "v4", auth });
  const range = "Schedule!A:E"; //from row 1 until the last non-empty row

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: range,
  });

  const rows = res.data.values;
  if (!rows || rows.length === 0) return null;

  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "/");

  for (let row of rows) {
    const [name, date, dinner, link, note] = row;
    if (date === today) {
      return { name, date, dinner, link, note };
    }
  }
  return null;
}

exports.handler = async () => {
  const schedule = await getTodaySchedule();

  let message = "";
  if (schedule) {
    message = `🍽️ Dinner Schedule for ${schedule.date}\n👤 Name: ${schedule.name}\n🍝 Dinner: ${schedule.dinner}\n🔗 [Link](${schedule.link})\n📝 Note: ${schedule.note || 'None'}`;
  } else {
    message = `⚠️ No dinner schedule found for today. Please update the Google Sheet.`;
  }

  await axios.post(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
    chat_id: telegramChatId,
    text: message,
    parse_mode: "Markdown",
  });

  return { statusCode: 200, body: "Message sent" };
};
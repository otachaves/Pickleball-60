const { MercadoPagoConfig, Payment } = require("mercadopago");
const nodemailer = require("nodemailer");
const { google } = require("googleapis");

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASS,
  },
});

async function saveToSheet(data) {
  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const sheets = google.sheets({ version: "v4", auth });
  const categoriesText = data.categories.map((c) => c.label).join(", ");
  const playersText = data.categories.map((c) => `${c.label}: ${c.players.join(", ")}`).join(" | ");
  await sheets.spreadsheets.values.append({
    spreadsheetId: "1yXdYMc0Ud-B7MSVUOZg0bMPiaKceLHHW4v-eDjYIwOQ",
    range: "Sheet1!A:G",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[
        new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }),
        data.name,
        data.email,
        categoriesText,
        playersText,
        `R$ ${data.total}`,
        data.status || "Confirmado",
      ]],
    },
  });
}

async function sendConfirmationEmail(data) {
  const catRows = data.categories.map((c) => {
    const players = c.players.filter((p) => p).join(", ") || "—";
    return `<tr>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;font-weight:600">${c.label}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee">${players}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right">R$ ${c.price}</td>
    </tr>`;
  }).join("");

  await transporter.sendMail({
    from: `"Copa Imperial 60+" <${process.env.GMAIL_USER}>`,
    to: data.email,
    subject: "Inscrição confirmada — Copa

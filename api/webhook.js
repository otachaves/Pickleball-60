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

async function updateSheetStatus(paymentId, name, email) {
  try {
    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    const sheets = google.sheets({ version: "v4", auth });
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: "1yXdYMc0Ud-B7MSVUOZg0bMPiaKceLHHW4v-eDjYIwOQ",
      range: "Sheet1!A:G",
    });
    const rows = result.data.values || [];
    const rowIndex = rows.findIndex((r) => r[2] === email && r[6] === "Pendente (Pix)");
    if (rowIndex !== -1) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: "1yXdYMc0Ud-B7MSVUOZg0bMPiaKceLHHW4v-eDjYIwOQ",
        range: `Sheet1!G${rowIndex + 1}`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [["Confirmado"]] },
      });
    }
  } catch (e) {
    console.error("Erro ao atualizar planilha:", e);
  }
}

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).end();

  const { type, data } = req.body;
  if (type !== "payment") return res.status(200).end();

  try {
    const payment = new Payment(client);
    const result = await payment.get({ id: data.id });

    if (result.status !== "approved") return res.status(200).end();

    const payer = result.payer || {};
    const name = payer.first_name
      ? `${payer.first_name} ${payer.last_name || ""}`.trim()
      : "Participante";
    const email = payer.email || "";

    // Atualiza status na planilha
    await updateSheetStatus(data.id, name, email);

    // Envia email de confirmação
    await transporter.sendMail({
      from: `"Copa Imperial 60+" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "Pagamento confirmado — Copa Imperial 60+ 🏓",
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#1a1a1a">
          <div style="background:#16a34a;padding:24px;text-align:center;border-radius:12px 12px 0 0">
            <h1 style="color:#fff;margin:0;font-size:22px">Copa Imperial 60+</h1>
            <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:14px">Pagamento confirmado!</p>
          </div>
          <div style="background:#fff;padding:24px;border:1px solid #eee;border-top:none;border-radius:0 0 12px 12px">
            <p>Olá, <strong>${name}</strong>!</p>
            <p>Seu pagamento via Pix foi <strong style="color:#16a34a">confirmado</strong>. Sua vaga está garantida!</p>
            <div style="background:#f9fafb;border-radius:8px;padding:14px;margin-top:16px;font-size:14px;color:#555">
              📅 2 e 3 de maio de 2026<br>
              📍 Paróquia Santa Clara — R. Cel. Veiga, 1130 · Petrópolis
            </div>
            <p style="margin-top:20px;color:#888;font-size:13px">Nos vemos na quadra!</p>
          </div>
        </div>
      `,
    });

    // Notifica organizador
    await transporter.sendMail({
      from: `"Copa Imperial 60+" <${process.env.GMAIL_USER}>`,
      to: process.env.GMAIL_USER,
      subject: `Pix confirmado — ${name}`,
      html: `<p>Pagamento Pix confirmado para <strong>${name}</strong> (${email}).</p>`,
    });

    res.status(200).end();
  } catch (err) {
    console.error(err);
    res.status(500).end();
  }
};

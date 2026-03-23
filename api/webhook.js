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

async function getSheetData(paymentId) {
  try {
    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    const sheets = google.sheets({ version: "v4", auth });
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: "1yXdYMc0Ud-B7MSVUOZg0bMPiaKceLHHW4v-eDjYIwOQ",
      range: "Sheet1!A:H",
    });
    const rows = result.data.values || [];
    const rowIndex = rows.findIndex((r) => r[7] === String(paymentId));
    if (rowIndex !== -1) {
      return { rowIndex: rowIndex + 1, name: rows[rowIndex][1], email: rows[rowIndex][2] };
    }
    return null;
  } catch (e) {
    console.error("Erro ao buscar planilha:", e);
    return null;
  }
}

async function updateSheetStatus(rowIndex) {
  try {
    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    const sheets = google.sheets({ version: "v4", auth });
    await sheets.spreadsheets.values.update({
      spreadsheetId: "1yXdYMc0Ud-B7MSVUOZg0bMPiaKceLHHW4v-eDjYIwOQ",
      range: `Sheet1!G${rowIndex}`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [["Confirmado"]] },
    });
  } catch (e) {
    console.error("Erro ao atualizar planilha:", e);
  }
}

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).end();

  const { type, data } = req.body;

  // Ignora notificacoes que nao sao de pagamento
  if (type !== "payment") return res.status(200).end();

  try {
    const payment = new Payment(client);
    const result = await payment.get({ id: data.id });

    console.log("WEBHOOK payment id:", data.id, "status:", result.status, "method:", result.payment_method_id);

    // So processa Pix aprovado — cartao ja e tratado no process-payment.js
    if (result.status !== "approved" || result.payment_method_id !== "pix") {
      return res.status(200).end();
    }

    // Busca dados do pagador na planilha
    const sheetData = await getSheetData(data.id);
    const name = sheetData?.name || result.payer?.first_name || "Participante";
    const email = sheetData?.email || result.payer?.email || "";

    console.log("WEBHOOK Pix aprovado - name:", name, "email:", email);

    if (!email) {
      console.error("Email nao encontrado para o pagamento:", data.id);
      return res.status(200).end();
    }

    // Atualiza planilha e envia emails
    await Promise.all([
      sheetData ? updateSheetStatus(sheetData.rowIndex) : Promise.resolve(),
      transporter.sendMail({
        from: `"Copa Imperial 60+" <${process.env.GMAIL_USER}>`,
        to: email,
        subject: "Pagamento confirmado - Copa Imperial 60+",
        html: `
          <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a">
            <div style="background:#16a34a;padding:28px 24px;text-align:center;border-radius:12px 12px 0 0">
              <h1 style="color:#fff;margin:0;font-size:22px">Copa Imperial 60+</h1>
              <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:14px">Pagamento confirmado!</p>
            </div>
            <div style="background:#fff;padding:24px;border:1px solid #eee;border-top:none;border-radius:0 0 12px 12px">
              <p style="font-size:15px">Ola, <strong>${name}</strong>!</p>
              <p style="font-size:14px;color:#555;">Seu pagamento via Pix foi confirmado. Sua vaga esta garantida!</p>
              <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:14px;margin-top:20px;font-size:14px;color:#166534">
                2 e 3 de maio de 2026<br>
                Paroquia Santa Clara - R. Cel. Veiga, 1130 - Petropolis
              </div>
              <p style="margin-top:20px;font-size:13px;color:#888">Nos vemos na quadra!</p>
            </div>
          </div>
        `,
      }),
      transporter.sendMail({
        from: `"Copa Imperial 60+" <${process.env.GMAIL_USER}>`,
        to: process.env.GMAIL_USER,
        subject: `Pix confirmado - ${name}`,
        html: `<p>Pagamento Pix confirmado para <strong>${name}</strong> (${email}).</p>`,
      }),
    ]);

    res.status(200).end();
  } catch (err) {
    console.error(err);
    res.status(500).end();
  }
};

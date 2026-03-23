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
    range: "Sheet1!A:H",
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
        data.paymentId || "",
        JSON.stringify(data.categories || []),
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
    subject: "Inscricao confirmada - Copa Imperial 60+",
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a">
        <div style="background:#16a34a;padding:28px 24px;text-align:center;border-radius:12px 12px 0 0">
          <h1 style="color:#fff;margin:0;font-size:22px">Copa Imperial 60+</h1>
          <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:14px">Inscricao confirmada!</p>
        </div>
        <div style="background:#fff;padding:24px;border:1px solid #eee;border-top:none;border-radius:0 0 12px 12px">
          <p style="font-size:15px">Olá, <strong>${data.name}</strong>!</p>
          <p style="font-size:14px;color:#555;margin-bottom:20px">Sua inscricao foi confirmada com sucesso. Veja o resumo abaixo:</p>
          <table style="width:100%;border-collapse:collapse;font-size:14px">
            <thead>
              <tr style="background:#f9fafb">
                <th style="padding:8px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#aaa">Categoria</th>
                <th style="padding:8px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#aaa">Jogadores</th>
                <th style="padding:8px 12px;text-align:right;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#aaa">Valor</th>
              </tr>
            </thead>
            <tbody>${catRows}</tbody>
          </table>
          <div style="display:flex;justify-content:space-between;padding:12px;background:#f9fafb;border-radius:8px;margin-top:4px;font-weight:700;font-size:15px">
            <span>Total pago</span><span>R$ ${data.total}</span>
          </div>
          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:14px;margin-top:20px;font-size:14px;color:#166534">
            📅 2 e 3 de maio de 2026<br>
            📍 Paróquia Santa Clara — R. Cel. Veiga, 1130 · Petrópolis
          </div>
          <p style="margin-top:20px;font-size:13px;color:#888">Dúvidas? Responda este email.<br>Nos vemos na quadra!</p>
        </div>
      </div>
    `,
  });
}

async function sendOrganizerEmail(data) {
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
    to: process.env.GMAIL_USER,
    subject: `Nova inscricao - ${data.name}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a">
        <div style="background:#1a1a1a;padding:20px 24px;border-radius:12px 12px 0 0">
          <h2 style="color:#f0c040;margin:0;font-size:18px">Nova inscricao recebida</h2>
          <p style="color:rgba(255,255,255,0.6);margin:4px 0 0;font-size:13px">${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}</p>
        </div>
        <div style="background:#fff;padding:24px;border:1px solid #eee;border-top:none;border-radius:0 0 12px 12px">
          <table style="width:100%;font-size:14px;margin-bottom:20px">
            <tr><td style="color:#aaa;padding:4px 0;width:120px">Nome</td><td style="font-weight:600">${data.name}</td></tr>
            <tr><td style="color:#aaa;padding:4px 0">Email</td><td>${data.email}</td></tr>
            <tr><td style="color:#aaa;padding:4px 0">Total</td><td style="font-weight:600;color:#16a34a">R$ ${data.total}</td></tr>
          </table>
          <table style="width:100%;border-collapse:collapse;font-size:14px">
            <thead>
              <tr style="background:#f9fafb">
                <th style="padding:8px 12px;text-align:left;font-size:11px;text-transform:uppercase;color:#aaa">Categoria</th>
                <th style="padding:8px 12px;text-align:left;font-size:11px;text-transform:uppercase;color:#aaa">Jogadores</th>
                <th style="padding:8px 12px;text-align:right;font-size:11px;text-transform:uppercase;color:#aaa">Valor</th>
              </tr>
            </thead>
            <tbody>${catRows}</tbody>
          </table>
        </div>
      </div>
    `,
  });
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();

  try {
    const payment = new Payment(client);
    const result = await payment.create({ body: req.body });

    console.log("Payment status:", result.status, "method:", result.payment_method_id);

    const meta = req.body.metadata || {};
    const name = meta.name || req.body.payer?.first_name || "Participante";
    const email = meta.email || req.body.payer?.email || "";
    const categories = meta.categories ? JSON.parse(meta.categories) : [];
    const total = categories.reduce((s, c) => s + c.price, 0);
    const data = { name, email, categories, total, paymentMethod: result.payment_method_id };

    if (result.status === "approved" && result.payment_method_id !== "pix") {
      await Promise.all([
        saveToSheet({ ...data, status: "Confirmado" }),
        sendConfirmationEmail(data),
        sendOrganizerEmail(data),
      ]);
    } else if (result.status === "pending" || result.payment_method_id === "pix") {
      await saveToSheet({ ...data, status: "Pendente (Pix)", paymentId: result.id });
    }

    res.status(200).json({
      status: result.status,
      payment_method_id: result.payment_method_id,
      point_of_interaction: result.point_of_interaction || null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao processar pagamento" });
  }
};

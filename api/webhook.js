const { MercadoPagoConfig, Payment } = require("mercadopago");
const nodemailer = require("nodemailer");

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

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).end();

  const { type, data } = req.body;
  if (type !== "payment") return res.status(200).end();

  try {
    const payment = new Payment(client);
    const result = await payment.get({ id: data.id });
    if (result.status !== "approved") return res.status(200).end();

    const { name, email, categories } = result.metadata;
    const cats = JSON.parse(categories);
    const total = cats.reduce((sum, c) => sum + c.price, 0);

    const catLines = cats.map((c) => {
      const players = c.players?.join(", ") || "";
      return `• ${c.label}${players ? ` — ${players}` : ""}: R$ ${c.price}`;
    }).join("\n");

    await transporter.sendMail({
      from: `"Copa Imperial 60+" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "Inscrição confirmada — Copa Imperial 60+ 🏓",
      text: `Olá, ${name}!\n\nSua inscrição foi confirmada.\n\n${catLines}\n\nTotal pago: R$ ${total}\n\nNos vemos na quadra!\n\n📅 2 e 3 de maio de 2026\n📍 Paróquia Santa Clara — R. Cel. Veiga, 1130 · Petrópolis\n\nEquipe Copa Imperial 60+`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#1a1a1a">
          <div style="background:#16a34a;padding:24px;text-align:center;border-radius:12px 12px 0 0">
            <h1 style="color:#fff;margin:0;font-size:22px">Copa Imperial 60+</h1>
          </div>
          <div style="background:#fff;padding:24px;border:1px solid #eee;border-top:none;border-radius:0 0 12px 12px">
            <p>Olá, <strong>${name}</strong>!</p>
            <p>Sua inscrição foi <strong style="color:#16a34a">confirmada</strong>.</p>
            <hr style="border:none;border-top:1px solid #eee;margin:16px 0">
            ${cats.map(c => `<p style="margin:6px 0">🏓 <strong>${c.label}</strong>${c.players?.length ? ` — ${c.players.join(", ")}` : ""} <span style="float:right">R$ ${c.price}</span></p>`).join("")}
            <hr style="border:none;border-top:1px solid #eee;margin:16px 0">
            <p><strong>Total pago: R$ ${total}</strong></p>
            <div style="background:#f9fafb;border-radius:8px;padding:14px;margin-top:16px;font-size:14px;color:#555">
              📅 2 e 3 de maio de 2026<br>
              📍 Paróquia Santa Clara — R. Cel. Veiga, 1130 · Petrópolis
            </div>
            <p style="margin-top:20px;color:#888;font-size:13px">Nos vemos na quadra!</p>
          </div>
        </div>
      `,
    });

    res.status(200).end();
  } catch (err) {
    console.error(err);
    res.status(500).end();
  }
};

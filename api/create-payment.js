const { MercadoPagoConfig, Preference } = require("mercadopago");

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();

  const { name, email, categories } = req.body;

  const items = categories.map((cat) => ({
    title: cat.label,
    quantity: 1,
    unit_price: cat.price,
    currency_id: "BRL",
  }));

  try {
    const preference = new Preference(client);
    const result = await preference.create({
      body: {
        items,
        payer: { name, email },
        payment_methods: {
          installments: 12,
        },
        back_urls: {
          success: `${process.env.SITE_URL}?status=success`,
          failure: `${process.env.SITE_URL}?status=failure`,
          pending: `${process.env.SITE_URL}?status=pending`,
        },
        notification_url: `${process.env.SITE_URL}/api/webhook`,
        metadata: {
          name,
          email,
          categories: JSON.stringify(categories),
        },
      },
    });

    res.status(200).json({
      preference_id: result.id,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao criar pagamento" });
  }
};

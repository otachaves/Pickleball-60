const { google } = require("googleapis");

const LIMITES = {
  "Single masculino": 12,
  "Dupla masculina": 12,
  "Dupla feminina": 12,
  "Dupla mista": 12,
  "Quarteto": 6,
};

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: "1yXdYMc0Ud-B7MSVUOZg0bMPiaKceLHHW4v-eDjYIwOQ",
      range: "Sheet1!D:F",
    });

    const rows = result.data.values || [];
    const contagem = {};
    Object.keys(LIMITES).forEach((k) => (contagem[k] = 0));

    rows.slice(1).forEach((row) => {
      const categorias = (row[0] || "").split(",").map((c) => c.trim());
      categorias.forEach((cat) => {
        if (contagem[cat] !== undefined) contagem[cat]++;
      });
    });

    const vagas = {};
    Object.keys(LIMITES).forEach((cat) => {
      vagas[cat] = {
        limite: LIMITES[cat],
        inscritos: contagem[cat],
        restantes: Math.max(0, LIMITES[cat] - contagem[cat]),
        esgotado: contagem[cat] >= LIMITES[cat],
      };
    });

    res.status(200).json(vagas);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar vagas" });
  }
};

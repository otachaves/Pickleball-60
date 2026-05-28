const { google } = require("googleapis");

const SHEET_ID = "1yXdYMc0Ud-B7MSVUOZg0bMPiaKceLHHW4v-eDjYIwOQ";
const CONFIG_RANGE = "Config!A:B";

const DEFAULT_CONFIG = {
  lote: 1,
  categorias: {
    open: { vagas: 12, esgotado: false },
    "40": { vagas: 12, esgotado: false },
    "50": { vagas: 12, esgotado: false },
    "60": { vagas: 12, esgotado: false },
    kids: { vagas: 12, esgotado: false },
  },
};

async function getSheets() {
  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return google.sheets({ version: "v4", auth });
}

function parseConfigRows(rows) {
  const config = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
  for (const row of rows) {
    const [key, value] = row;
    if (!key || value === undefined) continue;

    if (key === "lote") {
      config.lote = parseInt(value) || 1;
      continue;
    }

    const dotIdx = key.indexOf(".");
    if (dotIdx === -1) continue;
    const catId = key.slice(0, dotIdx);
    const field = key.slice(dotIdx + 1);
    if (!config.categorias[catId]) continue;

    if (field === "vagas") {
      config.categorias[catId].vagas = parseInt(value) || 0;
    } else if (field === "esgotado") {
      config.categorias[catId].esgotado = String(value).toLowerCase() === "true";
    }
  }
  return config;
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  let sheets;
  try {
    sheets = await getSheets();
  } catch (e) {
    console.error("Erro ao autenticar Sheets:", e);
    return res.status(500).json({ error: "Erro de autenticação" });
  }

  if (req.method === "GET") {
    try {
      const result = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: CONFIG_RANGE,
      });
      const rows = result.data.values || [];
      return res.status(200).json(parseConfigRows(rows));
    } catch (e) {
      // Aba "Config" pode não existir ainda — retorna defaults
      return res.status(200).json(DEFAULT_CONFIG);
    }
  }

  if (req.method === "POST") {
    const { key, value } = req.body || {};
    if (!key || value === undefined || value === null) {
      return res.status(400).json({ error: "key e value obrigatórios" });
    }

    try {
      // Tenta ler linhas atuais
      let rows = [];
      try {
        const result = await sheets.spreadsheets.values.get({
          spreadsheetId: SHEET_ID,
          range: CONFIG_RANGE,
        });
        rows = result.data.values || [];
      } catch (e) {
        // Se a aba Config não existe, tenta criar e depois append
        try {
          await sheets.spreadsheets.batchUpdate({
            spreadsheetId: SHEET_ID,
            requestBody: {
              requests: [{ addSheet: { properties: { title: "Config" } } }],
            },
          });
        } catch (createErr) {
          // Aba já existe, ignore
        }
      }

      // Encontra TODAS as linhas com a mesma key e atualiza cada uma
      // (resolve bug de duplicatas onde GET lia a última mas POST só
      // atualizava a primeira)
      const matchingIdxs = [];
      for (let i = 0; i < rows.length; i++) {
        if (rows[i][0] === key) matchingIdxs.push(i);
      }

      if (matchingIdxs.length > 0) {
        for (const idx of matchingIdxs) {
          await sheets.spreadsheets.values.update({
            spreadsheetId: SHEET_ID,
            range: `Config!B${idx + 1}`,
            valueInputOption: "USER_ENTERED",
            requestBody: { values: [[String(value)]] },
          });
        }
      } else {
        await sheets.spreadsheets.values.append({
          spreadsheetId: SHEET_ID,
          range: CONFIG_RANGE,
          valueInputOption: "USER_ENTERED",
          requestBody: { values: [[key, String(value)]] },
        });
      }
      return res.status(200).json({ ok: true });
    } catch (e) {
      console.error("Erro ao salvar config:", e);
      return res.status(500).json({ error: "Erro ao salvar config" });
    }
  }

  res.status(405).end();
};

const { google } = require("googleapis");

const SHEET_ID = "1yXdYMc0Ud-B7MSVUOZg0bMPiaKceLHHW4v-eDjYIwOQ";
const STATUS_RANGE = "Status!A:B";

async function getSheets() {
  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return google.sheets({ version: "v4", auth });
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const sheets = await getSheets();

  // GET — retorna status atual de todas as categorias
  if (req.method === "GET") {
    try {
      const result = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: STATUS_RANGE,
      });
      const rows = result.data.values || [];
      const status = {};
      rows.forEach(r => { if (r[0]) status[r[0]] = r[1] === "true"; });
      return res.status(200).json(status);
    } catch (e) {
      // Se a aba não existe ainda, retorna todas abertas
      return res.status(200).json({});
    }
  }

  // POST — atualiza status de uma categoria
  if (req.method === "POST") {
    const { catId, aberta } = req.body;
    if (!catId) return res.status(400).json({ error: "catId obrigatorio" });

    try {
      // Busca rows atuais
      let rows = [];
      try {
        const result = await sheets.spreadsheets.values.get({
          spreadsheetId: SHEET_ID,
          range: STATUS_RANGE,
        });
        rows = result.data.values || [];
      } catch (e) {}

      const idx = rows.findIndex(r => r[0] === catId);
      if (idx !== -1) {
        // Atualiza linha existente
        await sheets.spreadsheets.values.update({
          spreadsheetId: SHEET_ID,
          range: `Status!B${idx + 1}`,
          valueInputOption: "USER_ENTERED",
          requestBody: { values: [[String(aberta)]] },
        });
      } else {
        // Adiciona nova linha
        await sheets.spreadsheets.values.append({
          spreadsheetId: SHEET_ID,
          range: STATUS_RANGE,
          valueInputOption: "USER_ENTERED",
          requestBody: { values: [[catId, String(aberta)]] },
        });
      }
      return res.status(200).json({ ok: true });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "Erro ao salvar status" });
    }
  }

  res.status(405).end();
};

import express from "express";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3001;

// CORS middleware
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, PUT, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Cache-Control, Pragma, Expires",
  );
  res.header("Cache-Control", "no-cache, no-store, must-revalidate");
  res.header("Pragma", "no-cache");
  res.header("Expires", "0");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());
app.use(express.static("public"));

const DATA_DIR = join(__dirname, "data");
const DATA_FILE = join(DATA_DIR, "participants.json");

// Убедиться, что директория существует
if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

// Убедиться, что файл существует
if (!existsSync(DATA_FILE)) {
  writeFileSync(
    DATA_FILE,
    JSON.stringify(
      { participants: [], combatState: { round: 1, currentTurnIndex: 0 } },
      null,
      2,
    ),
  );
}

// Получить участников
app.get("/api/participants", (req, res) => {
  try {
    const data = readFileSync(DATA_FILE, "utf-8");
    const jsonData = JSON.parse(data);
    // console.log("GET /api/participants");
    res.json(jsonData);
  } catch (err) {
    console.error("Ошибка чтения:", err);
    res.json({
      participants: [],
      combatState: { round: 1, currentTurnIndex: 0 },
    });
  }
});

// Сохранить участников
app.put("/api/participants", (req, res) => {
  try {
    const { participants, combatState } = req.body;
    console.log("PUT /api/participants - получено:", {
      participantsCount: participants?.length,
      combatState,
    });
    const data = {
      participants,
      combatState: combatState || { round: 1, currentTurnIndex: 0 },
    };
    console.log("PUT /api/participants - сохранение:", data.combatState);
    writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
    console.log("Файл:", DATA_FILE);
    res.json({ success: true });
  } catch (err) {
    console.error("Ошибка записи:", err);
    res.status(500).json({ error: err.message });
  }
});

// Обновить состояние боя
app.put("/api/combat-state", (req, res) => {
  try {
    const data = readFileSync(DATA_FILE, "utf-8");
    const jsonData = JSON.parse(data);
    const { round, currentTurnIndex } = req.body;

    jsonData.combatState = { round, currentTurnIndex };

    writeFileSync(DATA_FILE, JSON.stringify(jsonData, null, 2), "utf-8");
    res.json({ success: true });
  } catch (err) {
    console.error("Ошибка обновления состояния боя:", err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`API сервер запущен на http://localhost:${PORT}`);
  console.log(`Доступен в сети: http://0.0.0.0:${PORT}`);
  console.log(`Файл данных: ${DATA_FILE}`);
});

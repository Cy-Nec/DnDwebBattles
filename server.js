import express from "express";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { networkInterfaces } from "os";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Функция для получения локального IP
function getLocalIp() {
  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // Выбираем IPv4, не внутренние адреса
      if (net.family === "IPv4" && !net.internal) {
        // Предпочтение 192.168.x.x и 10.x.x.x
        if (net.address.startsWith("192.168.") || net.address.startsWith("10.")) {
          return net.address;
        }
      }
    }
  }
  return "localhost";
}

const LOCAL_IP = getLocalIp();

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

app.use(express.json({ limit: '50mb' }));
app.use(express.static("public"));

const DATA_DIR = join(__dirname, "data");
const DATA_FILE = join(DATA_DIR, "participants.json");
const IMAGES_DIR = join(DATA_DIR, "images");
const IMAGES_FILE = join(DATA_DIR, "images.json");
const DISPLAYED_IMAGE_FILE = join(DATA_DIR, "displayed-image.json");

// Убедиться, что директория существует
if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

// Убедиться, что директория для изображений существует
if (!existsSync(IMAGES_DIR)) {
  mkdirSync(IMAGES_DIR, { recursive: true });
}

// Убедиться, что файл участников существует
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

// Убедиться, что файл изображений существует
if (!existsSync(IMAGES_FILE)) {
  writeFileSync(IMAGES_FILE, JSON.stringify({ images: [] }, null, 2));
}

// Убедиться, что файл отображаемого изображения существует
if (!existsSync(DISPLAYED_IMAGE_FILE)) {
  writeFileSync(DISPLAYED_IMAGE_FILE, JSON.stringify({ image: null }, null, 2));
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

// Получить изображения
app.get("/api/images", (req, res) => {
  try {
    const data = readFileSync(IMAGES_FILE, "utf-8");
    const jsonData = JSON.parse(data);
    res.json(jsonData);
  } catch (err) {
    console.error("Ошибка чтения изображений:", err);
    res.json({ images: [] });
  }
});

// Сохранить изображение
app.post("/api/images", (req, res) => {
  try {
    const { id, name, url } = req.body;
    console.log("POST /api/images - получено:", { id, name, urlLength: url?.length });
    
    if (!id || !name || !url) {
      return res.status(400).json({ error: "Неверные данные" });
    }

    const data = readFileSync(IMAGES_FILE, "utf-8");
    const jsonData = JSON.parse(data);
    
    // Сохраняем изображение в массив
    jsonData.images.push({ id, name, url, createdAt: Date.now() });
    
    writeFileSync(IMAGES_FILE, JSON.stringify(jsonData, null, 2), "utf-8");
    console.log("Изображение сохранено, всего изображений:", jsonData.images.length);
    res.json({ success: true, image: { id, name, url } });
  } catch (err) {
    console.error("Ошибка сохранения изображения:", err);
    res.status(500).json({ error: err.message });
  }
});

// Удалить изображение
app.delete("/api/images/:id", (req, res) => {
  try {
    const imageId = parseInt(req.params.id);
    
    const data = readFileSync(IMAGES_FILE, "utf-8");
    const jsonData = JSON.parse(data);
    
    jsonData.images = jsonData.images.filter(img => img.id !== imageId);
    
    writeFileSync(IMAGES_FILE, JSON.stringify(jsonData, null, 2), "utf-8");
    res.json({ success: true });
  } catch (err) {
    console.error("Ошибка удаления изображения:", err);
    res.status(500).json({ error: err.message });
  }
});

// Получить отображаемое изображение
app.get("/api/displayed-image", (req, res) => {
  try {
    const data = readFileSync(DISPLAYED_IMAGE_FILE, "utf-8");
    const jsonData = JSON.parse(data);
    res.json(jsonData);
  } catch (err) {
    console.error("Ошибка чтения отображаемого изображения:", err);
    res.json({ image: null });
  }
});

// Установить отображаемое изображение
app.post("/api/displayed-image", (req, res) => {
  try {
    const image = req.body;
    console.log("POST /api/displayed-image - получено:", { name: image?.name, urlLength: image?.url?.length });
    
    writeFileSync(DISPLAYED_IMAGE_FILE, JSON.stringify({ image }, null, 2), "utf-8");
    console.log("Отображаемое изображение сохранено");
    res.json({ success: true });
  } catch (err) {
    console.error("Ошибка сохранения отображаемого изображения:", err);
    res.status(500).json({ error: err.message });
  }
});

// Очистить отображаемое изображение
app.delete("/api/displayed-image", (req, res) => {
  try {
    writeFileSync(DISPLAYED_IMAGE_FILE, JSON.stringify({ image: null }, null, 2), "utf-8");
    console.log("Отображаемое изображение очищено");
    res.json({ success: true });
  } catch (err) {
    console.error("Ошибка очистки отображаемого изображения:", err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`API сервер запущен на http://localhost:${PORT}`);
  console.log(`Доступен в сети: http://${LOCAL_IP}:${PORT}`);
  console.log(`Файл данных: ${DATA_FILE}`);
});

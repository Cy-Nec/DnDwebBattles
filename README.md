# webDNDBattles — D&D Combat Tracker

Веб-приложение для отслеживания боя в настольных ролевых играх (D&D и другие системы). Позволяет мастеру и игрокам видеть текущее состояние боя: инициативу, здоровье участников и номер раунда.

## Особенности

- **Две роли**: Мастер (DM) и Игрок (Player)
- **Управление участниками**: добавление игроков и NPC
- **Настройка боя**: инициатива, здоровье, отношение (друг/враг)
- **Автоматическая сортировка**: по инициативе
- **Пошаговый режим**: с отображением текущего хода
- **Синхронизация**: игроки видят изменения в реальном времени
- **Сохранение состояния**: данные хранятся в JSON-файле

---

## Технологии

| Категория | Технология |
|-----------|------------|
| Frontend | React 19 |
| Сборка | Vite 7 |
| Backend | Node.js + Express 5 |
| Хранение данных | JSON-файл |

---

## Установка

### 1. Клонирование репозитория

```bash
git clone https://github.com/Cy-Nec/webDNDBattles.git
cd webDNDBattles
```

### 2. Установка зависимостей

```bash
npm install
```

### 3. Запуск приложения

**Вариант А: Через start.bat (Windows)**
```bash
start.bat
```

**Вариант Б: Вручную (два терминала)**

Терминал 1 — сервер API:
```bash
npm run server
```

Терминал 2 — frontend:
```bash
npm run dev
```

### 4. Открыть в браузере

- Локально: http://localhost:5173
- В сети: http://<ваш-IP>:5173

---

## Конфигурация

### Vite (`vite.config.js`)

```js
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',  // Доступ из сети
    port: 5173,       // Порт frontend
    proxy: {
      '/api': 'http://localhost:3001'  // Прокси на API сервер
    }
  }
})
```

### Express сервер (`server.js`)

| Параметр | Значение |
|----------|----------|
| Порт API | 3001 |
| Файл данных | `data/participants.json` |
| CORS | Разрешён для всех источников |

---

## Структура данных

### Файл `data/participants.json`

```json
{
  "participants": [
    {
      "id": 1772334498925,
      "type": "player",
      "name": "Аурелия",
      "hp": 45,
      "initiative": 15,
      "friend": true,
      "inCombat": true,
      "dead": false
    },
    {
      "id": 1772333404518,
      "type": "npc",
      "name": "Гигантская крыса",
      "hp": 3,
      "initiative": 12,
      "friend": false,
      "inCombat": true,
      "dead": false
    }
  ],
  "combatState": {
    "round": 1,
    "currentTurnIndex": 0
  }
}
```

### Поля участника

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | number | Уникальный идентификатор (timestamp) |
| `type` | string | Тип: `"player"` или `"npc"` |
| `name` | string | Имя участника |
| `hp` | number | Текущее здоровье |
| `initiative` | number \| null | Значение инициативы |
| `friend` | boolean | Отношение: `true` — друг, `false` — враг |
| `inCombat` | boolean | Участвует ли в бою |
| `dead` | boolean | Погиб ли участник |

### Состояние боя (`combatState`)

| Поле | Тип | Описание |
|------|-----|----------|
| `round` | number | Номер текущего раунда |
| `currentTurnIndex` | number | Индекс текущей инициативы в отсортированном списке |

---

## API

| Метод | Эндпоинт | Описание |
|-------|----------|----------|
| `GET` | `/api/participants` | Получить всех участников и состояние боя |
| `PUT` | `/api/participants` | Сохранить участников и состояние боя |
| `PUT` | `/api/combat-state` | Обновить только состояние боя |

---

## Структура проекта

```
webDNDBattles/
├── src/
│   ├── App.jsx              # Главный компонент (выбор роли)
│   ├── pages/
│   │   ├── DmPage.jsx       # Панель мастера
│   │   └── PlayerPage.jsx   # Панель игрока
│   ├── components/
│   │   ├── ParticipantCard.jsx  # Карточка участника
│   │   ├── CombatControls.jsx   # Управление боем
│   │   ├── RoundDisplay.jsx     # Отображение раунда
│   │   └── AddParticipantModal.jsx
│   └── utils/
│       └── combatUtils.js   # Функции сортировки и логики боя
├── data/
│   └── participants.json    # Хранилище данных
├── server.js                # Express сервер
├── vite.config.js           # Конфигурация Vite
└── package.json
```

---

## Скрипты

| Команда | Описание |
|---------|----------|
| `npm run dev` | Запуск frontend (Vite) |
| `npm run server` | Запуск API сервера |
| `npm run build` | Сборка production-версии |
| `npm run preview` | Предпросмотр сборки |
| `npm run lint` | Проверка кода ESLint |

---

## Лицензия

MIT

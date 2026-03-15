// Сортировка участников по инициативе
export const sortByInitiative = (participants) => {
  return [...participants].sort(
    (a, b) => (b.initiative || 0) - (a.initiative || 0),
  );
};

// Получение уникальных значений инициативы
export const getUniqueInitiatives = (participants) => {
  return [...new Set(participants.map((p) => p.initiative))].sort(
    (a, b) => b - a,
  );
};

// Определение текущего хода
export const getCurrentTurnParticipants = (
  sortedParticipants,
  uniqueInitiatives,
  currentTurnIndex,
) => {
  const currentInitiative =
    uniqueInitiatives[currentTurnIndex] !== undefined
      ? uniqueInitiatives[currentTurnIndex]
      : null;

  return currentInitiative !== null
    ? sortedParticipants.filter((p) => p.initiative === currentInitiative)
    : [];
};

// Проверка, является ли участник частью текущего хода (с учётом пропуска)
export const isCurrentTurn = (participant, currentTurnParticipants) => {
  // Если участник пропускает ход, он не считается текущим
  if (participant.skipNextTurn) {
    return false;
  }
  return currentTurnParticipants.some((p) => p.id === participant.id);
};

// Определение типа иконки участника
export const getParticipantIcon = (participant) => {
  if (participant.dead) return "💀";
  if (participant.type === "player") return "🎮";
  if (participant.type === "npc") return participant.friend ? "🛡️" : "⚔️";
  return "❓";
};

// Получение класса карточки участника
export const getParticipantCardClass = (
  participant,
  isCombat = false,
  isCurrent = false,
) => {
  const classes = ["participant-card"];

  if (isCombat) classes.push("combat-card");
  if (isCurrent) classes.push("current-turn");

  classes.push(participant.type);

  if (participant.type === "npc") {
    classes.push(participant.friend ? "friend" : "enemy");
  }

  if (participant.dead) classes.push("dead");

  return classes.join(" ");
};

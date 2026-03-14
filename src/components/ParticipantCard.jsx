import { getParticipantIcon } from "../utils/combatUtils";
import "./ParticipantCard.css";

function ParticipantCard({
  participant,
  mode = "normal",
  isCurrent = false,
  onRemove,
  onUpdateInitiative,
  onUpdateHp,
  onChangeHp,
  onDeath,
  onLeaveCombat,
  onRevive,
  onJoinCombat,
  onSkipTurn,
  currentPlayerId,
}) {
  const icon = getParticipantIcon(participant);
  const isCombat = mode === "combat" || mode === "combat-dm";
  const isDead = participant.dead;

  // Режим боя для ДМ
  if (mode === "combat-dm") {
    return (
      <div
        className={`participant-card combat-card ${participant.type} ${participant.type === "npc" ? (participant.friend ? "friend" : "enemy") : ""} ${isCurrent ? "current-turn" : ""} ${participant.skipNextTurn ? "skip-next-turn" : ""}`}
      >
        {isCurrent && <div className="turn-indicator">⚔️ ХОД</div>}
        {participant.skipNextTurn && (
          <div className="skip-indicator">
            <img src="/skip.svg" alt="Пропуск" />
          </div>
        )}
        <div className="initiative-badge">{participant.initiative}</div>
        <div className="participant-info">
          <span className="participant-type">
            {participant.type === "player"
              ? "🎮"
              : participant.friend
                ? "🛡️"
                : "⚔️"}
          </span>
          <span className="participant-name">{participant.name}</span>
        </div>
        <div className="combat-stats">
          <div className="stat-group">
            <label>Иниц.</label>
            <span className="stat-value">{participant.initiative}</span>
          </div>
          <div className="stat-group">
            <label>ХП</label>
            <div className="hp-controls">
              <button
                className="hp-btn"
                onClick={() => onChangeHp(participant.id, -1)}
              >
                −
              </button>
              <span className="stat-value hp-value">❤️ {participant.hp}</span>
              <button
                className="hp-btn"
                onClick={() => onChangeHp(participant.id, 1)}
              >
                +
              </button>
            </div>
          </div>
        </div>
        <div className="combat-actions">
          <button
            className="leave-combat-btn"
            onClick={() => onLeaveCombat(participant.id)}
            title="Выйти из боя"
          >
            🚪
          </button>
          <button
            className="death-btn"
            onClick={() => onDeath(participant.id)}
            title="Смерть"
          >
            💀
          </button>
          <button
            className={`skip-turn-btn ${participant.skipNextTurn ? "active" : ""}`}
            onClick={() => onSkipTurn(participant.id)}
            title={
              participant.skipNextTurn
                ? "Отменить пропуск хода"
                : "Пропустить следующий ход"
            }
          >
            <img src="/skip.svg" alt="Пропуск" />
          </button>
        </div>
      </div>
    );
  }

  // Режим боя для игрока
  if (mode === "combat-player") {
    // Скрывать HP у NPC (игрок не должен видеть здоровье NPC)
    const isNpc = participant.type === "npc";

    return (
      <div
        className={`participant-card combat-card ${participant.type} ${participant.type === "npc" ? (participant.friend ? "friend" : "enemy") : ""} ${isCurrent ? "current-turn" : ""} ${participant.skipNextTurn ? "skip-next-turn" : ""}`}
      >
        {isCurrent && <div className="turn-indicator">⚔️ ХОД</div>}
        {participant.skipNextTurn && (
          <div className="skip-indicator">
            <img src="/skip.svg" alt="Пропуск" />
          </div>
        )}
        <div className="initiative-badge">{participant.initiative}</div>
        <div className="participant-info">
          <span className="participant-type">
            {participant.type === "player"
              ? "🎮"
              : participant.friend
                ? "🛡️"
                : "⚔️"}
          </span>
          <span className="participant-name">{participant.name}</span>
        </div>
        {!isNpc && (
          <div className="hp-display">
            <span className="participant-hp">❤️ {participant.hp}</span>
          </div>
        )}
      </div>
    );
  }

  // Режим погибшего
  if (mode === "dead") {
    return (
      <div className="participant-card dead">
        <div className="participant-info">
          <span className="participant-type">💀</span>
          <span className="participant-name">{participant.name}</span>
        </div>
        <span className="participant-hp">❤️ {participant.hp}</span>
        <div className="card-actions">
          <button
            className="revive-btn"
            onClick={() => onRevive(participant.id)}
            title="Воскресить"
          >
            ✨
          </button>
          <button
            className="remove-dead-btn"
            onClick={() => onRemove(participant.id)}
            title="Удалить"
          >
            ✕
          </button>
        </div>
      </div>
    );
  }

  // Обычный режим (список участников)
  return (
    <div
      className={`participant-card ${participant.type} ${participant.type === "npc" ? (participant.friend ? "friend" : "enemy") : ""} ${isDead ? "dead" : ""}`}
    >
      <div className="participant-info">
        <span className="participant-type">{icon}</span>
        <span className="participant-name">{participant.name}</span>
      </div>
      <div className="participant-stats">
        <div className="stat-group">
          <label>Иниц.</label>
          <div className="input-with-clear">
            <input
              type="number"
              className="stat-input"
              value={participant.initiative ?? ""}
              onChange={(e) =>
                onUpdateInitiative(participant.id, e.target.value)
              }
              min="0"
            />
            {participant.initiative !== null &&
              participant.initiative !== "" && (
                <button
                  className="clear-init-btn"
                  onClick={() => onUpdateInitiative(participant.id, "")}
                  title="Очистить инициативу"
                >
                  ✕
                </button>
              )}
          </div>
        </div>
        <div className="stat-group">
          <label>ХП</label>
          <input
            type="number"
            className="stat-input"
            value={participant.hp}
            onChange={(e) => onUpdateHp(participant.id, e.target.value)}
            min="0"
          />
        </div>
      </div>
      <div className="card-actions">
        {!isDead && onJoinCombat && participant.initiative !== null && (
          <button
            className="join-combat-btn"
            onClick={() => onJoinCombat(participant.id)}
            title="Вступить в бой"
          >
            ⚔️
          </button>
        )}
        {!isDead && (
          <button
            className="remove-button"
            onClick={() => onRemove(participant.id)}
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}

export default ParticipantCard;

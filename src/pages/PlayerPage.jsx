import { useState, useEffect, useRef } from "react";
import "./PlayerPage.css";
import ParticipantCard from "../components/ParticipantCard";
import RoundDisplay from "../components/RoundDisplay";
import { useWakeLock } from "../hooks/useWakeLock";
import { sortByInitiative } from "../utils/combatUtils";

const API_URL = "/api/participants";

function PlayerPage({ onBack, playerId }) {
  const [participants, setParticipants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [round, setRound] = useState(1);
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  const cardRefs = useRef({});

  // Блокировка отключения экрана
  useWakeLock();

  // Загрузка данных
  useEffect(() => {
    fetch(API_URL)
      .then((res) => res.json())
      .then((data) => {
        setParticipants(data.participants || []);
        if (data.combatState) {
          setRound(data.combatState.round || 1);
          setCurrentTurnIndex(data.combatState.currentTurnIndex || 0);
        }
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Ошибка загрузки:", err);
        setIsLoading(false);
      });
  }, []);

  // Обновление данных каждую секунду
  useEffect(() => {
    const interval = setInterval(() => {
      fetch(API_URL, {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
        },
      })
        .then((res) => res.json())
        .then((data) => {
          setParticipants(data.participants || []);
          if (data.combatState) {
            setRound(data.combatState.round || 1);
            setCurrentTurnIndex(data.combatState.currentTurnIndex || 0);
            console.log(
              "PlayerPage: обновлено состояние боя",
              data.combatState,
            );
          }
        })
        .catch((err) => console.error("Ошибка обновления:", err));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const combatParticipants = participants.filter(
    (p) => p.inCombat === true && !p.dead,
  );

  // Фильтруем только участников с инициативой
  const combatParticipantsWithInitiative = combatParticipants.filter(
    (p) => p.initiative !== null && p.initiative !== undefined,
  );
  const sortedCombatParticipants = sortByInitiative(
    combatParticipantsWithInitiative,
  );

  // currentTurnIndex теперь указывает на конкретного участника в sortedCombatParticipants
  const currentTurnParticipant =
    sortedCombatParticipants[currentTurnIndex] || null;

  // Автопрокрутка к текущему участнику при смене хода
  const prevTurnIndexRef = useRef(currentTurnIndex);
  useEffect(() => {
    // Скроллим только если индекс хода изменился
    if (prevTurnIndexRef.current !== currentTurnIndex) {
      prevTurnIndexRef.current = currentTurnIndex;
      
      if (currentTurnIndex !== null && sortedCombatParticipants[currentTurnIndex]) {
        const currentParticipant = sortedCombatParticipants[currentTurnIndex];
        const cardElement = cardRefs.current[currentParticipant.id];

        if (cardElement) {
          // Небольшая задержка чтобы элемент точно отрендерился
          setTimeout(() => {
            cardElement.scrollIntoView({
              behavior: "smooth",
              block: "center",
              inline: "center"
            });
          }, 100);
        }
      }
    }
  }, [currentTurnIndex, sortedCombatParticipants]);

  if (isLoading) {
    return (
      <div className="player-page">
        <div className="loading">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="player-page">
      <div className="player-header">
        <button className="back-button" onClick={onBack}>
          ← На главную
        </button>
        <h1>Бой ({(round - 1) * 6} сек)</h1>
      </div>

      {sortedCombatParticipants.length === 0 ? (
        <div className="no-combat">
          <p>Бой ещё не начался</p>
        </div>
      ) : (
        <>
          <RoundDisplay round={round} />
          <div className="combat-row">
            {sortedCombatParticipants.map((participant) => (
              <div
                key={participant.id}
                ref={(el) => (cardRefs.current[participant.id] = el)}
              >
                <ParticipantCard
                  participant={participant}
                  mode="combat-player"
                  isCurrent={currentTurnParticipant?.id === participant.id}
                  currentPlayerId={playerId}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default PlayerPage;

import { useState, useEffect, useRef } from "react";
import "./PlayerPage.css";
import "../themes.css";
import arrowBackIcon from "/arrow_back.svg?url";
import closeIcon from "/close.svg?url";
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
  const [isPictureMode, setIsPictureMode] = useState(false);
  const [displayedImage, setDisplayedImage] = useState(null);
  const cardRefs = useRef({});

  // Блокировка отключения экрана
  useWakeLock();

  // Загрузка отображаемого изображения с сервера
  useEffect(() => {
    // Первоначальная загрузка
    fetch('/api/displayed-image')
      .then(res => res.json())
      .then(data => {
        console.log('PlayerPage: загружаю изображение с сервера:', data);
        if (data.image) {
          setDisplayedImage(data.image);
          console.log('Загружено изображение:', data.image.name);
        }
      })
      .catch((err) => {
        console.error('Ошибка загрузки изображения:', err);
      });

    // Опрос сервера каждые 2 секунды для обновления изображения
    const interval = setInterval(() => {
      fetch('/api/displayed-image')
        .then(res => res.json())
        .then(data => {
          if (data.image) {
            setDisplayedImage(prevImage => {
              // Обновляем только если изображение изменилось
              if (!prevImage || prevImage.id !== data.image.id) {
                console.log('Изображение обновлено:', data.image.name);
                return data.image;
              }
              return prevImage;
            });
          } else {
            // Изображение удалено
            setDisplayedImage(null);
          }
        })
        .catch((err) => {
          console.error('Ошибка обновления изображения:', err);
        });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

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
  const combatRowRef = useRef(null);

  useEffect(() => {
    // Скроллим только если индекс хода изменился
    if (prevTurnIndexRef.current !== currentTurnIndex) {
      prevTurnIndexRef.current = currentTurnIndex;

      if (currentTurnIndex !== null && sortedCombatParticipants[currentTurnIndex]) {
        const currentParticipant = sortedCombatParticipants[currentTurnIndex];
        const cardElement = cardRefs.current[currentParticipant.id];
        const combatRow = combatRowRef.current;

        if (cardElement && combatRow) {
          // Небольшая задержка чтобы элемент точно отрендерился
          setTimeout(() => {
            const cardRect = cardElement.getBoundingClientRect();
            const containerRect = combatRow.getBoundingClientRect();

            // Вычисляем позицию карточки относительно контента контейнера
            const cardLeftInContainer = cardRect.left - containerRect.left + combatRow.scrollLeft;
            const cardCenter = cardLeftInContainer + (cardRect.width / 2);
            const containerCenter = containerRect.width / 2;
            const targetScroll = cardCenter - containerCenter;

            // Ограничиваем скролл пределами контейнера
            const maxScroll = combatRow.scrollWidth - containerRect.width;
            const scrollLeft = Math.max(0, Math.min(targetScroll, maxScroll));

            combatRow.scrollTo({
              left: scrollLeft,
              behavior: "smooth"
            });
          }, 200);
        }
      }
    }
  }, [currentTurnIndex, sortedCombatParticipants.length, isPictureMode, displayedImage]);

  if (isLoading) {
    return (
      <div className="player-page">
        <div className="loading">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className={`player-page theme-dnd ${isPictureMode ? 'picture-mode' : ''}`}>
      <div className="player-header">
        <button className="back-button" onClick={onBack}>
          <img src={arrowBackIcon} alt="На главную" className="back-icon" />
        </button>
        <h1>Бой ({(round - 1) * 6} сек)</h1>
      </div>

      {/* Изображение в picture mode */}
      {displayedImage && isPictureMode && (
        <div className="displayed-image-container">
          <img src={displayedImage.url} alt={displayedImage.name} className="displayed-image" />
        </div>
      )}

      {sortedCombatParticipants.length === 0 ? (
        <div className="no-combat">
          <p>Бой ещё не начался</p>
        </div>
      ) : (
        <>
          <RoundDisplay round={round} />
          
          <div className="combat-row" ref={combatRowRef}>
            {sortedCombatParticipants.map((participant, index) => {
              // В picture mode показываем только 3 карточки вокруг текущей
              let shouldShowInPictureMode = true;
              
              if (isPictureMode) {
                const prevIndex = (currentTurnIndex - 1 + sortedCombatParticipants.length) % sortedCombatParticipants.length;
                const nextIndex = (currentTurnIndex + 1) % sortedCombatParticipants.length;
                
                shouldShowInPictureMode = (
                  index === currentTurnIndex ||
                  index === prevIndex ||
                  index === nextIndex
                );
              }
              
              return (
                <div
                  key={participant.id}
                  ref={(el) => (cardRefs.current[participant.id] = el)}
                  className="combat-card-container"
                  style={{
                    display: !shouldShowInPictureMode ? 'none' : 'inline-block'
                  }}
                >
                  <ParticipantCard
                    participant={participant}
                    mode="combat-player"
                    isCurrent={currentTurnParticipant?.id === participant.id}
                    currentPlayerId={playerId}
                  />
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Кнопка переключения picture mode */}
      <button
        className={`picture-mode-toggle ${isPictureMode ? 'active' : ''}`}
        onClick={() => setIsPictureMode(!isPictureMode)}
        title={isPictureMode ? 'Выход из режима картинки' : 'Режим картинки'}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      </button>
    </div>
  );
}

export default PlayerPage;

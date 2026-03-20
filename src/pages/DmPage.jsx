import { useState, useEffect } from "react";
import "./DmPage.css";
import "../themes.css";
import menuIcon from "/menu.svg?url"
import arrowBackIcon from "/arrow_back.svg?url"
import swordsIcon from "/swords.svg?url"
import CombatControls from "../components/CombatControls";
import ParticipantCard from "../components/ParticipantCard";
import AddParticipantModal from "../components/AddParticipantModal";
import SideMenu from "../components/SideMenu/SideMenu";
import { useWakeLock } from "../hooks/useWakeLock";
import {
  sortByInitiative,
  getUniqueInitiatives,
  getCurrentTurnParticipants,
  isCurrentTurn,
} from "../utils/combatUtils";

const API_URL = "/api/participants";

function DmPage({ onBack }) {
  const [participants, setParticipants] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCombatMode, setIsCombatMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [round, setRound] = useState(1);
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
  const [images, setImages] = useState([]);

  // Блокировка отключения экрана
  useWakeLock();

  // Загрузка участников и состояния боя при монтировании
  useEffect(() => {
    Promise.all([
      fetch(API_URL).then(res => res.json()),
      fetch('/api/images').then(res => res.json())
    ]).then(([participantsData, imagesData]) => {
      setParticipants(participantsData.participants || []);
      setImages(imagesData.images || []);
      if (participantsData.combatState) {
        setRound(participantsData.combatState.round || 1);
        setCurrentTurnIndex(participantsData.combatState.currentTurnIndex || 0);
      }
      setIsLoading(false);
    }).catch((err) => {
      console.error("Ошибка загрузки данных:", err);
      setIsLoading(false);
    });
  }, []);

  // Сохранение участников при изменении
  useEffect(() => {
    if (!isLoading) {
      fetch(API_URL, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
        },
        body: JSON.stringify({
          participants,
          combatState: { round, currentTurnIndex },
        }),
      })
        .then((res) => res.json())
        .then((data) => console.log("DmPage: участники сохранены", data))
        .catch((err) => console.error("Ошибка сохранения участников:", err));
    }
  }, [participants, isLoading, round, currentTurnIndex]);

  const handleAddParticipant = (participantData) => {
    setParticipants([
      ...participants,
      {
        ...participantData,
        id: Date.now(),
        initiative: null,
        inCombat: false,
      },
    ]);
    setIsModalOpen(false);
  };

  const handleRemoveParticipant = (id) => {
    setParticipants(participants.filter((p) => p.id !== id));
  };

  const handleUpdateInitiative = (id, value) => {
    setParticipants(
      participants.map((p) =>
        p.id === id
          ? { ...p, initiative: value === "" ? null : parseInt(value) }
          : p,
      ),
    );
  };

  const handleUpdateHp = (id, value) => {
    setParticipants(
      participants.map((p) =>
        p.id === id
          ? { ...p, hp: Math.max(0, value === "" ? 0 : parseInt(value)) }
          : p,
      ),
    );
  };

  const handleChangeHp = (id, delta) => {
    setParticipants(
      participants.map((p) =>
        p.id === id ? { ...p, hp: Math.max(0, p.hp + delta) } : p,
      ),
    );
  };

  const handleDeath = (id) => {
    setParticipants(
      participants.map((p) =>
        p.id === id
          ? { ...p, dead: true, initiative: null, inCombat: false }
          : p,
      ),
    );
  };

  const handleLeaveCombat = (id) => {
    // Выйти из боя и сбросить инициативу
    setParticipants(
      participants.map((p) =>
        p.id === id ? { ...p, inCombat: false, initiative: null } : p,
      ),
    );
  };

  const handleJoinCombat = (id) => {
    setParticipants(
      participants.map((p) => (p.id === id ? { ...p, inCombat: true } : p)),
    );
  };

  const handleRevive = (id) => {
    setParticipants(
      participants.map((p) => (p.id === id ? { ...p, dead: false } : p)),
    );
  };

  const handleSkipTurn = (id, rounds = 1) => {
    setParticipants(
      participants.map((p) => {
        if (p.id !== id) return p;
        // Если rounds === 0, отменяем пропуск
        if (rounds === 0) {
          return { ...p, skipNextTurn: false, skipTurnsCount: undefined };
        }
        // Если уже установлен пропуск, обновляем значение
        if (p.skipNextTurn) {
          return { ...p, skipNextTurn: true, skipTurnsCount: rounds };
        }
        // Иначе устанавливаем пропуск с указанным количеством ходов
        return { ...p, skipNextTurn: true, skipTurnsCount: rounds };
      }),
    );
  };

  const handleToggleStatus = (id, statusId) => {
    setParticipants(
      participants.map((p) => {
        if (p.id !== id) return p;
        const currentStatuses = p.statuses || [];
        const newStatuses = currentStatuses.includes(statusId)
          ? currentStatuses.filter((s) => s !== statusId)
          : [...currentStatuses, statusId];
        return { ...p, statuses: newStatuses };
      }),
    );
  };

  const handleAddImage = (imageData) => {
    setImages([...images, imageData]);
  };

  const handleRemoveImage = async (id) => {
    try {
      const response = await fetch(`/api/images/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setImages(images.filter((img) => img.id !== id));
      }
    } catch (error) {
      console.error('Ошибка удаления изображения:', error);
    }
  };

  const handleShowImage = async (image) => {
    // Отправляем изображение на сервер для отображения на странице игрока
    try {
      const response = await fetch('/api/displayed-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(image)
      });
      
      if (response.ok) {
        console.log('Изображение отправлено на сервер:', image.name);
      }
    } catch (e) {
      console.error('Ошибка отправки изображения:', e);
    }
  };

  const hasInitiative = participants.some((p) => p.initiative !== null);
  const combatParticipants = participants.filter((p) => p.inCombat === true);
  const nonCombatParticipants = participants.filter((p) => p.inCombat !== true && !p.dead);
  const deadParticipants = participants.filter((p) => p.dead);

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

  const startCombat = () => {
    setParticipants(
      participants.map((p) =>
        p.initiative !== null && !p.dead ? { ...p, inCombat: true } : p,
      ),
    );
    setRound(1);
    setCurrentTurnIndex(0);
    setIsCombatMode(true);
  };

  const endCombat = () => {
    // Сбросить участие в бою и инициативу у всех участников
    setParticipants(
      participants.map((p) => ({ ...p, inCombat: false, initiative: null })),
    );
    setIsCombatMode(false);
    setRound(1);
    setCurrentTurnIndex(0);
  };

  const endTurn = () => {
    if (sortedCombatParticipants.length === 0) return;

    let nextIndex = currentTurnIndex + 1;
    const updates = new Map();

    // Пропускаем участников, которые пропускают ход
    while (nextIndex < sortedCombatParticipants.length) {
      const nextParticipant = sortedCombatParticipants[nextIndex];

      if (nextParticipant.skipNextTurn) {
        const skipTurnsCount = nextParticipant.skipTurnsCount || 1;
        const newSkipTurnsCount = skipTurnsCount - 1;

        updates.set(nextParticipant.id, {
          skipNextTurn: newSkipTurnsCount > 0,
          skipTurnsCount: newSkipTurnsCount > 0 ? newSkipTurnsCount : undefined,
        });

        if (newSkipTurnsCount > 0) {
          // Ещё есть пропуски, идём дальше
          nextIndex++;
        } else {
          // Счётчик исчерпан, останавливаемся на этом участнике
          break;
        }
      } else {
        // Участник активен, останавливаемся
        break;
      }
    }

    // Применяем все обновления одним вызовом
    if (updates.size > 0) {
      setParticipants((prev) =>
        prev.map((p) =>
          updates.has(p.id) ? { ...p, ...updates.get(p.id) } : p,
        ),
      );
    }

    // Проверка на конец круга
    if (nextIndex >= sortedCombatParticipants.length) {
      setRound(round + 1);
      setCurrentTurnIndex(0);
    } else {
      setCurrentTurnIndex(nextIndex);
    }
  };

  return (
    <div className="dm-page theme-dnd">
      <div className="dm-header">
        <button className="back-button" onClick={onBack}>
          <img src={arrowBackIcon} alt="На главную" className="back-icon" />
        </button>
        <h1>Панель Мастера</h1>
        <button className="menu-button" onClick={() => setIsSideMenuOpen(true)}>
          <img src={menuIcon} alt="Меню" />
        </button>
      </div>

      {/* Боковое меню */}
      <SideMenu
        isOpen={isSideMenuOpen}
        onClose={() => setIsSideMenuOpen(false)}
        onEndCombat={endCombat}
        isCombatMode={isCombatMode}
        wantedParticipants={participants}
        onAddWantedParticipant={(participant) => {
          setParticipants([
            ...participants,
            {
              ...participant,
              id: Date.now(),
              initiative: null,
              inCombat: false,
              statuses: []
            }
          ])
        }}
        onRemoveWantedParticipant={(id) => {
          setParticipants(participants.filter(p => p.id !== id))
        }}
        onEditWantedParticipant={(participant) => {
          setParticipants(participants.map(p =>
            p.id === participant.id ? participant : p
          ))
        }}
        onJoinCombat={(id, initiative) => {
          setParticipants(participants.map(p =>
            p.id === id ? {
              ...p,
              inCombat: true,
              initiative: initiative !== null && initiative !== undefined ? initiative : p.initiative
            } : p
          ))
        }}
        onReviveWantedParticipant={(id) => {
          setParticipants(participants.map(p =>
            p.id === id ? { ...p, dead: false } : p
          ))
        }}
        images={images}
        onAddImage={handleAddImage}
        onRemoveImage={handleRemoveImage}
        onShowImage={handleShowImage}
      />

      {isCombatMode && (
        <CombatControls
          round={round}
          onEndTurn={endTurn}
          onEndCombat={endCombat}
        />
      )}

      {!isCombatMode && (
        <>
          <div className="section-title">Участники</div>
          <div className="participants-row">
            {participants.map((participant) => (
              <ParticipantCard
                key={participant.id}
                participant={participant}
                mode="normal"
                onRemove={handleRemoveParticipant}
                onUpdateInitiative={handleUpdateInitiative}
                onUpdateHp={handleUpdateHp}
              />
            ))}
          </div>

          {hasInitiative && (
            <button className="start-combat-button" onClick={startCombat} title="Начать бой">
              <img src={swordsIcon} alt="Начать бой" className="swords-icon" />
            </button>
          )}
          {!hasInitiative && (
            <button className="start-combat-button disabled" disabled title="Добавьте инициативу участникам">
              <img src={swordsIcon} alt="Начать бой" className="swords-icon" />
            </button>
          )}
        </>
      )}

      {isCombatMode && (
        <>
          <div className="section-title">Бой ({(round - 1) * 6} сек)</div>
          <div className="combat-row">
            {sortedCombatParticipants.map((participant) => (
              <ParticipantCard
                key={participant.id}
                participant={participant}
                mode="combat-dm"
                isCurrent={currentTurnParticipant?.id === participant.id}
                onChangeHp={handleChangeHp}
                onLeaveCombat={handleLeaveCombat}
                onDeath={handleDeath}
                onSkipTurn={handleSkipTurn}
                onToggleStatus={handleToggleStatus}
              />
            ))}
          </div>

          {nonCombatParticipants.length > 0 && (
            <>
              <div className="section-title">Не участвуют в бою</div>
              <div className="participants-row non-combat">
                {nonCombatParticipants.map((participant) => (
                  <ParticipantCard
                    key={participant.id}
                    participant={participant}
                    mode="normal"
                    onRemove={handleRemoveParticipant}
                    onUpdateInitiative={handleUpdateInitiative}
                    onUpdateHp={handleUpdateHp}
                    onJoinCombat={handleJoinCombat}
                  />
                ))}
              </div>
            </>
          )}

          {deadParticipants.length > 0 && (
            <>
              <div className="section-title">Погибшие</div>
              <div className="participants-row dead">
                {deadParticipants.map((participant) => (
                  <ParticipantCard
                    key={participant.id}
                    participant={participant}
                    mode="dead"
                    onRemove={handleRemoveParticipant}
                    onRevive={handleRevive}
                  />
                ))}
              </div>
            </>
          )}
        </>
      )}

      <AddParticipantModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddParticipant}
      />
    </div>
  );
}

export default DmPage;

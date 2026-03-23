import { useState, useEffect } from "react";
import "./WantedSection.css";
import addIcon from "/add.svg?url";

function WantedSection({
  participants = [],
  onAddParticipant,
  onRemoveParticipant,
  onEditParticipant,
  onJoinCombat,
  onReviveParticipant,
}) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newHp, setNewHp] = useState("");
  const [newType, setNewType] = useState("player");
  const [contextMenu, setContextMenu] = useState(null);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isInitiativeModalOpen, setIsInitiativeModalOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editHp, setEditHp] = useState("");
  const [editType, setEditType] = useState("player");
  const [editInitiative, setEditInitiative] = useState("");
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

  const handleAdd = () => {
    if (newName.trim()) {
      const participantData = {
        name: newName.trim(),
        hp: parseInt(newHp) || 10,
      };

      console.log("handleAdd вызван, newType:", newType);

      // Для NPC устанавливаем дополнительный флаг friend
      if (newType === "player") {
        participantData.type = "player";
      } else if (newType === "friend") {
        participantData.type = "npc";
        participantData.friend = true;
      } else if (newType === "enemy") {
        participantData.type = "npc";
        participantData.friend = false;
      }

      console.log("Добавляем участника:", participantData);

      onAddParticipant(participantData);
      setNewName("");
      setNewHp("");
      setIsAddModalOpen(false);
    }
  };

  const openEditModal = (participant) => {
    console.log("Открываем редактирование для:", participant);
    setEditName(participant.name);
    setEditHp(participant.hp.toString());
    // Маппим тип участника на тип для кнопок
    let mappedType = "player";
    if (participant.type === "friend") mappedType = "friend";
    else if (participant.type === "enemy") mappedType = "enemy";
    else if (participant.type === "npc") {
      // Если npc, проверяем friend флаг
      mappedType = participant.friend ? "friend" : "enemy";
    }
    setEditType(mappedType);
    setSelectedParticipant(participant);
    setIsEditModalOpen(true);
    setContextMenu(null);
  };

  const handleEdit = () => {
    if (selectedParticipant && editName.trim()) {
      onEditParticipant({
        ...selectedParticipant,
        name: editName.trim(),
        hp: parseInt(editHp) || 10,
        type: editType,
      });
      setIsEditModalOpen(false);
      setSelectedParticipant(null);
    }
  };

  const openInitiativeModal = (participant) => {
    console.log("Открываем модальное окно инициативы для:", participant);
    setEditInitiative(participant.initiative?.toString() ?? "");
    setSelectedParticipant(participant);
    setIsInitiativeModalOpen(true);
    setContextMenu(null);
  };

  const handleInitiativeSubmit = () => {
    console.log(
      "handleInitiativeSubmit вызвана",
      selectedParticipant,
      editInitiative,
    );
    if (selectedParticipant) {
      const initiative =
        editInitiative !== "" &&
        editInitiative !== null &&
        editInitiative !== undefined
          ? parseInt(editInitiative)
          : null;
      console.log("Инициатива:", initiative, "editInitiative:", editInitiative);
      onJoinCombat(selectedParticipant.id, initiative);
      setIsInitiativeModalOpen(false);
      setSelectedParticipant(null);
    }
  };

  const handleResetInitiative = () => {
    if (selectedParticipant) {
      console.log("Сброс инициативы для:", selectedParticipant);
      onJoinCombat(selectedParticipant.id, null);
      setContextMenu(null);
      setSelectedParticipant(null);
    }
  };

  const handleRevive = () => {
    if (selectedParticipant) {
      onReviveParticipant(selectedParticipant.id);
      setContextMenu(null);
      setSelectedParticipant(null);
    }
  };

  const handleContextMenu = (e, participant) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedParticipant(participant);

    // Получаем позицию относительно .wanted-section
    const section = e.currentTarget.closest(".wanted-section");
    const sectionRect = section.getBoundingClientRect();
    const sectionWidth = sectionRect.width;

    const menuWidth = 180;
    const offsetX = 10;
    const offsetY = 10;

    // Позиция курсора относительно секции
    const cursorX = e.clientX - sectionRect.left;

    // Проверяем, помещается ли меню слева от курсора
    const x =
      cursorX - menuWidth - offsetX < 0
        ? cursorX + offsetX // Если не помещается слева, открываем справа
        : cursorX - menuWidth - offsetX; // Иначе слева
    const y = e.clientY - sectionRect.top + offsetY;

    console.log("Позиция:", { x, y, cursorX, sectionWidth, menuWidth });

    setContextMenu({ x, y });
  };

  useEffect(() => {
    const handleGlobalClick = (e) => {
      // Не закрываем при клике на само меню или модальное окно
      if (
        e.target.closest(".wanted-context-menu") ||
        e.target.closest(".wanted-modal") ||
        e.target.closest(".wanted-modal-backdrop")
      )
        return;
      closeContextMenu();
    };

    // Используем setTimeout чтобы не срабатывало сразу при открытии
    setTimeout(() => {
      document.addEventListener("click", handleGlobalClick, { capture: true });
    }, 100);

    return () => {
      document.removeEventListener("click", handleGlobalClick, {
        capture: true,
      });
    };
  }, []);

  const closeContextMenu = () => {
    setContextMenu(null);
    setSelectedParticipant(null);
  };

  const handleRemove = () => {
    if (selectedParticipant) {
      onRemoveParticipant(selectedParticipant.id);
      closeContextMenu();
    }
  };

  return (
    <div className="wanted-section">
      <div className="wanted-content">
        {participants.length === 0 ? (
          <p className="wanted-placeholder">Нет участников</p>
        ) : (
          <div className="wanted-cards">
            {participants
              .slice()
              .sort((a, b) => {
                // Сначала игроки, потом остальные
                if (a.type === "player" && b.type !== "player") return -1;
                if (a.type !== "player" && b.type === "player") return 1;
                // Затем по статусу (живые перед мёртвыми)
                if (a.dead && !b.dead) return 1;
                if (!a.dead && b.dead) return -1;
                // Затем по алфавиту
                return a.name.localeCompare(b.name);
              })
              .map((participant, index) => (
                <div
                  key={participant.id || index}
                  className={`wanted-card ${participant.dead ? "dead" : ""}`}
                  onContextMenu={(e) => handleContextMenu(e, participant)}
                >
                  <div className="wanted-card-name">{participant.name}</div>
                  <div className="wanted-card-hp">HP: {participant.hp}</div>
                  <div
                    className={`wanted-card-type type-${participant.type === "player" ? "player" : participant.friend ? "friend" : "enemy"}`}
                  >
                    {participant.type === "player"
                      ? "Игрок"
                      : participant.friend
                        ? "Союзник"
                        : "Враг"}
                  </div>
                  {participant.dead && (
                    <div className="wanted-card-dead">Мёртв</div>
                  )}
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Кнопка добавления */}
      <button
        className="wanted-add-btn"
        onClick={() => setIsAddModalOpen(true)}
      >
        <img src={addIcon} alt="Добавить" className="wanted-add-icon" />
      </button>

      {/* Контекстное меню */}
      {contextMenu && selectedParticipant && (
        <div
          className="wanted-context-menu"
          style={{
            top: contextMenu.y,
            left: contextMenu.x,
          }}
        >
          <button
            className="context-menu-item"
            onClick={() => openEditModal(selectedParticipant)}
          >
            Изменить
          </button>
          {selectedParticipant.dead ? (
            <button className="context-menu-item revive" onClick={handleRevive}>
              Возродить
            </button>
          ) : selectedParticipant.initiative !== null &&
            selectedParticipant.initiative !== undefined ? (
            <button
              className="context-menu-item"
              onClick={handleResetInitiative}
            >
              Сброс инициативы
            </button>
          ) : (
            <button
              className="context-menu-item"
              onClick={() => openInitiativeModal(selectedParticipant)}
            >
              В бой
            </button>
          )}
          <button className="context-menu-item danger" onClick={handleRemove}>
            Удалить
          </button>
        </div>
      )}

      {/* Модальное окно редактирования */}
      {isEditModalOpen && (
        <div
          className="wanted-modal-backdrop"
          onClick={() => setIsEditModalOpen(false)}
        >
          <div className="wanted-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Редактировать участника</h3>

            <div className="wanted-form-group">
              <label>Имя</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Введите имя"
                autoFocus
              />
            </div>

            <div className="wanted-form-group">
              <label>HP</label>
              <input
                type="number"
                value={editHp}
                onChange={(e) => setEditHp(e.target.value)}
                placeholder="10"
              />
            </div>

            <div className="wanted-form-group">
              <label>Тип</label>
              <div className="wanted-type-selector">
                <button
                  className={`wanted-type-btn ${editType === "player" ? "active" : ""}`}
                  onClick={() => setEditType("player")}
                >
                  Игрок
                </button>
                <button
                  className={`wanted-type-btn ${editType === "friend" ? "active" : ""}`}
                  onClick={() => setEditType("friend")}
                >
                  Союзник
                </button>
                <button
                  className={`wanted-type-btn ${editType === "enemy" ? "active" : ""}`}
                  onClick={() => setEditType("enemy")}
                >
                  Враг
                </button>
              </div>
            </div>

            <div className="wanted-modal-actions">
              <button
                className="wanted-cancel-btn"
                onClick={() => setIsEditModalOpen(false)}
              >
                Отмена
              </button>
              <button className="wanted-confirm-btn" onClick={handleEdit}>
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно инициативы */}
      {isInitiativeModalOpen && (
        <div
          className="wanted-modal-backdrop"
          onClick={() => setIsInitiativeModalOpen(false)}
        >
          <div
            className="wanted-modal wanted-modal-small"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Инициатива</h3>

            <div className="wanted-form-group">
              <label>Значение</label>
              <input
                type="number"
                value={editInitiative}
                onChange={(e) => setEditInitiative(e.target.value)}
                placeholder="0"
                autoFocus
              />
            </div>

            <div className="wanted-modal-actions">
              <button
                className="wanted-cancel-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsInitiativeModalOpen(false);
                }}
              >
                Отмена
              </button>
              <button
                className="wanted-confirm-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleInitiativeSubmit();
                }}
              >
                В бой
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно добавления */}
      {isAddModalOpen && (
        <div
          className="wanted-modal-backdrop"
          onClick={() => setIsAddModalOpen(false)}
        >
          <div className="wanted-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Добавить участника</h3>

            <div className="wanted-form-group">
              <label>Имя</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Введите имя"
                autoFocus
              />
            </div>

            <div className="wanted-form-group">
              <label>HP</label>
              <input
                type="number"
                value={newHp}
                onChange={(e) => setNewHp(e.target.value)}
                placeholder="10"
              />
            </div>

            <div className="wanted-form-group">
              <label>Тип</label>
              <div className="wanted-type-selector">
                <button
                  className={`wanted-type-btn ${newType === "player" ? "active" : ""}`}
                  onClick={() => setNewType("player")}
                >
                  Игрок
                </button>
                <button
                  className={`wanted-type-btn ${newType === "friend" ? "active" : ""}`}
                  onClick={() => setNewType("friend")}
                >
                  Союзник
                </button>
                <button
                  className={`wanted-type-btn ${newType === "enemy" ? "active" : ""}`}
                  onClick={() => setNewType("enemy")}
                >
                  Враг
                </button>
              </div>
            </div>

            <div className="wanted-modal-actions">
              <button
                className="wanted-cancel-btn"
                onClick={() => setIsAddModalOpen(false)}
              >
                Отмена
              </button>
              <button className="wanted-confirm-btn" onClick={handleAdd}>
                Добавить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default WantedSection;

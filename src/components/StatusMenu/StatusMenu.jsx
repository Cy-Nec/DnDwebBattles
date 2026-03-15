import { useState, useRef, useEffect } from "react";
import { statusesConfig } from "../../config/statusesConfig";
import "./StatusMenu.css";

function StatusMenu({ participant, onToggleStatus, onOpenChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  // Закрытие меню при клике вне его
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Уведомление родителя об изменении состояния меню
  useEffect(() => {
    if (onOpenChange) {
      onOpenChange(isOpen);
    }
  }, [isOpen, onOpenChange]);

  const handleToggle = (statusId) => {
    const status = statusesConfig.find((s) => s.id === statusId);
    const activeStatuses = participant.statuses || [];
    const isAdding = !activeStatuses.includes(statusId);

    // Воспроизведение звука при добавлении статуса
    if (isAdding && status?.sound) {
      const audio = new Audio(status.sound);
      audio
        .play()
        .catch((err) =>
          console.log("Звук статуса:", status.label, err.message),
        );
    }

    onToggleStatus(participant.id, statusId);
  };

  const activeStatuses = participant.statuses || [];

  return (
    <div className={`status-menu ${isOpen ? "open" : ""}`} ref={menuRef}>
      <button
        className="status-menu-btn"
        onClick={() => setIsOpen(!isOpen)}
        title="Состояния"
      >
        <img src="/statuses/menu.svg" alt="Состояния" />
      </button>

      {isOpen && (
        <div className="status-menu-dropdown">
          {statusesConfig.map((status) => {
            const isActive = activeStatuses.includes(status.id);
            return (
              <button
                key={status.id}
                className={`status-menu-item ${isActive ? "active" : ""}`}
                onClick={() => handleToggle(status.id)}
                style={{
                  "--status-color": status.color,
                }}
              >
                <img
                  src={isActive ? status.icon : `/statuses/menu.svg`}
                  alt={status.label}
                  className="status-icon"
                />
                <span className="status-label">{status.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default StatusMenu;

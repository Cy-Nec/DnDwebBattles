import { useState, useEffect, useRef } from "react";
import { parseMarkdown } from "../../utils/parseMarkdown.jsx";
import "./StatusTooltip.css";

function StatusTooltip({ status }) {
  const [position, setPosition] = useState("right");
  const tooltipRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (tooltipRef.current) {
        const tooltip = tooltipRef.current;
        const rect = tooltip.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // Проверяем, помещается ли подсказка справа (с отступом 5px)
        const spaceOnRight = viewportWidth - e.clientX - 5;
        const needsLeftPosition = spaceOnRight < rect.width;

        setPosition(needsLeftPosition ? "left" : "right");

        // Позиционируем левый край подсказки в позицию курсора + 10px отступа
        tooltip.style.left = `${e.clientX + 10}px`;

        // Центрируем по вертикали относительно курсора
        tooltip.style.top = `${e.clientY}px`;

        // Не даём подсказке выйти за верх/низ экрана
        if (rect.height > viewportHeight) {
          tooltip.style.top = "0";
          tooltip.style.maxHeight = `${viewportHeight - 20}px`;
        } else if (e.clientY + rect.height / 2 > viewportHeight) {
          tooltip.style.top = `${viewportHeight - rect.height - 10}px`;
        } else if (e.clientY - rect.height / 2 < 0) {
          tooltip.style.top = "10px";
        }
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    return () => document.removeEventListener("mousemove", handleMouseMove);
  }, []);

  if (!status?.description) return null;

  return (
    <div
      className={`status-tooltip ${position === "left" ? "position-left" : ""}`}
      style={{ "--status-color": status.color }}
      ref={tooltipRef}
    >
      <div className="status-tooltip-title">{status.label}</div>
      <div className="status-tooltip-description">
        {parseMarkdown(status.description)}
      </div>
    </div>
  );
}

export default StatusTooltip;

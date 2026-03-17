import { useState, useEffect, useRef } from "react";
import { parseMarkdown } from "../../utils/parseMarkdown.jsx";
import "./StatusTooltip.css";

function StatusTooltip({ status }) {
  const tooltipRef = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const updatePosition = () => {
    if (tooltipRef.current) {
      const tooltip = tooltipRef.current;
      const iconWrapper = tooltipRef.current.parentElement;

      if (iconWrapper) {
        const viewportWidth = window.innerWidth;

        // Отступы от краёв экрана
        const edgePadding = 10;
        // Минимальный отступ от иконки
        const iconGap = 2;

        // Временно делаем видимым для расчёта размеров
        tooltip.style.visibility = 'visible';
        tooltip.style.opacity = '0';
        
        const tooltipWidth = tooltip.offsetWidth;
        const tooltipHeight = tooltip.offsetHeight;

        // Возвращаем скрытие
        tooltip.style.visibility = 'hidden';
        tooltip.style.opacity = '0';

        // Позиционируем по вертикали — выравниваем по верху иконки
        let newTop = 0;
        
        // Позиционируем по горизонтали — справа от иконки
        let newLeft = iconWrapper.offsetWidth + iconGap;

        // Проверяем, не выходит ли за правый край экрана
        const iconRect = iconWrapper.getBoundingClientRect();
        if (iconRect.right + tooltipWidth + iconGap > viewportWidth - edgePadding) {
          // Позиционируем слева от иконки
          newLeft = -tooltipWidth - iconGap;
        }

        setPosition({ top: newTop, left: newLeft });
      }
    }
  };

  useEffect(() => {
    updatePosition();
    
    // Пересчитываем позицию при изменении размера окна и скролле
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, []);

  if (!status?.description) return null;

  return (
    <div
      className="status-tooltip"
      style={{ 
        "--status-color": status.color,
        top: `${position.top}px`,
        left: `${position.left}px`
      }}
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

import RoundDisplay from './RoundDisplay'
import swordRoseIcon from "/sword_rose.svg?url"
import './CombatControls.css'

function CombatControls({ round, onEndTurn, onEndCombat }) {
  return (
    <div className="combat-controls">
      <RoundDisplay round={round} />
      <button className="end-turn-button" onClick={onEndTurn}>
        Конец хода
      </button>
      <button className="end-combat-button" onClick={onEndCombat} title="Завершить бой">
        <img src={swordRoseIcon} alt="Завершить бой" className="sword-rose-icon" />
      </button>
    </div>
  )
}

export default CombatControls

import { useState, useRef, useEffect } from 'react'
import './SkipTurnModal.css'

function SkipTurnModal({ isOpen, onClose, onConfirm, defaultRounds = 1 }) {
  const [rounds, setRounds] = useState(defaultRounds)
  const inputRef = useRef(null)

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isOpen])

  const handleSubmit = (e) => {
    e.preventDefault()
    const value = parseInt(rounds) || 1
    onConfirm(Math.max(1, value))
    onClose()
  }

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="skip-turn-modal-backdrop" onClick={handleBackdropClick}>
      <div className="skip-turn-modal">
        <h3>Пропуск хода</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="skip-rounds">Количество ходов:</label>
            <input
              ref={inputRef}
              id="skip-rounds"
              type="number"
              min="1"
              max="10"
              value={rounds}
              onChange={(e) => setRounds(e.target.value)}
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Отмена
            </button>
            <button type="submit" className="confirm-btn">
              Пропустить
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default SkipTurnModal

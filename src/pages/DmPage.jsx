import { useState, useEffect } from 'react'
import './DmPage.css'
import CombatControls from '../components/CombatControls'
import ParticipantCard from '../components/ParticipantCard'
import AddParticipantModal from '../components/AddParticipantModal'
import {
  sortByInitiative,
  getUniqueInitiatives,
  getCurrentTurnParticipants,
  isCurrentTurn
} from '../utils/combatUtils'

const API_URL = '/api/participants'

function DmPage({ onBack }) {
  const [participants, setParticipants] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCombatMode, setIsCombatMode] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [round, setRound] = useState(1)
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0)

  // Загрузка участников и состояния боя при монтировании
  useEffect(() => {
    fetch(API_URL)
      .then(res => res.json())
      .then(data => {
        setParticipants(data.participants || [])
        if (data.combatState) {
          setRound(data.combatState.round || 1)
          setCurrentTurnIndex(data.combatState.currentTurnIndex || 0)
        }
        setIsLoading(false)
      })
      .catch(err => {
        console.error('Ошибка загрузки участников:', err)
        setIsLoading(false)
      })
  }, [])

  // Сохранение участников при изменении
  useEffect(() => {
    if (!isLoading) {
      fetch(API_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        },
        body: JSON.stringify({ participants, combatState: { round, currentTurnIndex } })
      })
      .then(res => res.json())
      .then(data => console.log('DmPage: участники сохранены', data))
      .catch(err => console.error('Ошибка сохранения участников:', err))
    }
  }, [participants, isLoading, round, currentTurnIndex])

  const handleAddParticipant = (participantData) => {
    setParticipants([...participants, {
      ...participantData,
      id: Date.now(),
      initiative: null,
      inCombat: false
    }])
    setIsModalOpen(false)
  }

  const handleRemoveParticipant = (id) => {
    setParticipants(participants.filter(p => p.id !== id))
  }

  const handleUpdateInitiative = (id, value) => {
    setParticipants(participants.map(p =>
      p.id === id ? { ...p, initiative: value === '' ? null : parseInt(value) } : p
    ))
  }

  const handleUpdateHp = (id, value) => {
    setParticipants(participants.map(p =>
      p.id === id ? { ...p, hp: Math.max(0, value === '' ? 0 : parseInt(value)) } : p
    ))
  }

  const handleChangeHp = (id, delta) => {
    setParticipants(participants.map(p =>
      p.id === id ? { ...p, hp: Math.max(0, p.hp + delta) } : p
    ))
  }

  const handleDeath = (id) => {
    const participant = participants.find(p => p.id === id)
    if (participant) {
      if (participant.type === 'player') {
        setParticipants(participants.map(p =>
          p.id === id ? { ...p, dead: true, initiative: null, inCombat: false } : p
        ))
      } else {
        setParticipants(participants.filter(p => p.id !== id))
      }
    }
  }

  const handleLeaveCombat = (id) => {
    setParticipants(participants.map(p =>
      p.id === id ? { ...p, inCombat: false } : p
    ))
  }

  const handleJoinCombat = (id) => {
    setParticipants(participants.map(p =>
      p.id === id ? { ...p, inCombat: true } : p
    ))
  }

  const handleRevive = (id) => {
    setParticipants(participants.map(p =>
      p.id === id ? { ...p, dead: false } : p
    ))
  }

  const hasInitiative = participants.some(p => p.initiative !== null)
  const combatParticipants = participants.filter(p => p.inCombat === true)
  const nonCombatParticipants = participants.filter(p => p.inCombat !== true)
  const deadParticipants = participants.filter(p => p.dead)

  const sortedCombatParticipants = sortByInitiative(combatParticipants)
  const uniqueInitiatives = getUniqueInitiatives(sortedCombatParticipants)
  const currentTurnParticipants = getCurrentTurnParticipants(sortedCombatParticipants, uniqueInitiatives, currentTurnIndex)

  const startCombat = () => {
    setParticipants(participants.map(p =>
      p.initiative !== null && !p.dead ? { ...p, inCombat: true } : p
    ))
    setRound(1)
    setCurrentTurnIndex(0)
    setIsCombatMode(true)
  }

  const endCombat = () => {
    setParticipants(participants.map(p => ({ ...p, inCombat: false })))
    setIsCombatMode(false)
    setRound(1)
    setCurrentTurnIndex(0)
  }

  const endTurn = () => {
    if (uniqueInitiatives.length === 0) return

    const nextIndex = currentTurnIndex + 1
    if (nextIndex >= uniqueInitiatives.length) {
      setRound(round + 1)
      setCurrentTurnIndex(0)
    } else {
      setCurrentTurnIndex(nextIndex)
    }
  }

  return (
    <div className="dm-page">
      <div className="dm-header">
        <button className="back-button" onClick={onBack}>
          ← На главную
        </button>
        <h1>Панель Мастера</h1>
      </div>

      <button className="add-button" onClick={() => setIsModalOpen(true)}>
        + Добавить участника
      </button>

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
            {participants.map(participant => (
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
            <button className="start-combat-button" onClick={startCombat}>
              ⚔️ Начать бой
            </button>
          )}
        </>
      )}

      {isCombatMode && (
        <>
          <div className="section-title">Бой</div>
          <div className="combat-row">
            {sortedCombatParticipants.map(participant => (
              <ParticipantCard
                key={participant.id}
                participant={participant}
                mode="combat-dm"
                isCurrent={isCurrentTurn(participant, currentTurnParticipants)}
                onChangeHp={handleChangeHp}
                onLeaveCombat={handleLeaveCombat}
                onDeath={handleDeath}
              />
            ))}
          </div>

          {nonCombatParticipants.length > 0 && (
            <>
              <div className="section-title">Не участвуют в бою</div>
              <div className="participants-row non-combat">
                {nonCombatParticipants.map(participant => (
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
                {deadParticipants.map(participant => (
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
  )
}

export default DmPage

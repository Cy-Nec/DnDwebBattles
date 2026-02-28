import { useState, useEffect } from 'react'
import './PlayerPage.css'
import ParticipantCard from '../components/ParticipantCard'
import RoundDisplay from '../components/RoundDisplay'
import {
  sortByInitiative,
  getUniqueInitiatives,
  getCurrentTurnParticipants,
  isCurrentTurn
} from '../utils/combatUtils'

const API_URL = '/api/participants'

function PlayerPage({ onBack, playerId }) {
  const [participants, setParticipants] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [round, setRound] = useState(1)
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0)

  // Загрузка данных
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
        console.error('Ошибка загрузки:', err)
        setIsLoading(false)
      })
  }, [])

  // Обновление данных каждую секунду
  useEffect(() => {
    const interval = setInterval(() => {
      fetch(API_URL, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      })
        .then(res => res.json())
        .then(data => {
          setParticipants(data.participants || [])
          if (data.combatState) {
            setRound(data.combatState.round || 1)
            setCurrentTurnIndex(data.combatState.currentTurnIndex || 0)
            console.log('PlayerPage: обновлено состояние боя', data.combatState)
          }
        })
        .catch(err => console.error('Ошибка обновления:', err))
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const combatParticipants = participants.filter(p => p.inCombat === true && !p.dead)
  const sortedCombatParticipants = sortByInitiative(combatParticipants)
  const uniqueInitiatives = getUniqueInitiatives(sortedCombatParticipants)
  const currentTurnParticipants = getCurrentTurnParticipants(sortedCombatParticipants, uniqueInitiatives, currentTurnIndex)

  if (isLoading) {
    return (
      <div className="player-page">
        <div className="loading">Загрузка...</div>
      </div>
    )
  }

  return (
    <div className="player-page">
      <div className="player-header">
        <button className="back-button" onClick={onBack}>
          ← На главную
        </button>
        <h1>Бой</h1>
      </div>

      {sortedCombatParticipants.length === 0 ? (
        <div className="no-combat">
          <p>Бой ещё не начался</p>
        </div>
      ) : (
        <>
          <RoundDisplay round={round} />
          <div className="combat-row">
            {sortedCombatParticipants.map(participant => (
              <ParticipantCard
                key={participant.id}
                participant={participant}
                mode="combat-player"
                isCurrent={isCurrentTurn(participant, currentTurnParticipants)}
                currentPlayerId={playerId}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default PlayerPage

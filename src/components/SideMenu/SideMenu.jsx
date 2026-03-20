import { useState } from 'react'
import './SideMenu.css'
import closeIcon from "/close.svg?url"
import arrowDropIcon from "/arrow_drop.svg?url"
import WantedSection from './WantedSection/WantedSection'
import ImageSection from './ImageSection/ImageSection'

function SideMenu({ isOpen, onClose, onEndCombat, isCombatMode, wantedParticipants, onAddWantedParticipant, onRemoveWantedParticipant, onEditWantedParticipant, onJoinCombat, onReviveWantedParticipant, images, onAddImage, onRemoveImage, onShowImage }) {
  const [wantedOpen, setWantedOpen] = useState(false)
  const [imgOpen, setImgOpen] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [collapsingSections, setCollapsingSections] = useState({})

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      onClose()
      setIsClosing(false)
    }, 300)
  }

  const toggleSection = (section, isOpen) => {
    if (isOpen) {
      // Закрываем с анимацией
      setCollapsingSections(prev => ({ ...prev, [section]: 'collapsing' }))
      setTimeout(() => {
        setCollapsingSections(prev => ({ ...prev, [section]: false }))
        section === 'wanted' ? setWantedOpen(false) : setImgOpen(false)
      }, 300)
    } else {
      // Открываем с анимацией
      section === 'wanted' ? setWantedOpen(true) : setImgOpen(true)
      setCollapsingSections(prev => ({ ...prev, [section]: 'expanding' }))
      setTimeout(() => {
        setCollapsingSections(prev => ({ ...prev, [section]: false }))
      }, 300)
    }
  }

  if (!isOpen) return null

  return (
    <div className={`side-menu-backdrop ${isClosing ? 'closing' : ''}`} onClick={handleClose}>
      <div className={`side-menu ${isClosing ? 'closing' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="side-menu-header">
          <h2>Меню</h2>
          <button className="close-menu-btn" onClick={onClose}>
            <img src={closeIcon} alt="Закрыть" className="close-icon" />
          </button>
        </div>

        <div className="side-menu-content">
          {/* Раздел WANTED */}
          <div className="side-menu-section full-width">
            <div className="side-menu-section-header">
              <span>WANTED</span>
              <button
                className="side-menu-section-toggle"
                onClick={() => toggleSection('wanted', wantedOpen)}
              >
                <img
                  src={arrowDropIcon}
                  alt={wantedOpen ? 'Свернуть' : 'Развернуть'}
                  className={`arrow-drop-icon ${wantedOpen ? 'expanded' : ''}`}
                />
              </button>
            </div>
            {wantedOpen && (
              <div className={`side-menu-section-content ${collapsingSections.wanted || ''}`}>
                <WantedSection
                  participants={wantedParticipants}
                  onAddParticipant={onAddWantedParticipant}
                  onRemoveParticipant={onRemoveWantedParticipant}
                  onEditParticipant={onEditWantedParticipant}
                  onJoinCombat={onJoinCombat}
                  onReviveParticipant={onReviveWantedParticipant}
                />
              </div>
            )}
          </div>

          {/* Раздел IMG */}
          <div className="side-menu-section full-width">
            <div className="side-menu-section-header">
              <span>IMG</span>
              <button
                className="side-menu-section-toggle"
                onClick={() => toggleSection('img', imgOpen)}
              >
                <img
                  src={arrowDropIcon}
                  alt={imgOpen ? 'Свернуть' : 'Развернуть'}
                  className={`arrow-drop-icon ${imgOpen ? 'expanded' : ''}`}
                />
              </button>
            </div>
            {imgOpen && (
              <div className={`side-menu-section-content ${collapsingSections.img || ''}`}>
                <ImageSection
                  images={images || []}
                  onAddImage={onAddImage}
                  onRemoveImage={onRemoveImage}
                  onShowImage={onShowImage}
                />
              </div>
            )}
          </div>

          {/* Завершить бой */}
          {isCombatMode && (
            <button className="side-menu-item full-width danger" onClick={() => { onClose(); onEndCombat(); }}>
              <span>⚔️ Завершить бой</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default SideMenu

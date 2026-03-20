import { useState, useEffect } from 'react'
import './ImageSection.css'
import addIcon from '/add.svg?url'
import closeIcon from '/close.svg?url'

const API_URL = '/api/images'

function ImageSection({ images, onAddImage, onRemoveImage, onShowImage }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [contextMenu, setContextMenu] = useState(null)
  const [selectedImage, setSelectedImage] = useState(null)

  // Сообщаем родительскому компоненту об открытии контекстного меню
  useEffect(() => {
    const section = document.querySelector('.side-menu-section-content')
    if (section) {
      if (contextMenu) {
        section.classList.add('context-menu-open')
      } else {
        section.classList.remove('context-menu-open')
      }
    }
  }, [contextMenu])

  useEffect(() => {
    const handleGlobalClick = (e) => {
      // Не закрываем при клике на само меню
      if (e.target.closest('.context-menu')) return
      closeContextMenu()
    }

    // Используем setTimeout чтобы не срабатывало сразу при открытии
    setTimeout(() => {
      document.addEventListener('click', handleGlobalClick, { capture: true })
    }, 100)

    return () => {
      document.removeEventListener('click', handleGlobalClick, { capture: true })
    }
  }, [])

  const handleContextMenu = (e, image) => {
    e.preventDefault()
    e.stopPropagation()
    setSelectedImage(image)

    // Получаем позицию относительно .image-section
    const section = e.currentTarget.closest('.image-section')
    const sectionRect = section.getBoundingClientRect()

    const menuWidth = 170
    const menuHeight = 50
    const offsetX = 10
    const offsetY = 10

    // Позиция курсора относительно секции
    const cursorX = e.clientX - sectionRect.left
    const cursorY = e.clientY - sectionRect.top

    // Проверяем, помещается ли меню слева от курсора
    const x = cursorX - menuWidth - offsetX < 0
      ? cursorX + offsetX  // Если не помещается слева, открываем справа
      : cursorX - menuWidth - offsetX  // Иначе слева
    
    // Проверяем, помещается ли меню снизу
    const y = cursorY + menuHeight + offsetY > sectionRect.height
      ? cursorY - offsetY - menuHeight  // Если не помещается снизу, открываем сверху
      : cursorY + offsetY  // Иначе снизу

    setContextMenu({ x, y })
  }

  useEffect(() => {
    const handleGlobalClick = (e) => {
      // Не закрываем при клике на само меню
      if (e.target.closest('.context-menu')) return
      closeContextMenu()
    }

    // Используем setTimeout чтобы не срабатывало сразу при открытии
    setTimeout(() => {
      document.addEventListener('click', handleGlobalClick, { capture: true })
    }, 100)

    return () => {
      document.removeEventListener('click', handleGlobalClick, { capture: true })
    }
  }, [])

  const closeContextMenu = () => {
    setContextMenu(null)
    setSelectedImage(null)
  }

  const handleDeleteImage = () => {
    if (selectedImage) {
      onRemoveImage(selectedImage.id)
      closeContextMenu()
    }
  }

  const handleShowImage = () => {
    if (selectedImage && onShowImage) {
      onShowImage(selectedImage)
      closeContextMenu()
    }
  }

  return (
    <div className="image-section">
      <div className="image-content">
        {images.length === 0 ? (
          <p className="no-images-text">Нет изображений</p>
        ) : (
          <div className="images-grid">
            {images.map((image) => (
              <div
                key={image.id}
                className="image-item"
                onContextMenu={(e) => handleContextMenu(e, image)}
              >
                <div className="image-thumbnail">
                  <img src={image.url} alt={image.name} />
                </div>
                <span className="image-name">{image.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Кнопка добавления */}
      <button
        className="image-add-btn"
        onClick={() => setIsModalOpen(true)}
      >
        <img src={addIcon} alt="Добавить" className="image-add-icon" />
      </button>

      {/* Контекстное меню */}
      {contextMenu && selectedImage && (
        <div
          className="context-menu"
          style={{
            top: contextMenu.y,
            left: contextMenu.x,
          }}
        >
          <div className="context-menu-item" onClick={handleShowImage}>
            Отобразить
          </div>
          <div className="context-menu-item danger" onClick={handleDeleteImage}>
            Удалить
          </div>
        </div>
      )}

      {isModalOpen && (
        <AddImageModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onAdd={onAddImage}
        />
      )}
    </div>
  )
}

function AddImageModal({ isOpen, onClose, onAdd }) {
  const [name, setName] = useState('')
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [isSaving, setIsSaving] = useState(false)

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      setFile(selectedFile)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result)
      }
      reader.readAsDataURL(selectedFile)
    }
  }

  const handleSubmit = async () => {
    if (file && name.trim()) {
      setIsSaving(true)
      try {
        const imageData = {
          id: Date.now(),
          name: name.trim(),
          url: preview
        }
        
        // Сохраняем на сервер
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(imageData)
        })
        
        if (response.ok) {
          onAdd(imageData)
          setName('')
          setFile(null)
          setPreview(null)
          onClose()
        }
      } catch (error) {
        console.error('Ошибка сохранения изображения:', error)
      } finally {
        setIsSaving(false)
      }
    }
  }

  return (
    <div className="add-image-modal-backdrop" onClick={onClose}>
      <div className="add-image-modal" onClick={(e) => e.stopPropagation()}>
        <div className="add-image-modal-header">
          <h2>Добавить изображение</h2>
          <button className="close-modal-btn" onClick={onClose}>
            <img src={closeIcon} alt="Закрыть" />
          </button>
        </div>

        <div className="add-image-modal-content">
          <div className="form-group">
            <label>Название</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Введите название"
              className="image-name-input"
            />
          </div>

          <div className="form-group">
            <label>Файл</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="file-input"
            />
          </div>

          {preview && (
            <div className="form-group">
              <label>Предпросмотр</label>
              <div className="image-preview">
                <img src={preview} alt="Предпросмотр" />
              </div>
            </div>
          )}
        </div>

        <div className="add-image-modal-actions">
          <button className="cancel-btn" onClick={onClose}>Отмена</button>
          <button
            className="submit-btn"
            onClick={handleSubmit}
            disabled={!file || !name.trim() || isSaving}
          >
            {isSaving ? 'Сохранение...' : 'Добавить'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ImageSection

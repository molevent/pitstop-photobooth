import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import bgImage from '../assets/bg.jpg'
import confirmButton from '../../Button/Button-Confirm.png'

const THEMES = [
  { id: 'original', name: 'Original', color: 'bg-gradient-to-br from-gray-200 to-gray-400' },
  { id: 'white-grey', name: 'White-Grey', color: 'bg-gradient-to-br from-white to-gray-300' },
  { id: 'pitstop', name: 'Pit Stop', color: 'bg-gradient-to-br from-green-400 to-green-600' },
  { id: 'sepia', name: 'Sepia', color: 'bg-gradient-to-br from-yellow-200 to-amber-400' },
  { id: 'warm', name: 'Warm', color: 'bg-gradient-to-br from-orange-400 to-red-400' },
  { id: 'cool', name: 'Cool', color: 'bg-gradient-to-br from-cyan-400 to-blue-500' },
  { id: 'vintage', name: 'Vintage', color: 'bg-gradient-to-br from-amber-200 to-purple-300' },
  { id: 'noir', name: 'Noir', color: 'bg-gradient-to-br from-gray-700 to-black' },
  { id: 'rose', name: 'Rose', color: 'bg-gradient-to-br from-pink-300 to-rose-400' },
  { id: 'golden', name: 'Golden', color: 'bg-gradient-to-br from-yellow-400 to-amber-500' },
  { id: 'cinematic', name: 'Cinematic', color: 'bg-gradient-to-br from-teal-400 to-orange-400' },
  { id: 'purple', name: 'Purple Haze', color: 'bg-gradient-to-br from-purple-400 to-indigo-500' },
  { id: 'forest', name: 'Forest', color: 'bg-gradient-to-br from-emerald-500 to-green-700' },
  { id: 'sunset', name: 'Sunset', color: 'bg-gradient-to-br from-orange-300 to-pink-500' },
  { id: 'ocean', name: 'Ocean', color: 'bg-gradient-to-br from-blue-500 to-cyan-600' },
  { id: 'crimson', name: 'Crimson', color: 'bg-gradient-to-br from-red-500 to-red-700' },
]

// Theme filter functions
const applyTheme = (ctx, theme, x, y, width, height) => {
  const imageData = ctx.getImageData(x, y, width, height)
  const data = imageData.data

  switch (theme) {
    case 'white-grey':
      for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3
        data[i] = avg
        data[i + 1] = avg
        data[i + 2] = avg
      }
      break
    case 'pitstop':
      for (let i = 0; i < data.length; i += 4) {
        data[i] = data[i] * 0.7
        data[i + 1] = data[i + 1] * 1.2
        data[i + 2] = data[i + 2] * 0.8
      }
      break
    case 'sepia':
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]
        data[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189))
        data[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168))
        data[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131))
      }
      break
    case 'warm':
      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.min(255, data[i] * 1.15)
        data[i + 1] = data[i + 1] * 0.95
        data[i + 2] = data[i + 2] * 0.75
      }
      break
    case 'cool':
      for (let i = 0; i < data.length; i += 4) {
        data[i] = data[i] * 0.8
        data[i + 1] = data[i + 1] * 0.95
        data[i + 2] = Math.min(255, data[i + 2] * 1.2)
      }
      break
    case 'vintage':
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]
        data[i] = Math.min(255, (r * 0.9) + 20)
        data[i + 1] = Math.min(255, (g * 0.85) + 15)
        data[i + 2] = Math.min(255, (b * 0.8) + 10)
      }
      break
    case 'noir':
      for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3
        const contrast = avg < 128 ? avg * 0.5 : Math.min(255, avg * 1.5)
        data[i] = contrast
        data[i + 1] = contrast
        data[i + 2] = contrast
      }
      break
    case 'rose':
      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.min(255, data[i] * 1.2)
        data[i + 1] = data[i + 1] * 0.85
        data[i + 2] = data[i + 2] * 0.9
      }
      break
    case 'golden':
      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.min(255, data[i] * 1.25)
        data[i + 1] = Math.min(255, data[i + 1] * 1.1)
        data[i + 2] = data[i + 2] * 0.6
      }
      break
    case 'cinematic':
      for (let i = 0; i < data.length; i += 4) {
        data[i] = data[i] * 0.9
        data[i + 1] = data[i + 1] * 1.05
        data[i + 2] = Math.min(255, data[i + 2] * 1.15)
      }
      break
    case 'purple':
      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.min(255, data[i] * 1.1)
        data[i + 1] = data[i + 1] * 0.8
        data[i + 2] = Math.min(255, data[i + 2] * 1.25)
      }
      break
    case 'forest':
      for (let i = 0; i < data.length; i += 4) {
        data[i] = data[i] * 0.75
        data[i + 1] = Math.min(255, data[i + 1] * 1.2)
        data[i + 2] = data[i + 2] * 0.85
      }
      break
    case 'sunset':
      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.min(255, data[i] * 1.3)
        data[i + 1] = data[i + 1] * 0.9
        data[i + 2] = data[i + 2] * 0.8
      }
      break
    case 'ocean':
      for (let i = 0; i < data.length; i += 4) {
        data[i] = data[i] * 0.7
        data[i + 1] = data[i + 1] * 0.95
        data[i + 2] = Math.min(255, data[i + 2] * 1.3)
      }
      break
    case 'crimson':
      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.min(255, data[i] * 1.35)
        data[i + 1] = data[i + 1] * 0.7
        data[i + 2] = data[i + 2] * 0.75
      }
      break
    case 'original':
    default:
      break
  }

  ctx.putImageData(imageData, x, y)
}

export default function PhotoSelector({ photos, onSelect }) {
  const [selectedIndex, setSelectedIndex] = useState(null)
  const [selectedTheme, setSelectedTheme] = useState('original')
  const [previewUrl, setPreviewUrl] = useState(null)
  const canvasRef = useRef(null)

  // Generate preview when selection or theme changes
  useEffect(() => {
    if (selectedIndex === null) {
      setPreviewUrl(null)
      return
    }

    const photoBlob = photos[selectedIndex]
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      
      ctx.drawImage(img, 0, 0)
      applyTheme(ctx, selectedTheme, 0, 0, img.width, img.height)
      
      setPreviewUrl(canvas.toDataURL('image/jpeg', 0.95))
    }
    img.src = URL.createObjectURL(photoBlob)
  }, [selectedIndex, selectedTheme, photos])

  const handleConfirm = () => {
    if (selectedIndex !== null) {
      onSelect(photos[selectedIndex], selectedTheme)
    }
  }

  const handlePhotoClick = (index) => {
    setSelectedIndex(index)
    setSelectedTheme('original')
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-screen w-screen flex items-center justify-center p-8 overflow-hidden"
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
      }}
    >
      <div className="flex flex-col items-center justify-center gap-12 max-w-md w-full">
        {/* Title */}
        <motion.h2 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-white text-2xl font-bold text-center"
        >
          Select Your Favorite Photo
        </motion.h2>
        
        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-white/60 text-sm text-center -mt-4"
        >
          Choose 1 photo for promotion
        </motion.p>

        {/* Photos */}
        <div className="flex gap-6 items-center justify-center">
          {photos.map((blob, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => handlePhotoClick(index)}
              className={`relative cursor-pointer transition-all duration-300 ${
                selectedIndex === index 
                  ? 'ring-4 ring-white scale-105' 
                  : 'opacity-70 hover:opacity-100'
              }`}
            >
              <img
                src={selectedIndex === index && previewUrl ? previewUrl : URL.createObjectURL(blob)}
                alt={`Photo ${index + 1}`}
                className="w-40 h-52 object-cover rounded-xl"
              />
              {selectedIndex === index && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-xl">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                    <Check className="w-6 h-6 text-black" />
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Theme Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-3"
        >
          <p className="text-white/70 text-sm">Select Theme</p>
          <div className="grid grid-cols-6 gap-2">
            {THEMES.map((theme) => (
              <button
                key={theme.id}
                onClick={() => setSelectedTheme(theme.id)}
                className={`w-10 h-10 rounded-lg ${theme.color} border-2 transition-all ${
                  selectedTheme === theme.id
                    ? 'border-white scale-110'
                    : 'border-transparent hover:border-white/50'
                }`}
                title={theme.name}
              />
            ))}
          </div>
          <p className="text-white/50 text-xs">{THEMES.find(t => t.id === selectedTheme)?.name}</p>
        </motion.div>

        {/* Buttons */}
        <div className="flex gap-4 mt-4">
          <button
            onClick={handleConfirm}
            disabled={selectedIndex === null}
            className={`transition-all duration-150 cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <img 
              src={confirmButton} 
              alt="Confirm" 
              className="h-14 w-auto object-contain"
            />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

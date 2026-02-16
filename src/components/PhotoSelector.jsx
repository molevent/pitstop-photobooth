import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, X } from 'lucide-react'
import bgImage from '../assets/bg.jpg'

export default function PhotoSelector({ photos, onSelect, onSkip }) {
  const [selectedIndex, setSelectedIndex] = useState(null)

  const handleConfirm = () => {
    if (selectedIndex !== null) {
      onSelect(photos[selectedIndex])
    }
  }

  return (
    <div 
      className="h-screen w-screen flex flex-col items-center justify-center p-8"
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
      }}
    >
      <motion.h2 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-white text-2xl font-bold mb-20 text-center pt-20"
      >
        Select Your Favorite Photo
      </motion.h2>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-white/60 text-sm mb-8 text-center"
      >
        Choose 1 photo for promotion, or skip to continue without
      </motion.p>

      <div className="flex gap-4 py-[120px]">
        {photos.map((blob, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => setSelectedIndex(index)}
            className={`relative cursor-pointer transition-all duration-300 ${
              selectedIndex === index 
                ? 'ring-4 ring-white scale-105' 
                : 'opacity-70 hover:opacity-100'
            }`}
          >
            <img
              src={URL.createObjectURL(blob)}
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

      <div className="flex gap-4 mt-20">
        <button
          onClick={onSkip}
          className="flex items-center gap-2 text-white/50 text-lg font-medium 
                     px-8 py-3 rounded-full border border-white/20 
                     hover:border-white/40 hover:text-white/70 
                     active:scale-95 transition-all duration-150 cursor-pointer"
        >
          <X size={18} />
          Skip
        </button>
        <button
          onClick={handleConfirm}
          disabled={selectedIndex === null}
          className={`flex items-center gap-2 text-lg font-medium 
                     px-10 py-3 rounded-full active:scale-95 
                     transition-all duration-150 cursor-pointer
                     ${selectedIndex !== null 
                       ? 'bg-white text-black hover:bg-white/90' 
                       : 'bg-white/20 text-white/40 cursor-not-allowed'}`}
        >
          <Check size={18} />
          Confirm
        </button>
      </div>
    </div>
  )
}

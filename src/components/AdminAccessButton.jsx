import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Delete } from 'lucide-react'
import settingIcon from '../../Button/setting.png'

const ADMIN_PIN = '190289'

export default function AdminAccessButton({ onSuccess }) {
  const [showPinModal, setShowPinModal] = useState(false)
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)

  const handleNumberClick = (num) => {
    if (pin.length < 6) {
      const newPin = pin + num
      setPin(newPin)
      setError(false)
      
      if (newPin.length === 6) {
        if (newPin === ADMIN_PIN) {
          setTimeout(() => {
            setShowPinModal(false)
            setPin('')
            onSuccess()
          }, 200)
        } else {
          setError(true)
          setTimeout(() => setPin(''), 500)
        }
      }
    }
  }

  const handleDelete = () => {
    setPin(pin.slice(0, -1))
    setError(false)
  }

  const handleClose = () => {
    setShowPinModal(false)
    setPin('')
    setError(false)
  }

  return (
    <>
      {/* Settings Button */}
      <button
        onClick={() => setShowPinModal(true)}
        className="fixed bottom-6 right-6 z-50"
        style={{ opacity: 0.05 }}
      >
        <img 
          src={settingIcon} 
          alt="Settings" 
          className="h-10 w-auto object-contain"
        />
      </button>

      {/* PIN Modal */}
      <AnimatePresence>
        {showPinModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80"
            onClick={handleClose}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-8 w-full max-w-sm mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-center mb-6 relative">
                <h2 className="text-xl font-bold text-gray-800">Admin Access</h2>
                <button
                  onClick={handleClose}
                  className="absolute right-0 p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={24} className="text-gray-600" />
                </button>
              </div>

              {/* PIN Display */}
              <div className={`flex justify-center gap-3 mb-8 ${error ? 'animate-shake' : ''}`}>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className={`w-5 h-5 rounded-full border-2 transition-all ${
                      i < pin.length
                        ? error
                          ? 'bg-red-500 border-red-500'
                          : 'bg-green-500 border-green-500'
                        : 'bg-white border-gray-300'
                    }`}
                  />
                ))}
              </div>

              {error && (
                <p className="text-red-500 text-center text-sm mb-4">Incorrect PIN</p>
              )}

              {/* Keypad - Centered with more spacing from title */}
              <div className="mt-10 flex justify-center">
                <div className="grid grid-cols-3 gap-5 mx-auto w-fit">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <button
                      key={num}
                      onClick={() => handleNumberClick(num.toString())}
                      className="w-20 h-20 rounded-2xl bg-gray-100 hover:bg-gray-200 active:bg-gray-300 active:scale-95 text-2xl font-semibold text-gray-800 transition-all"
                    >
                      {num}
                    </button>
                  ))}
                  <button
                    onClick={handleDelete}
                    className="w-20 h-20 rounded-2xl bg-gray-100 hover:bg-gray-200 active:bg-gray-300 active:scale-95 transition-all flex items-center justify-center"
                  >
                    <Delete size={24} className="text-gray-600" />
                  </button>
                  <button
                    onClick={() => handleNumberClick('0')}
                    className="w-20 h-20 rounded-2xl bg-gray-100 hover:bg-gray-200 active:bg-gray-300 active:scale-95 text-2xl font-semibold text-gray-800 transition-all"
                  >
                    0
                  </button>
                  <button
                    onClick={handleClose}
                    className="w-20 h-20 rounded-2xl bg-red-50 hover:bg-red-100 active:bg-red-200 active:scale-95 text-sm font-medium text-red-600 transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

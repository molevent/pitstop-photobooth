import { useCallback } from 'react'
import Webcam from 'react-webcam'
import { motion, AnimatePresence } from 'framer-motion'
import logo from '../assets/logo.png'
import startButton from '../assets/start-button.png'

const videoConstraints = {
  facingMode: 'user',
  width: { ideal: 1920 },
  height: { ideal: 1080 },
}

export default function CameraView({ webcamRef, status, countdown, currentPhoto, onStart }) {
  const isCountingDown = status === 'countdown'
  const isCapturing = status === 'capturing'

  return (
    <div className="relative h-screen w-screen bg-black overflow-hidden">
      {/* Camera Feed */}
      <Webcam
        ref={webcamRef}
        audio={false}
        screenshotFormat="image/jpeg"
        screenshotQuality={0.95}
        mirrored={true}
        videoConstraints={videoConstraints}
        className="absolute inset-0 h-full w-full object-cover"
      />

      {/* Flash Effect */}
      <AnimatePresence>
        {isCapturing && (
          <motion.div
            key={`flash-${currentPhoto}`}
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-white z-20 pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Countdown Numbers */}
      <AnimatePresence mode="wait">
        {isCountingDown && countdown !== null && (
          <motion.div
            key={countdown}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="absolute inset-0 flex items-center justify-center z-10"
          >
            <span className="text-white text-[12rem] font-bold drop-shadow-2xl select-none">
              {countdown}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Photo Counter & Look Here hint */}
      {(isCountingDown || isCapturing) && (
        <>
          <div className="absolute top-8 right-8 z-10">
            <span className="text-white/60 text-2xl font-medium tracking-widest">
              {currentPhoto} / 3
            </span>
          </div>
          <div className="absolute top-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center">
            <svg className="w-4 h-4 text-white/70 mb-1" style={{ filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.8))' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
            <span className="text-white/70 text-sm tracking-wider" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8), 0 1px 2px rgba(0,0,0,0.9)' }}>Take a look Here</span>
          </div>
        </>
      )}

      {/* Start Button (idle state) */}
      {status === 'idle' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex flex-col items-center justify-center z-10"
          style={{ backgroundColor: 'rgba(16, 90, 62, 0.8)' }}
        >
          <img
            src={logo}
            alt="PIT."
            className="h-24 w-auto mb-4 object-contain"
          />
          <p className="text-white/50 text-lg mb-12 tracking-widest uppercase">
            a place to pause
          </p>
          <button
            onClick={onStart}
            className="active:scale-95 transition-transform duration-150 cursor-pointer"
            style={{ paddingTop: '40px' }}
          >
            <img
              src={startButton}
              alt="Tap to Start"
              className="h-auto w-auto max-h-32 object-contain"
            />
          </button>
        </motion.div>
      )}
    </div>
  )
}

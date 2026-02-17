import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import { useRef, useEffect, useState } from 'react'
import './App.css'
import usePitSession from './hooks/usePitSession'
import useBoomerang from './hooks/useBoomerang'
import CameraView from './components/CameraView'
import ReviewScreen from './components/ReviewScreen'
import PrintCanvas from './components/PrintCanvas'
import Admin from './components/Admin'
import PhotoSelector from './components/PhotoSelector'
import StaticImageCanvas from './components/StaticImageCanvas'
import SessionViewer from './components/SessionViewer'
import PhotoWall from './components/PhotoWall'

function MainApp() {
  const navigate = useNavigate()
  const {
    status,
    captures,
    countdown,
    currentPhoto,
    webcamRef,
    startSession,
    reset,
    setReview,
    setSelecting,
  } = usePitSession()

  const { gifBlob, generate } = useBoomerang()
  const printCanvasRef = useRef(null)
  const staticImageRef = useRef(null)
  
  // State for selected photo and theme
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [selectedTheme, setSelectedTheme] = useState('original')
  const [photoKey, setPhotoKey] = useState(0)

  // When status becomes 'processing', generate boomerang then go to selecting
  useEffect(() => {
    if (status === 'processing' && captures.length === 3) {
      generate(captures).then(() => {
        setSelecting()
      }).catch((err) => {
        console.error('Boomerang generation failed:', err)
        setSelecting()
      })
    }
  }, [status, captures, generate, setSelecting])

  const handlePhotoSelect = (photo, theme = 'original') => {
    setSelectedPhoto(photo)
    setSelectedTheme(theme)
    setPhotoKey(k => k + 1)
    setReview()
  }

  const handleSkipSelection = () => {
    setSelectedPhoto(null)
    setReview()
  }

  return (
    <div className="h-screen w-screen bg-black overflow-hidden">
      {/* Hidden Canvases */}
      <div style={{ position: 'fixed', left: '-9999px', top: '-9999px' }}>
        <PrintCanvas ref={printCanvasRef} captures={captures} />
        {selectedPhoto && (
          <StaticImageCanvas key={photoKey} ref={staticImageRef} photoBlob={selectedPhoto} theme={selectedTheme} />
        )}
      </div>

      {/* View Switching */}
      {(status === 'idle' || status === 'countdown' || status === 'capturing') && (
        <CameraView
          webcamRef={webcamRef}
          status={status}
          countdown={countdown}
          currentPhoto={currentPhoto}
          onStart={startSession}
          onAdminNavigate={() => navigate('/admin')}
          onCancel={reset}
        />
      )}

      {status === 'processing' && (
        <div className="h-full w-full flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mb-6" />
          <p className="text-white/60 text-xl tracking-widest uppercase">Processing...</p>
        </div>
      )}

      {status === 'selecting' && captures.length === 3 && (
        <PhotoSelector
          photos={captures}
          onSelect={handlePhotoSelect}
          onSkip={handleSkipSelection}
        />
      )}

      {status === 'review' && (
        <ReviewScreen
          gifBlob={gifBlob}
          captures={captures}
          selectedPhoto={selectedPhoto}
          staticImageRef={staticImageRef}
          printCanvasRef={printCanvasRef}
          onDone={reset}
          onAdminNavigate={() => navigate('/admin')}
        />
      )}
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainApp />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/review" element={<ReviewScreen />} />
        <Route path="/pit/:sessionId" element={<ReviewScreen />} />
        <Route path="/session/:sessionId" element={<SessionViewer />} />
        <Route path="/wall" element={<PhotoWall />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

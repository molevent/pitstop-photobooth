import { useEffect, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import logo from '../assets/logo.png'
import bgImage from '../assets/bg.jpg'

const fixUrl = (url) => {
  if (!url) return null
  try {
    const parsed = new URL(url)
    // Only fix Docker internal IPs (172.x.x.x, 10.x.x.x, 192.168.x.x)
    if (/^(172\.|10\.|192\.168\.)/.test(parsed.hostname)) {
      return `${window.location.origin}${parsed.pathname}`
    }
    return url
  } catch {
    return url
  }
}

// CSS for infinite scrolling columns
const scrollStyles = `
  @keyframes scrollUp {
    0% { transform: translateY(0); }
    100% { transform: translateY(-50%); }
  }
  @keyframes scrollDown {
    0% { transform: translateY(-50%); }
    100% { transform: translateY(0); }
  }
  .scroll-up {
    animation: scrollUp var(--scroll-duration, 60s) linear infinite;
  }
  .scroll-down {
    animation: scrollDown var(--scroll-duration, 60s) linear infinite;
  }
  .scroll-up:hover, .scroll-down:hover {
    animation-play-state: paused;
  }
`

export default function PhotoWall() {
  const [photos, setPhotos] = useState([])
  const [newPhoto, setNewPhoto] = useState(null)
  const [columns, setColumns] = useState(4)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const prevCountRef = useRef(0)
  const pollIntervalRef = useRef(null)
  const containerRef = useRef(null)

  // Responsive columns
  useEffect(() => {
    const updateColumns = () => {
      const w = window.innerWidth
      if (w < 640) setColumns(2)
      else if (w < 1024) setColumns(3)
      else if (w < 1536) setColumns(4)
      else setColumns(5)
    }
    updateColumns()
    window.addEventListener('resize', updateColumns)
    return () => window.removeEventListener('resize', updateColumns)
  }, [])

  // Fullscreen change listener
  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onFsChange)
    return () => document.removeEventListener('fullscreenchange', onFsChange)
  }, [])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.()
    } else {
      document.exitFullscreen?.()
    }
  }

  // Fetch sessions from Supabase directly (works on Netlify without backend)
  const fetchPhotos = useCallback(async () => {
    try {
      const { data: sessions, error } = await supabase
        .from('sessions')
        .select('id, static_image_filename, static_image_url, cloud_static_url, created_at')
        .order('created_at', { ascending: true })

      if (error) throw error

      const photoList = sessions
        .filter(s => s.static_image_filename)
        .map((s) => ({
          id: s.id,
          // Prefer cloud URL (Supabase Storage), fall back to local URL
          url: s.cloud_static_url || fixUrl(s.static_image_url) || `${window.location.origin}/uploads/${s.static_image_filename}`,
        }))

      if (prevCountRef.current > 0 && photoList.length > prevCountRef.current) {
        const latest = photoList[photoList.length - 1]
        setNewPhoto(latest)
        setTimeout(() => {
          setNewPhoto(null)
          setPhotos(photoList)
        }, 3000)
      } else {
        setPhotos(photoList)
      }

      prevCountRef.current = photoList.length
    } catch (err) {
      console.error('Failed to fetch photos:', err)
    }
  }, [])

  // Initial fetch + polling every 5 seconds
  useEffect(() => {
    fetchPhotos()
    pollIntervalRef.current = setInterval(fetchPhotos, 5000)
    return () => clearInterval(pollIntervalRef.current)
  }, [fetchPhotos])

  // Distribute photos into columns
  const getColumns = () => {
    const cols = Array.from({ length: columns }, () => [])
    photos.forEach((photo, i) => {
      if (newPhoto && photo.id === newPhoto.id) return
      cols[i % columns].push(photo)
    })
    return cols
  }

  const masonryColumns = getColumns()

  // Scroll speed based on number of photos per column (more photos = slower)
  const avgPerCol = photos.length > 0 ? Math.ceil(photos.length / columns) : 1
  const scrollDuration = Math.max(30, avgPerCol * 8)

  return (
    <div
      ref={containerRef}
      className="h-screen w-full overflow-hidden relative bg-black"
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <style>{scrollStyles}</style>

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40 pointer-events-none z-0" />

      {/* Header - auto-hide after 5s, show on hover */}
      <div className="absolute top-0 left-0 right-0 z-30 opacity-100 hover:opacity-100 transition-opacity duration-500">
        <div className="bg-black/50 backdrop-blur-md border-b border-white/10">
          <div className="max-w-[2000px] mx-auto px-4 py-3 flex items-center justify-between">
            <img src={logo} alt="PIT." className="h-8 sm:h-10 w-auto" />
            <div className="flex items-center gap-3">
              <span className="text-white/60 text-xs sm:text-sm font-medium tracking-wider">
                {photos.length} Photos
              </span>
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" title="Live" />
              
              {/* Fullscreen button */}
              <button
                onClick={toggleFullscreen}
                className="ml-2 p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all"
                title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              >
                {isFullscreen ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="4 14 10 14 10 20" /><polyline points="20 10 14 10 14 4" />
                    <line x1="14" y1="10" x2="21" y2="3" /><line x1="3" y1="21" x2="10" y2="14" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" />
                    <line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* New Photo Splash Animation */}
      <AnimatePresence>
        {newPhoto && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="relative"
              initial={{ scale: 0, rotate: -10 }}
              animate={{ 
                scale: 1, 
                rotate: 0,
                transition: { type: 'spring', stiffness: 200, damping: 15 }
              }}
              exit={{ 
                scale: 0.3, opacity: 0, y: -100,
                transition: { duration: 0.5, ease: 'easeIn' }
              }}
            >
              <motion.div
                className="absolute -inset-6 rounded-3xl bg-white/20 blur-2xl"
                animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              />
              <div className="relative rounded-2xl overflow-hidden shadow-2xl max-w-[70vw] max-h-[70vh] sm:max-w-[40vw] sm:max-h-[65vh] ring-4 ring-white/30">
                <img
                  src={newPhoto.url}
                  alt="New photo"
                  className="max-h-[70vh] sm:max-h-[65vh] w-auto object-contain"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scrolling Columns */}
      <div className="relative z-10 h-full flex gap-2 sm:gap-3 px-2 sm:px-3 pt-16 pb-2">
        {photos.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
              className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full"
            />
            <p className="text-white/50 text-lg tracking-wider">Waiting for photos...</p>
          </div>
        ) : (
          masonryColumns.map((col, colIdx) => (
            <div key={colIdx} className="flex-1 overflow-hidden relative">
              {/* Duplicate content for seamless loop */}
              <div
                className={colIdx % 2 === 0 ? 'scroll-up' : 'scroll-down'}
                style={{ '--scroll-duration': `${scrollDuration}s` }}
              >
                {/* First copy */}
                <div className="flex flex-col gap-2 sm:gap-3 pb-2 sm:pb-3">
                  {col.map((photo) => (
                    <PhotoCard key={photo.id} photo={photo} />
                  ))}
                </div>
                {/* Second copy for seamless loop */}
                <div className="flex flex-col gap-2 sm:gap-3 pb-2 sm:pb-3">
                  {col.map((photo) => (
                    <PhotoCard key={`dup-${photo.id}`} photo={photo} />
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Bottom branding overlay */}
      <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/60 to-transparent pt-12 pb-3 pointer-events-none">
        <p className="text-white/30 text-[10px] sm:text-xs tracking-wider text-center">
          #pitstopcnx #ChiangMai #NewSpace #APlaceToPause #SlowDownMoveForward
        </p>
        <p className="text-white/50 text-xs sm:text-sm tracking-wider text-center mt-1 font-medium">
          @pitstopcnx
        </p>
      </div>
    </div>
  )
}

function PhotoCard({ photo }) {
  const [loaded, setLoaded] = useState(false)

  return (
    <div className="relative">
      <div className="rounded-lg sm:rounded-xl overflow-hidden shadow-lg">
        {!loaded && (
          <div className="aspect-[9/16] bg-white/10 animate-pulse rounded-lg sm:rounded-xl" />
        )}
        <img
          src={photo.url}
          alt="Photo"
          className={`w-full object-cover rounded-lg sm:rounded-xl ${loaded ? '' : 'hidden'}`}
          onLoad={() => setLoaded(true)}
        />
      </div>
    </div>
  )
}

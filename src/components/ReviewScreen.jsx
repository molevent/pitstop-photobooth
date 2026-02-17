import { useEffect, useState, useCallback } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { motion } from 'framer-motion'
import { useLocation, useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { supabase } from '../lib/supabase'
import bgImage from '../assets/bg.jpg'
import logo from '../assets/logo.png'
import logoGreen from '../assets/logo-green.png'
import tabGif from '../../Button/Tab-GIF.png'
import tabPhoto from '../../Button/Tab-Photo.png'
import btnShareStories from '../../Button/Button-Share Stories.png'
import btnSaveGif from '../../Button/Button-Save Gif.png'
import btnShare from '../../Button/Button-Share.png'
import btnSavePhoto from '../../Button/Button-Save Photo.png'
import btnPrint from '../../Button/Button-Print.png'
import btnDone from '../../Button/Button-Done.png'
import AdminAccessButton from './AdminAccessButton'

const SERVER_URL = import.meta.env.VITE_SERVER_URL || `http://${window.location.hostname}:3000`

export default function ReviewScreen({ gifBlob, captures, selectedPhoto, staticImageRef, printCanvasRef, onDone, onAdminNavigate }) {
  const location = useLocation()
  const params = useParams()
  const navigate = useNavigate()
  const adminSession = location.state
  const urlSessionId = params.sessionId
  
  const [uploadStatus, setUploadStatus] = useState('uploading')
  const [boomerangUrl, setBoomerangUrl] = useState(null)
  const [staticImageUrl, setStaticImageUrl] = useState(null)
  const [gifPreviewUrl, setGifPreviewUrl] = useState(null)
  const [staticPreviewUrl, setStaticPreviewUrl] = useState(null)
  const [activePreview, setActivePreview] = useState('static')
  const [printEnabled, setPrintEnabled] = useState(() => {
    const stored = localStorage.getItem('printEnabled')
    return stored !== null ? JSON.parse(stored) : false
  })

  // Check if this is an admin/URL-based view (no new upload needed)
  const isExistingSession = !!(urlSessionId || adminSession)

  // Fix URL: replace Docker internal IP with browser-accessible hostname
  // Nginx proxies /uploads/ to backend, so we use window.location.origin (port 80)
  const fixUrl = (url) => {
    if (!url) return null
    try {
      const parsed = new URL(url)
      return `${window.location.origin}${parsed.pathname}`
    } catch {
      return url
    }
  }

  // Load existing session data (from Admin navigation or URL like /pit/1)
  useEffect(() => {
    async function loadExistingSession() {
      let bUrl = null
      let sUrl = null

      if (adminSession?.boomerangUrl) {
        // Data passed via navigation state from Admin
        bUrl = fixUrl(adminSession.boomerangUrl)
        sUrl = adminSession.staticImageUrl ? fixUrl(adminSession.staticImageUrl) : null
      } else if (urlSessionId) {
        // Fetch from Supabase by session number (1=oldest, highest=newest)
        try {
          const { data: sessions, error } = await supabase
            .from('sessions')
            .select('*')
            .order('created_at', { ascending: true })
          
          if (error) throw error
          const sessionNumber = parseInt(urlSessionId)
          const sessionIndex = sessionNumber - 1
          if (sessionIndex >= 0 && sessionIndex < sessions.length) {
            const session = sessions[sessionIndex]
            // Prefer cloud URLs (Supabase Storage)
            bUrl = session.cloud_boomerang_url || (session.boomerang_url ? fixUrl(session.boomerang_url) : null)
            sUrl = session.cloud_static_url || (session.static_image_url ? fixUrl(session.static_image_url) : null)
          }
        } catch (err) {
          console.error('Failed to fetch session:', err)
        }
      } else {
        // Not an existing session, skip
        return
      }

      // Set boomerang URL for QR code AND preview
      if (bUrl) {
        setBoomerangUrl(bUrl)
        setGifPreviewUrl(bUrl)
        setUploadStatus('done')
      }
      // Set static image URL for preview
      if (sUrl) {
        setStaticImageUrl(sUrl)
        setStaticPreviewUrl(sUrl)
      }
    }
    loadExistingSession()
  }, [adminSession, urlSessionId])

  // Create local preview URL for the GIF (normal session flow)
  useEffect(() => {
    if (gifBlob) {
      const url = URL.createObjectURL(gifBlob)
      setGifPreviewUrl(url)
      return () => URL.revokeObjectURL(url)
    }
  }, [gifBlob])

  // Generate static image preview with retry
  useEffect(() => {
    let timeoutId
    async function generateStaticPreview() {
      if (!selectedPhoto || !staticImageRef?.current) return
      
      // Wait for canvas to be ready
      if (!staticImageRef.current.isReady()) {
        timeoutId = setTimeout(generateStaticPreview, 100)
        return
      }
      
      const blob = await staticImageRef.current.generateBlob()
      if (blob) {
        const url = URL.createObjectURL(blob)
        setStaticPreviewUrl(url)
        return () => URL.revokeObjectURL(url)
      }
    }
    generateStaticPreview()
    return () => clearTimeout(timeoutId)
  }, [selectedPhoto, staticImageRef])

  // Auto-upload on mount (only for new sessions, not admin/URL views)
  useEffect(() => {
    if (isExistingSession) return

    async function upload() {
      try {
        setUploadStatus('uploading')

        // Generate print image
        let printBlob = null
        if (printCanvasRef?.current?.generatePrintBlob) {
          printBlob = await printCanvasRef.current.generatePrintBlob()
        }

        // Generate static image if selected
        let staticBlob = null
        if (selectedPhoto && staticImageRef?.current?.generateBlob) {
          staticBlob = await staticImageRef.current.generateBlob()
        }

        const formData = new FormData()
        if (printBlob) {
          formData.append('print', printBlob, 'print.jpg')
        }
        if (gifBlob) {
          formData.append('boomerang', gifBlob, 'boomerang.gif')
        }
        if (staticBlob) {
          formData.append('staticImage', staticBlob, 'static.jpg')
        }
        // Upload first photo for admin gallery
        if (captures?.[0]) {
          formData.append('firstPhoto', captures[0], 'first-photo.jpg')
        }

        const res = await axios.post(`${SERVER_URL}/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })

        // Fix URLs: replace Docker internal IP with browser-accessible origin
        const fixedBoomerangUrl = res.data.boomerangUrl ? fixUrl(res.data.boomerangUrl) : null
        const fixedStaticUrl = res.data.staticImageUrl ? fixUrl(res.data.staticImageUrl) : null
        setBoomerangUrl(fixedBoomerangUrl)
        setStaticImageUrl(fixedStaticUrl)
        setUploadStatus('done')
      } catch (err) {
        console.error('Upload failed:', err)
        setUploadStatus('error')
      }
    }

    upload()
  }, [gifBlob, printCanvasRef, selectedPhoto, staticImageRef])

  // Print handler - fixed with base64 data URL
  const handlePrint = useCallback(async () => {
    if (!printCanvasRef?.current?.generatePrintBlob) {
      console.error('Print canvas ref not available')
      return
    }

    try {
      const blob = await printCanvasRef.current.generatePrintBlob()
      if (!blob) {
        console.error('Failed to generate print blob')
        return
      }
      
      // Convert blob to base64 data URL (works across windows)
      const reader = new FileReader()
      reader.onload = () => {
        const dataUrl = reader.result
        
        const printWindow = window.open('', '_blank')
        if (!printWindow) {
          alert('Please allow popups to print')
          return
        }
        
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Print Photo</title>
              <style>
                @page { size: 4in 6in; margin: 0; }
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { 
                  width: 4in; 
                  height: 6in; 
                  display: flex; 
                  align-items: center; 
                  justify-content: center;
                  background: #fff;
                }
                img { 
                  width: 100%; 
                  height: 100%; 
                  object-fit: contain;
                }
              </style>
            </head>
            <body>
              <img src="${dataUrl}" onload="setTimeout(() => window.print(), 300)" />
            </body>
          </html>
        `)
        printWindow.document.close()
      }
      reader.readAsDataURL(blob)
    } catch (err) {
      console.error('Print error:', err)
      alert('Print failed. Please try again.')
    }
  }, [printCanvasRef])

  // Download handler for GIF
  const handleDownload = useCallback(() => {
    if (gifBlob) {
      const url = URL.createObjectURL(gifBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'pit-boomerang.gif'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }, [gifBlob])

  // Download handler for static image
  const handleDownloadStatic = useCallback(async () => {
    if (selectedPhoto && staticImageRef?.current?.generateBlob) {
      const blob = await staticImageRef.current.generateBlob()
      if (blob) {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'pit-static.jpg'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
    }
  }, [selectedPhoto, staticImageRef])

  // Share handler for GIF
  const handleShare = useCallback(async () => {
    if (!gifBlob) return
    
    const file = new File([gifBlob], 'pit-boomerang.gif', { type: 'image/gif' })
    
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: 'My Pit.CNX Boomerang',
          text: 'Check out my boomerang from Pit.CNX!'
        })
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Share failed:', err)
          alert('Share failed. Try downloading instead.')
        }
      }
    } else {
      alert('Sharing not supported on this device. Use download instead.')
    }
  }, [gifBlob])

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
      <div className="flex flex-col items-center justify-center gap-4 md:gap-5 max-w-md w-full">
        {/* Logo */}
        <img
          src={logo}
          alt="PIT."
          className="h-16 md:h-20 lg:h-24 w-auto object-contain pb-[100px] md:pb-[150px] lg:pb-[200px]"
        />

        {/* Preview with toggle */}
        <div className="flex flex-col items-center justify-center gap-3">
          {/* Toggle buttons */}
          {staticPreviewUrl && (
            <div className="flex gap-2">
              <button
                onClick={() => setActivePreview('gif')}
                className={`transition-all ${activePreview === 'gif' ? 'opacity-100' : 'opacity-50'}`}
              >
                <img src={tabGif} alt="GIF" className="h-8 w-auto object-contain" />
              </button>
              <button
                onClick={() => setActivePreview('static')}
                className={`transition-all ${activePreview === 'static' ? 'opacity-100' : 'opacity-50'}`}
              >
                <img src={tabPhoto} alt="Photo" className="h-8 w-auto object-contain" />
              </button>
            </div>
          )}
          
          {/* Preview content */}
          <div className="flex items-center justify-center">
            {activePreview === 'gif' && gifPreviewUrl ? (
              <img
                src={gifPreviewUrl}
                alt="Boomerang"
                className="rounded-2xl shadow-2xl max-h-[35vh] md:max-h-[40vh] lg:max-h-[45vh] w-auto"
              />
            ) : activePreview === 'static' && staticPreviewUrl ? (
              <img
                src={staticPreviewUrl}
                alt="Static"
                className="rounded-2xl shadow-2xl max-h-[32vh] md:max-h-[38vh] lg:max-h-[42vh] w-auto"
              />
            ) : (
              <div className="w-64 h-48 md:w-80 md:h-60 bg-white/10 rounded-2xl flex items-center justify-center">
                <span className="text-white/40 text-base md:text-lg">Generating...</span>
              </div>
            )}
          </div>
        </div>

        {/* QR Code + Buttons */}
        <div className="flex flex-col items-center justify-center gap-4">
          {/* QR Code - switches based on active tab */}
          {uploadStatus === 'done' && (boomerangUrl || staticImageUrl) ? (
            <div className="bg-white p-10 md:p-12 lg:p-14 rounded-2xl">
              <QRCodeSVG
                value={activePreview === 'static' && staticImageUrl ? staticImageUrl : (boomerangUrl || staticImageUrl)}
                size={140}
                level="H"
                bgColor="#ffffff"
                fgColor="#000000"
              />
            </div>
          ) : uploadStatus === 'uploading' ? (
            <div className="w-[180px] h-[180px] md:w-[200px] md:h-[200px] lg:w-[220px] lg:h-[220px] bg-white/10 rounded-2xl flex items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="w-6 h-6 md:w-8 md:h-8 border-4 border-white/30 border-t-white rounded-full"
              />
            </div>
          ) : (
            <div className="w-[180px] h-[180px] md:w-[200px] md:h-[200px] lg:w-[220px] lg:h-[220px] bg-white/10 rounded-2xl flex items-center justify-center">
              <span className="text-red-400 text-sm md:text-base">Upload failed</span>
            </div>
          )}

          <p className="text-white/60 text-sm md:text-base tracking-[0.3em] uppercase font-medium">
            Scan to Download
          </p>

          {/* Download Buttons */}
          <div className="flex gap-2 flex-wrap justify-center">
            {/* Share Stories - downloads static image for Instagram */}
            {staticPreviewUrl && (
              <button
                onClick={isExistingSession ? () => window.open(staticImageUrl || staticPreviewUrl, '_blank') : handleDownloadStatic}
                className="transition-all duration-150 cursor-pointer active:scale-95 hover:opacity-90"
              >
                <img src={btnShareStories} alt="Share Stories" className="h-6 w-auto object-contain" />
              </button>
            )}
            
            {activePreview === 'gif' && (gifBlob || isExistingSession) && (
              <>
                <button
                  onClick={isExistingSession ? () => window.open(boomerangUrl, '_blank') : handleDownload}
                  className="transition-all duration-150 cursor-pointer active:scale-95 hover:opacity-90"
                >
                  <img src={btnSaveGif} alt="Save GIF" className="h-6 w-auto object-contain" />
                </button>
                <button
                  onClick={isExistingSession ? () => window.open(boomerangUrl, '_blank') : handleShare}
                  className="transition-all duration-150 cursor-pointer active:scale-95 hover:opacity-90"
                >
                  <img src={btnShare} alt="Share" className="h-6 w-auto object-contain" />
                </button>
              </>
            )}
            {activePreview === 'static' && staticPreviewUrl && (
              <button
                onClick={isExistingSession ? () => window.open(staticImageUrl || staticPreviewUrl, '_blank') : handleDownloadStatic}
                className="transition-all duration-150 cursor-pointer active:scale-95 hover:opacity-90"
              >
                <img src={btnSavePhoto} alt="Save Photo" className="h-6 w-auto object-contain" />
              </button>
            )}
          </div>

          {/* PRINT Button - only show when enabled in Admin */}
          {printEnabled && (
            <button
              onClick={handlePrint}
              className="transition-all duration-150 cursor-pointer active:scale-95 hover:opacity-90"
            >
              <img src={btnPrint} alt="Print" className="h-8 w-auto object-contain" />
            </button>
          )}

          {/* DONE Button */}
          <button
            onClick={isExistingSession ? () => navigate('/admin') : onDone}
            className="transition-all duration-150 cursor-pointer active:scale-95 hover:opacity-80"
          >
            <img src={btnDone} alt="Done" className="h-6 w-auto object-contain" />
          </button>

          {/* Hashtags */}
          <p className="text-white/40 text-[10px] md:text-xs tracking-wider text-center max-w-xs leading-relaxed">
            #pitstopcnx #ChiangMai #NewSpace #APlaceToPause #SlowDownMoveForward
          </p>

          {/* Instagram */}
          <p className="text-white/60 text-xs md:text-sm tracking-wider text-center font-medium">
            @pitstopcnx
          </p>
        </div>
      </div>

      {/* Admin Access Button */}
      <AdminAccessButton onSuccess={onAdminNavigate} />
    </motion.div>
  )
}

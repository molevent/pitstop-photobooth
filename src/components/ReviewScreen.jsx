import { useEffect, useState, useCallback } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { motion } from 'framer-motion'
import { Printer, RotateCcw, Download, Share2 } from 'lucide-react'
import axios from 'axios'
import bgImage from '../assets/bg.jpg'
import logo from '../assets/logo.png'
import logoGreen from '../assets/logo-green.png'

const SERVER_URL = import.meta.env.VITE_SERVER_URL || `http://${window.location.hostname}:3000`

export default function ReviewScreen({ gifBlob, captures, selectedPhoto, staticImageRef, printCanvasRef, onDone }) {
  const [uploadStatus, setUploadStatus] = useState('uploading') // uploading | done | error
  const [boomerangUrl, setBoomerangUrl] = useState(null)
  const [staticImageUrl, setStaticImageUrl] = useState(null)
  const [gifPreviewUrl, setGifPreviewUrl] = useState(null)
  const [staticPreviewUrl, setStaticPreviewUrl] = useState(null)
  const [activePreview, setActivePreview] = useState('gif') // 'gif' | 'static'

  // Create local preview URL for the GIF
  useEffect(() => {
    if (gifBlob) {
      const url = URL.createObjectURL(gifBlob)
      setGifPreviewUrl(url)
      return () => URL.revokeObjectURL(url)
    }
  }, [gifBlob])

  // Generate static image preview
  useEffect(() => {
    async function generateStaticPreview() {
      if (selectedPhoto && staticImageRef?.current?.generateBlob) {
        const blob = await staticImageRef.current.generateBlob()
        if (blob) {
          const url = URL.createObjectURL(blob)
          setStaticPreviewUrl(url)
          return () => URL.revokeObjectURL(url)
        }
      }
    }
    generateStaticPreview()
  }, [selectedPhoto, staticImageRef])

  // Auto-upload on mount
  useEffect(() => {
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

        setBoomerangUrl(res.data.boomerangUrl)
        setStaticImageUrl(res.data.staticImageUrl)
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
      className="h-screen w-screen flex items-center justify-center p-8"
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
      }}
    >
      <div className="flex flex-col items-center justify-center gap-6 max-w-md w-full">
        {/* Logo */}
        <img
          src={logo}
          alt="PIT."
          className="h-16 w-auto object-contain"
        />

        {/* Preview with toggle */}
        <div className="flex flex-col items-center justify-center gap-3">
          {/* Toggle buttons */}
          {staticPreviewUrl && (
            <div className="flex gap-2 mb-2">
              <button
                onClick={() => setActivePreview('gif')}
                className={`px-4 py-1 rounded-full text-sm font-medium transition-all ${
                  activePreview === 'gif'
                    ? 'bg-white text-black'
                    : 'bg-white/20 text-white/70'
                }`}
              >
                GIF
              </button>
              <button
                onClick={() => setActivePreview('static')}
                className={`px-4 py-1 rounded-full text-sm font-medium transition-all ${
                  activePreview === 'static'
                    ? 'bg-white text-black'
                    : 'bg-white/20 text-white/70'
                }`}
              >
                Static
              </button>
            </div>
          )}
          
          {/* Preview content */}
          <div className="flex items-center justify-center">
            {activePreview === 'gif' && gifPreviewUrl ? (
              <img
                src={gifPreviewUrl}
                alt="Boomerang"
                className="rounded-2xl shadow-2xl max-h-[30vh] w-auto"
              />
            ) : activePreview === 'static' && staticPreviewUrl ? (
              <img
                src={staticPreviewUrl}
                alt="Static"
                className="rounded-2xl shadow-2xl max-h-[30vh] w-auto"
              />
            ) : (
              <div className="w-80 h-60 bg-white/10 rounded-2xl flex items-center justify-center">
                <span className="text-white/40 text-lg">Generating...</span>
              </div>
            )}
          </div>
        </div>

        {/* QR Code + Buttons */}
        <div className="flex flex-col items-center justify-center gap-5">
          {/* QR Code */}
          {uploadStatus === 'done' && boomerangUrl ? (
            <div className="bg-white p-4 rounded-2xl">
              <QRCodeSVG
                value={boomerangUrl}
                size={180}
                level="H"
                bgColor="#ffffff"
                fgColor="#000000"
              />
            </div>
          ) : uploadStatus === 'uploading' ? (
            <div className="w-[212px] h-[212px] bg-white/10 rounded-2xl flex items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full"
              />
            </div>
          ) : (
            <div className="w-[212px] h-[212px] bg-white/10 rounded-2xl flex items-center justify-center">
              <span className="text-red-400 text-lg">Upload failed</span>
            </div>
          )}

          <p className="text-white/60 text-lg tracking-[0.3em] uppercase font-medium mb-1">
            Scan to Download
          </p>

          {/* Download Buttons */}
          <div className="flex gap-4 flex-wrap justify-center">
            {/* Share Stories - downloads static image for Instagram */}
            {staticPreviewUrl && (
              <button
                onClick={handleDownloadStatic}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-medium 
                           px-10 py-3 rounded-full hover:opacity-90 active:scale-95 
                           transition-all duration-150 cursor-pointer border border-white/30"
              >
                <Share2 size={16} />
                SHARE STORIES
              </button>
            )}
            
            {activePreview === 'gif' && gifBlob && (
              <>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 bg-white/10 text-white text-sm font-medium 
                             px-10 py-3 rounded-full hover:bg-white/20 active:scale-95 
                             transition-all duration-150 cursor-pointer border border-white/30"
                >
                  <Download size={16} />
                  SAVE GIF
                </button>
                <button
                  onClick={handleShare}
                  className="flex items-center gap-2 bg-white/10 text-white text-sm font-medium 
                             px-10 py-3 rounded-full hover:bg-white/20 active:scale-95 
                             transition-all duration-150 cursor-pointer border border-white/30"
                >
                  <Share2 size={16} />
                  SHARE
                </button>
              </>
            )}
            {activePreview === 'static' && staticPreviewUrl && (
              <button
                onClick={handleDownloadStatic}
                className="flex items-center gap-2 bg-white/10 text-white text-sm font-medium 
                           px-10 py-3 rounded-full hover:bg-white/20 active:scale-95 
                           transition-all duration-150 cursor-pointer border border-white/30"
              >
                <Download size={16} />
                SAVE PHOTO
              </button>
            )}
          </div>

          {/* PRINT Button */}
          <button
            onClick={handlePrint}
            className="flex items-center gap-3 bg-white text-black text-xl font-bold 
                       px-20 py-6 rounded-full hover:bg-white/90 active:scale-95 
                       transition-all duration-150 shadow-2xl cursor-pointer my-1"
          >
            <Printer size={24} />
            PRINT
          </button>

          {/* DONE Button */}
          <button
            onClick={onDone}
            className="flex items-center gap-2 text-white/50 text-lg font-medium 
                       px-14 py-4 rounded-full border border-white/20 
                       hover:border-white/40 hover:text-white/70 
                       active:scale-95 transition-all duration-150 cursor-pointer"
          >
            <RotateCcw size={18} />
            DONE
          </button>

          {/* Hashtags */}
          <p className="text-white/40 text-xs tracking-wider mt-4 text-center max-w-xs leading-relaxed">
            #pitstopcnx #ChiangMai #NewSpace #APlaceToPause #SlowDownMoveForward
          </p>

          {/* Instagram */}
          <p className="text-white/60 text-sm tracking-wider mt-3 text-center font-medium">
            @pitstopcnx
          </p>
        </div>
      </div>
    </motion.div>
  )
}

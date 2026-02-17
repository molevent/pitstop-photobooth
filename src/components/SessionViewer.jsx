import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, X, FileImage, Film, Image as ImageIcon, Printer, ArrowLeft } from 'lucide-react'

const SERVER_URL = import.meta.env.VITE_SERVER_URL || `http://${window.location.hostname}:3000`

export default function SessionViewer() {
  const location = useLocation()
  const navigate = useNavigate()
  const params = useParams()
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(null)
  
  const sessionId = params.sessionId || location.state?.sessionId || new URLSearchParams(location.search).get('id')

  useEffect(() => {
    if (!sessionId) {
      navigate('/admin')
      return
    }
    
    fetchSession()
  }, [sessionId])

  const fetchSession = async () => {
    try {
      const res = await axios.get(`${SERVER_URL}/api/sessions/${sessionId}`)
      setSession(res.data)
    } catch (err) {
      console.error('Failed to fetch session:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = (url, filename) => {
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handlePrint = (url) => {
    const printWindow = window.open(url, '_blank')
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print()
      }
    }
  }

  const openImageModal = (imageData) => {
    setSelectedImage(imageData)
  }

  const closeImageModal = () => {
    setSelectedImage(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="h-screen bg-black flex flex-col items-center justify-center">
        <p className="text-white/60 text-xl mb-4">Session not found</p>
        <button onClick={() => navigate('/admin')} className="text-white hover:text-white/70">
          ← Back to Gallery
        </button>
      </div>
    )
  }

  const hasPrint = !!session.print_filename
  const hasBoomerang = !!session.boomerang_filename
  const hasStatic = !!session.static_image_filename
  const itemCount = [hasPrint, hasBoomerang, hasStatic].filter(Boolean).length

  const images = []
  if (hasBoomerang) {
    images.push({
      type: 'boomerang',
      title: 'Boomerang GIF',
      url: `${SERVER_URL}/uploads/${session.boomerang_filename}`,
      filename: `boomerang-${session.id}.gif`,
      icon: Film
    })
  }
  if (hasStatic) {
    images.push({
      type: 'static',
      title: 'Stories',
      url: `${SERVER_URL}/uploads/${session.static_image_filename}`,
      filename: `static-${session.id}.jpg`,
      icon: ImageIcon
    })
  }
  if (hasPrint) {
    images.push({
      type: 'print',
      title: 'Print',
      url: `${SERVER_URL}/uploads/${session.print_filename}`,
      filename: `print-${session.id}.jpg`,
      icon: FileImage
    })
  }

  return (
    <div className="h-screen bg-black p-4 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/admin')}
            className="flex items-center gap-2 text-white/50 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="hidden sm:inline">Back to Gallery</span>
          </button>
          <h1 className="text-white text-xl sm:text-2xl font-bold">Session Details</h1>
        </div>
        <button 
          onClick={() => navigate('/admin')} 
          className="flex items-center gap-2 text-white/50 hover:text-white"
        >
          <X size={20} />
        </button>
      </div>

      {/* Feature indicators */}
      <div className="flex gap-4 mb-4 flex-shrink-0">
        {hasPrint && (
          <div className="flex items-center gap-1 text-white/60 text-sm">
            <div className="w-5 h-5 bg-white/80 rounded-full flex items-center justify-center">
              <FileImage size={12} className="text-black" />
            </div>
            <span>Print</span>
          </div>
        )}
        {hasBoomerang && (
          <div className="flex items-center gap-1 text-white/60 text-sm">
            <div className="w-5 h-5 bg-white/80 rounded-full flex items-center justify-center">
              <Film size={12} className="text-black" />
            </div>
            <span>GIF</span>
          </div>
        )}
        {hasStatic && (
          <div className="flex items-center gap-1 text-white/60 text-sm">
            <div className="w-5 h-5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <ImageIcon size={12} className="text-white" />
            </div>
            <span>Stories</span>
          </div>
        )}
      </div>

      {/* Media Grid */}
      <div className={`flex-1 grid gap-4 ${itemCount === 1 ? 'grid-cols-1 max-w-md mx-auto' : itemCount === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
        {images.map((img, index) => {
          const Icon = img.icon
          return (
            <motion.div 
              key={img.type}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white/5 rounded-xl p-3 flex flex-col h-full cursor-pointer hover:bg-white/10 transition-colors"
              onClick={() => openImageModal(img)}
            >
              <h3 className="text-white text-sm font-medium mb-2 flex items-center gap-1 flex-shrink-0">
                <Icon size={14} /> {img.title}
              </h3>
              <div className="flex-1 flex items-center justify-center min-h-0">
                <img 
                  src={img.url}
                  alt={img.title}
                  className="max-h-full max-w-full rounded-lg object-contain"
                />
              </div>
              <p className="text-white/40 text-xs text-center mt-2">Click to view options</p>
            </motion.div>
          )
        })}
      </div>

      {/* Session Info */}
      <div className="mt-3 text-white/40 text-xs flex-shrink-0 flex justify-between items-center">
        <p>ID: {session.id} | {new Date(session.created_at).toLocaleString('th-TH')}</p>
        <button 
          onClick={() => navigate('/admin')}
          className="text-white/60 hover:text-white flex items-center gap-1"
        >
          <ArrowLeft size={14} /> Back to Gallery
        </button>
      </div>

      {/* Image Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-4"
            onClick={closeImageModal}
          >
            {/* Modal Header */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
              <h2 className="text-white text-lg font-medium flex items-center gap-2">
                {(() => {
                  const Icon = selectedImage.icon
                  return <Icon size={18} />
                })()}
                {selectedImage.title}
              </h2>
              <button 
                onClick={closeImageModal}
                className="text-white/50 hover:text-white p-2"
              >
                <X size={24} />
              </button>
            </div>

            {/* Large Image */}
            <motion.div 
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="flex-1 flex items-center justify-center w-full max-h-[70vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <img 
                src={selectedImage.url}
                alt={selectedImage.title}
                className="max-h-full max-w-full rounded-xl object-contain"
              />
            </motion.div>

            {/* Action Buttons */}
            <div className="absolute bottom-8 left-4 right-4 flex gap-4 justify-center" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => handleDownload(selectedImage.url, selectedImage.filename)}
                className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded-full font-medium hover:bg-white/90 transition-colors"
              >
                <Download size={18} />
                Download
              </button>
              {selectedImage.type === 'print' && (
                <button
                  onClick={() => handlePrint(selectedImage.url)}
                  className="flex items-center gap-2 bg-white/20 text-white px-6 py-3 rounded-full font-medium hover:bg-white/30 transition-colors"
                >
                  <Printer size={18} />
                  Print
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

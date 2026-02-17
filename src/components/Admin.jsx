import { useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { Trash2, Image as ImageIcon, Film, FileImage, X, Printer, AlertTriangle, Eye, LayoutGrid, Download } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import downloadButton from '../../Button/Button-Download.png'

const SERVER_URL = import.meta.env.VITE_SERVER_URL || `http://${window.location.hostname}:3000`

export default function Admin() {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [sessionToDelete, setSessionToDelete] = useState(null)
  const [printEnabled, setPrintEnabled] = useState(() => {
    const stored = localStorage.getItem('printEnabled')
    return stored !== null ? JSON.parse(stored) : false
  })
  const navigate = useNavigate()

  useEffect(() => {
    localStorage.setItem('printEnabled', JSON.stringify(printEnabled))
  }, [printEnabled])

  useEffect(() => {
    fetchSessions()
  }, [])

  const fetchSessions = async () => {
    try {
      const res = await axios.get(`${SERVER_URL}/api/sessions`)
      setSessions(res.data)
    } catch (err) {
      console.error('Failed to fetch sessions:', err)
    } finally {
      setLoading(false)
    }
  }

  // View Session (3-panel view) - clicking on image
  const handleViewSession = (session) => {
    navigate(`/session/${session.id}`, { 
      state: { sessionId: session.id }
    })
  }

  // View QR Code (review screen) - clicking QR Code button
  // Sessions are sorted newest-first, so reverse: 1=oldest, highest=newest
  const handleViewQR = (session, index) => {
    const sessionNumber = index !== undefined ? sessions.length - index : session.id
    navigate(`/pit/${sessionNumber}`, { 
      state: { 
        sessionId: session.id,
        boomerangUrl: session.boomerang_url,
        staticImageUrl: session.static_image_url,
        firstPhotoUrl: session.first_photo_filename 
          ? `${SERVER_URL}/uploads/${session.first_photo_filename}`
          : null
      }
    })
  }

  const handleDeleteClick = (sessionId, e) => {
    e.stopPropagation()
    setSessionToDelete(sessionId)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (!sessionToDelete) return
    
    try {
      await axios.delete(`${SERVER_URL}/api/sessions/${sessionToDelete}`)
      setSessions(sessions.filter(s => s.id !== sessionToDelete))
      setShowDeleteModal(false)
      setSessionToDelete(null)
    } catch (err) {
      console.error('Failed to delete session:', err)
      alert('Failed to delete session')
    }
  }

  const cancelDelete = () => {
    setShowDeleteModal(false)
    setSessionToDelete(null)
  }

  const getThumbnailUrl = (session) => {
    // Priority: first_photo > static_image > boomerang
    if (session.first_photo_filename) {
      return `${SERVER_URL}/uploads/${session.first_photo_filename}`
    }
    if (session.static_image_filename) {
      return `${SERVER_URL}/uploads/${session.static_image_filename}`
    }
    if (session.boomerang_filename) {
      return `${SERVER_URL}/uploads/${session.boomerang_filename}`
    }
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="h-screen bg-black p-8 overflow-y-auto pb-24">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-white text-4xl font-bold">Admin Gallery</h1>
        
        {/* Print Toggle */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 bg-white/10 rounded-full px-4 py-2">
            <Printer size={18} className={printEnabled ? 'text-white' : 'text-white/40'} />
            <span className="text-white/80 text-sm">Print</span>
            <button
              onClick={() => setPrintEnabled(!printEnabled)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                printEnabled ? 'bg-green-500' : 'bg-white/30'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  printEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
            <span className={`text-sm ${printEnabled ? 'text-green-400' : 'text-white/40'}`}>
              {printEnabled ? 'ON' : 'OFF'}
            </span>
          </div>
          
          <button 
            onClick={() => window.open('/wall', '_blank')}
            className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-500 text-white px-4 py-2 rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <LayoutGrid size={16} />
            Photo Wall
          </button>

          <a
            href="/api/download-all"
            download
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors"
          >
            <Download size={16} />
            Download All
          </a>

          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-white/50 hover:text-white transition-colors"
          >
            <X size={24} />
            Close
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {sessions.map((session, index) => {
          const thumbnailUrl = getThumbnailUrl(session)
          const hasPrint = !!session.print_filename
          const hasBoomerang = !!session.boomerang_filename
          const hasStatic = !!session.static_image_filename
          
          return (
            <div 
              key={session.id}
              className="group relative"
            >
              <div 
                onClick={() => handleViewSession(session)}
                className="cursor-pointer relative aspect-[3/4] rounded-xl overflow-hidden bg-white/10"
              >
                {thumbnailUrl ? (
                  <img 
                    src={thumbnailUrl}
                    alt={`Session ${session.id}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/40">
                    <ImageIcon size={48} />
                  </div>
                )}
                
                {/* Feature indicators */}
                <div className="absolute top-2 right-2 flex gap-1">
                  {hasPrint && (
                    <div className="w-6 h-6 bg-white/80 rounded-full flex items-center justify-center" title="Has Print">
                      <FileImage size={14} className="text-black" />
                    </div>
                  )}
                  {hasBoomerang && (
                    <div className="w-6 h-6 bg-white/80 rounded-full flex items-center justify-center" title="Has GIF">
                      <Film size={14} className="text-black" />
                    </div>
                  )}
                  {hasStatic && (
                    <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center" title="Has Static Image">
                      <ImageIcon size={14} className="text-white" />
                    </div>
                  )}
                </div>
                
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    View Session
                  </span>
                </div>
              </div>
              
              {/* Timestamp, Download, View, Delete */}
              <div className="flex items-center justify-between mt-2">
                <p className="text-white/50 text-xs">
                  {new Date(session.created_at).toLocaleString('en-US', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
                <div className="flex items-center gap-2">
                  {/* View QR Button - Replaces Download */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      console.log('QR Code clicked', session)
                      handleViewQR(session, index)
                    }}
                    className="px-3 py-1 rounded-full bg-white/90 hover:bg-white text-black text-xs font-medium transition-colors flex items-center gap-1 pointer-events-auto"
                    style={{ pointerEvents: 'auto' }}
                    title="View QR Code"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="7" height="7" rx="1"/>
                      <rect x="14" y="3" width="7" height="7" rx="1"/>
                      <rect x="14" y="14" width="7" height="7" rx="1"/>
                      <rect x="3" y="14" width="7" height="7" rx="1"/>
                    </svg>
                    QR Code
                  </button>
                  {/* Delete Button */}
                  <button
                    onClick={(e) => handleDeleteClick(session.id, e)}
                    className="p-1 rounded transition-colors text-white/30 hover:text-red-400 hover:bg-red-500/20"
                    title="Delete session"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {sessions.length === 0 && (
        <div className="text-center text-white/50 mt-20">
          No sessions yet. Start taking photos!
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80"
            onClick={cancelDelete}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-8 w-full max-w-sm mx-4 text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle size={32} className="text-red-500" />
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-gray-800 mb-2">Delete Session?</h3>
              <p className="text-gray-500 mb-6">
                This action cannot be undone. The photo and all associated files will be permanently deleted.
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={cancelDelete}
                  className="flex-1 py-3 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 py-3 px-4 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
      <div className="fixed bottom-8 left-8 flex gap-4 text-white/60 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-white/80 rounded-full flex items-center justify-center">
            <FileImage size={12} className="text-black" />
          </div>
          <span>Print</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-white/80 rounded-full flex items-center justify-center">
            <Film size={12} className="text-black" />
          </div>
          <span>GIF</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <ImageIcon size={12} className="text-white" />
          </div>
          <span>Static</span>
        </div>
      </div>
    </div>
  )
}

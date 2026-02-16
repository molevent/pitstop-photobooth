import { useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { Trash2, Image as ImageIcon, Film, FileImage, X } from 'lucide-react'

const SERVER_URL = import.meta.env.VITE_SERVER_URL || `http://${window.location.hostname}:3000`

export default function Admin() {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const navigate = useNavigate()

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

  const handleClick = (session) => {
    navigate('/review', { 
      state: { 
        sessionId: session.id,
        boomerangUrl: session.boomerang_url,
        firstPhotoUrl: session.first_photo_filename 
          ? `${SERVER_URL}/uploads/${session.first_photo_filename}`
          : null
      }
    })
  }

  const handleDelete = async (sessionId, e) => {
    e.stopPropagation()
    if (deleteConfirm === sessionId) {
      try {
        await axios.delete(`${SERVER_URL}/api/sessions/${sessionId}`)
        setSessions(sessions.filter(s => s.id !== sessionId))
        setDeleteConfirm(null)
      } catch (err) {
        console.error('Failed to delete session:', err)
        alert('Failed to delete session')
      }
    } else {
      setDeleteConfirm(sessionId)
    }
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
    <div className="min-h-screen bg-black p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-white text-4xl font-bold">Admin Gallery</h1>
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-white/50 hover:text-white transition-colors"
        >
          <X size={24} />
          Close
        </button>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {sessions.map((session) => {
          const thumbnailUrl = getThumbnailUrl(session)
          const hasPrint = !!session.print_filename
          const hasBoomerang = !!session.boomerang_filename
          const hasStatic = !!session.static_image_filename
          
          return (
            <div 
              key={session.id}
              className="cursor-pointer group relative"
            >
              <div 
                onClick={() => handleClick(session)}
                className="relative aspect-[3/4] rounded-xl overflow-hidden bg-white/10"
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
              
              {/* Timestamp and Delete */}
              <div className="flex items-center justify-between mt-2">
                <p className="text-white/50 text-xs">
                  {new Date(session.created_at).toLocaleString('th-TH', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
                <button
                  onClick={(e) => handleDelete(session.id, e)}
                  className={`p-1 rounded transition-colors ${
                    deleteConfirm === session.id 
                      ? 'bg-red-500 text-white' 
                      : 'text-white/30 hover:text-red-400'
                  }`}
                  title={deleteConfirm === session.id ? 'Click again to confirm delete' : 'Delete session'}
                >
                  <Trash2 size={16} />
                </button>
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

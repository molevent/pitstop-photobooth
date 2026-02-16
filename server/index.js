import express from 'express'
import cors from 'cors'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import { v4 as uuidv4 } from 'uuid'
import os from 'os'
import { db } from './db.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = 3000

app.use(cors())
app.use(express.json())

// Serve uploads statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// Multer storage config
const storage = multer.diskStorage({
  destination: path.join(__dirname, 'uploads'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || (file.mimetype === 'image/gif' ? '.gif' : '.jpg')
    cb(null, `${uuidv4()}${ext}`)
  },
})

const upload = multer({ storage })

// Upload endpoint — accepts print JPEG + boomerang GIF + static image + session data
app.post('/upload', upload.fields([
  { name: 'print', maxCount: 1 },
  { name: 'boomerang', maxCount: 1 },
  { name: 'staticImage', maxCount: 1 },
  { name: 'firstPhoto', maxCount: 1 },
]), async (req, res) => {
  try {
    const hostIP = getLocalIP()
    const baseURL = `http://${hostIP}:${PORT}`
    const sessionId = req.body.sessionId || uuidv4()

    const printFile = req.files.print?.[0]
    const boomerangFile = req.files.boomerang?.[0]
    const staticImageFile = req.files.staticImage?.[0]
    const firstPhotoFile = req.files.firstPhoto?.[0]

    const printUrl = printFile ? `${baseURL}/uploads/${printFile.filename}` : null
    const boomerangUrl = boomerangFile ? `${baseURL}/uploads/${boomerangFile.filename}` : null
    const staticImageUrl = staticImageFile ? `${baseURL}/uploads/${staticImageFile.filename}` : null

    // Save to Supabase database
    await db.insertSession(
      sessionId,
      printFile?.filename || null,
      boomerangFile?.filename || null,
      boomerangUrl,
      firstPhotoFile?.filename || null,
      staticImageFile?.filename || null,
      staticImageUrl
    )

    res.json({
      sessionId,
      printUrl,
      boomerangUrl,
      staticImageUrl,
    })
  } catch (err) {
    console.error('Upload error:', err)
    res.status(500).json({ error: 'Upload failed' })
  }
})

// Get all sessions for admin
app.get('/api/sessions', async (req, res) => {
  try {
    const sessions = await db.getAllSessions()
    res.json(sessions)
  } catch (err) {
    console.error('Get sessions error:', err)
    res.status(500).json({ error: 'Failed to get sessions' })
  }
})

// Get single session
app.get('/api/sessions/:id', async (req, res) => {
  try {
    const session = await db.getSessionById(req.params.id)
    if (!session) {
      return res.status(404).json({ error: 'Session not found' })
    }
    res.json(session)
  } catch (err) {
    console.error('Get session error:', err)
    res.status(500).json({ error: 'Failed to get session' })
  }
})

// Delete session
app.delete('/api/sessions/:id', async (req, res) => {
  try {
    await db.deleteSession(req.params.id)
    res.json({ message: 'Session deleted' })
  } catch (err) {
    console.error('Delete session error:', err)
    res.status(500).json({ error: 'Failed to delete session' })
  }
})

function getLocalIP() {
  const interfaces = os.networkInterfaces()
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address
      }
    }
  }
  return 'localhost'
}

app.listen(PORT, '0.0.0.0', () => {
  const ip = getLocalIP()
  console.log(`🚀 Pit.CNX Server running at http://${ip}:${PORT}`)
})

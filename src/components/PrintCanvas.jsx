import { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react'
import html2canvas from 'html2canvas'
import printTemplate from '../assets/print-template.png'

const W = 1200
const H = 1800
const PAD = 30
const GAP = 24
const HEADER_H = 100
const FOOTER_H = 200
const HALF = W / 2
const holeW = HALF - PAD * 2
const totalVertSpace = H - HEADER_H - FOOTER_H - PAD * 2 - GAP * 2
const holeH = totalVertSpace / 3

const positions = []
for (let i = 0; i < 3; i++) {
  const y = HEADER_H + PAD + i * (holeH + GAP)
  positions.push({
    left: { x: PAD, y, w: holeW, h: holeH },
    right: { x: HALF + PAD, y, w: holeW, h: holeH },
  })
}

// Crop photo using canvas - maintains aspect ratio, center crop
function cropPhoto(url, w, h) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      
      const imgRatio = img.width / img.height
      const targetRatio = w / h
      
      let sw, sh, sx, sy
      if (imgRatio > targetRatio) {
        sh = img.height
        sw = img.height * targetRatio
        sx = (img.width - sw) / 2
        sy = 0
      } else {
        sw = img.width
        sh = img.width / targetRatio
        sx = 0
        sy = (img.height - sh) / 2
      }
      
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h)
      canvas.toBlob((blob) => resolve(URL.createObjectURL(blob)), 'image/jpeg', 0.95)
    }
    img.src = url
  })
}

const PrintCanvas = forwardRef(function PrintCanvas({ captures }, ref) {
  const containerRef = useRef(null)
  const [photos, setPhotos] = useState({})

  useEffect(() => {
    if (captures?.length > 0) {
      const process = async () => {
        const result = {}
        for (let i = 0; i < captures.length; i++) {
          const url = URL.createObjectURL(captures[i])
          const cropped = await cropPhoto(url, holeW, holeH)
          result[i] = cropped
          URL.revokeObjectURL(url)
        }
        setPhotos(result)
      }
      process()
      return () => Object.values(photos).forEach(u => URL.revokeObjectURL(u))
    }
  }, [captures])

  useImperativeHandle(ref, () => ({
    generatePrintBlob: async () => {
      if (!containerRef.current) return null
      const canvas = await html2canvas(containerRef.current, {
        scale: 2, useCORS: true, backgroundColor: '#ffffff', width: W, height: H
      })
      return new Promise((r) => canvas.toBlob((b) => r(b), 'image/jpeg', 0.95))
    },
  }))

  return (
    <div ref={containerRef} style={{ width: W, height: H, position: 'relative', overflow: 'hidden', background: '#fff' }}>
      <img src={printTemplate} alt="" style={{ position: 'absolute', top: 0, left: 0, width: W, height: H, zIndex: 1 }} />
      {Object.entries(photos).map(([i, url]) => {
        const pos = positions[parseInt(i)]
        if (!pos) return null
        return (
          <div key={i}>
            <img src={url} alt="" style={{ position: 'absolute', left: pos.left.x, top: pos.left.y, width: holeW, height: holeH, borderRadius: 8, zIndex: 10 }} />
            <img src={url} alt="" style={{ position: 'absolute', left: pos.right.x, top: pos.right.y, width: holeW, height: holeH, borderRadius: 8, zIndex: 10 }} />
          </div>
        )
      })}
    </div>
  )
})

export default PrintCanvas

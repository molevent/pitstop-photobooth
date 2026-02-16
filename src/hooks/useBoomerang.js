import { useState, useCallback } from 'react'
import GIF from 'gif.js.optimized'
import logoGreen from '../assets/logo-green.png'

export default function useBoomerang() {
  const [gifBlob, setGifBlob] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const generate = useCallback((photoBlobs) => {
    return new Promise((resolve, reject) => {
      if (!photoBlobs || photoBlobs.length < 3) {
        reject(new Error('Need at least 3 photos'))
        return
      }

      setIsGenerating(true)

      // Load logo image first
      const logoImg = new Image()
      logoImg.crossOrigin = 'anonymous'
      
      logoImg.onload = () => {
        const gif = new GIF({
          workers: 2,
          quality: 10,
          workerScript: '/gif.worker.js',
          width: 640,
          height: 480,
          repeat: 0,
        })

        // Boomerang sequence: 1 -> 2 -> 3 -> 2
        const sequence = [photoBlobs[0], photoBlobs[1], photoBlobs[2], photoBlobs[1]]

        let loaded = 0
        const images = []

        sequence.forEach((blob, i) => {
          const img = new Image()
          img.onload = () => {
            images[i] = img
            loaded++
            if (loaded === sequence.length) {
              // Create a canvas to draw frames at consistent size
              const canvas = document.createElement('canvas')
              canvas.width = 640
              canvas.height = 480
              const ctx = canvas.getContext('2d')

              // Logo dimensions (positioned at top-right)
              const logoW = 80
              const logoH = (logoImg.height / logoImg.width) * logoW
              const logoX = 640 - logoW - 20
              const logoY = 20

              images.forEach((image) => {
                ctx.clearRect(0, 0, 640, 480)
                
                // Draw image covering the canvas (center-crop)
                const scale = Math.max(640 / image.width, 480 / image.height)
                const w = image.width * scale
                const h = image.height * scale
                const x = (640 - w) / 2
                const y = (480 - h) / 2
                ctx.drawImage(image, x, y, w, h)
                
                // Draw logo on top (semi-transparent white background for visibility)
                ctx.save()
                ctx.globalAlpha = 0.9
                ctx.drawImage(logoImg, logoX, logoY, logoW, logoH)
                ctx.restore()
                
                gif.addFrame(ctx, { copy: true, delay: 300 })
              })

              gif.on('finished', (blob) => {
                setGifBlob(blob)
                setIsGenerating(false)
                resolve(blob)
              })

              gif.on('error', (err) => {
                setIsGenerating(false)
                reject(err)
              })

              gif.render()
            }
          }
          img.src = URL.createObjectURL(blob)
        })
      }
      
      logoImg.onerror = () => {
        // If logo fails to load, continue without logo
        reject(new Error('Failed to load logo'))
      }
      
      logoImg.src = logoGreen
    })
  }, [])

  return { gifBlob, isGenerating, generate }
}

import { useState, useCallback } from 'react'
import GIF from 'gif.js.optimized'
import templateGif from '../assets/template-gif.png'

const GIF_WIDTH = 540
const GIF_HEIGHT = 960

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

      // Load template overlay (PNG with transparency)
      const templateImg = new Image()
      templateImg.crossOrigin = 'anonymous'
      
      templateImg.onload = () => {
        const gif = new GIF({
          workers: 2,
          quality: 10,
          workerScript: '/gif.worker.js',
          width: GIF_WIDTH,
          height: GIF_HEIGHT,
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
              const canvas = document.createElement('canvas')
              canvas.width = GIF_WIDTH
              canvas.height = GIF_HEIGHT
              const ctx = canvas.getContext('2d')

              images.forEach((image) => {
                ctx.clearRect(0, 0, GIF_WIDTH, GIF_HEIGHT)
                
                // Center-crop photo to 9:16 ratio (no stretching)
                const targetRatio = GIF_WIDTH / GIF_HEIGHT // 9:16
                const photoRatio = image.width / image.height
                
                let sx, sy, sWidth, sHeight
                
                if (photoRatio > targetRatio) {
                  // Photo is wider — crop sides
                  sHeight = image.height
                  sWidth = sHeight * targetRatio
                  sx = (image.width - sWidth) / 2
                  sy = 0
                } else {
                  // Photo is taller — crop top/bottom
                  sWidth = image.width
                  sHeight = sWidth / targetRatio
                  sx = 0
                  sy = (image.height - sHeight) / 2
                }
                
                ctx.drawImage(image, sx, sy, sWidth, sHeight, 0, 0, GIF_WIDTH, GIF_HEIGHT)
                
                // Overlay template on top
                ctx.drawImage(templateImg, 0, 0, GIF_WIDTH, GIF_HEIGHT)
                
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
      
      templateImg.onerror = () => {
        reject(new Error('Failed to load GIF template'))
      }
      
      templateImg.src = templateGif
    })
  }, [])

  return { gifBlob, isGenerating, generate }
}

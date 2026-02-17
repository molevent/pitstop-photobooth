import { useEffect, useState, forwardRef, useImperativeHandle } from 'react'
import templateB from '../assets/template-b.jpg'

// Theme filter functions
const applyTheme = (ctx, theme, x, y, width, height) => {
  const imageData = ctx.getImageData(x, y, width, height)
  const data = imageData.data

  switch (theme) {
    case 'white-grey':
      for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3
        data[i] = avg
        data[i + 1] = avg
        data[i + 2] = avg
      }
      break
    case 'pitstop':
      for (let i = 0; i < data.length; i += 4) {
        data[i] = data[i] * 0.7
        data[i + 1] = data[i + 1] * 1.2
        data[i + 2] = data[i + 2] * 0.8
      }
      break
    case 'sepia':
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]
        data[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189))
        data[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168))
        data[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131))
      }
      break
    case 'warm':
      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.min(255, data[i] * 1.15)
        data[i + 1] = data[i + 1] * 0.95
        data[i + 2] = data[i + 2] * 0.75
      }
      break
    case 'cool':
      for (let i = 0; i < data.length; i += 4) {
        data[i] = data[i] * 0.8
        data[i + 1] = data[i + 1] * 0.95
        data[i + 2] = Math.min(255, data[i + 2] * 1.2)
      }
      break
    case 'vintage':
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]
        data[i] = Math.min(255, (r * 0.9) + 20)
        data[i + 1] = Math.min(255, (g * 0.85) + 15)
        data[i + 2] = Math.min(255, (b * 0.8) + 10)
      }
      break
    case 'noir':
      for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3
        const contrast = avg < 128 ? avg * 0.5 : Math.min(255, avg * 1.5)
        data[i] = contrast
        data[i + 1] = contrast
        data[i + 2] = contrast
      }
      break
    case 'rose':
      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.min(255, data[i] * 1.2)
        data[i + 1] = data[i + 1] * 0.85
        data[i + 2] = data[i + 2] * 0.9
      }
      break
    case 'golden':
      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.min(255, data[i] * 1.25)
        data[i + 1] = Math.min(255, data[i + 1] * 1.1)
        data[i + 2] = data[i + 2] * 0.6
      }
      break
    case 'cinematic':
      for (let i = 0; i < data.length; i += 4) {
        data[i] = data[i] * 0.9
        data[i + 1] = data[i + 1] * 1.05
        data[i + 2] = Math.min(255, data[i + 2] * 1.15)
      }
      break
    case 'purple':
      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.min(255, data[i] * 1.1)
        data[i + 1] = data[i + 1] * 0.8
        data[i + 2] = Math.min(255, data[i + 2] * 1.25)
      }
      break
    case 'forest':
      for (let i = 0; i < data.length; i += 4) {
        data[i] = data[i] * 0.75
        data[i + 1] = Math.min(255, data[i + 1] * 1.2)
        data[i + 2] = data[i + 2] * 0.85
      }
      break
    case 'sunset':
      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.min(255, data[i] * 1.3)
        data[i + 1] = data[i + 1] * 0.9
        data[i + 2] = data[i + 2] * 0.8
      }
      break
    case 'ocean':
      for (let i = 0; i < data.length; i += 4) {
        data[i] = data[i] * 0.7
        data[i + 1] = data[i + 1] * 0.95
        data[i + 2] = Math.min(255, data[i + 2] * 1.3)
      }
      break
    case 'crimson':
      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.min(255, data[i] * 1.35)
        data[i + 1] = data[i + 1] * 0.7
        data[i + 2] = data[i + 2] * 0.75
      }
      break
    case 'original':
    default:
      break
  }

  ctx.putImageData(imageData, x, y)
}

const StaticImageCanvas = forwardRef(function StaticImageCanvas({ photoBlob, theme = 'original' }, ref) {
  const [templateLoaded, setTemplateLoaded] = useState(false)
  const [photoLoaded, setPhotoLoaded] = useState(false)
  const [templateImg, setTemplateImg] = useState(null)
  const [photoImg, setPhotoImg] = useState(null)

  // Load template
  useEffect(() => {
    const img = new Image()
    img.onload = () => {
      setTemplateImg(img)
      setTemplateLoaded(true)
    }
    img.src = templateB
  }, [])

  // Load photo
  useEffect(() => {
    if (!photoBlob) return
    const img = new Image()
    img.onload = () => {
      setPhotoImg(img)
      setPhotoLoaded(true)
    }
    img.src = URL.createObjectURL(photoBlob)
  }, [photoBlob])

  // Draw canvas when both images loaded
  useEffect(() => {
    if (!templateLoaded || !photoLoaded || !templateImg || !photoImg) return

    const canvas = document.createElement('canvas')
    canvas.width = 1080
    canvas.height = 1920
    const ctx = canvas.getContext('2d')

    ctx.drawImage(templateImg, 0, 0, canvas.width, canvas.height)

    // Photo cropping to 9:16 ratio without distortion
    const targetRatio = 9 / 16  // 0.5625
    const photoRatio = photoImg.width / photoImg.height
    
    let sx, sy, sWidth, sHeight
    
    if (photoRatio > targetRatio) {
      sHeight = photoImg.height
      sWidth = sHeight * targetRatio
      sx = (photoImg.width - sWidth) / 2
      sy = 0
    } else {
      sWidth = photoImg.width
      sHeight = sWidth / targetRatio
      sx = 0
      sy = (photoImg.height - sHeight) / 2
    }
    
    // Size increased by 20% from 480x853
    const photoWidth = 576
    const photoHeight = 1024  // maintains 9:16 ratio
    
    const x = (canvas.width - photoWidth) / 2
    const y = (canvas.height - photoHeight) / 2  // centered vertically

    ctx.save()
    ctx.beginPath()
    ctx.roundRect(x, y, photoWidth, photoHeight, 16)
    ctx.clip()
    ctx.drawImage(photoImg, sx, sy, sWidth, sHeight, x, y, photoWidth, photoHeight)
    ctx.restore()

    applyTheme(ctx, theme, x, y, photoWidth, photoHeight)

  }, [templateLoaded, photoLoaded, templateImg, photoImg, theme])

  // Expose method to generate blob
  useImperativeHandle(ref, () => ({
    isReady: () => templateLoaded && photoLoaded,
    generateBlob: async () => {
      if (!templateLoaded || !photoLoaded) return null
      
      const canvas = document.createElement('canvas')
      canvas.width = 1080
      canvas.height = 1920
      const ctx = canvas.getContext('2d')

      ctx.drawImage(templateImg, 0, 0, canvas.width, canvas.height)

      // Photo cropping to 9:16 ratio without distortion
      const targetRatio = 9 / 16
      const photoRatio = photoImg.width / photoImg.height
      
      let sx, sy, sWidth, sHeight
      
      if (photoRatio > targetRatio) {
        sHeight = photoImg.height
        sWidth = sHeight * targetRatio
        sx = (photoImg.width - sWidth) / 2
        sy = 0
      } else {
        sWidth = photoImg.width
        sHeight = sWidth / targetRatio
        sx = 0
        sy = (photoImg.height - sHeight) / 2
      }
      
      // Size increased by 20%
      const photoWidth = 576
      const photoHeight = 1024
      
      const x = (canvas.width - photoWidth) / 2
      const y = (canvas.height - photoHeight) / 2

      ctx.save()
      ctx.beginPath()
      ctx.roundRect(x, y, photoWidth, photoHeight, 16)
      ctx.clip()
      ctx.drawImage(photoImg, sx, sy, sWidth, sHeight, x, y, photoWidth, photoHeight)
      ctx.restore()

      applyTheme(ctx, theme, x, y, photoWidth, photoHeight)

      return new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.95)
      })
    }
  }))

  if (!templateLoaded || !photoLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-white/10 rounded-2xl">
        <span className="text-white/60">Loading...</span>
      </div>
    )
  }

  return (
    <canvas
      ref={(el) => {
        if (el && templateImg && photoImg) {
          el.width = 1080
          el.height = 1920
          const ctx = el.getContext('2d')
          
          ctx.drawImage(templateImg, 0, 0, 1080, 1920)
          
          // Photo cropping to 9:16 ratio without distortion
          const targetRatio = 9 / 16
          const photoRatio = photoImg.width / photoImg.height
          
          let sx, sy, sWidth, sHeight
          
          if (photoRatio > targetRatio) {
            sHeight = photoImg.height
            sWidth = sHeight * targetRatio
            sx = (photoImg.width - sWidth) / 2
            sy = 0
          } else {
            sWidth = photoImg.width
            sHeight = sWidth / targetRatio
            sx = 0
            sy = (photoImg.height - sHeight) / 2
          }
          
          // Size increased by 20%
          const photoWidth = 576
          const photoHeight = 1024
          
          const x = (1080 - photoWidth) / 2
          const y = (1920 - photoHeight) / 2
          
          ctx.save()
          ctx.beginPath()
          ctx.roundRect(x, y, photoWidth, photoHeight, 16)
          ctx.clip()
          ctx.drawImage(photoImg, sx, sy, sWidth, sHeight, x, y, photoWidth, photoHeight)
          ctx.restore()
          
          applyTheme(ctx, theme, x, y, photoWidth, photoHeight)
        }
      }}
      className="w-full h-full object-contain rounded-2xl"
    />
  )
})

export default StaticImageCanvas

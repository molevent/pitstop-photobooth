import { useEffect, useState, forwardRef, useImperativeHandle } from 'react'
import templateB from '../assets/template-b.jpg'

const StaticImageCanvas = forwardRef(function StaticImageCanvas({ photoBlob }, ref) {
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
    // Instagram Story dimensions (9:16 aspect ratio)
    canvas.width = 1080
    canvas.height = 1920
    const ctx = canvas.getContext('2d')

    // Draw template background
    ctx.drawImage(templateImg, 0, 0, canvas.width, canvas.height)

    // Photo positioning: centered, slightly lower for Stories
    const photoWidth = 900
    const photoHeight = (photoImg.height / photoImg.width) * photoWidth
    const x = (canvas.width - photoWidth) / 2
    const y = 750 // Positioned for Stories composition

    // Draw photo with rounded corners
    ctx.save()
    ctx.beginPath()
    ctx.roundRect(x, y, photoWidth, photoHeight, 16)
    ctx.clip()
    ctx.drawImage(photoImg, x, y, photoWidth, photoHeight)
    ctx.restore()

  }, [templateLoaded, photoLoaded, templateImg, photoImg])

  // Expose method to generate blob
  useImperativeHandle(ref, () => ({
    generateBlob: async () => {
      if (!templateLoaded || !photoLoaded) return null
      
      const canvas = document.createElement('canvas')
      // Instagram Story dimensions (9:16 aspect ratio)
      canvas.width = 1080
      canvas.height = 1920
      const ctx = canvas.getContext('2d')

      // Draw template
      ctx.drawImage(templateImg, 0, 0, canvas.width, canvas.height)

      // Draw photo
      const photoWidth = 900
      const photoHeight = (photoImg.height / photoImg.width) * photoWidth
      const x = (canvas.width - photoWidth) / 2
      const y = 750 // Positioned for Stories composition

      ctx.save()
      ctx.beginPath()
      ctx.roundRect(x, y, photoWidth, photoHeight, 16)
      ctx.clip()
      ctx.drawImage(photoImg, x, y, photoWidth, photoHeight)
      ctx.restore()

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
          el.width = 1200
          el.height = 1800
          const ctx = el.getContext('2d')
          
          // Draw template
          ctx.drawImage(templateImg, 0, 0, 1200, 1800)
          
          // Draw photo
          const photoWidth = 900
          const photoHeight = (photoImg.height / photoImg.width) * photoWidth
          const x = (1200 - photoWidth) / 2
          const y = 650
          
          ctx.save()
          ctx.beginPath()
          ctx.roundRect(x, y, photoWidth, photoHeight, 16)
          ctx.clip()
          ctx.drawImage(photoImg, x, y, photoWidth, photoHeight)
          ctx.restore()
        }
      }}
      className="w-full h-full object-contain rounded-2xl"
    />
  )
})

export default StaticImageCanvas

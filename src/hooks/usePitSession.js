import { useState, useRef, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'

const COUNTDOWN_SECONDS = 3
const PREVIEW_SECONDS = 1
const TOTAL_PHOTOS = 3

export default function usePitSession() {
  const [sessionId] = useState(() => uuidv4())
  const [status, setStatus] = useState('idle') // idle | countdown | capturing | processing | review
  const [captures, setCaptures] = useState([])
  const [countdown, setCountdown] = useState(null)
  const [currentPhoto, setCurrentPhoto] = useState(0)
  const webcamRef = useRef(null)

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

  const capturePhoto = useCallback(() => {
    if (!webcamRef.current) return null
    const imageSrc = webcamRef.current.getScreenshot()
    return imageSrc
  }, [])

  const dataURLtoBlob = (dataURL) => {
    const arr = dataURL.split(',')
    const mime = arr[0].match(/:(.*?);/)[1]
    const bstr = atob(arr[1])
    let n = bstr.length
    const u8arr = new Uint8Array(n)
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n)
    }
    return new Blob([u8arr], { type: mime })
  }

  const runCountdown = async () => {
    for (let i = COUNTDOWN_SECONDS; i >= 1; i--) {
      setCountdown(i)
      await sleep(1000)
    }
    setCountdown(null)
  }

  const startSession = useCallback(async () => {
    setCaptures([])
    setCurrentPhoto(0)
    const photos = []

    for (let i = 0; i < TOTAL_PHOTOS; i++) {
      setCurrentPhoto(i + 1)
      setStatus('countdown')
      await runCountdown()

      setStatus('capturing')
      const dataURL = capturePhoto()
      if (dataURL) {
        photos.push(dataURLtoBlob(dataURL))
      }

      // Brief preview pause between shots (not after the last one)
      if (i < TOTAL_PHOTOS - 1) {
        await sleep(PREVIEW_SECONDS * 1000)
      }
    }

    setCaptures(photos)
    setStatus('processing')
  }, [capturePhoto])

  const reset = useCallback(() => {
    setStatus('idle')
    setCaptures([])
    setCountdown(null)
    setCurrentPhoto(0)
  }, [])

  const setReview = useCallback(() => {
    setStatus('review')
  }, [])

  const setSelecting = useCallback(() => {
    setStatus('selecting')
  }, [])

  return {
    sessionId,
    status,
    captures,
    countdown,
    currentPhoto,
    webcamRef,
    startSession,
    reset,
    setReview,
    setSelecting,
  }
}

import { IconCameraOff, IconQrcode, IconRefresh, IconScan, IconX } from '@tabler/icons-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Button, IconButton } from '../components/ui.tsx'
import { openShareParam, validScannedShare } from './link.ts'

type Status = 'starting' | 'scanning' | 'checking' | 'failed' | 'no-camera'

interface Detector {
  detect: (source: HTMLVideoElement) => Promise<{ rawValue: string }[]>
}

/** Native BarcodeDetector when it supports QR (Android Chrome); otherwise null. */
async function nativeDetector(): Promise<Detector | null> {
  const BD = (
    globalThis as {
      BarcodeDetector?: { new (o: object): Detector; getSupportedFormats?: () => Promise<string[]> }
    }
  ).BarcodeDetector
  if (!BD) return null
  try {
    const formats = (await BD.getSupportedFormats?.()) ?? ['qr_code']
    return formats.includes('qr_code') ? new BD({ formats: ['qr_code'] }) : null
  } catch {
    return null
  }
}

/** jsQR on video frames (iOS Safari and others without BarcodeDetector). */
async function frameDetector(): Promise<Detector> {
  const { default: jsQR } = await import('jsqr')
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  return {
    detect: async (video) => {
      const w = video.videoWidth
      const h = video.videoHeight
      if (!ctx || !w || !h) return []
      canvas.width = w
      canvas.height = h
      ctx.drawImage(video, 0, 0, w, h)
      const code = jsQR(ctx.getImageData(0, 0, w, h).data, w, h)
      return code ? [{ rawValue: code.data }] : []
    },
  }
}

const SCAN_INTERVAL_MS = 250

function stopStream(stream: MediaStream | null) {
  for (const track of stream?.getTracks() ?? []) track.stop()
}

/** Full-screen camera scanner for share-link QR codes. */
function ScannerOverlay({ onClose }: { onClose: () => void }) {
  const video = useRef<HTMLVideoElement>(null)
  const [status, setStatus] = useState<Status>('starting')
  const [attempt, setAttempt] = useState(0)

  const retry = useCallback(() => {
    setStatus('starting')
    setAttempt((a) => a + 1)
  }, [])

  useEffect(() => {
    let stream: MediaStream | null = null
    let timer: ReturnType<typeof setTimeout> | undefined
    let alive = true

    async function start() {
      let opened: MediaStream
      try {
        opened = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        })
      } catch {
        if (alive) setStatus('no-camera')
        return
      }
      // Closed (or restarted) while the camera was still opening: the cleanup below
      // already ran without a stream, so release this one right away.
      const el = video.current
      if (!alive || !el) {
        stopStream(opened)
        return
      }
      stream = opened
      el.srcObject = stream
      try {
        await el.play()
      } catch {
        // autoplay can be refused; frames still arrive once the stream is attached
      }
      const detector = (await nativeDetector()) ?? (await frameDetector())
      if (!alive) return
      setStatus('scanning')

      const tick = async () => {
        if (!alive) return
        const found = await detector.detect(el).catch(() => [])
        const text = found[0]?.rawValue
        if (!text) {
          timer = setTimeout(() => void tick(), SCAN_INTERVAL_MS)
          return
        }
        setStatus('checking')
        const param = await validScannedShare(text)
        if (!alive) return
        if (param) {
          onClose()
          openShareParam(param)
        } else {
          setStatus('failed')
        }
      }
      void tick()
    }

    void start()
    const el = video.current
    return () => {
      alive = false
      clearTimeout(timer)
      stopStream(stream)
      if (el) el.srcObject = null
    }
    // `attempt` restarts the camera when the user taps 重新掃描.
    // oxlint-disable-next-line react/exhaustive-effect-dependencies
  }, [attempt, onClose])

  return createPortal(
    <dialog
      open
      aria-modal="true"
      aria-label="掃描 QR code"
      className="fixed inset-0 z-50 m-0 flex size-full max-h-none max-w-none flex-col bg-crust p-0 text-text"
    >
      <div className="flex items-center gap-2 px-2 pt-[max(0.5rem,env(safe-area-inset-top))]">
        <IconButton label="關閉掃描" onClick={onClose}>
          <IconX size={24} />
        </IconButton>
        <h2 className="flex-1 font-bold">掃描分享的 QR code</h2>
      </div>

      <div className="relative flex flex-1 items-center justify-center overflow-hidden">
        <video
          ref={video}
          muted
          playsInline
          aria-hidden
          className="absolute inset-0 size-full object-cover"
        />
        {status !== 'no-camera' && (
          <div
            aria-hidden
            className="relative size-64 rounded-3xl border-4 border-accent shadow-[0_0_0_100vmax_rgb(0_0_0/0.45)]"
          />
        )}
      </div>

      <div className="space-y-3 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {status === 'failed' ? (
          <div role="alert" className="space-y-3 rounded-2xl border border-fail bg-base p-4">
            <p className="flex items-center gap-2 font-semibold text-fail-fg">
              <IconQrcode size={20} aria-hidden />
              掃描失敗
            </p>
            <p className="text-sm text-subtext1">這不是阿瓦隆紀錄的分享 QR code，或內容已損毀。</p>
            <Button variant="primary" className="w-full" onClick={retry}>
              <IconRefresh size={20} aria-hidden />
              重新掃描
            </Button>
          </div>
        ) : status === 'no-camera' ? (
          <div role="alert" className="space-y-3 rounded-2xl border border-fail bg-base p-4">
            <p className="flex items-center gap-2 font-semibold text-fail-fg">
              <IconCameraOff size={20} aria-hidden />
              無法使用相機
            </p>
            <p className="text-sm text-subtext1">請在瀏覽器設定允許此網站使用相機後再試一次。</p>
            <Button className="w-full" onClick={retry}>
              <IconRefresh size={20} aria-hidden />
              再試一次
            </Button>
          </div>
        ) : (
          <p className="text-center text-sm text-subtext1" aria-live="polite">
            {status === 'checking'
              ? '讀取中…'
              : status === 'starting'
                ? '開啟相機中…'
                : '將分享的 QR code 對準方框'}
          </p>
        )}
      </div>
    </dialog>,
    document.body,
  )
}

/** Button that opens the scanner. */
export function ScanButton({ variant = 'icon' }: { variant?: 'icon' | 'full' }) {
  const [open, setOpen] = useState(false)
  const close = useCallback(() => setOpen(false), [])
  return (
    <>
      {variant === 'icon' ? (
        <IconButton label="掃描 QR" onClick={() => setOpen(true)}>
          <IconScan size={22} />
        </IconButton>
      ) : (
        <Button className="flex-1" onClick={() => setOpen(true)}>
          <IconScan size={20} aria-hidden />
          掃描 QR
        </Button>
      )}
      {open && <ScannerOverlay onClose={close} />}
    </>
  )
}

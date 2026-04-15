'use client'

import { useState, useEffect } from 'react'
import { Download, X, Smartphone } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [show, setShow] = useState(false)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    // Already installed as PWA
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true)
      return
    }

    // Dismissed before
    if (localStorage.getItem('pwa-install-dismissed')) return

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      // Show banner after 30s of engagement
      setTimeout(() => setShow(true), 30_000)
    }

    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', () => {
      setInstalled(true)
      setShow(false)
    })

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function handleInstall() {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setInstalled(true)
    }
    setShow(false)
    setDeferredPrompt(null)
  }

  function dismiss() {
    setShow(false)
    localStorage.setItem('pwa-install-dismissed', '1')
  }

  if (!show || installed) return null

  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-80 z-40 animate-slide-up">
      <div className="card p-4 shadow-xl border border-brand-100 dark:border-brand-900/40">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center flex-shrink-0">
            <Smartphone className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Install TimeFlow</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Add to home screen for instant access and offline support
            </p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleInstall}
                className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5"
              >
                <Download className="w-3 h-3" />
                Install
              </button>
              <button
                onClick={dismiss}
                className="btn-secondary text-xs px-3 py-1.5"
              >
                Not now
              </button>
            </div>
          </div>
          <button onClick={dismiss} className="btn-ghost p-1 flex-shrink-0 -mt-1 -mr-1">
            <X className="w-3.5 h-3.5 text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  )
}

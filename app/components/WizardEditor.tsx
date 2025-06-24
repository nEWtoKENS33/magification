'use client'

import { useState } from 'react'

export default function WizardEditor({ image }: { image: File }) {
  const [loading, setLoading] = useState(false)
  const [resultUrl, setResultUrl] = useState<string | null>(null)

  const handleMakeWizard = async () => {
    setLoading(true)
    const formData = new FormData()
    formData.append('file', image)

    try {
      const res = await fetch('/api/magify', {
        method: 'POST',
        body: e,
      })

      const data = await res.json()
      setResultUrl(data.resultUrl)
    } catch (err) {
      console.error('❌ Error generating image:', err)
    }

    setLoading(false)
  }

  return (
    <div className="text-center mt-4 space-y-4">
      <button
        onClick={handleMakeWizard}
        disabled={loading}
        className="px-6 py-2 bg-purple-800 text-white rounded-xl hover:bg-purple-700"
      >
        {loading ? 'Casting spell...' : 'Make Me a Wizard'}
      </button>

      {resultUrl && (
        <div className="mt-6">
          <p className="text-white">🧙 Your Magified Image:</p>
          <img
            src={resultUrl}
            alt="Wizard version"
            className="mx-auto mt-4 w-[400px] h-[400px] object-contain border rounded"
          />
        </div>
      )}
    </div>
  )
}

'use client'

import React, { useState } from 'react'

export default function ImageUploader({
  onImageReady,
}: {
  onImageReady: (file: File) => void
}) {
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('image_file', file)
      formData.append('size', 'auto')

      const res = await fetch('https://api.remove.bg/v1.0/removebg', {
        method: 'POST',
        headers: {
          'X-Api-Key': process.env.NEXT_PUBLIC_REMOVE_BG_API_KEY!,
        },
        body: formData,
      })

      if (!res.ok) {
        throw new Error('Failed to remove background')
      }

      const blob = await res.blob()

      // Convertir a imagen cuadrada
      const imageBitmap = await createImageBitmap(blob)
      const size = Math.max(imageBitmap.width, imageBitmap.height)

      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size

      const ctx = canvas.getContext('2d')!
      ctx.clearRect(0, 0, size, size)
      ctx.drawImage(
        imageBitmap,
        (size - imageBitmap.width) / 2,
        (size - imageBitmap.height) / 2
      )

      const finalBlob = await new Promise<Blob>((resolve) =>
        canvas.toBlob((b) => b && resolve(b), 'image/png')
      )

      const squaredFile = new File([finalBlob], 'converted.png', {
        type: 'image/png',
      })

      setPreview(URL.createObjectURL(squaredFile))
      onImageReady(squaredFile)
    } catch (err) {
      console.error(err)
      setError('Something went wrong while removing background.')
    }

    setLoading(false)
  }

  return (
    <div className="text-center p-4">
     <div className="flex justify-center mt-6">
  <label className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-6 rounded cursor-pointer transition duration-300">
    Upload Image
    <input
      type="file"
      accept="image/*"
      onChange={handleFileChange}
      className="hidden"
    />
  </label>
</div>


      {loading && <p className="text-purple-400 mt-4">Working..</p>}
      {error && <p className="text-red-400 mt-2">{error}</p>}

      {preview && !loading && (
        <div className="mt-4">
          <p className="text-sm text-white">Preview (background removed):</p>
          <img
            src={preview}
            alt="preview"
            className="mx-auto mt-2 w-64 h-64 object-contain border rounded"
          />
        </div>
      )}
    </div>
  )
}

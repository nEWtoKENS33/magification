'use client'

import { useState } from 'react'
import ImageUploader from '@/app/components/ImageUploader'
import WizardEditor from '@/app/components/WizardEditor'
import SocialButtons from './components/SocialButtons'


export default function Home() {
  const [readyImage, setReadyImage] = useState<File | null>(null)

  return (
    <main className="min-h-screen text-white flex flex-col items-center py-12 space-y-8">
      <h1 className="text-4xl font-bold text-purple-300">🧙 Magification</h1>
      <p className="text-sm text-gray-400">Upload an image and become a wizard</p>

      {!readyImage ? (
        <ImageUploader onImageReady={setReadyImage} />
      ) : (
        <WizardEditor image={readyImage} />
      )}


     <SocialButtons/>
    </main>
  )
}

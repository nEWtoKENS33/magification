import { NextRequest, NextResponse } from 'next/server'
import { OpenAI } from 'openai'
import sharp from 'sharp'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

// Convierte un Buffer en un objeto File válido para OpenAI
function bufferToFile(buffer: Buffer, name: string, type: string = 'image/png'): File {
  return new File([buffer], name, { type })
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()
    const file = form.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const imageFile = bufferToFile(buffer, 'image.png')

    // 🟣 Crear la máscara a partir del canal alfa con sharp
    const maskBuffer = await sharp(buffer)
      .ensureAlpha() // Asegura canal alfa
      .extractChannel('alpha') // Extrae canal alfa
      .toColourspace('b-w') // Convierte a blanco y negro
      .png()
      .toBuffer()

    const maskFile = bufferToFile(maskBuffer, 'mask.png')

    // ✨ Prompt descriptivo mágico
    const prompt = `Analyze the uploaded image and detect if there is a visible hand, head, and/or a clear main subject (person, creature, or character).

— If a hand is present, add a wizard’s wand (not a staff) being held naturally. The wand should emit a glowing aura in one of the following colors, chosen randomly or balanced by harmony with the original image:

Green (Slytherin style)

Yellow (Hufflepuff style)

Red (Gryffindor style)

Orange (Ravenclaw style)
The aura must be radiant, magical, and clearly visible, surrounding the wand tip and subtly reflecting light on nearby areas.

— If a head is present:

Add a tall, pointed wizard hat that fits the head’s orientation, lighting, and scale.

Also add a long wizard beard in the style of Dumbledore, matching the style and texture of the image (realistic or illustrated).

— Always surround the main subject (character, person, creature, or object) with a soft magical aura, consisting of glows, sparkles, or particles, without replacing or altering the original background. The aura should complement the wand’s glow color if present.

The background of the original image must remain intact.

Important:

If the uploaded image is a photo, all added elements (wand, aura, hat, beard) must look photorealistic and blend naturally.

If the uploaded image is illustrated or stylized art, match the artistic style, colors, and brushwork.

Preserve the subject’s original pose, proportions, and identity. Do not deform, obscure, or overly alter any facial or body features. Focus on enhancing the magical feel without compromising the source content.`

    const response = await openai.images.edit({
      image: imageFile,
      mask: maskFile,
      prompt,
      size: '512x512',
      response_format: 'url',
      n: 1,
    })

    if (!response.data?.[0]?.url) {
      return NextResponse.json({ error: 'No image returned from OpenAI' }, { status: 500 })
    }

    return NextResponse.json({ resultUrl: response.data[0].url })
  } catch (err: any) {
    console.error('❌ Error en /api/magify:', err)
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}

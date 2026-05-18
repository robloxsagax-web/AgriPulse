import fs from 'fs'
import path from 'path'
import sharp from 'sharp'

export const runtime = 'nodejs'
export const maxDuration = 60

const VALID_KATEGORIE = new Set([
  'plastik_metal', 'papier', 'szklo', 'bio', 'zmieszane',
  'tekstylia', 'elektroodpady', 'pszok', 'kaucja', 'niewyrazne', 'niewaste', 'apteka',
])

const REQUIRED_FIELDS = [
  'kategoria', 'pewnosc', 'nazwa_przedmiotu',
  'jak_przygotowac', 'wyjasnienie', 'uwaga_dodatkowa',
  'potrzebne_doprecyzowanie',
]

const TIMEOUT_MS = 60_000

const systemPrompt = fs.readFileSync(
  path.join(process.cwd(), 'app', 'lib', 'system-prompt.md'),
  'utf-8',
)

function errorResponse(status: number, message: string) {
  return Response.json({ error: message }, { status })
}

export async function POST(request: Request) {
  // 1. Parse multipart form data
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return errorResponse(400, 'Nieprawidłowe żądanie.')
  }

  const imageField = formData.get('image')
  if (!imageField || !(imageField instanceof Blob)) {
    return errorResponse(400, 'Nie przesłano zdjęcia.')
  }

  // 2. Validate env vars
  const apiKey = process.env.GOOGLE_API_KEY
  const model = process.env.GOOGLE_MODEL
  if (!apiKey || !model) {
    console.error('[classify] GOOGLE_API_KEY or GOOGLE_MODEL is not set')
    return errorResponse(503, 'Asystent jest chwilowo niedostępny. Spróbuj ponownie za chwilę.')
  }

  // 3. Resize image to max 1024px on the long edge
  let base64Image: string
  try {
    const buffer = Buffer.from(await imageField.arrayBuffer())
    const resized = await sharp(buffer)
      .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer()
    base64Image = resized.toString('base64')
  } catch (err) {
    console.error('[classify] Image processing failed:', err)
    return errorResponse(422, 'Nie udało się przetworzyć zdjęcia. Sprawdź format pliku.')
  }

  // 4. Call Google AI Studio with a timeout
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

  let googleBody: unknown
  try {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
        contents: [{
          parts: [
            { text: 'Do którego kosza powinienem to wyrzucić?' },
            { inline_data: { mime_type: 'image/jpeg', data: base64Image } },
          ],
        }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.3,
        },
      }),
      signal: controller.signal,
    })

    if (!res.ok) {
      const errText = await res.text().catch(() => '')
      console.error('[classify] Google AI returned HTTP', res.status, errText)
      return errorResponse(503, 'Asystent jest chwilowo niedostępny. Spróbuj ponownie za chwilę.')
    }

    googleBody = await res.json()
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      console.error('[classify] Google AI request timed out after', TIMEOUT_MS, 'ms')
      return errorResponse(504, 'Analizowanie zdjęcia trwało zbyt długo. Spróbuj ponownie.')
    }
    console.error('[classify] Google AI unreachable:', err)
    return errorResponse(503, 'Asystent jest chwilowo niedostępny. Spróbuj ponownie za chwilę.')
  } finally {
    clearTimeout(timeoutId)
  }

  // 5. Extract text from non-thought parts (Gemma 4 thinking models include thought: true parts)
  type Part = { text?: string; thought?: boolean }
  const parts: Part[] =
    (googleBody as { candidates?: [{ content?: { parts?: Part[] } }] })
      ?.candidates?.[0]?.content?.parts ?? []

  const answerText = parts
    .filter((p) => !p.thought)
    .map((p) => p.text ?? '')
    .join('')

  if (!answerText) {
    console.error('[classify] No answer parts in Google AI response:', JSON.stringify(googleBody))
    return errorResponse(422, 'Nie udało się przeanalizować zdjęcia. Spróbuj zrobić wyraźniejsze zdjęcie.')
  }

  // 6. Parse the JSON that Gemma produced
  let result: Record<string, unknown>
  try {
    result = JSON.parse(answerText)
  } catch (err) {
    console.error('[classify] Failed to parse Gemma JSON:', err, '\nRaw:', answerText)
    return errorResponse(422, 'Nie udało się przeanalizować zdjęcia. Spróbuj zrobić wyraźniejsze zdjęcie.')
  }

  // 7. Validate required fields are present
  for (const field of REQUIRED_FIELDS) {
    if (!(field in result)) {
      console.error('[classify] Missing required field:', field, result)
      return errorResponse(422, 'Nie udało się przeanalizować zdjęcia. Spróbuj zrobić wyraźniejsze zdjęcie.')
    }
  }

  // 8. Validate kategoria is one of the known values
  if (!VALID_KATEGORIE.has(result.kategoria as string)) {
    console.error('[classify] Unknown kategoria value:', result.kategoria)
    return errorResponse(422, 'Nie udało się przeanalizować zdjęcia. Spróbuj zrobić wyraźniejsze zdjęcie.')
  }

  return Response.json(result)
}

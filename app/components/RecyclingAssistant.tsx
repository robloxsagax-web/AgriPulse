'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

type ViewState = 'idle' | 'camera' | 'preview'

export type BinId =
  | 'yellow' | 'blue' | 'green' | 'brown' | 'gray'
  | 'purple' | 'red' | 'pszok' | 'kaucja'

interface BinInfo {
  dot: string
  bg: string
  hex: string
  textColor: string
  iconType: 'bin' | 'building' | 'return'
  name: string
  fullName: string
  desc: string
  icon: string
}

export const BIN_CONFIG: Record<BinId, BinInfo> = {
  yellow: { dot: 'bg-yellow-400', bg: 'bg-yellow-400', hex: '#facc15', textColor: 'text-yellow-500', iconType: 'bin',      name: 'Żółty',     fullName: 'Żółty kosz',     desc: 'Plastik i metal',                      icon: '🧴' },
  blue:   { dot: 'bg-blue-500',   bg: 'bg-blue-500',   hex: '#3b82f6', textColor: 'text-blue-500',   iconType: 'bin',      name: 'Niebieski', fullName: 'Niebieski kosz', desc: 'Papier i tektura',                     icon: '📰' },
  green:  { dot: 'bg-green-600',  bg: 'bg-green-600',  hex: '#16a34a', textColor: 'text-green-600',  iconType: 'bin',      name: 'Zielony',   fullName: 'Zielony kosz',   desc: 'Szkło',                                icon: '🍾' },
  brown:  { dot: 'bg-amber-700',  bg: 'bg-amber-700',  hex: '#b45309', textColor: 'text-amber-700',  iconType: 'bin',      name: 'Brązowy',   fullName: 'Brązowy kosz',   desc: 'Bio i resztki jedzenia',               icon: '🍂' },
  gray:   { dot: 'bg-gray-400',   bg: 'bg-gray-400',   hex: '#9ca3af', textColor: 'text-gray-500',   iconType: 'bin',      name: 'Szary',     fullName: 'Szary kosz',     desc: 'Odpady zmieszane',                     icon: '🗑️' },
  purple: { dot: 'bg-purple-500', bg: 'bg-purple-500', hex: '#a855f7', textColor: 'text-purple-500', iconType: 'bin',      name: 'Fioletowy', fullName: 'Fioletowy kosz', desc: 'Tekstylia',                            icon: '👕' },
  red:    { dot: 'bg-red-500',    bg: 'bg-red-500',    hex: '#ef4444', textColor: 'text-red-500',    iconType: 'bin',      name: 'Czerwony',  fullName: 'Czerwony kosz',  desc: 'Elektroodpady',                        icon: '🔌' },
  pszok:  { dot: 'bg-orange-500', bg: 'bg-orange-500', hex: '#f97316', textColor: 'text-orange-500', iconType: 'building', name: 'PSZOK',     fullName: 'PSZOK',          desc: 'Odpady problemowe i wielkogabarytowe', icon: '🏭' },
  kaucja: { dot: 'bg-teal-500',   bg: 'bg-teal-500',   hex: '#14b8a6', textColor: 'text-teal-500',   iconType: 'return',   name: 'Kaucja',    fullName: 'Kaucja',         desc: 'Butelki i puszki z kaucją',            icon: '🫙' },
}

const BIN_ORDER: BinId[] = ['yellow', 'blue', 'green', 'brown', 'gray', 'purple', 'red', 'pszok', 'kaucja']

export default function RecyclingAssistant() {
  const [view, setView] = useState<ViewState>('idle')
  const [photo, setPhoto] = useState<string | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [showCameraFallback, setShowCameraFallback] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }, [])

  useEffect(() => () => stopCamera(), [stopCamera])

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhoto(URL.createObjectURL(file))
    setView('preview')
  }

  useEffect(() => {
    if (view === 'camera' && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current
    }
  }, [view])

  async function openCamera() {
    setCameraError(null)
    setShowCameraFallback(false)
    if (!navigator.mediaDevices?.getUserMedia) {
      setShowCameraFallback(true)
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
      })
      streamRef.current = stream
      setView('camera')
    } catch {
      setCameraError('Brak dostępu do kamery. Sprawdź uprawnienia w przeglądarce.')
    }
  }

  function capturePhoto() {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d')?.drawImage(video, 0, 0)
    canvas.toBlob(
      (blob) => {
        if (!blob) return
        stopCamera()
        setPhoto(URL.createObjectURL(blob))
        setView('preview')
      },
      'image/jpeg',
      0.92,
    )
  }

  function handleRetake() {
    if (photo) URL.revokeObjectURL(photo)
    setPhoto(null)
    setView('idle')
  }

  return (
    <main className="flex min-h-screen flex-col items-center bg-stone-50 px-4 pb-16">
      <header className="w-full max-w-md pt-10 pb-6 text-center">
        <div className="mb-3 flex justify-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-600 shadow-md text-white">
            <ReturnIcon className="h-7 w-7" />
          </span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-stone-800">
          Gdzie to wyrzucić?
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-stone-500">
          Zrób zdjęcie przedmiotu, a powiem Ci,
          <br />
          do którego kosza go wrzucić.
        </p>
      </header>

      <div className="w-full max-w-md space-y-4">
        {view === 'idle' && (
          <div className="flex flex-col items-center gap-5 rounded-2xl border-2 border-dashed border-green-200 bg-white py-12 shadow-sm">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-green-600">
              <CameraIcon className="h-8 w-8" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-stone-700">Zrób zdjęcie przedmiotu</p>
              <p className="mt-1 text-xs text-stone-400">lub wybierz z galerii zdjęć</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={openCamera}
                className="flex items-center gap-2 rounded-full bg-green-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition-transform active:scale-95"
              >
                <CameraIcon className="h-4 w-4" />
                Aparat
              </button>
              <label className="relative overflow-hidden flex cursor-pointer items-center gap-2 rounded-full border border-stone-200 bg-white px-6 py-3 text-sm font-semibold text-stone-600 transition-transform active:scale-95">
                <GalleryIcon className="h-4 w-4" />
                Galeria
                <input
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={handleFileSelected}
                />
              </label>
            </div>
            {showCameraFallback && (
              <label className="relative overflow-hidden flex cursor-pointer items-center gap-2 rounded-full bg-green-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition-transform active:scale-95">
                <CameraIcon className="h-4 w-4" />
                Otwórz aparat
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={handleFileSelected}
                />
              </label>
            )}
            {cameraError && (
              <p className="px-6 text-center text-xs text-red-500">{cameraError}</p>
            )}
          </div>
        )}

        {view === 'camera' && (
          <div className="overflow-hidden rounded-2xl bg-black shadow-sm">
            <div className="relative aspect-[3/4] w-full bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between px-6 pb-6 pt-16 bg-gradient-to-t from-black/60 to-transparent">
                <button
                  onClick={() => { stopCamera(); setView('idle') }}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm"
                  aria-label="Anuluj"
                >
                  <CloseIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={capturePhoto}
                  className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-white/20 backdrop-blur-sm transition-transform active:scale-90"
                  aria-label="Zrób zdjęcie"
                >
                  <div className="h-12 w-12 rounded-full bg-white" />
                </button>
                <div className="h-11 w-11" />
              </div>
            </div>
          </div>
        )}

        {view === 'preview' && photo && (
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
            <div className="relative">
              <img
                src={photo}
                alt="Zdjęcie przedmiotu"
                className="aspect-[4/3] w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>
            <div className="flex gap-2 p-3">
              <button
                onClick={handleRetake}
                className="flex-1 rounded-full border border-stone-200 py-2.5 text-sm font-medium text-stone-600 transition-colors active:bg-stone-50"
              >
                Zrób ponownie
              </button>
              <button
                disabled
                className="flex flex-1 cursor-not-allowed items-center justify-center gap-1.5 rounded-full bg-green-600 py-2.5 text-sm font-semibold text-white opacity-40"
              >
                <SparkleIcon className="h-4 w-4" />
                Analizuj
              </button>
            </div>
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />

        <ResultCardPlaceholder />

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-stone-400">
            Kosze na odpady
          </p>
          <div className="space-y-2.5">
            {BIN_ORDER.map((id) => {
              const bin = BIN_CONFIG[id]
              return (
                <div key={id} className="flex items-center gap-3">
                  <LegendIcon binId={id} className="h-4 w-4 shrink-0" />
                  <span className="w-24 shrink-0 text-sm font-medium text-stone-700">
                    {bin.name}
                  </span>
                  <span className="text-sm text-stone-500">{bin.desc}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </main>
  )
}

type Confidence = 'wysoka' | 'srednia' | 'niska'

const CONFIDENCE_STYLES: Record<Confidence, { badge: string; label: string }> = {
  wysoka:  { badge: 'bg-green-100 text-green-700',  label: 'Wysoka pewność' },
  srednia: { badge: 'bg-amber-100 text-amber-700',  label: 'Średnia pewność' },
  niska:   { badge: 'bg-red-100   text-red-600',    label: 'Niska pewność' },
}

function ResultCard({
  binId,
  nazwaObiektu,
  pewnosc,
  instrukcja,
  uwagaDodatkowa,
  wskazowka,
  potrzebneDoprecyzowanie,
}: {
  binId: BinId
  nazwaObiektu: string
  pewnosc: Confidence
  instrukcja: string
  uwagaDodatkowa?: string
  wskazowka: string
  potrzebneDoprecyzowanie?: string
}) {
  const bin = BIN_CONFIG[binId]
  const conf = CONFIDENCE_STYLES[pewnosc]
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
        Wynik analizy
      </p>

      {/* Bin header + confidence badge */}
      <div className="flex items-start gap-3">
        <ResultCardBinIcon binId={binId} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-stone-800">{bin.fullName}</p>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${conf.badge}`}>
              {conf.label}
            </span>
          </div>
          <p className="text-sm text-stone-500">{bin.desc}</p>
        </div>
      </div>

      {/* nazwa_przedmiotu */}
      <p className="text-xs text-stone-400">
        Zidentyfikowano: <span className="font-medium text-stone-600">{nazwaObiektu}</span>
      </p>

      {/* potrzebne_doprecyzowanie */}
      {potrzebneDoprecyzowanie && (
        <div className="rounded-xl bg-sky-50 px-4 py-3">
          <p className="mb-1 text-xs font-semibold text-sky-700">Potrzebne doprecyzowanie</p>
          <p className="text-xs leading-relaxed text-sky-800">{potrzebneDoprecyzowanie}</p>
        </div>
      )}

      {/* jak_przygotowac */}
      <p className="text-sm leading-relaxed text-stone-600">{instrukcja}</p>

      {/* uwaga_dodatkowa */}
      {uwagaDodatkowa && (
        <div className="rounded-xl bg-amber-50 px-4 py-3">
          <p className="mb-1 text-xs font-semibold text-amber-700">Uwaga</p>
          <p className="text-xs leading-relaxed text-amber-800">{uwagaDodatkowa}</p>
        </div>
      )}

      {/* wskazowka */}
      <div className="rounded-xl bg-green-50 px-4 py-3">
        <p className="mb-1 text-xs font-semibold text-green-700">Wskazówka</p>
        <p className="text-xs leading-relaxed text-green-800">{wskazowka}</p>
      </div>

    </div>
  )
}

type PlaceholderExample = {
  binId: BinId
  nazwaObiektu: string
  pewnosc: Confidence
  instrukcja: string
  uwagaDodatkowa?: string
  wskazowka: string
  potrzebneDoprecyzowanie?: string
}

const PLACEHOLDER_EXAMPLES: PlaceholderExample[] = [
  {
    binId: 'yellow',
    nazwaObiektu: 'Butelka plastikowa PET 0,5 l',
    pewnosc: 'wysoka',
    instrukcja: 'Butelki PET, opakowania plastikowe oraz puszki aluminiowe i stalowe wrzucamy do żółtego pojemnika. Opróżnij i zgnieć przed wyrzuceniem.',
    uwagaDodatkowa: 'Jeśli nakrętka jest z innego tworzywa niż butelka, możesz ją odkręcić i wrzucić osobno — też do żółtego kosza.',
    wskazowka: 'Nie musisz myć opakowania — wystarczy że będzie puste i suche. Zgnieć butelkę, żeby zaoszczędzić miejsce w koszu.',
  },
  {
    binId: 'kaucja',
    nazwaObiektu: 'Szklana butelka z oznaczeniem kaucji',
    pewnosc: 'srednia',
    instrukcja: 'Butelki objęte systemem kaucyjnym należy zwrócić do sklepu — nie wrzucać do kosza. Możesz oddać je w automacie RVM lub przy kasie w wyznaczonych sklepach.',
    wskazowka: 'Sprawdź etykietę lub nakrywkę — jeśli widzisz symbol kaucji i kwotę (np. 0,50 zł), butelka podlega zwrotowi i możesz odzyskać pieniądze.',
    potrzebneDoprecyzowanie: 'Czy na butelce widoczne jest oznaczenie kaucji (symbol i kwota)? Jeśli nie, może ona trafić do zielonego kosza na szkło.',
  },
  {
    binId: 'red',
    nazwaObiektu: 'Ładowarka do telefonu USB-C',
    pewnosc: 'wysoka',
    instrukcja: 'Elektroodpady (kable, ładowarki, elektronika) wymagają specjalnego przetworzenia. Oddaj do oznaczonego punktu w sklepie RTV/AGD lub do PSZOK — nigdy do zwykłego kosza.',
    uwagaDodatkowa: 'Jeśli urządzenie zawiera baterię, upewnij się że nie jest uszkodzona lub spuchnięta — uszkodzone baterie oddaj osobno jako odpady niebezpieczne.',
    wskazowka: 'Wiele supermarketów i sklepów elektronicznych ma pojemniki na małe elektroodpady przy wejściu — to najwygodniejsza opcja w codziennych zakupach.',
  },
  {
    binId: 'gray',
    nazwaObiektu: 'Opakowanie wielomateriałowe (karton + folia)',
    pewnosc: 'niska',
    instrukcja: 'Opakowania wielomateriałowe (np. kartony po sokach i mleku z warstwą folii lub aluminium) wrzucamy do szarego kosza na odpady zmieszane, jeśli gmina nie prowadzi osobnej zbiórki.',
    uwagaDodatkowa: 'W niektórych gminach opakowania Tetra Pak zbierane są osobno — razem z papierem lub plastikiem. Zasady różnią się w zależności od miejscowości.',
    wskazowka: 'Zgnieć karton i zdejmij nakrętkę przed wyrzuceniem. Nakrętkę wrzuć do żółtego kosza.',
    potrzebneDoprecyzowanie: 'Czy opakowanie ma warstwę folii lub aluminium wewnątrz (np. karton po mleku lub soku)? To decyduje, czy trafi do papieru czy do odpadów zmieszanych.',
  },
]

function ResultCardPlaceholder() {
  const [index, setIndex] = useState(0)
  const example = PLACEHOLDER_EXAMPLES[index]

  return (
    <div className="space-y-2">
      <ResultCard {...example} />
      <div className="flex items-center justify-between px-1">
        <span className="text-xs italic text-stone-300">
          Przykład {index + 1} z {PLACEHOLDER_EXAMPLES.length} — połączenie z Gemma wkrótce
        </span>
        <button
          onClick={() => setIndex((i) => (i + 1) % PLACEHOLDER_EXAMPLES.length)}
          className="py-2 px-3 text-xs font-medium text-stone-400 transition-colors hover:text-stone-600"
        >
          Następny →
        </button>
      </div>
    </div>
  )
}

function ResultCardBinIcon({ binId }: { binId: BinId }) {
  const bin = BIN_CONFIG[binId]
  return (
    <div
      className={`flex h-20 w-20 shrink-0 flex-col items-center justify-center gap-1 rounded-full shadow-md ${bin.bg}`}
    >
      {bin.iconType === 'building' ? (
        <BuildingIcon className="h-7 w-7 text-white" />
      ) : bin.iconType === 'return' ? (
        <ReturnIcon className="h-7 w-7 text-white" />
      ) : (
        <span
          className="text-white leading-none select-none"
          style={{ fontSize: '28px', fontFamily: 'system-ui, sans-serif' }}
        >
          {'♻︎'}
        </span>
      )}
      <span className="text-[10px] font-bold uppercase tracking-wide text-white/90">
        {bin.name}
      </span>
    </div>
  )
}

function LegendIcon({ binId, className }: { binId: BinId; className?: string }) {
  const bin = BIN_CONFIG[binId]
  const cls = `${className ?? ''} ${bin.textColor}`
  if (bin.iconType === 'building') return <BuildingIcon className={cls} />
  if (bin.iconType === 'return') return <ReturnIcon className={cls} />
  return <TrashBinIcon className={cls} />
}

function TrashBinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
  )
}

function BuildingIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
    </svg>
  )
}

function ReturnIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
    </svg>
  )
}

function CameraIcon({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
    </svg>
  )
}

function GalleryIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
    </svg>
  )
}

function CloseIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  )
}

function SparkleIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
    </svg>
  )
}

import ReSortAssistant from './components/ReSortAssistant'

export default function Page() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#e8e4df] sm:p-6">
      {/* Phone frame: full-bleed on real phones, bezel mockup on larger screens */}
      <div className="relative h-dvh w-full overflow-hidden bg-[#fafaf7] shadow-[0_40px_80px_rgba(0,0,0,0.22),0_8px_24px_rgba(0,0,0,0.12)] ring-1 ring-black/10 sm:h-[min(844px,calc(100dvh-3rem))] sm:w-[390px] sm:rounded-[44px]">
        {/* Notch / camera hole */}
        <div className="pointer-events-none absolute left-1/2 top-2.5 z-50 hidden h-7 w-28 -translate-x-1/2 items-center justify-end rounded-full bg-stone-950 pr-2.5 sm:flex">
          <div className="h-2.5 w-2.5 rounded-full bg-stone-800 ring-1 ring-stone-700" />
        </div>

        {/* Scrollable app content */}
        <div className="h-full w-full overflow-y-auto">
          <ReSortAssistant />
        </div>

        {/* Home indicator */}
        <div className="pointer-events-none absolute bottom-2 left-1/2 z-50 hidden h-1 w-32 -translate-x-1/2 rounded-full bg-stone-950/40 sm:block" />
      </div>
    </div>
  )
}

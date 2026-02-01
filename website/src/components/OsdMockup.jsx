import { useEffect, useState } from 'react'

export default function OsdMockup() {
  const [vol, setVol] = useState(72)

  useEffect(() => {
    let dir = 1
    const id = setInterval(() => {
      setVol((v) => {
        const next = v + dir * 2
        if (next >= 88) dir = -1
        if (next <= 56) dir = 1
        return next
      })
    }, 1200)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="flex flex-col items-center gap-6">
      {/* OSD */}
      <div className="bg-[#0a0612]/75 backdrop-blur-2xl border border-violet-500/25 rounded-2xl px-8 py-5 shadow-[0_0_40px_rgba(139,92,246,0.15),0_20px_60px_rgba(0,0,0,0.4)] animate-[float_6s_ease-in-out_infinite]">
        <div className="flex items-center gap-4 min-w-[320px]">
          <svg className="text-violet-400 shrink-0" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          </svg>
          <div className="flex-1 h-1.5 bg-violet-500/15 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-600 to-violet-400 rounded-full shadow-[0_0_12px_rgba(139,92,246,0.3)] transition-[width] duration-400 ease-out"
              style={{ width: vol + '%' }}
            />
          </div>
          <span className="text-sm font-bold tabular-nums min-w-[36px] text-right">{vol}%</span>
        </div>
      </div>

      {/* Shortcut hint */}
      <div className="flex items-center gap-2.5 text-violet-200/30 text-sm">
        <kbd className="px-2.5 py-1 text-xs font-semibold bg-violet-500/8 border border-violet-500/25 rounded-md text-violet-300">Alt</kbd>
        <span className="font-light">+</span>
        <svg className="text-violet-400" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="8" y="2" width="8" height="20" rx="4" />
          <line x1="12" y1="6" x2="12" y2="10" strokeWidth="2" strokeLinecap="round" />
          <path className="animate-[scroll-hint_2s_ease-in-out_infinite]" d="M9 4l3-3 3 3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  )
}

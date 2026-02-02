import { useEffect, useState } from 'react'

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav
      className={`fixed top-0 inset-x-0 z-50 h-16 transition-all duration-400 border-b ${
        scrolled
          ? 'bg-[#050208]/85 backdrop-blur-xl border-violet-500/12'
          : 'border-transparent'
      }`}
    >
      <div className="max-w-[1120px] mx-auto px-6 h-full flex items-center justify-between">
        <a href="#" className="flex items-center gap-2.5 font-bold text-lg">
          <span className="w-8 h-8 bg-gradient-to-br from-violet-600 to-violet-400 rounded-[10px] flex items-center justify-center text-xs font-extrabold text-white shadow-[0_0_20px_rgba(139,92,246,0.3)]">
            Vy
          </span>
          <span>Volox</span>
        </a>
        <div className="flex items-center gap-8">
          <a href="#features" className="hidden sm:block text-sm font-medium text-violet-200/60 hover:text-white transition-colors">Features</a>
          <a href="#how-it-works" className="hidden sm:block text-sm font-medium text-violet-200/60 hover:text-white transition-colors">How it works</a>
          <a
            href="#download"
            className="px-5 py-2 bg-violet-600 text-white text-sm font-semibold rounded-[10px] shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:bg-violet-500 hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] hover:-translate-y-0.5 transition-all"
          >
            Download
          </a>
        </div>
      </div>
    </nav>
  )
}

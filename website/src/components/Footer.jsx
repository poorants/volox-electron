export default function Footer() {
  return (
    <footer className="border-t border-violet-500/12 py-8 px-6">
      <div className="max-w-[1120px] mx-auto flex items-center justify-between max-sm:flex-col max-sm:gap-4 max-sm:text-center">
        <div className="flex items-center gap-3 text-sm text-violet-200/25">
          <span className="w-7 h-7 bg-gradient-to-br from-violet-600 to-violet-400 rounded-lg flex items-center justify-center text-[10px] font-extrabold text-white">Vy</span>
          &copy; 2025 Voly
        </div>
        <div className="flex gap-6">
          <a href="https://github.com" target="_blank" rel="noopener" className="text-sm text-violet-200/25 hover:text-white transition-colors">GitHub</a>
          <a href="#" className="text-sm text-violet-200/25 hover:text-white transition-colors">License</a>
        </div>
      </div>
    </footer>
  )
}

import { motion } from 'framer-motion'

export default function Download() {
  return (
    <section id="download" className="py-28 px-6">
      <div className="max-w-[1120px] mx-auto">
        <motion.div
          className="relative text-center bg-[#0a0612]/70 backdrop-blur-2xl border border-violet-500/25 rounded-3xl py-20 px-10 overflow-hidden"
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.7 }}
        >
          {/* Glow */}
          <div className="absolute -top-1/2 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.15)_0%,transparent_60%)] pointer-events-none" />

          <h2 className="relative text-[clamp(1.8rem,3.5vw,2.5rem)] font-extrabold mb-3">
            Ready to take control?
          </h2>
          <p className="relative text-violet-200/50 text-lg mb-9">
            Free, open source, and under 10MB. No account needed.
          </p>
          <div className="relative flex flex-col items-center gap-4">
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="https://github.com/poorants/volox-electron/releases/latest/download/volox-setup.exe"
                className="inline-flex items-center gap-2.5 px-8 py-4 bg-violet-600 text-white text-lg font-semibold rounded-2xl shadow-[0_0_30px_rgba(139,92,246,0.3),0_4px_20px_rgba(0,0,0,0.3)] hover:bg-violet-500 hover:shadow-[0_0_50px_rgba(139,92,246,0.5)] hover:-translate-y-0.5 transition-all active:scale-[0.97]"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801"/>
                </svg>
                Windows
              </a>
              <a
                href="https://github.com/poorants/volox-electron/releases/latest/download/volox.dmg"
                className="inline-flex items-center gap-2.5 px-8 py-4 border border-violet-500/40 text-violet-100 text-lg font-semibold rounded-2xl hover:bg-violet-500/10 hover:border-violet-400 hover:-translate-y-0.5 transition-all active:scale-[0.97]"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                macOS
              </a>
            </div>
            <span className="text-xs text-violet-200/25">Windows 10+ / macOS 11+</span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

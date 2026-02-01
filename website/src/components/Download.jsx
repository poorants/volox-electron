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
          <div className="relative flex flex-col items-center gap-3">
            <a
              href="#"
              className="inline-flex items-center gap-2.5 px-9 py-4.5 bg-violet-600 text-white text-lg font-semibold rounded-2xl shadow-[0_0_30px_rgba(139,92,246,0.3),0_4px_20px_rgba(0,0,0,0.3)] hover:bg-violet-500 hover:shadow-[0_0_50px_rgba(139,92,246,0.5)] hover:-translate-y-0.5 transition-all active:scale-[0.97]"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download Voly v2.0
            </a>
            <span className="text-xs text-violet-200/25">Windows 10+ &middot; x64</span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

import { motion } from 'framer-motion'
import OsdMockup from './OsdMockup'

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (i) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.12, duration: 0.7, ease: [0.4, 0, 0.2, 1] },
  }),
}

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24 pb-20 px-6">
      {/* Grid background */}
      <div
        className="absolute inset-0 animate-[grid-drift_20s_linear_infinite]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(139,92,246,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.05) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
          maskImage: 'radial-gradient(ellipse 60% 60% at 50% 40%, black 20%, transparent 70%)',
          WebkitMaskImage: 'radial-gradient(ellipse 60% 60% at 50% 40%, black 20%, transparent 70%)',
        }}
      />

      {/* Radial glow */}
      <div className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.12)_0%,transparent_60%)] pointer-events-none" />

      <div className="relative z-10 text-center max-w-[720px]">
        {/* Badge */}
        <motion.div
          custom={0} variants={fadeUp} initial="hidden" animate="visible"
          className="inline-flex items-center gap-2 px-4 py-1.5 bg-violet-500/8 border border-violet-500/25 rounded-full text-xs font-medium text-violet-300 mb-7"
        >
          <span className="w-1.5 h-1.5 bg-violet-400 rounded-full shadow-[0_0_8px_theme(colors.violet.400)] animate-pulse" />
          Free &amp; Open Source
        </motion.div>

        {/* Title */}
        <motion.h1
          custom={1} variants={fadeUp} initial="hidden" animate="visible"
          className="text-[clamp(2.8rem,6vw,4.5rem)] font-extrabold leading-[1.08] tracking-tight mb-6"
        >
          Volume,<br />
          <span className="bg-gradient-to-br from-violet-400 via-violet-300 to-violet-200 bg-clip-text text-transparent">
            the way it should be.
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          custom={2} variants={fadeUp} initial="hidden" animate="visible"
          className="text-[clamp(1rem,2vw,1.15rem)] text-violet-200/50 leading-relaxed mb-10 max-w-[540px] mx-auto"
        >
          Control your system volume with a simple keyboard shortcut and mouse wheel.
          <br />Minimal. Fast. Beautiful.
        </motion.p>

        {/* CTA */}
        <motion.div
          custom={3} variants={fadeUp} initial="hidden" animate="visible"
          className="flex items-center justify-center gap-4 flex-wrap mb-16"
        >
          <a href="#download" className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-violet-600 text-white font-semibold rounded-[14px] shadow-[0_0_30px_rgba(139,92,246,0.3),0_4px_20px_rgba(0,0,0,0.3)] hover:bg-violet-500 hover:shadow-[0_0_50px_rgba(139,92,246,0.5)] hover:-translate-y-0.5 transition-all active:scale-[0.97]">
            <DownloadIcon />
            Get Volox
          </a>
          <a href="https://github.com/poorants/volox" target="_blank" rel="noopener" className="inline-flex items-center gap-2.5 px-7 py-3.5 border border-violet-500/25 text-violet-200/60 font-semibold rounded-[14px] hover:bg-violet-500/8 hover:text-white hover:border-violet-400 transition-all active:scale-[0.97]">
            <GithubIcon />
            View on GitHub
          </a>
        </motion.div>

        {/* OSD Mockup */}
        <motion.div custom={4} variants={fadeUp} initial="hidden" animate="visible">
          <OsdMockup />
        </motion.div>
      </div>
    </section>
  )
}

function DownloadIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}

function GithubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  )
}

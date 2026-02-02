import { motion } from 'framer-motion'

const steps = [
  {
    num: '01',
    title: 'Install & Forget',
    desc: 'Run the installer. Volox starts in your system tray. Enable "Launch at startup" and it\'s always there.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
    ),
  },
  {
    num: '02',
    title: 'Hold & Scroll',
    desc: <>Hold <kbd className="px-2 py-0.5 text-xs font-semibold bg-violet-500/8 border border-violet-500/25 rounded-md text-violet-300">Alt</kbd> and scroll your mouse wheel. Volume goes up, volume goes down. That's it.</>,
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="8" y="2" width="8" height="20" rx="4" /><line x1="12" y1="6" x2="12" y2="10" strokeWidth="2" strokeLinecap="round" /></svg>
    ),
  },
  {
    num: '03',
    title: 'See the Feedback',
    desc: 'A sleek overlay appears showing your current volume. Fades away automatically. Never interrupts your flow.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" /></svg>
    ),
  },
]

const stepVariants = {
  hidden: { opacity: 0, y: 32 },
  visible: (i) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.15, duration: 0.6, ease: [0.4, 0, 0.2, 1] },
  }),
}

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="relative py-28 px-6">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-violet-500/25 to-transparent" />

      <div className="max-w-[1120px] mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.7 }}
        >
          <span className="inline-block text-xs font-semibold uppercase tracking-[0.15em] text-violet-400 mb-4">How it works</span>
          <h2 className="text-[clamp(2rem,4vw,3rem)] font-extrabold tracking-tight leading-tight">
            Three seconds to master.
          </h2>
        </motion.div>

        <div className="flex flex-col gap-6">
          {steps.map((s, i) => (
            <motion.div
              key={s.num}
              custom={i}
              variants={stepVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-40px' }}
              className="grid grid-cols-[60px_1fr_auto] max-md:grid-cols-1 max-md:text-center items-center gap-6 bg-[#0a0612]/70 backdrop-blur-xl border border-violet-500/12 rounded-2xl p-8 transition-all duration-300 hover:border-violet-500/25 hover:shadow-[0_0_40px_rgba(139,92,246,0.08)]"
            >
              <span className="text-3xl font-extrabold text-violet-600/40 tabular-nums max-md:text-2xl">{s.num}</span>
              <div>
                <h3 className="text-lg font-bold mb-1.5">{s.title}</h3>
                <p className="text-sm text-violet-200/50 leading-relaxed">{s.desc}</p>
              </div>
              <div className="w-16 h-16 flex items-center justify-center bg-violet-500/8 border border-violet-500/12 rounded-2xl text-violet-400 max-md:mx-auto">
                {s.icon}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

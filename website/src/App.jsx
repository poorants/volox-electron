import Nav from './components/Nav'
import Hero from './components/Hero'
import Features from './components/Features'
import HowItWorks from './components/HowItWorks'
import Download from './components/Download'
import Footer from './components/Footer'
import CursorGlow from './components/CursorGlow'

export default function App() {
  return (
    <div className="relative min-h-screen overflow-x-hidden text-white font-sans">
      <CursorGlow />
      <Nav />
      <Hero />
      <Features />
      <HowItWorks />
      <Download />
      <Footer />
    </div>
  )
}

import { useEffect, useRef } from 'react'

export default function CursorGlow() {
  const ref = useRef(null)

  useEffect(() => {
    let x = 0, y = 0, gx = 0, gy = 0
    let active = false

    const onMove = (e) => {
      x = e.clientX
      y = e.clientY
      active = true
    }
    const onLeave = () => { active = false }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseleave', onLeave)

    let raf
    const animate = () => {
      gx += (x - gx) * 0.08
      gy += (y - gy) * 0.08
      if (ref.current) {
        ref.current.style.left = gx + 'px'
        ref.current.style.top = gy + 'px'
        ref.current.style.opacity = active ? '1' : '0'
      }
      raf = requestAnimationFrame(animate)
    }
    raf = requestAnimationFrame(animate)

    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseleave', onLeave)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div
      ref={ref}
      className="pointer-events-none fixed z-[9999] w-[500px] h-[500px] rounded-full opacity-0 -translate-x-1/2 -translate-y-1/2 transition-opacity duration-300"
      style={{
        background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)',
      }}
    />
  )
}

'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface CelebrationOverlayProps {
  onDismiss: () => void
}

const PARTICLES = Array.from({ length: 16 }, (_, i) => ({
  angle: (i / 16) * 2 * Math.PI,
  color: i % 3 === 0 ? '#c9a96e' : i % 3 === 1 ? '#e8c97a' : '#ffffff',
  size: i % 2 === 0 ? 6 : 4,
  distance: 38 + (i % 4) * 8,
}))

export function CelebrationOverlay({ onDismiss }: CelebrationOverlayProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 3000)
    return () => clearTimeout(timer)
  }, [onDismiss])

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
        role="dialog"
        aria-modal="true"
        aria-label="Exceptional dining experience"
        className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-charcoal-950/97 backdrop-blur-md"
        onClick={onDismiss}
      >
        {/* Particle burst */}
        <div aria-hidden="true" className="absolute inset-0 overflow-hidden pointer-events-none">
          {PARTICLES.map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 1, scale: 0, x: '50vw', y: '50vh' }}
              animate={{
                opacity: 0,
                scale: 1.2,
                x: `calc(50vw + ${Math.cos(p.angle) * p.distance}vw)`,
                y: `calc(50vh + ${Math.sin(p.angle) * p.distance}vh)`,
              }}
              transition={{ duration: 1.4, delay: 0.15 + i * 0.02, ease: [0.25, 0.46, 0.45, 0.94] }}
              style={{ width: p.size, height: p.size, background: p.color, borderRadius: '50%', position: 'absolute' }}
            />
          ))}
        </div>

        {/* Glow ring */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
          aria-hidden="true"
          className="absolute w-64 h-64 rounded-full border border-gold-400/20"
          style={{ boxShadow: '0 0 80px rgba(201,169,110,0.15)' }}
        />

        {/* Content */}
        <motion.div
          initial={{ scale: 0.6, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 180, damping: 16, delay: 0.15 }}
          className="text-center px-8 relative z-10"
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-7xl mb-6"
            aria-hidden="true"
          >
            ✦
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="font-serif text-4xl text-gold-400 mb-3 tracking-wide"
          >
            Exceptional
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-cream-100/65 text-sm max-w-xs leading-relaxed font-serif italic"
          >
            A dining experience worth remembering forever. Your memory has been saved.
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="mt-8 text-xs text-cream-100/25 tracking-widest uppercase"
          >
            Tap to continue
          </motion.p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

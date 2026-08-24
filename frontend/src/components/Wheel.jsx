import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Coffee, Shield, Target, Crown, Loader2 } from 'lucide-react'
import clsx from 'clsx'

export default function Wheel({
  players = [],
  onResult,
  onStart,
  onStop,
  title = "Qui paiera le café ?",
  disabled = false
}) {
  const [isSpinning, setIsSpinning] = useState(false)
  const [winner, setWinner] = useState(null)
  const [rotation, setRotation] = useState(0)
  const [hasImmunity, setHasImmunity] = useState(false)
  
  const wheelRef = useRef(null)
  const timerRef = useRef(null)
  const speedRef = useRef(0)
  const slowingRef = useRef(false)

  const finishSpin = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }

    const newIndex = Math.floor(Math.random() * players.length)
    speedRef.current = 0
    slowingRef.current = false
    setWinner(players[newIndex].id)
    setIsSpinning(false)
    if (onResult) onResult(players[newIndex])
    if (onStop) onStop()
  }

  // Clear any existing timer
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  // Handle immunity check
  useEffect(() => {
    if (winner) {
      const winnerPlayer = players.find(p => p.id === winner)
      if (winnerPlayer && winnerPlayer.has_immunity) {
        setHasImmunity(true)
        // Auto-restart after immunity animation
        const immunityTimer = setTimeout(() => {
          setHasImmunity(false)
          setWinner(null)
          setIsSpinning(false)
          if (onStop) onStop()
        }, 2000)
        return () => clearTimeout(immunityTimer)
      }
    }
  }, [winner, players, onStop])

  const startSpin = () => {
    if (isSpinning || disabled || players.length === 0) return
    
    setIsSpinning(true)
    slowingRef.current = false
    setWinner(null)
    setHasImmunity(false)
    setRotation(0)
    speedRef.current = 0
    
    if (onStart) onStart()
    
    const spin = () => {
      // Accelerate
      if (speedRef.current < 30) {
        speedRef.current += 0.5
      }
      
      // Randomly start slowing down
      if (Math.random() < 0.01 && !slowingRef.current) {
        slowingRef.current = true
      }
      
      // Slow down
      if (slowingRef.current) {
        speedRef.current *= 0.95
        if (speedRef.current < 0.1) {
          finishSpin()
          return
        }
      }
      
      // Update rotation
      setRotation(prev => prev + speedRef.current)
      timerRef.current = setTimeout(spin, 16)
    }
    
    spin()
  }

  const stopSpin = () => {
    if (!isSpinning) return
    finishSpin()
  }

  const handleKeyDown = (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      if (isSpinning) {
        stopSpin()
      } else {
        startSpin()
      }
    }
  }

  // Winner name
  const winnerPlayer = players.find(p => p.id === winner)
  const displayName = winnerPlayer?.name || '???'

  // Immunity animation
  const immunityAnimation = {
    hidden: { opacity: 0, scale: 0.5, rotate: -10 },
    visible: { 
      opacity: 1, 
      scale: [1, 1.2, 1], 
      rotate: [0, 10, -10, 0],
      transition: { duration: 0.5, repeat: 2 }
    },
    exit: { opacity: 0, scale: 0.5, rotate: 10, transition: { duration: 0.3 } }
  }

  return (
    <div 
      className="flex flex-col items-center gap-6"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {/* Title */}
      <motion.h3 
        className="text-xl font-bold text-coffee-dark text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {title}
      </motion.h3>

      {/* Wheel Container */}
      <div 
        className="relative w-64 h-64 md:w-80 md:h-80"
        ref={wheelRef}
      >
        {/* Wheel */}
        <motion.div 
          className="absolute inset-0 rounded-full border-8 border-coffee-dark/20 shadow-inner overflow-visible"
          style={{
            background: `conic-gradient(
              from 0deg at 50% 50%,
              ${players.map((_, i) => {
                const colors = ['#d97706', '#ea580c', '#dc2626', '#db2777', '#9333ea']
                return `${colors[i % colors.length]} ${(i * (360 / players.length))}deg ${((i + 1) * (360 / players.length))}deg`
              }).join(', ')}
            )`
          }}
          animate={{ rotate: rotation }}
          transition={{ ease: 'easeOut' }}
        >
          {/* Labels stay centered on their segment while the wheel rotates. */}
          {players.map((player, index) => {
            const angle = (index / players.length) * 360

            return (
              <motion.span
                key={player.id}
                className="absolute left-1/2 top-1/2 z-[1] max-w-[38%] -translate-x-1/2 -translate-y-1/2 truncate text-center text-xs font-bold text-white drop-shadow-md md:text-sm"
                style={{
                  transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(clamp(-118px, -34%, -78px)) rotate(${-angle}deg)`,
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                {player.name}
              </motion.span>
            )
          })}

          {/* Center circle */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div 
              className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-coffee-cream to-white rounded-full border-4 border-coffee-dark shadow-lg flex items-center justify-center z-10"
              animate={isSpinning ? { scale: [1, 1.05, 1] } : {}}
              transition={{ duration: 0.5, repeat: Infinity }}
            >
              {isSpinning ? (
                <Loader2 className="w-8 h-8 text-coffee-dark animate-spin" />
              ) : winner ? (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-center"
                >
                  {hasImmunity ? (
                    <Shield className="w-8 h-8 text-red-500 mx-auto animate-shake" />
                  ) : (
                    <Crown className="w-8 h-8 text-amber-500 mx-auto" />
                  )}
                </motion.div>
              ) : (
                <Target className="w-8 h-8 text-coffee-dark" />
              )}
            </motion.div>
          </div>

          {/* Pointer */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-b-[20px] border-b-coffee-dark" />
          </div>
        </motion.div>

        {/* Winner overlay */}
        <AnimatePresence>
          {winner && !hasImmunity && (
            <motion.div 
              className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center z-20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div 
                className="bg-white rounded-2xl p-6 shadow-xl text-center max-w-xs"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 500 }}
              >
                <Crown className="w-10 h-10 text-amber-500 mx-auto mb-3 animate-bounce" />
                <h4 className="font-bold text-coffee-dark text-lg">Gagnant !</h4>
                <p className="text-coffee-light mt-1">{displayName}</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Immunity overlay */}
        <AnimatePresence>
          {hasImmunity && (
            <motion.div 
              className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center z-20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div 
                className="bg-white rounded-2xl p-6 shadow-xl text-center max-w-xs"
                variants={immunityAnimation}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <Shield className="w-10 h-10 text-red-500 mx-auto mb-3" />
                <h4 className="font-bold text-coffee-dark text-lg">Immunité !</h4>
                <p className="text-coffee-light mt-1">{displayName}</p>
                <p className="text-xs text-coffee-light/70 mt-2">Nouveau tirage...</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="flex gap-4">
        {!isSpinning ? (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={startSpin}
            disabled={disabled || players.length === 0}
            className={clsx(
              "btn btn-primary gap-2 shadow-lg",
              (disabled || players.length === 0) && "opacity-50 cursor-not-allowed"
            )}
          >
            <Coffee className="w-5 h-5" />
            Tirer au sort
          </motion.button>
        ) : (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={stopSpin}
            className="btn btn-error gap-2 shadow-lg"
          >
            <Target className="w-5 h-5" />
            Arrêter
          </motion.button>
        )}
      </div>

      {/* Help text */}
      {players.length === 0 && (
        <p className="text-coffee-light text-sm">
          Sélectionnez des joueurs pour commencer
        </p>
      )}
    </div>
  )
}

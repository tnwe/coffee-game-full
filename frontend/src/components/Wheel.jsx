import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Coffee, Shield, Target, CreditCard, HandPlatter, Loader2 } from 'lucide-react'
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
  const animationRef = useRef(null)
  const rotationRef = useRef(0)
  const targetRotationRef = useRef(0)
  const animationFromRef = useRef(0)
  const animationStartRef = useRef(0)
  const animationDurationRef = useRef(0)
  const winnerIndexRef = useRef(0)

  const finishSpin = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }

    const winnerPlayer = players[winnerIndexRef.current]
    setRotation(targetRotationRef.current)
    rotationRef.current = targetRotationRef.current
    setWinner(winnerPlayer.id)
    setIsSpinning(false)
    if (onResult) onResult(winnerPlayer)
    if (onStop) onStop()
  }

  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [])

  useEffect(() => {
    if (!winner) return

    const winnerPlayer = players.find(player => player.id === winner)
    if (!winnerPlayer?.has_immunity) return

    setHasImmunity(true)
    const immunityTimer = setTimeout(() => {
      setHasImmunity(false)
      setWinner(null)
      setIsSpinning(false)
      if (onStop) onStop()
    }, 2000)

    return () => clearTimeout(immunityTimer)
  }, [winner, players, onStop])

  const startSpin = () => {
    if (isSpinning || disabled || players.length === 0) return

    const winnerIndex = Math.floor(Math.random() * players.length)
    const sliceSize = 360 / players.length
    const targetOffset = (360 - (winnerIndex * sliceSize + sliceSize / 2)) % 360

    winnerIndexRef.current = winnerIndex
    rotationRef.current = 0
    targetRotationRef.current = 360 * 6 + targetOffset
    animationFromRef.current = 0
    animationStartRef.current = performance.now()
    animationDurationRef.current = 4500
    setIsSpinning(true)
    setWinner(null)
    setHasImmunity(false)
    setRotation(0)
    if (onStart) onStart()

    const spin = (timestamp) => {
      const progress = Math.min(
        (timestamp - animationStartRef.current) / animationDurationRef.current,
        1
      )
      const easedProgress = 1 - Math.pow(1 - progress, 3)
      const nextRotation = animationFromRef.current + (
        targetRotationRef.current - animationFromRef.current
      ) * easedProgress

      rotationRef.current = nextRotation
      setRotation(nextRotation)

      if (progress >= 1) {
        finishSpin()
      } else {
        animationRef.current = requestAnimationFrame(spin)
      }
    }

    animationRef.current = requestAnimationFrame(spin)
  }

  const stopSpin = () => {
    if (!isSpinning) return

    animationFromRef.current = rotationRef.current
    const currentAngle = rotationRef.current % 360
    const sliceSize = 360 / players.length
    const targetOffset = (360 - (winnerIndexRef.current * sliceSize + sliceSize / 2)) % 360
    const remainingAngle = (targetOffset - currentAngle + 360) % 360
    targetRotationRef.current = rotationRef.current + 360 * 2 + remainingAngle
    animationStartRef.current = performance.now()
    animationDurationRef.current = 1200
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
                const colors = [
                  '#3b2116', '#4a2b1c', '#5a351f', '#6b4025', '#7b4b2b',
                  '#8c5833', '#9d6740', '#ae764e', '#bf8960', '#d1a17b',
                  '#e1bfa0', '#edd9c2'
                ]
                return `${colors[i % colors.length]} ${(i * (360 / players.length))}deg ${((i + 1) * (360 / players.length))}deg`
              }).join(', ')}
            )`
          }}
          animate={{ rotate: rotation }}
          transition={{ ease: 'easeOut' }}
        >
          {/* Each label sits at its sector midpoint and counter-rotates with the wheel. */}
          {players.map((player, index) => {
            const angle = (index + 0.5) * (360 / players.length)

            return (
              <motion.span
                key={player.id}
                className="absolute left-1/2 top-1/2 z-[1] max-w-[28%] -translate-x-1/2 -translate-y-1/2 truncate text-center text-xs font-bold text-white drop-shadow-md md:text-sm"
                style={{
                  transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(clamp(-112px, -42%, -78px)) rotate(${-angle - rotation}deg)`,
                  color: index >= 10 ? '#3b2116' : '#ffffff',
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
                    <CreditCard className="w-8 h-8 text-amber-500 mx-auto" />
                  )}
                </motion.div>
              ) : (
                <Target className="w-8 h-8 text-coffee-dark" />
              )}
            </motion.div>
          </div>

        </motion.div>

        {/* Fixed pointer: it must not be a child of the rotating wheel. */}
        <div className="absolute top-0 left-1/2 z-30 -translate-x-1/2 -translate-y-1/2">
          <div className="w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[20px] border-t-coffee-dark" />
        </div>

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
                <CreditCard className="w-10 h-10 text-amber-500 mx-auto mb-3 animate-bounce" />
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
                <HandPlatter className="w-10 h-10 text-blue-500 mx-auto mb-3" />
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

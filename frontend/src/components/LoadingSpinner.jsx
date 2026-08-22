import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import clsx from 'clsx'

export default function LoadingSpinner({ 
  className = '', 
  size = 'md',
  text = 'Chargement...' 
}) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  }

  return (
    <div className={clsx("flex flex-col items-center justify-center gap-3", className)}>
      <motion.div
        className={clsx("animate-spin", sizeClasses[size])}
        initial={{ rotate: 0 }}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      >
        <Loader2 className="w-full h-full text-coffee-dark" />
      </motion.div>
      {text && (
        <p className="text-coffee-light text-sm">{text}</p>
      )}
    </div>
  )
}

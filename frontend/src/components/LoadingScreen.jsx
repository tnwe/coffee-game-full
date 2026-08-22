import { motion } from 'framer-motion'
import { Coffee, Loader2 } from 'lucide-react'

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-coffee-dark via-coffee-medium to-coffee-dark flex items-center justify-center z-50">
      {/* Background pattern */}
      <div className="absolute inset-0 coffee-bean-bg opacity-20" />
      
      {/* Loading content */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 text-center"
      >
        {/* Coffee cup animation */}
        <motion.div 
          className="relative mb-8"
          animate={{ y: [-10, 0, -10] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div className="relative mx-auto w-32 h-32">
            {/* Cup */}
            <motion.div 
              className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-20 bg-gradient-to-b from-coffee-light to-coffee-dark rounded-b-3xl border-4 border-coffee-dark"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
            
            {/* Cup handle */}
            <div className="absolute right-[-8px] top-1/2 -translate-y-1/2 w-6 h-8 bg-coffee-dark rounded-r-full border-2 border-coffee-dark" />
            
            {/* Coffee */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-16 h-12 bg-coffee-dark rounded-b-2xl" />
            
            {/* Steam */}
            <motion.div 
              className="absolute -top-8 left-1/2 -translate-x-1/2"
              animate={{ opacity: [0.3, 0.8, 0.3], y: [-10, -20, -10] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <div className="w-2 h-8 bg-white/30 rounded-full blur-sm" />
            </motion.div>
            <motion.div 
              className="absolute -top-8 left-1/2 -translate-x-3/4"
              animate={{ opacity: [0.3, 0.8, 0.3], y: [-10, -25, -10] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
            >
              <div className="w-2 h-8 bg-white/30 rounded-full blur-sm" />
            </motion.div>
            <motion.div 
              className="absolute -top-8 left-1/2 -translate-x-1/4"
              animate={{ opacity: [0.3, 0.8, 0.3], y: [-10, -20, -10] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
            >
              <div className="w-2 h-8 bg-white/30 rounded-full blur-sm" />
            </motion.div>
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1 
          className="text-4xl md:text-5xl font-bold text-white mb-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          Coffee Game
        </motion.h1>
        
        <motion.p 
          className="text-white/80 text-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          Chargement...
        </motion.p>

        {/* Loading bar */}
        <motion.div 
          className="mt-8 w-64 h-1 bg-white/20 rounded-full overflow-hidden mx-auto"
          initial={{ width: 0 }}
          animate={{ width: '100%' }}
          transition={{ duration: 2, ease: 'easeInOut' }}
        >
          <motion.div 
            className="h-full bg-gradient-to-r from-coffee-cream to-white"
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 2, ease: 'easeInOut' }}
          />
        </motion.div>
      </motion.div>
    </div>
  )
}

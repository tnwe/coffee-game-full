import { motion } from 'framer-motion'
import { Calendar, CreditCard, HandPlatter } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function RecentGame({ game, index }) {
  const date = new Date(game.date)
  const formattedDate = format(date, 'EEE d MMM yyyy', { locale: fr })
  
  const isDoublette = game.payer_id === game.fetcher_id && game.payer_id
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`flex flex-wrap items-center gap-4 p-4 rounded-xl bg-coffee-cream/50 hover:bg-coffee-cream/80 transition-colors duration-200 ${
        isDoublette ? 'border border-amber-500/30' : 'border border-transparent'
      }`}
    >
      {/* Date */}
      <div className="flex items-center gap-2 text-coffee-light">
        <Calendar className="w-5 h-5" />
        <span className="text-sm">{formattedDate}</span>
      </div>

      {/* Payer */}
      <div className="flex items-center gap-2">
        <CreditCard className="w-5 h-5 text-amber-500" />
        <span className="font-medium text-coffee-dark">
          {game.payer?.name || '?'}
        </span>
      </div>

      {/* Fetcher */}
      <div className="flex items-center gap-2">
        <HandPlatter className="w-5 h-5 text-blue-500" />
        <span className="font-medium text-coffee-dark">
          {game.fetcher?.name || '?'}
        </span>
      </div>

      {/* Doublette badge */}
      {isDoublette && (
        <span className="badge badge-warning ml-auto">
          Doublette !
        </span>
      )}
    </motion.div>
  )
}

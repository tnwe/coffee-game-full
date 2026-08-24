import { motion } from 'framer-motion'
import { Calendar, Users } from 'lucide-react'
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
      className={`flex items-center gap-4 p-4 rounded-xl bg-coffee-cream/50 hover:bg-coffee-cream/80 transition-colors duration-200 ${
        isDoublette ? 'border border-amber-500/30' : 'border border-transparent'
      }`}
    >
      {/* Date */}
      <div className="flex items-center gap-2 text-coffee-light">
        <Calendar className="w-5 h-5" />
        <span className="text-sm">{formattedDate}</span>
      </div>

      {/* Participants */}
      <div className="flex items-center gap-2">
        <Users className="w-5 h-5 text-coffee-light" />
        <div className="flex -space-x-2">
          {game.participants?.slice(0, 3).map((p, i) => (
            <div 
              key={p.id}
              className="w-8 h-8 rounded-full bg-coffee-light/20 border-2 border-white flex items-center justify-center text-xs font-medium text-coffee-dark"
              style={{ zIndex: 3 - i }}
            >
              {p.name.charAt(0)}
            </div>
          ))}
          {game.participants?.length > 3 && (
            <div className="w-8 h-8 rounded-full bg-coffee-light/30 border-2 border-white flex items-center justify-center text-xs font-medium text-coffee-dark">
              +{game.participants.length - 3}
            </div>
          )}
        </div>
      </div>

      {/* Payer */}
      <div className="flex items-center gap-2">
        <span className="font-medium text-coffee-dark">
          {game.payer?.name || '?'}
        </span>
      </div>

      {/* Fetcher */}
      <div className="flex items-center gap-2">
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

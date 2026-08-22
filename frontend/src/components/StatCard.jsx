import { motion } from 'framer-motion'
import clsx from 'clsx'

const colorClasses = {
  amber: 'from-amber-500 to-orange-600',
  blue: 'from-blue-500 to-blue-700',
  green: 'from-emerald-500 to-green-600',
  purple: 'from-purple-500 to-purple-700',
  red: 'from-red-500 to-rose-600',
  coffee: 'from-coffee-light to-coffee-dark',
}

const iconColorClasses = {
  amber: 'text-amber-600',
  blue: 'text-blue-600',
  green: 'text-emerald-600',
  purple: 'text-purple-600',
  red: 'text-red-600',
  coffee: 'text-coffee-dark',
}

const bgColorClasses = {
  amber: 'bg-amber-500/10',
  blue: 'bg-blue-500/10',
  green: 'bg-emerald-500/10',
  purple: 'bg-purple-500/10',
  red: 'bg-red-500/10',
  coffee: 'bg-coffee-light/10',
}

export default function StatCard({
  icon,
  title,
  value,
  subtitle,
  color = 'coffee',
  delay = 0
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="card p-6 group"
    >
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${colorClasses[color]} shadow-lg group-hover:scale-105 transition-transform duration-300`}>
          <div className={clsx("text-xl", iconColorClasses[color])}>
            {icon}
          </div>
        </div>
        <div>
          <p className="text-2xl font-bold text-coffee-dark">{value}</p>
          <p className="text-sm text-coffee-light mt-0.5">{subtitle}</p>
        </div>
      </div>
      <p className="text-sm font-medium text-coffee-dark mt-4 truncate">{title}</p>
    </motion.div>
  )
}

StatCard.Skeleton = function StatCardSkeleton() {
  return (
    <div className="card p-6 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-coffee-light/20" />
        <div className="flex-1">
          <div className="h-6 w-20 bg-coffee-light/20 rounded mb-1" />
          <div className="h-4 w-16 bg-coffee-light/10 rounded" />
        </div>
      </div>
      <div className="h-4 w-24 bg-coffee-light/10 rounded mt-4" />
    </div>
  )
}

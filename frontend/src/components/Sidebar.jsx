import { Link, useLocation } from 'react-router-dom'
import { 
  Home, Plus, BarChart3, Users, History,
  Coffee, Trophy, Calendar, Shield, X
} from 'lucide-react'

export default function Sidebar({ onClose }) {
  const location = useLocation()

  const mainLinks = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/new-game', icon: Plus, label: 'Nouvelle partie' },
  ]

  const statsLinks = [
    { path: '/stats', icon: BarChart3, label: 'Statistiques' },
    { path: '/history', icon: Calendar, label: 'Historique' },
    { path: '/players', icon: Users, label: 'Joueurs' },
  ]

  const isActive = (path) => location.pathname === path

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-coffee-milk to-white border-r border-coffee-light/20">
      {/* Header */}
      <div className="p-4 border-b border-coffee-light/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-coffee-dark to-coffee-light rounded-xl flex items-center justify-center shadow-lg">
            <Coffee className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-coffee-dark">Coffee Game</h2>
            <p className="text-xs text-coffee-light">v2.0</p>
          </div>
        </div>
        
        {/* Close button for mobile */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-lg hover:bg-coffee-cream transition-colors"
          >
            <X className="w-5 h-5 text-coffee-dark" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-6">
        {/* Main */}
        <div>
          <h3 className="px-3 text-xs font-semibold text-coffee-light uppercase tracking-wider mb-2">
            Principal
          </h3>
          <div className="space-y-1">
            {mainLinks.map(({ path, icon: Icon, label }) => (
              <Link
                key={path}
                to={path}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive(path)
                    ? 'bg-coffee-light text-white shadow-sm'
                    : 'text-coffee-dark hover:bg-coffee-cream hover:text-coffee-dark'
                }`}
              >
                <Icon className="w-5 h-5" />
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div>
          <h3 className="px-3 text-xs font-semibold text-coffee-light uppercase tracking-wider mb-2">
            Statistiques
          </h3>
          <div className="space-y-1">
            {statsLinks.map(({ path, icon: Icon, label }) => (
              <Link
                key={path}
                to={path}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive(path)
                    ? 'bg-coffee-light text-white shadow-sm'
                    : 'text-coffee-dark hover:bg-coffee-cream hover:text-coffee-dark'
                }`}
              >
                <Icon className="w-5 h-5" />
                {label}
              </Link>
            ))}
          </div>
        </div>

      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-coffee-light/20">
        <div className="bg-coffee-light/10 rounded-xl p-3 text-center">
          <Trophy className="w-6 h-6 text-coffee-light mx-auto mb-1" />
          <p className="text-xs text-coffee-light">
            Qui paiera le prochain café ?
          </p>
        </div>
      </div>
    </div>
  )
}

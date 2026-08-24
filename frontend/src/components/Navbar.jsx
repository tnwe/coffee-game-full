import { Link, useLocation } from 'react-router-dom'
import { Coffee, Menu, Home, Plus, BarChart3, Users, History } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function Navbar({ onMenuClick }) {
  const location = useLocation()
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = [
    { path: '/', icon: Home, label: 'Accueil' },
    { path: '/new-game', icon: Plus, label: 'Nouvelle partie' },
    { path: '/stats', icon: BarChart3, label: 'Statistiques' },
    { path: '/players', icon: Users, label: 'Joueurs' },
    { path: '/history', icon: History, label: 'Historique' },
  ]

  const isActive = (path) => location.pathname === path

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-30 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/95 backdrop-blur-sm shadow-md' 
          : 'bg-white/80 backdrop-blur-sm'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-coffee-dark to-coffee-light rounded-full flex items-center justify-center shadow-lg">
                <Coffee className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-coffee-cream rounded-full animate-pulse" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-coffee-dark">Coffee Game</h1>
              <p className="text-xs text-coffee-light -mt-1">Le jeu du café v2</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map(({ path, icon: Icon, label }) => (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive(path)
                    ? 'bg-coffee-light text-white shadow-sm'
                    : 'text-coffee-dark hover:bg-coffee-cream hover:text-coffee-dark'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-lg text-coffee-dark hover:bg-coffee-cream transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

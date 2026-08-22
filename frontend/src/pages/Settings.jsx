import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Settings as SettingsIcon, Coffee, Palette, Database, 
  Bell, User, Shield, Info, ArrowLeft, Save, RefreshCw
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import LoadingSpinner from '../components/LoadingSpinner'

const fetchStats = async () => {
  const response = await fetch('/api/v1/stats/')
  if (!response.ok) throw new Error('Failed to fetch stats')
  return response.json()
}

const fetchPlayers = async () => {
  const response = await fetch('/api/v1/players/')
  if (!response.ok) throw new Error('Failed to fetch players')
  return response.json()
}

const fetchGames = async () => {
  const response = await fetch('/api/v1/games/?limit=1')
  if (!response.ok) throw new Error('Failed to fetch games')
  return response.json()
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState('general')
  const [appName, setAppName] = useState('Coffee Game')
  const [theme, setTheme] = useState('light')
  const [notifications, setNotifications] = useState(true)
  const [resetConfirm, setResetConfirm] = useState(false)

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: fetchStats
  })

  const { data: players, isLoading: playersLoading } = useQuery({
    queryKey: ['players'],
    queryFn: fetchPlayers
  })

  const { data: games, isLoading: gamesLoading } = useQuery({
    queryKey: ['games', 1],
    queryFn: fetchGames
  })

  const isLoading = statsLoading || playersLoading || gamesLoading

  const handleResetDatabase = async () => {
    try {
      // Note: This is a placeholder. In a real app, you'd need a proper endpoint
      toast.success('Base de données réinitialisée (simulation)')
      setResetConfirm(false)
    } catch (error) {
      toast.error('Erreur lors de la réinitialisation')
    }
  }

  const handleExportData = async () => {
    try {
      const response = await fetch('/api/v1/stats/')
      const data = await response.json()
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `coffee-game-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      toast.success('Données exportées avec succès !')
    } catch (error) {
      toast.error('Erreur lors de l\'export')
    }
  }

  const tabs = [
    { id: 'general', label: 'Général', icon: SettingsIcon },
    { id: 'appearance', label: 'Apparence', icon: Palette },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'about', label: 'À propos', icon: Info }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <button 
          onClick={() => window.history.back()}
          className="p-2 rounded-lg hover:bg-coffee-cream/50 transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-coffee-dark" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-coffee-dark">Paramètres</h1>
          <p className="text-coffee-light mt-1">Configurez l'application</p>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card p-6"
      >
        <div className="flex flex-wrap gap-1 mb-6">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === id
                  ? 'bg-coffee-light text-white shadow-sm'
                  : 'text-coffee-dark hover:bg-coffee-cream/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {/* General Tab */}
          {activeTab === 'general' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div>
                <h3 className="font-semibold text-coffee-dark mb-2">Nom de l'application</h3>
                <p className="text-coffee-light text-sm mb-4">
                  Personnalisez le nom affiché dans l'application
                </p>
                <input
                  type="text"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  className="input max-w-md"
                />
              </div>

              <div>
                <h3 className="font-semibold text-coffee-dark mb-2">Base de données</h3>
                <p className="text-coffee-light text-sm mb-4">
                  Gérez les données de l'application
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={handleExportData}
                    className="btn btn-secondary gap-2"
                  >
                    <Database className="w-4 h-4" />
                    Exporter les données
                  </button>
                  <button
                    onClick={() => setResetConfirm(true)}
                    className="btn btn-error gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Réinitialiser
                  </button>
                </div>
              </div>

              {/* Statistics Overview */}
              {isLoading ? (
                <LoadingSpinner />
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="card p-4 text-center">
                    <p className="text-2xl font-bold text-coffee-dark">{stats?.total_games || 0}</p>
                    <p className="text-xs text-coffee-light mt-1">Parties totales</p>
                  </div>
                  <div className="card p-4 text-center">
                    <p className="text-2xl font-bold text-coffee-dark">{players?.total || 0}</p>
                    <p className="text-xs text-coffee-light mt-1">Joueurs</p>
                  </div>
                  <div className="card p-4 text-center">
                    <p className="text-2xl font-bold text-coffee-dark">{stats?.total_coffees_drunk || 0}</p>
                    <p className="text-xs text-coffee-light mt-1">Cafés bus</p>
                  </div>
                  <div className="card p-4 text-center">
                    <p className="text-2xl font-bold text-amber-600">{stats?.total_doublettes || 0}</p>
                    <p className="text-xs text-coffee-light mt-1">Doubletes</p>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div>
                <h3 className="font-semibold text-coffee-dark mb-2">Thème</h3>
                <p className="text-coffee-light text-sm mb-4">
                  Choisissez le thème de l'application
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setTheme('light')}
                    className={clsx(
                      "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                      theme === 'light' 
                        ? 'bg-coffee-light text-white shadow-sm' 
                        : 'bg-white border border-coffee-light/20 text-coffee-dark hover:border-coffee-light'
                    )}
                  >
                    Clair
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    className={clsx(
                      "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                      theme === 'dark' 
                        ? 'bg-coffee-light text-white shadow-sm' 
                        : 'bg-white border border-coffee-light/20 text-coffee-dark hover:border-coffee-light'
                    )}
                  >
                    Sombre
                  </button>
                  <button
                    onClick={() => setTheme('system')}
                    className={clsx(
                      "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                      theme === 'system' 
                        ? 'bg-coffee-light text-white shadow-sm' 
                        : 'bg-white border border-coffee-light/20 text-coffee-dark hover:border-coffee-light'
                    )}
                  >
                    Système
                  </button>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-coffee-dark mb-2">Couleur principale</h3>
                <p className="text-coffee-light text-sm mb-4">
                  Personnalisez la couleur principale de l'application
                </p>
                <div className="flex flex-wrap gap-3">
                  {[
                    { value: 'coffee', label: 'Café', color: 'bg-coffee-light' },
                    { value: 'amber', label: 'Ambre', color: 'bg-amber-600' },
                    { value: 'blue', label: 'Bleu', color: 'bg-blue-600' },
                    { value: 'green', label: 'Vert', color: 'bg-emerald-600' },
                    { value: 'purple', label: 'Violet', color: 'bg-purple-600' }
                  ].map(({ value, label, color }) => (
                    <button
                      key={value}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                        color === 'bg-coffee-light' ? 'bg-coffee-light text-white shadow-sm' : 'bg-white border border-coffee-light/20'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full ${color}`} />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-coffee-cream/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Bell className="w-6 h-6 text-coffee-light" />
                    <div>
                      <h4 className="font-medium text-coffee-dark">Notifications de partie</h4>
                      <p className="text-sm text-coffee-light">Recevoir des notifications pour les nouvelles parties</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications}
                      onChange={(e) => setNotifications(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-coffee-light/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-coffee-light after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-coffee-light"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-coffee-cream/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Shield className="w-6 h-6 text-coffee-light" />
                    <div>
                      <h4 className="font-medium text-coffee-dark">Notifications d'immunité</h4>
                      <p className="text-sm text-coffee-light">Être notifié quand l'immunité est utilisée</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications}
                      onChange={(e) => setNotifications(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-coffee-light/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-coffee-light after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-coffee-light"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-coffee-cream/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <User className="w-6 h-6 text-coffee-light" />
                    <div>
                      <h4 className="font-medium text-coffee-dark">Notifications de nouveaux joueurs</h4>
                      <p className="text-sm text-coffee-light">Recevoir des notifications quand un nouveau joueur est ajouté</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications}
                      onChange={(e) => setNotifications(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-coffee-light/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-coffee-light after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-coffee-light"></div>
                  </label>
                </div>
              </div>

              <button
                onClick={() => toast.success('Test notification!')}
                className="btn btn-primary gap-2"
              >
                <Bell className="w-4 h-4" />
                Tester les notifications
              </button>
            </motion.div>
          )}

          {/* About Tab */}
          {activeTab === 'about' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-coffee-light to-coffee-dark rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Coffee className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-coffee-dark">Coffee Game V2</h2>
                <p className="text-coffee-light mt-1">Le jeu du café entre collègues</p>
              </div>

              <div className="card p-6 bg-coffee-cream/50">
                <h3 className="font-semibold text-coffee-dark mb-4">À propos de l'application</h3>
                <p className="text-coffee-light text-sm leading-relaxed">
                  Coffee Game est une application conçue pour gérer le jeu du café entre collègues.
                  Elle permet de tirer au sort qui paiera et qui ira chercher le café, tout en gardant
                  une trace de toutes les parties jouées.
                </p>

                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-coffee-dark mb-2">Version</h4>
                    <p className="text-coffee-light text-sm">2.0.0</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-coffee-dark mb-2">Technologies</h4>
                    <p className="text-coffee-light text-sm">FastAPI, React, TailwindCSS</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-coffee-dark mb-2">Développeur</h4>
                    <p className="text-coffee-light text-sm">tnwe</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-coffee-dark mb-2">Déploiement</h4>
                    <p className="text-coffee-light text-sm">Render</p>
                  </div>
                </div>
              </div>

              <div className="card p-6 bg-coffee-cream/50">
                <h3 className="font-semibold text-coffee-dark mb-4">Fonctionnalités</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { icon: Users, label: 'Gestion des joueurs', desc: 'Ajoutez, modifiez ou supprimez des joueurs' },
                    { icon: Coffee, label: 'Création de parties', desc: 'Tirez au sort ou sélectionnez manuellement' },
                    { icon: Shield, label: 'Système d\'immunité', desc: 'Gérez les immunités des joueurs' },
                    { icon: BarChart3, label: 'Statistiques', desc: 'Analysez les performances des joueurs' },
                    { icon: Calendar, label: 'Historique', desc: 'Consultez toutes les parties jouées' },
                    { icon: Trophy, label: 'Classements', desc: 'Découvrez les meilleurs payeurs et chercheurs' }
                  ].map(({ icon: Icon, label, desc }, index) => (
                    <motion.div
                      key={label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start gap-3"
                    >
                      <div className="w-10 h-10 bg-coffee-light/20 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-coffee-dark" />
                      </div>
                      <div>
                        <h4 className="font-medium text-coffee-dark">{label}</h4>
                        <p className="text-sm text-coffee-light">{desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Reset Confirmation Modal */}
      <AnimatePresence>
        {resetConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setResetConfirm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-coffee-dark flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-red-500" />
                  Réinitialiser la base de données
                </h3>
                <button
                  onClick={() => setResetConfirm(false)}
                  className="p-1 rounded-lg hover:bg-coffee-cream transition-colors"
                >
                  <X className="w-5 h-5 text-coffee-dark" />
                </button>
              </div>

              <div className="mb-6">
                <p className="text-coffee-dark">
                  Êtes-vous sûr de vouloir réinitialiser la base de données ?
                </p>
                <p className="text-coffee-light text-sm mt-2">
                  Cette action supprimera toutes les parties et les joueurs.
                  <span className="font-bold text-red-500"> Elle est irréversible.</span>
                </p>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setResetConfirm(false)}
                  className="btn btn-secondary"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleResetDatabase}
                  className="btn btn-error"
                >
                  Réinitialiser
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

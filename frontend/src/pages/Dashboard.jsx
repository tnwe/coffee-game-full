import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { 
  Coffee, Users, Calendar, TrendingUp, CreditCard, HandPlatter, Trophy,
  ArrowRight, Play, Clock, Plus
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import StatCard from '../components/StatCard'
import RecentGame from '../components/RecentGame'
import LoadingSpinner from '../components/LoadingSpinner'

const fetchStats = async () => {
  const response = await fetch('/api/v1/stats/')
  if (!response.ok) throw new Error('Failed to fetch stats')
  return response.json()
}

const fetchRecentGames = async () => {
  const response = await fetch('/api/v1/games/recent?limit=5')
  if (!response.ok) throw new Error('Failed to fetch recent games')
  return response.json()
}

const fetchPlayers = async () => {
  const response = await fetch('/api/v1/players/')
  if (!response.ok) throw new Error('Failed to fetch players')
  return response.json()
}

export default function Dashboard() {
  const [todayGame, setTodayGame] = useState(null)
  
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: fetchStats
  })
  
  const { data: recentGames, isLoading: gamesLoading } = useQuery({
    queryKey: ['recentGames'],
    queryFn: fetchRecentGames
  })
  
  const { data: players, isLoading: playersLoading } = useQuery({
    queryKey: ['players'],
    queryFn: fetchPlayers
  })

  useEffect(() => {
    // Check for today's game
    const checkTodayGame = async () => {
      try {
        const response = await fetch('/api/v1/games/today')
        if (response.ok) {
          const data = await response.json()
          setTodayGame(data)
        }
      } catch (error) {
        console.error('Error checking today game:', error)
      }
    }
    checkTodayGame()
  }, [])

  const topPayers = stats?.top_payers?.slice(0, 3) || []
  const topFetchers = stats?.top_fetchers?.slice(0, 3) || []
  const topScores = stats?.top_scores?.slice(0, 3) || []

  const isLoading = statsLoading || gamesLoading || playersLoading

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <StatCard.Skeleton key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LoadingSpinner className="mx-auto" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-coffee-dark">Tableau de bord</h1>
          <p className="text-coffee-light mt-1">Bienvenue dans le jeu du café v2</p>
        </div>
        
        <Link to="/new-game" className="btn btn-primary gap-2 shadow-lg">
          <Plus className="w-5 h-5" />
          Nouvelle partie
        </Link>
      </motion.div>

      {/* Stats Grid */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <StatCard
          icon={<Coffee className="w-6 h-6" />}
          title="Parties totales"
          value={stats?.total_games || 0}
          subtitle="Session de café"
          color="amber"
        />
        
        <StatCard
          icon={<Users className="w-6 h-6" />}
          title="Joueurs"
          value={players?.total || 0}
          subtitle="Participants"
          color="blue"
        />
        
        <StatCard
          icon={<Calendar className="w-6 h-6" />}
          title="Cafés bus"
          value={stats?.total_coffees_drunk || 0}
          subtitle="Total"
          color="green"
        />
        
        <StatCard
          icon={<TrendingUp className="w-6 h-6" />}
          title="Doubletes"
          value={`${stats?.total_doublettes || 0} (${Math.round((stats?.doublette_percentage || 0))}%)`}
          subtitle="Payer = Chercheur"
          color="purple"
        />
      </motion.div>

      {/* Today's Game */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {todayGame ? (
          <div className="bg-gradient-to-r from-coffee-light/10 to-coffee-cream/10 rounded-2xl p-6 border border-coffee-light/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-coffee-light rounded-xl flex items-center justify-center shadow-lg">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-coffee-dark">Aujourd'hui</h3>
                  <p className="text-coffee-light text-sm">
                    {new Date().toLocaleDateString('fr-FR', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                {todayGame.payer && (
                  <span className="badge badge-success">
                    Payé par: {todayGame.payer.name}
                  </span>
                )}
                {todayGame.fetcher && (
                  <span className="badge badge-info">
                    Cherché par: {todayGame.fetcher.name}
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-coffee-light/5 to-coffee-cream/5 rounded-2xl p-6 border border-coffee-light/10 text-center">
            <div className="w-12 h-12 bg-coffee-light/20 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Plus className="w-6 h-6 text-coffee-dark" />
            </div>
            <h3 className="font-semibold text-coffee-dark mb-2">Aucune partie aujourd'hui</h3>
            <p className="text-coffee-light text-sm mb-4">
              Lancez une nouvelle partie pour commencer
            </p>
            <Link to="/new-game" className="btn btn-primary gap-2">
              <Play className="w-4 h-4" />
              Commencer une partie
            </Link>
          </div>
        )}
      </motion.div>

      {/* Leaderboards */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* Top Payers */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-coffee-dark flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-amber-500" />
              Top Payeurs
            </h3>
            <Link to="/stats" className="text-sm text-coffee-light hover:text-coffee-dark flex items-center gap-1">
              Voir tout <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {topPayers.length > 0 ? (
              topPayers.map((payer, index) => (
                <motion.div 
                  key={payer.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-3 p-3 bg-coffee-cream/50 rounded-xl"
                >
                  <span className="w-8 h-8 bg-coffee-light rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {index + 1}
                  </span>
                  <span className="font-medium text-coffee-dark flex-1">{payer.name}</span>
                  <span className="font-bold text-amber-600">{payer.count}×</span>
                </motion.div>
              ))
            ) : (
              <p className="text-coffee-light text-center py-4">Aucun payeur encore</p>
            )}
          </div>
        </div>

        {/* Top Fetchers */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-coffee-dark flex items-center gap-2">
              <HandPlatter className="w-5 h-5 text-blue-500" />
              Top Chercheurs
            </h3>
            <Link to="/stats" className="text-sm text-coffee-light hover:text-coffee-dark flex items-center gap-1">
              Voir tout <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {topFetchers.length > 0 ? (
              topFetchers.map((fetcher, index) => (
                <motion.div 
                  key={fetcher.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-3 p-3 bg-coffee-cream/50 rounded-xl"
                >
                  <span className="w-8 h-8 bg-coffee-light rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {index + 1}
                  </span>
                  <span className="font-medium text-coffee-dark flex-1">{fetcher.name}</span>
                  <span className="font-bold text-blue-600">{fetcher.count}×</span>
                </motion.div>
              ))
            ) : (
              <p className="text-coffee-light text-center py-4">Aucun chercheur encore</p>
            )}
          </div>
        </div>

        {/* Top Scores */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-coffee-dark flex items-center gap-2">
              <Trophy className="w-5 h-5 text-purple-500" />
              Meilleur Score
            </h3>
            <Link to="/stats" className="text-sm text-coffee-light hover:text-coffee-dark flex items-center gap-1">
              Voir tout <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {topScores.length > 0 ? (
              topScores.map((score, index) => (
                <motion.div 
                  key={score.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-3 p-3 bg-coffee-cream/50 rounded-xl"
                >
                  <span className="w-8 h-8 bg-coffee-light rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {index + 1}
                  </span>
                  <span className="font-medium text-coffee-dark flex-1">{score.name}</span>
                  <span className="font-bold text-purple-600">{score.score.toFixed(2)}</span>
                </motion.div>
              ))
            ) : (
              <p className="text-coffee-light text-center py-4">Aucun score encore</p>
            )}
          </div>
        </div>
      </motion.div>

      {/* Recent Games */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-coffee-dark flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Parties récentes
            </h3>
            <Link to="/history" className="text-sm text-coffee-light hover:text-coffee-dark flex items-center gap-1">
              Voir l'historique <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          {recentGames?.games?.length > 0 ? (
            <div className="space-y-4">
              {recentGames.games.slice(0, 5).map((game, index) => (
                <RecentGame 
                  key={game.id} 
                  game={game} 
                  index={index}
                />
              ))}
            </div>
          ) : (
            <p className="text-coffee-light text-center py-8">Aucune partie récente</p>
          )}
        </div>
      </motion.div>
    </div>
  )
}

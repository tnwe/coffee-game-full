import { useState } from 'react'
import { motion, MotionConfig } from 'framer-motion'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line
} from 'recharts'
import { 
  BarChart3, Users, CreditCard, HandPlatter, Trophy, Calendar, TrendingUp,
  Filter, Download, ArrowUp, ArrowDown
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import LoadingSpinner from '../components/LoadingSpinner'

const fetchStats = async () => {
  const response = await fetch('/api/v1/stats/')
  if (!response.ok) throw new Error('Failed to fetch stats')
  return response.json()
}

const COLORS = [
  '#8b4513', '#a0522d', '#cd853f', '#d2691e', '#f4a460',
  '#daa520', '#b8860b', '#deb887', '#f5deb3', '#8b0000'
]

const metricOptions = [
  { value: 'score', label: 'Score Total' },
  { value: 'normalized_score', label: 'Score Normalisé' },
  { value: 'paid', label: 'Cafés Payés' },
  { value: 'fetched', label: 'Cafés Cherchés' },
  { value: 'participations', label: 'Participations' }
]

export default function Stats() {
  const [activeMetric, setActiveMetric] = useState('score')
  const [chartType, setChartType] = useState('bar')

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: fetchStats
  })

  const isLoading = statsLoading

  // Prepare data for charts
  const playerStats = stats?.players?.map(p => ({
    name: p.player_name,
    score: p.score,
    paid: p.paid,
    fetched: p.fetched,
    participations: p.participations,
    normalizedScore: p.normalized_score
  })) || []

  const sortedPlayers = [...playerStats].sort((a, b) => 
    b[activeMetric] - a[activeMetric] || b.participations - a.participations
  )

  // Bar chart data
  const barChartData = sortedPlayers.map(p => ({
    name: p.name,
    fullName: p.name,
    value: activeMetric === 'normalized_score' ? p.normalizedScore : p[activeMetric]
  }))

  // Pie chart data (top 8)
  const pieChartData = sortedPlayers.slice(0, 8).map(p => ({
    name: p.name,
    value: activeMetric === 'normalized_score' ? p.normalizedScore : p[activeMetric]
  }))

  // Monthly stats
  const monthlyData = stats?.monthly_stats || []

  // Format numbers
  const formatNumber = (value) => {
    if (typeof value === 'number') {
      return value.toLocaleString('fr-FR')
    }
    return value
  }

  const formatPercentage = (value) => {
    if (typeof value === 'number') {
      return value.toFixed(1) + '%'
    }
    return value
  }

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null
    const data = payload[0].payload
    
    return (
      <div className="bg-white p-3 rounded-xl shadow-lg border border-coffee-light/20">
        <p className="font-semibold text-coffee-dark">{data.fullName || label}</p>
        <p className="text-coffee-light text-sm">
          {activeMetric === 'normalized_score' ? 'Score normalisé' : metricOptions.find(m => m.value === activeMetric)?.label || activeMetric}
          : {formatNumber(data.value)}
        </p>
        {data.participations !== undefined && (
          <p className="text-coffee-light text-sm">
            Participations: {data.participations}
          </p>
        )}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <MotionConfig reducedMotion="always">
      <div className="space-y-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-coffee-dark">Statistiques</h1>
          <p className="text-coffee-light mt-1">Analyse détaillée des performances</p>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3"
      >
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-coffee-dark">{formatNumber(stats?.total_games || 0)}</p>
          <p className="text-xs text-coffee-light mt-1">Parties jouées</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-coffee-dark">{formatNumber(stats?.total_participations || 0)}</p>
          <p className="text-xs text-coffee-light mt-1">Participations</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-coffee-dark">{formatNumber(stats?.total_coffees_drunk || 0)}</p>
          <p className="text-xs text-coffee-light mt-1">Cafés bus</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{formatNumber(stats?.total_doublettes || 0)}</p>
          <p className="text-xs text-coffee-light mt-1">Doubletes</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-coffee-dark">{formatPercentage(stats?.doublette_percentage || 0)}</p>
          <p className="text-xs text-coffee-light mt-1">% Doubletes</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-coffee-dark">{playerStats.length}</p>
          <p className="text-xs text-coffee-light mt-1">Joueurs</p>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card p-6"
      >
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-coffee-light" />
            <span className="text-sm font-medium text-coffee-dark">Classement par :</span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {metricOptions.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setActiveMetric(value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeMetric === value
                    ? 'bg-coffee-light text-white shadow-sm'
                    : 'bg-white text-coffee-dark border border-coffee-light/20 hover:border-coffee-light'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm font-medium text-coffee-dark">Type :</span>
            <button
              onClick={() => setChartType('bar')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                chartType === 'bar'
                  ? 'bg-coffee-light text-white shadow-sm'
                  : 'bg-white text-coffee-dark border border-coffee-light/20'
              }`}
            >
              Barres
            </button>
            <button
              onClick={() => setChartType('pie')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                chartType === 'pie'
                  ? 'bg-coffee-light text-white shadow-sm'
                  : 'bg-white text-coffee-dark border border-coffee-light/20'
              }`}
            >
              Camembert
            </button>
          </div>
        </div>
      </motion.div>

      {/* Leaderboard Chart */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="card p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-coffee-dark flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Classement des joueurs
          </h3>
        </div>

        {chartType === 'bar' ? (
          <div className="overflow-x-auto">
            <div style={{ height: `${Math.max(520, barChartData.length * 34)}px`, minWidth: '640px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e8d5c4" strokeWidth={1} />
                <XAxis 
                  type="number" 
                  stroke="#4a2c2a"
                  tickFormatter={formatNumber}
                />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={160}
                  stroke="#4a2c2a"
                  tick={{ fontSize: 12, fill: '#4a2c2a' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ color: '#4a2c2a' }} />
                <Bar dataKey="value" fill="#8b4513" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                  {barChartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="h-80 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                  isAnimationActive={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {pieChartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  wrapperStyle={{ color: '#4a2c2a' }}
                  layout="vertical"
                  align="right"
                  verticalAlign="middle"
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </motion.div>

      {/* Detailed Leaderboard */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="card p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-coffee-dark flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Classement détaillé
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-coffee-light/20">
                <th className="p-3 text-left text-xs font-semibold text-coffee-light uppercase tracking-wider">
                  Rang
                </th>
                <th className="p-3 text-left text-xs font-semibold text-coffee-light uppercase tracking-wider">
                  Joueur
                </th>
                <th className="p-3 text-center text-xs font-semibold text-coffee-light uppercase tracking-wider">
                  <CreditCard className="w-4 h-4 inline" /> Payé
                </th>
                <th className="p-3 text-center text-xs font-semibold text-coffee-light uppercase tracking-wider">
                  <HandPlatter className="w-4 h-4 inline" /> Cherché
                </th>
                <th className="p-3 text-center text-xs font-semibold text-coffee-light uppercase tracking-wider">
                  <Users className="w-4 h-4 inline" /> Participations
                </th>
                <th className="p-3 text-center text-xs font-semibold text-coffee-light uppercase tracking-wider">
                  <TrendingUp className="w-4 h-4 inline" /> Score
                </th>
                <th className="p-3 text-center text-xs font-semibold text-coffee-light uppercase tracking-wider">
                  Score Norm.
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedPlayers.map((player, index) => (
                <motion.tr
                  key={player.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b border-coffee-light/10 hover:bg-coffee-cream/50 transition-colors"
                >
                  <td className="p-3 text-coffee-dark font-medium">
                    {index + 1}
                  </td>
                  <td className="p-3 text-coffee-dark font-medium">
                    {player.name}
                  </td>
                  <td className="p-3 text-center font-semibold text-amber-600">
                    {player.paid}
                  </td>
                  <td className="p-3 text-center font-semibold text-blue-600">
                    {player.fetched}
                  </td>
                  <td className="p-3 text-center text-coffee-dark">
                    {player.participations}
                  </td>
                  <td className="p-3 text-center font-semibold text-coffee-dark">
                    {player.score}
                  </td>
                  <td className="p-3 text-center text-coffee-dark">
                    {player.normalizedScore.toFixed(2)}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Monthly Statistics */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="card p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-coffee-dark flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Statistiques mensuelles
          </h3>
        </div>

        {monthlyData.length > 0 ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8d5c4" strokeWidth={1} />
                <XAxis 
                  dataKey="month" 
                  stroke="#4a2c2a"
                  tick={{ fontSize: 12, fill: '#4a2c2a' }}
                />
                <YAxis 
                  stroke="#4a2c2a"
                  tick={{ fontSize: 12, fill: '#4a2c2a' }}
                />
                <Tooltip 
                  contentStyle={{
                    background: 'white',
                    border: '1px solid #e8d5c4',
                    borderRadius: '0.75rem',
                    color: '#4a2c2a'
                  }}
                />
                <Legend wrapperStyle={{ color: '#4a2c2a' }} />
                <Line 
                  type="monotone" 
                  dataKey="games_count" 
                  name="Parties" 
                  stroke="#8b4513" 
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  isAnimationActive={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="participants_count" 
                  name="Participants" 
                  stroke="#a0522d" 
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  isAnimationActive={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="doublettes_count" 
                  name="Doubletes" 
                  stroke="#cd853f" 
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-coffee-light text-center py-8">
            Pas de données mensuelles disponibles
          </p>
        )}
      </motion.div>

      {/* Top Performers */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <div className="card p-6">
          <h4 className="font-semibold text-coffee-dark mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-amber-500" />
            Top Payeurs
          </h4>
          <div className="space-y-3">
            {stats?.top_payers?.slice(0, 5).map((payer, index) => (
              <motion.div 
                key={payer.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-3"
              >
                <span className="w-6 h-6 bg-amber-500/20 rounded-full flex items-center justify-center text-amber-600 text-sm font-bold">
                  {index + 1}
                </span>
                <span className="font-medium text-coffee-dark flex-1 truncate">{payer.name}</span>
                <span className="font-bold text-amber-600">{payer.count}×</span>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <h4 className="font-semibold text-coffee-dark mb-4 flex items-center gap-2">
            <HandPlatter className="w-5 h-5 text-blue-500" />
            Top Chercheurs
          </h4>
          <div className="space-y-3">
            {stats?.top_fetchers?.slice(0, 5).map((fetcher, index) => (
              <motion.div 
                key={fetcher.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-3"
              >
                <span className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-600 text-sm font-bold">
                  {index + 1}
                </span>
                <span className="font-medium text-coffee-dark flex-1 truncate">{fetcher.name}</span>
                <span className="font-bold text-blue-600">{fetcher.count}×</span>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <h4 className="font-semibold text-coffee-dark mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-green-500" />
            Top Participants
          </h4>
          <div className="space-y-3">
            {stats?.top_participants?.slice(0, 5).map((participant, index) => (
              <motion.div 
                key={participant.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-3"
              >
                <span className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center text-green-600 text-sm font-bold">
                  {index + 1}
                </span>
                <span className="font-medium text-coffee-dark flex-1 truncate">{participant.name}</span>
                <span className="font-bold text-green-600">{participant.count}×</span>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <h4 className="font-semibold text-coffee-dark mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-500" />
            Meilleur Score Normalisé
          </h4>
          <div className="space-y-3">
            {stats?.top_scores?.slice(0, 5).map((score, index) => (
              <motion.div 
                key={score.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-3"
              >
                <span className="w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center text-purple-600 text-sm font-bold">
                  {index + 1}
                </span>
                <span className="font-medium text-coffee-dark flex-1 truncate">{score.name}</span>
                <span className="font-bold text-purple-600">{score.score.toFixed(2)}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
      </div>
    </MotionConfig>
  )
}

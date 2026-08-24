import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Coffee, Users, Crown, Shield, Check, X, Plus, Minus, 
  Shuffle, Target, Calendar, Clock, Play, RotateCcw
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import Wheel from '../components/Wheel'
import LoadingSpinner from '../components/LoadingSpinner'
import clsx from 'clsx'

const fetchPlayers = async () => {
  const response = await fetch('/api/v1/players/')
  if (!response.ok) throw new Error('Failed to fetch players')
  return response.json()
}

const fetchGames = async () => {
  const response = await fetch('/api/v1/games/')
  if (!response.ok) throw new Error('Failed to fetch games')
  return response.json()
}

const createGame = async (gameData) => {
  const response = await fetch('/api/v1/games/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(gameData)
  })
  if (!response.ok) throw new Error('Failed to create game')
  return response.json()
}

const updatePlayerImmunity = async ({ playerId, hasImmunity }) => {
  const response = await fetch(`/api/v1/players/${playerId}/toggle-immunity`, {
    method: 'POST'
  })
  if (!response.ok) throw new Error('Failed to update immunity')
  return response.json()
}

export default function NewGame() {
  const queryClient = useQueryClient()
  const [selectedPlayers, setSelectedPlayers] = useState({})
  const [payer, setPayer] = useState(null)
  const [fetcher, setFetcher] = useState(null)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [mode, setMode] = useState('draw') // 'draw' or 'manual'
  const [step, setStep] = useState('payer') // 'payer', 'fetcher', 'done'
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [doublette, setDoublette] = useState(false)
  const [immunityUsed, setImmunityUsed] = useState({})

  const { data: playersData, isLoading: playersLoading } = useQuery({
    queryKey: ['players'],
    queryFn: fetchPlayers
  })

  const { data: gamesData, isLoading: gamesLoading } = useQuery({
    queryKey: ['games'],
    queryFn: fetchGames
  })

  const createGameMutation = useMutation({
    mutationFn: createGame,
    onSuccess: () => {
      queryClient.invalidateQueries(['games', 'stats'])
      toast.success('Partie enregistrée avec succès !')
      resetGame()
    },
    onError: (error) => {
      toast.error(error.message || 'Erreur lors de l\'enregistrement')
    }
  })

  const updateImmunityMutation = useMutation({
    mutationFn: updatePlayerImmunity,
    onSuccess: () => {
      queryClient.invalidateQueries(['players'])
    }
  })

  const players = playersData?.players || []
  const existingDates = gamesData?.games?.map(g => g.date) || []

  const selectedPlayerList = players.filter(p => selectedPlayers[p.id])

  // Check if date already exists
  const dateExists = existingDates.includes(date)

  // Check if player has immunity
  const checkImmunity = useCallback((playerId) => {
    const player = players.find(p => p.id === playerId)
    return player?.has_immunity || false
  }, [players])

  const handleTogglePlayer = useCallback((playerId) => {
    setSelectedPlayers(prev => ({
      ...prev,
      [playerId]: !prev[playerId]
    }))
    // Clear selections if player is deselected
    if (payer === playerId) setPayer(null)
    if (fetcher === playerId) setFetcher(null)
  }, [payer, fetcher])

  const handleWheelResult = useCallback((winner) => {
    if (step === 'payer') {
      const hasImmunity = checkImmunity(winner.id)
      
      if (hasImmunity) {
        // Remove immunity and restart
        updateImmunityMutation.mutate({ playerId: winner.id })
        setImmunityUsed(prev => ({ ...prev, [winner.id]: true }))
        toast.info(`${winner.name} a l'immunité ! Nouveau tirage...`)
        setTimeout(() => {
          setPayer(null)
        }, 1000)
      } else {
        setPayer(winner.id)
        setStep('fetcher')
      }
    } else if (step === 'fetcher') {
      setFetcher(winner.id)
      setStep('done')
      
      if (winner.id === payer) {
        setDoublette(true)
        toast.success('Doublette ! 🎉')
      }
    }
  }, [step, payer, checkImmunity, updateImmunityMutation])

  const resetGame = useCallback(() => {
    setSelectedPlayers({})
    setPayer(null)
    setFetcher(null)
    setStep('payer')
    setDoublette(false)
    setImmunityUsed({})
    setShowConfetti(false)
  }, [])

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return
    
    if (!selectedPlayerList.length) {
      toast.error('Sélectionnez au moins un joueur')
      return
    }
    
    if (!payer || !fetcher) {
      toast.error('Complétez le tirage au sort')
      return
    }
    
    if (dateExists) {
      toast.error('Une partie existe déjà pour cette date')
      return
    }
    
    setIsSubmitting(true)
    
    try {
      await createGameMutation.mutateAsync({
        date,
        players: selectedPlayerList.map(p => p.id),
        payer: payer,
        fetcher: fetcher
      })
      
      // Trigger confetti
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 5000)
    } finally {
      setIsSubmitting(false)
    }
  }, [isSubmitting, selectedPlayerList, payer, fetcher, date, dateExists, createGameMutation])

  const handleManualSelect = useCallback((playerId, role) => {
    if (role === 'payer') {
      setPayer(payer === playerId ? null : playerId)
    } else {
      setFetcher(fetcher === playerId ? null : playerId)
    }
  }, [payer, fetcher])

  if (playersLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
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
          <h1 className="text-2xl font-bold text-coffee-dark">Nouvelle partie</h1>
          <p className="text-coffee-light mt-1">Lancez un nouveau tirage au sort</p>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={resetGame}
            className="btn btn-secondary gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Réinitialiser
          </button>
        </div>
      </motion.div>

      {/* Mode Selection */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-wrap gap-2"
      >
        <button
          onClick={() => setMode('draw')}
          className={clsx(
            "btn gap-2 transition-all duration-200",
            mode === 'draw' 
              ? 'btn-primary shadow-lg' 
              : 'btn-secondary hover:bg-coffee-cream/50'
          )}
        >
          <Shuffle className="w-4 h-4" />
          Tirage au sort
        </button>
        <button
          onClick={() => setMode('manual')}
          className={clsx(
            "btn gap-2 transition-all duration-200",
            mode === 'manual' 
              ? 'btn-primary shadow-lg' 
              : 'btn-secondary hover:bg-coffee-cream/50'
          )}
        >
          <Users className="w-4 h-4" />
          Sélection manuelle
        </button>
      </motion.div>

      {/* Date Selection */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card p-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-6 h-6 text-coffee-light" />
            <div>
              <h3 className="font-semibold text-coffee-dark">Date de la partie</h3>
              <p className="text-sm text-coffee-light">Sélectionnez la date du jeu</p>
            </div>
          </div>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input sm:w-auto"
            min="2020-01-01"
            max={new Date().toISOString().split('T')[0]}
          />
        </div>
        
        {dateExists && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 bg-red-50/50 border border-red-200 rounded-xl"
          >
            <p className="text-red-600 text-sm flex items-center gap-2">
              <X className="w-4 h-4" />
              Une partie existe déjà pour cette date
            </p>
          </motion.div>
        )}
      </motion.div>

      {/* Players Selection */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="card p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <Users className="w-6 h-6 text-coffee-light" />
          <div>
            <h3 className="font-semibold text-coffee-dark">Participants</h3>
            <p className="text-sm text-coffee-light">
              Sélectionnez les joueurs ({selectedPlayerList.length} sélectionnés)
            </p>
          </div>
        </div>

        {/* Players Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {players.map((player) => {
            const isSelected = !!selectedPlayers[player.id]
            const isPayer = payer === player.id
            const isFetcher = fetcher === player.id
            const hasImmunity = player.has_immunity
            const wasImmunityUsed = immunityUsed[player.id]
            
            return (
              <motion.button
                key={player.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleTogglePlayer(player.id)}
                className={clsx(
                  "relative p-4 rounded-xl border-2 transition-all duration-200 text-left group",
                  isSelected 
                    ? 'border-coffee-light bg-coffee-cream/50 shadow-sm' 
                    : 'border-coffee-light/20 bg-white hover:border-coffee-light',
                  (isPayer || isFetcher) && 'ring-2 ring-coffee-dark/50'
                )}
              >
                {/* Selection indicator */}
                <div className={clsx(
                  "absolute top-2 right-2 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200",
                  isSelected 
                    ? 'border-coffee-light bg-coffee-light' 
                    : 'border-coffee-light/30 bg-transparent'
                )}>
                  {isSelected && <Check className="w-3 h-3 text-white" />}
                </div>

                {/* Player info */}
                <div className="flex items-center gap-2">
                  <div className={clsx(
                    "w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold",
                    hasImmunity && !wasImmunityUsed ? 'bg-amber-500 ring-2 ring-amber-500/50' : 'bg-coffee-light'
                  )}>
                    {player.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-coffee-dark group-hover:text-coffee-dark/80">
                      {player.name}
                    </p>
                    <p className="text-xs text-coffee-light">
                      Score: {player.score || 0}
                    </p>
                  </div>
                </div>

                {/* Role indicators */}
                <div className="mt-2 flex gap-1">
                  {isPayer && (
                    <span className="badge badge-success text-xs">
                      <Crown className="w-3 h-3" /> Payeur
                    </span>
                  )}
                  {isFetcher && (
                    <span className="badge badge-info text-xs">
                      <Shield className="w-3 h-3" /> Chercheur
                    </span>
                  )}
                  {hasImmunity && !wasImmunityUsed && (
                    <span className="badge badge-warning text-xs">
                      🛡️ Immunité
                    </span>
                  )}
                </div>
              </motion.button>
            )
          })}
        </div>

        {selectedPlayerList.length === 0 && (
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-coffee-light mt-4 py-4"
          >
            Sélectionnez au moins un joueur pour continuer
          </motion.p>
        )}
      </motion.div>

      {/* Draw Mode - Wheel */}
      <AnimatePresence mode="wait">
        {mode === 'draw' && selectedPlayerList.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: 0.4 }}
            className="card p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <Shuffle className="w-6 h-6 text-coffee-light" />
              <div>
                <h3 className="font-semibold text-coffee-dark">
                  {step === 'payer' ? 'Qui paie le café ?' : step === 'fetcher' ? 'Qui va chercher le café ?' : 'Tirage terminé'}
                </h3>
                <p className="text-sm text-coffee-light">
                  {step === 'payer' && 'Tirez au sort pour déterminer le payeur'}
                  {step === 'fetcher' && 'Tirez au sort pour déterminer le chercheur'}
                  {step === 'done' && 'Le tirage est terminé !'}
                </p>
              </div>
            </div>

            {/* Wheel */}
            <Wheel
              players={selectedPlayerList}
              onResult={handleWheelResult}
              title={step === 'payer' ? 'Qui paie ?' : 'Qui cherche ?'}
              disabled={step === 'done'}
            />

            {/* Results */}
            <AnimatePresence>
              {(payer || fetcher) && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="mt-6 space-y-3"
                >
                  {payer && (
                    <motion.div 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-3 p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl"
                    >
                      <Crown className="w-6 h-6 text-emerald-600" />
                      <div>
                        <p className="font-medium text-coffee-dark">Payeur</p>
                        <p className="text-coffee-dark font-bold">
                          {players.find(p => p.id === payer)?.name}
                        </p>
                      </div>
                    </motion.div>
                  )}
                  
                  {fetcher && (
                    <motion.div 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-3 p-4 bg-blue-50/50 border border-blue-200 rounded-xl"
                    >
                      <Shield className="w-6 h-6 text-blue-600" />
                      <div>
                        <p className="font-medium text-coffee-dark">Chercheur</p>
                        <p className="text-coffee-dark font-bold">
                          {players.find(p => p.id === fetcher)?.name}
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {doublette && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="p-4 bg-amber-50/50 border border-amber-200 rounded-xl text-center"
                    >
                      <p className="font-bold text-amber-600 flex items-center justify-center gap-2">
                        <Crown className="w-5 h-5" />
                        <Shield className="w-5 h-5" />
                        Doublette !
                      </p>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Controls */}
            <div className="mt-6 flex flex-wrap gap-3">
              {step === 'done' && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={resetGame}
                  className="btn btn-secondary gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Recommencer
                </motion.button>
              )}
              
              {step !== 'done' && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSubmit}
                  disabled={isSubmitting || !payer || !fetcher}
                  className="btn btn-primary gap-2 flex-1 sm:flex-none"
                >
                  <Check className="w-4 h-4" />
                  {isSubmitting ? 'Enregistrement...' : 'Enregistrer la partie'}
                </motion.button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manual Mode */}
      <AnimatePresence mode="wait">
        {mode === 'manual' && selectedPlayerList.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: 0.4 }}
            className="card p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <Users className="w-6 h-6 text-coffee-light" />
              <div>
                <h3 className="font-semibold text-coffee-dark">Sélection manuelle</h3>
                <p className="text-sm text-coffee-light">
                  Sélectionnez qui paie et qui va chercher
                </p>
              </div>
            </div>

            {/* Selection Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {selectedPlayerList.map((player) => {
                const isPayerSelected = payer === player.id
                const isFetcherSelected = fetcher === player.id
                const hasImmunity = player.has_immunity
                
                return (
                  <motion.div
                    key={player.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={clsx(
                      "p-4 rounded-xl border-2 transition-all duration-200",
                      isPayerSelected || isFetcherSelected 
                        ? 'border-coffee-light bg-coffee-cream/50' 
                        : 'border-coffee-light/20 bg-white'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={clsx(
                        "w-10 h-10 rounded-full flex items-center justify-center text-white text-lg font-bold",
                        hasImmunity ? 'bg-amber-500 ring-2 ring-amber-500/50' : 'bg-coffee-light'
                      )}>
                        {player.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-coffee-dark truncate">
                          {player.name}
                        </p>
                        <p className="text-xs text-coffee-light">
                          Score: {player.score || 0}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => handleManualSelect(player.id, 'payer')}
                        className={clsx(
                          "flex-1 btn btn-sm gap-1 text-xs",
                          isPayerSelected 
                            ? 'btn-success' 
                            : 'btn-secondary'
                        )}
                      >
                        <Crown className="w-3 h-3" />
                        {isPayerSelected ? 'Payeur' : 'Choisir'}
                      </button>
                      <button
                        onClick={() => handleManualSelect(player.id, 'fetcher')}
                        className={clsx(
                          "flex-1 btn btn-sm gap-1 text-xs",
                          isFetcherSelected 
                            ? 'btn-info' 
                            : 'btn-secondary'
                        )}
                      >
                        <Shield className="w-3 h-3" />
                        {isFetcherSelected ? 'Chercheur' : 'Choisir'}
                      </button>
                    </div>
                  </motion.div>
                )
              })}
            </div>

            {/* Summary */}
            <AnimatePresence>
              {(payer || fetcher) && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="mt-6 p-4 bg-coffee-cream/50 rounded-xl border border-coffee-light/20"
                >
                  <h4 className="font-semibold text-coffee-dark mb-3">Résumé</h4>
                  <div className="flex flex-wrap gap-3">
                    {payer && (
                      <div className="flex items-center gap-2">
                        <Crown className="w-5 h-5 text-amber-500" />
                        <span className="font-medium text-coffee-dark">
                          Payeur: {players.find(p => p.id === payer)?.name}
                        </span>
                      </div>
                    )}
                    {fetcher && (
                      <div className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-blue-500" />
                        <span className="font-medium text-coffee-dark">
                          Chercheur: {players.find(p => p.id === fetcher)?.name}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {payer === fetcher && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mt-3 p-3 bg-amber-50/50 border border-amber-200 rounded-lg text-center"
                    >
                      <p className="font-bold text-amber-600">Doublette !</p>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Controls */}
            <div className="mt-6 flex flex-wrap gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={resetGame}
                className="btn btn-secondary gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Réinitialiser
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                disabled={isSubmitting || !payer || !fetcher}
                className="btn btn-primary gap-2 flex-1 sm:flex-none"
              >
                <Check className="w-4 h-4" />
                {isSubmitting ? 'Enregistrement...' : 'Enregistrer la partie'}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confetti */}
      <AnimatePresence>
        {showConfetti && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none z-50 overflow-hidden"
          >
            {Array.from({ length: 50 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  background: ['#8b4513', '#a0522d', '#cd853f', '#d2691e', '#f4a460'][i % 5],
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`
                }}
                initial={{ y: -100, opacity: 0 }}
                animate={{ 
                  y: [0, Math.random() * -100 - 500],
                  x: [0, (Math.random() - 0.5) * 200],
                  opacity: [1, 0],
                  rotate: [0, Math.random() * 360]
                }}
                transition={{ 
                  duration: 2 + Math.random() * 3,
                  repeat: Infinity,
                  ease: 'easeOut'
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {selectedPlayerList.length === 0 && mode !== 'manual' && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card p-8 text-center"
        >
          <div className="w-16 h-16 bg-coffee-light/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-coffee-light" />
          </div>
          <h3 className="font-semibold text-coffee-dark mb-2">
            Aucun joueur sélectionné
          </h3>
          <p className="text-coffee-light text-sm">
            Sélectionnez des joueurs pour commencer le tirage
          </p>
        </motion.div>
      )}
    </div>
  )
}

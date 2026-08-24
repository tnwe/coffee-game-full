import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Clock, Users, CreditCard, HandPlatter, Eye, Trash2, X } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import toast from 'react-hot-toast'
import LoadingSpinner from '../components/LoadingSpinner'
import clsx from 'clsx'

const fetchGames = async () => {
  const response = await fetch('/api/v1/games/?limit=100')
  if (!response.ok) throw new Error('Failed to fetch games')
  return response.json()
}

const deleteGame = async (gameId) => {
  const response = await fetch(`/api/v1/games/${gameId}`, {
    method: 'DELETE'
  })
  if (!response.ok) throw new Error('Failed to delete game')
  return true
}

export default function GameHistory() {
  const queryClient = useQueryClient()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null)
  const [expandedGame, setExpandedGame] = useState(null)

  const { data, isLoading, error } = useQuery({
    queryKey: ['games', 'history'],
    queryFn: fetchGames
  })

  const deleteGameMutation = useMutation({
    mutationFn: deleteGame,
    onSuccess: () => {
      queryClient.invalidateQueries(['games', 'stats'])
      setShowDeleteConfirm(null)
      toast.success('Partie supprimée avec succès')
    },
    onError: (error) => {
      toast.error(error.message || 'Erreur lors de la suppression')
    }
  })

  const games = data?.games || []

  const sortedGames = [...games].sort((a, b) =>
    new Date(b.date) - new Date(a.date)
  )

  const handleDeleteGame = useCallback((gameId) => {
    deleteGameMutation.mutate(gameId)
  }, [deleteGameMutation])

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return format(date, 'EEEE d MMMM yyyy', { locale: fr })
  }

  const formatShortDate = (dateString) => {
    const date = new Date(dateString)
    return format(date, 'dd/MM/yyyy', { locale: fr })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Erreur de chargement de l'historique</p>
        <button onClick={() => window.location.reload()} className="btn btn-secondary mt-4">
          Réessayer
        </button>
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
          <h1 className="text-2xl font-bold text-coffee-dark">Historique des parties</h1>
          <p className="text-coffee-light mt-1">Consultez et gérez toutes les parties jouées</p>
        </div>
      </motion.div>

      {/* Games List */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {sortedGames.length > 0 ? (
          <div className="space-y-3">
            {sortedGames.map((game, index) => {
              const isDoublette = game.is_doublette
              const isExpanded = expandedGame === game.id
              
              return (
                <motion.div
                  key={game.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={clsx(
                    "card p-4 transition-all duration-200",
                    isDoublette && "border border-amber-500/30 bg-amber-50/10"
                  )}
                >
                  {/* Game Summary */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      {/* Date */}
                      <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-coffee-light" />
                        <span className="font-medium text-coffee-dark">
                          {formatShortDate(game.date)}
                        </span>
                      </div>

                      {/* Participants */}
                      <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-coffee-light" />
                        <div className="flex -space-x-1">
                          {game.participants?.slice(0, 3).map((p, i) => (
                            <div 
                              key={p.id}
                              className="w-7 h-7 rounded-full bg-coffee-light/20 border border-white flex items-center justify-center text-xs font-medium text-coffee-dark"
                              style={{ zIndex: 3 - i }}
                            >
                              {p.name.charAt(0)}
                            </div>
                          ))}
                          {game.participants?.length > 3 && (
                            <div className="w-7 h-7 rounded-full bg-coffee-light/30 border border-white flex items-center justify-center text-xs font-medium text-coffee-dark">
                              +{game.participants.length - 3}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Payer */}
                      <div className="hidden md:flex items-center gap-2">
                        <span className="font-medium text-coffee-dark">
                          {game.payer?.name || '?'}
                        </span>
                      </div>

                      {/* Fetcher */}
                      <div className="hidden lg:flex items-center gap-2">
                        <span className="font-medium text-coffee-dark">
                          {game.fetcher?.name || '?'}
                        </span>
                      </div>

                      {/* Doublette Badge */}
                      {isDoublette && (
                        <span className="badge badge-warning text-xs">
                          Doublette
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setExpandedGame(isExpanded ? null : game.id)}
                        className="p-2 rounded-lg hover:bg-coffee-cream/50 transition-colors"
                      >
                        {isExpanded ? (
                          <X className="w-5 h-5 text-coffee-dark" />
                        ) : (
                          <Eye className="w-5 h-5 text-coffee-dark" />
                        )}
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(game.id)}
                        className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden mt-4 pt-4 border-t border-coffee-light/20"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Date */}
                          <div className="flex items-center gap-3">
                            <Clock className="w-5 h-5 text-coffee-light" />
                            <div>
                              <p className="text-sm text-coffee-light">Date</p>
                              <p className="font-medium text-coffee-dark">{formatDate(game.date)}</p>
                            </div>
                          </div>

                          {/* Participant Count */}
                          <div className="flex items-center gap-3">
                            <Users className="w-5 h-5 text-coffee-light" />
                            <div>
                              <p className="text-sm text-coffee-light">Participants</p>
                              <p className="font-medium text-coffee-dark">{game.participant_count || game.participants?.length || 0}</p>
                            </div>
                          </div>

                          {/* All Participants */}
                          <div className="md:col-span-2">
                            <p className="text-sm text-coffee-light mb-2">Tous les participants</p>
                            <div className="flex flex-wrap gap-2">
                              {game.participants?.map(p => (
                                <span 
                                  key={p.id}
                                  className="badge badge-coffee text-sm"
                                >
                                  {p.name}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Payer */}
                          <div className="flex items-center gap-3">
                            <CreditCard className="w-5 h-5 text-amber-500" />
                            <div>
                              <p className="text-sm text-coffee-light">Payeur</p>
                              <p className="font-medium text-coffee-dark">{game.payer?.name || 'Non spécifié'}</p>
                            </div>
                          </div>

                          {/* Fetcher */}
                          <div className="flex items-center gap-3">
                            <HandPlatter className="w-5 h-5 text-blue-500" />
                            <div>
                              <p className="text-sm text-coffee-light">Chercheur</p>
                              <p className="font-medium text-coffee-dark">{game.fetcher?.name || 'Non spécifié'}</p>
                            </div>
                          </div>
                        </div>

                        {/* Notes */}
                        {game.notes && (
                          <div className="mt-4 p-3 bg-coffee-cream/50 rounded-lg">
                            <p className="text-sm text-coffee-dark">{game.notes}</p>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card p-8 text-center"
          >
            <div className="w-16 h-16 bg-coffee-light/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-coffee-light" />
            </div>
            <h3 className="font-semibold text-coffee-dark mb-2">
              Aucune partie trouvée
            </h3>
            <p className="text-coffee-light text-sm">
              Aucune partie enregistrée pour le moment
            </p>
          </motion.div>
        )}
      </motion.div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowDeleteConfirm(null)}
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
                  <Trash2 className="w-5 h-5 text-red-500" />
                  Supprimer la partie
                </h3>
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="p-1 rounded-lg hover:bg-coffee-cream transition-colors"
                >
                  <X className="w-5 h-5 text-coffee-dark" />
                </button>
              </div>

              <div className="mb-6">
                <p className="text-coffee-dark">
                  Êtes-vous sûr de vouloir supprimer cette partie ?
                </p>
                <p className="text-coffee-light text-sm mt-2">
                  Cette action est irréversible.
                </p>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(null)}
                  className="btn btn-secondary"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteGame(showDeleteConfirm)}
                  disabled={deleteGameMutation.isLoading}
                  className="btn btn-error"
                >
                  {deleteGameMutation.isLoading ? 'Suppression...' : 'Supprimer'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

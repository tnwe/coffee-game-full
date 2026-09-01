import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, Plus, CreditCard, HandPlatter, TrendingUp,
  Pencil, ShieldCheck, ShieldX, X
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import LoadingSpinner from '../components/LoadingSpinner'
import clsx from 'clsx'

const fetchPlayers = async () => {
  const response = await fetch('/api/v1/players/')
  if (!response.ok) throw new Error('Failed to fetch players')
  return response.json()
}

const createPlayer = async (name) => {
  const response = await fetch('/api/v1/players/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  })
  if (!response.ok) throw new Error('Failed to create player')
  return response.json()
}

const toggleImmunity = async (playerId) => {
  const response = await fetch(`/api/v1/players/${playerId}/toggle-immunity`, {
    method: 'POST'
  })
  if (!response.ok) throw new Error('Failed to toggle immunity')
  return response.json()
}

export default function Players() {
  const queryClient = useQueryClient()
  const [newPlayerName, setNewPlayerName] = useState('')
  const [editingPlayer, setEditingPlayer] = useState(null)
  const [editName, setEditName] = useState('')

  const { data, isLoading, error } = useQuery({
    queryKey: ['players'],
    queryFn: fetchPlayers
  })

  const createPlayerMutation = useMutation({
    mutationFn: createPlayer,
    onSuccess: () => {
      queryClient.invalidateQueries(['players'])
      setNewPlayerName('')
      toast.success('Joueur ajouté avec succès !')
    },
    onError: (error) => {
      toast.error(error.message || 'Erreur lors de l\'ajout')
    }
  })

  const toggleImmunityMutation = useMutation({
    mutationFn: toggleImmunity,
    onSuccess: () => {
      queryClient.invalidateQueries(['players'])
    },
    onError: (error) => {
      toast.error(error.message || 'Erreur lors de la mise à jour')
    }
  })

  const players = data?.players || []
  const displayPlayers = players

  // Sort players
  const sortedPlayers = [...displayPlayers].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    if (b.total_participations !== a.total_participations) {
      return b.total_participations - a.total_participations
    }
    return a.name.localeCompare(b.name)
  })

  const handleCreatePlayer = useCallback((e) => {
    e.preventDefault()
    if (!newPlayerName.trim()) {
      toast.error('Le nom ne peut pas être vide')
      return
    }
    createPlayerMutation.mutate(newPlayerName.trim())
  }, [newPlayerName, createPlayerMutation])

  const handleToggleImmunity = useCallback((playerId, e) => {
    e.stopPropagation()
    toggleImmunityMutation.mutate(playerId)
  }, [toggleImmunityMutation])

  const handleEditPlayer = useCallback((player) => {
    setEditingPlayer(player)
    setEditName(player.name)
  }, [])

  const handleUpdatePlayer = useCallback(async (e) => {
    e.preventDefault()
    if (!editName.trim()) {
      toast.error('Le nom ne peut pas être vide')
      return
    }
    
    try {
      const response = await fetch(`/api/v1/players/${editingPlayer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim() })
      })
      
      if (!response.ok) throw new Error('Failed to update player')
      
      queryClient.invalidateQueries(['players'])
      setEditingPlayer(null)
      setEditName('')
      toast.success('Joueur mis à jour avec succès !')
    } catch (error) {
      toast.error(error.message || 'Erreur lors de la mise à jour')
    }
  }, [editingPlayer, editName, queryClient])

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
        <p className="text-red-500">Erreur de chargement des joueurs</p>
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
          <h1 className="text-2xl font-bold text-coffee-dark">Gestion des joueurs</h1>
          <p className="text-coffee-light mt-1">Ajoutez ou modifiez des joueurs</p>
        </div>
      </motion.div>

      {/* Actions Bar */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card p-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Add Player */}
          <form onSubmit={handleCreatePlayer} className="flex gap-2 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Nouveau joueur"
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              className="input"
            />
            <button
              type="submit"
              disabled={createPlayerMutation.isLoading || !newPlayerName.trim()}
              className="btn btn-primary gap-2 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Ajouter
            </button>
          </form>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="text-sm text-coffee-light">
            Total: {displayPlayers.length} joueurs
          </span>
        </div>
      </motion.div>

      {/* Players Table */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {sortedPlayers.length > 0 ? (
          <div className="space-y-3">
            {sortedPlayers.map((player, index) => (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="card p-4 hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex items-center gap-4">
                  {/* Rank */}
                  <span className="w-8 h-8 bg-coffee-light/20 rounded-full flex items-center justify-center text-coffee-dark text-sm font-bold">
                    {index + 1}
                  </span>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-coffee-dark truncate">
                      {player.name}
                    </h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                      <span className="text-sm text-coffee-light">
                        <CreditCard className="w-3 h-3 inline" /> {player.total_paid || 0}
                      </span>
                      <span className="text-sm text-coffee-light">
                        <HandPlatter className="w-3 h-3 inline" /> {player.total_fetched || 0}
                      </span>
                      <span className="text-sm text-coffee-light">
                        <Users className="w-3 h-3 inline" /> {player.total_participations || 0}
                      </span>
                      <span className="text-sm text-coffee-light">
                        <TrendingUp className="w-3 h-3 inline" /> {player.score || 0}
                      </span>
                    </div>
                  </div>

                  {/* Normalized Score */}
                  <div className="text-center">
                    <p className="text-2xl font-bold text-coffee-dark">
                      {player.normalized_score?.toFixed(2) || '0.00'}
                    </p>
                    <p className="text-xs text-coffee-light">Score normé</p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {/* Immunity Toggle */}
                    <button
                      onClick={(e) => handleToggleImmunity(player.id, e)}
                      className={clsx(
                        "p-2 rounded-lg transition-colors duration-200",
                        player.has_immunity 
                          ? 'bg-amber-500 text-white hover:bg-amber-600' 
                          : 'bg-coffee-cream/50 text-coffee-dark hover:bg-coffee-cream'
                      )}
                      title={player.has_immunity ? 'Retirer l\'immunité' : 'Donner l\'immunité'}
                    >
                      {player.has_immunity ? (
                        <ShieldCheck className="w-5 h-5" />
                      ) : (
                        <ShieldX className="w-5 h-5" />
                      )}
                    </button>

                    {/* Edit */}
                    <button
                      onClick={() => handleEditPlayer(player)}
                      className="p-2 rounded-lg text-coffee-dark hover:bg-coffee-cream/50 transition-colors duration-200"
                      title="Modifier"
                    >
                      <Pencil className="w-5 h-5" />
                    </button>

                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card p-8 text-center"
          >
            <div className="w-16 h-16 bg-coffee-light/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-coffee-light" />
            </div>
            <h3 className="font-semibold text-coffee-dark mb-2">
              Aucun joueur trouvé
            </h3>
            <p className="text-coffee-light text-sm">
              Ajoutez votre premier joueur
            </p>
          </motion.div>
        )}
      </motion.div>

      {/* Edit Player Modal */}
      <AnimatePresence>
        {editingPlayer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setEditingPlayer(null)}
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
                  <Pencil className="w-5 h-5" />
                  Modifier le joueur
                </h3>
                <button
                  onClick={() => setEditingPlayer(null)}
                  className="p-1 rounded-lg hover:bg-coffee-cream transition-colors"
                >
                  <X className="w-5 h-5 text-coffee-dark" />
                </button>
              </div>

              <form onSubmit={handleUpdatePlayer} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-coffee-dark mb-2">
                    Nom du joueur
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="input"
                    autoFocus
                  />
                </div>

                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => setEditingPlayer(null)}
                    className="btn btn-secondary"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                  >
                    Enregistrer
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}

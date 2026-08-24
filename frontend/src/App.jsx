import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import NewGame from './pages/NewGame'
import Stats from './pages/Stats'
import Players from './pages/Players'
import GameHistory from './pages/GameHistory'
import Settings from './pages/Settings'
import LoadingScreen from './components/LoadingScreen'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
})

export default function App() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return <LoadingScreen />
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-coffee-milk to-coffee-cream">
          <Navbar onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
          
          <div className="flex">
            {/* Sidebar for desktop */}
            <div className="hidden lg:block lg:w-64 lg:fixed lg:h-full">
              <Sidebar />
            </div>

            {/* Mobile sidebar overlay */}
            {isSidebarOpen && (
              <div 
                className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                onClick={() => setIsSidebarOpen(false)}
              />
            )}
            
            {isSidebarOpen && (
              <div className="fixed top-0 left-0 w-64 h-full bg-white shadow-xl z-50 lg:hidden">
                <Sidebar onClose={() => setIsSidebarOpen(false)} />
              </div>
            )}

            {/* Main content */}
            <main className="flex-1 lg:ml-64 p-4 pt-24 md:p-6 md:pt-28 lg:p-8 lg:pt-24">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/new-game" element={<NewGame />} />
                <Route path="/stats" element={<Stats />} />
                <Route path="/players" element={<Players />} />
                <Route path="/history" element={<GameHistory />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>

          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: 'white',
                color: 'var(--text-primary)',
                boxShadow: 'var(--shadow-lg)',
                borderRadius: 'var(--radius)',
              },
              success: {
                iconTheme: {
                  primary: 'var(--success)',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: 'var(--error)',
                  secondary: '#fff',
                },
              },
            }}
          />
        </div>
      </Router>
    </QueryClientProvider>
  )
}

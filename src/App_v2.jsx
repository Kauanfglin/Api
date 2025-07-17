import { useState, useEffect } from 'react'
import './App.css'

const API_BASE = 'https://proxypy-sa4w.onrender.com/'

function App() {
  const [activeTab, setActiveTab] = useState('live')
  const [isConnected, setIsConnected] = useState(false)
  const [liveData, setLiveData] = useState(null)
  const [nextPrediction, setNextPrediction] = useState(null)
  const [signalsList, setSignalsList] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(null)
  const [connectionStatus, setConnectionStatus] = useState('disconnected')

  // Função para buscar dados ao vivo
  const fetchLiveData = async () => {
    try {
      const response = await fetch(`${API_BASE}/live-data`)
      const data = await response.json()
      
      if (data.success) {
        setLiveData(data.data.games)
        setNextPrediction(data.data.next_prediction)
        setLastUpdate(new Date().toLocaleTimeString('pt-BR'))
        setConnectionStatus('connected')
        setIsConnected(true)
      } else {
        throw new Error(data.error || 'Erro ao buscar dados')
      }
    } catch (error) {
      console.error('Erro ao buscar dados ao vivo:', error)
      setConnectionStatus('error')
      setIsConnected(false)
    }
  }

  // Função para gerar lista de sinais
  const generateSignals = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`${API_BASE}/generate-signals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ count: 8 })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setSignalsList(data.data.signals)
      } else {
        throw new Error(data.error || 'Erro ao gerar sinais')
      }
    } catch (error) {
      console.error('Erro ao gerar sinais:', error)
      alert('Erro ao gerar sinais: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  // Função para simular novo jogo
  const simulateNewGame = async () => {
    try {
      const response = await fetch(`${API_BASE}/simulate-game`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Atualizar dados após simulação
        await fetchLiveData()
      }
    } catch (error) {
      console.error('Erro ao simular jogo:', error)
    }
  }

  // Conectar/desconectar
  const toggleConnection = () => {
    if (isConnected) {
      setIsConnected(false)
      setConnectionStatus('disconnected')
    } else {
      fetchLiveData()
    }
  }

  // Polling automático quando conectado
  useEffect(() => {
    let interval
    if (isConnected) {
      interval = setInterval(fetchLiveData, 30000) // 30 segundos
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isConnected])

  // Função para obter cor do círculo
  const getColorClass = (color) => {
    switch (color) {
      case 'red': return 'bg-red-500'
      case 'black': return 'bg-gray-900'
      case 'white': return 'bg-white border-2 border-gray-300'
      default: return 'bg-gray-400'
    }
  }

  // Função para obter texto da cor
  const getColorText = (color) => {
    switch (color) {
      case 'red': return 'Red'
      case 'black': return 'Black'
      case 'white': return 'White'
      default: return color
    }
  }

  // Função para obter classe de confiança
  const getConfidenceClass = (confidence) => {
    if (confidence >= 70) return 'text-green-400'
    if (confidence >= 60) return 'text-yellow-400'
    return 'text-orange-400'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-3xl">🔥</div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                  Blaze Double Analyzer PRO
                </h1>
                <p className="text-sm text-gray-300">Sinais ao vivo e predições inteligentes</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${
                    connectionStatus === 'connected' ? 'bg-green-400' : 
                    connectionStatus === 'error' ? 'bg-red-400' : 'bg-gray-400'
                  }`}></div>
                  <span>
                    {connectionStatus === 'connected' ? 'Conectado' : 
                     connectionStatus === 'error' ? 'Erro' : 'Desconectado'}
                  </span>
                </div>
                {lastUpdate && (
                  <div className="text-xs text-gray-400">
                    Última atualização: {lastUpdate}
                  </div>
                )}
              </div>
              
              <button
                onClick={toggleConnection}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  isConnected 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {isConnected ? 'Desconectar' : 'Conectar Live'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex space-x-1 bg-black/20 rounded-lg p-1 mb-6">
          <button
            onClick={() => setActiveTab('live')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
              activeTab === 'live'
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            🎯 Sinais Ao Vivo
          </button>
          <button
            onClick={() => setActiveTab('signals')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
              activeTab === 'signals'
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            📋 Lista de Sinais
          </button>
        </div>

        {/* Content */}
        {activeTab === 'live' && (
          <div className="space-y-6">
            {/* Predição da Próxima Cor */}
            {nextPrediction && (
              <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                <h2 className="text-xl font-bold mb-4 flex items-center">
                  🎯 Próxima Entrada Recomendada
                </h2>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-16 h-16 rounded-full ${getColorClass(nextPrediction.color)} flex items-center justify-center`}>
                      <span className={`font-bold text-lg ${nextPrediction.color === 'white' ? 'text-black' : 'text-white'}`}>
                        {getColorText(nextPrediction.color)}
                      </span>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{getColorText(nextPrediction.color)}</div>
                      <div className={`text-lg font-medium ${getConfidenceClass(nextPrediction.confidence)}`}>
                        {nextPrediction.confidence}% confiança
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm text-gray-300 mb-2">Baseado em:</div>
                    <div className="text-sm bg-blue-600/20 px-3 py-1 rounded-lg">
                      {nextPrediction.reason}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Histórico Recente */}
            {liveData && (
              <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">📊 Histórico Recente</h2>
                  <button
                    onClick={simulateNewGame}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-all"
                  >
                    Simular Novo Jogo
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {liveData.slice(0, 12).map((game, index) => (
                    <div key={game.id} className="bg-white/5 rounded-lg p-3 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full ${getColorClass(game.color)}`}></div>
                        <div>
                          <div className="font-medium">{game.time}</div>
                          <div className="text-sm text-gray-400">{getColorText(game.color)}</div>
                        </div>
                      </div>
                      <div className="text-lg font-bold text-gray-300">
                        {game.roll}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Controles */}
            <div className="flex justify-center space-x-4">
              <button
                onClick={fetchLiveData}
                disabled={!isConnected}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium transition-all"
              >
                🔄 Atualizar Dados
              </button>
            </div>
          </div>
        )}

        {activeTab === 'signals' && (
          <div className="space-y-6">
            {/* Gerador de Sinais */}
            <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">📋 Lista de Sinais Preditivos</h2>
                <button
                  onClick={generateSignals}
                  disabled={isLoading}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed rounded-lg font-medium transition-all"
                >
                  {isLoading ? '⏳ Gerando...' : '🎯 Gerar Sinais'}
                </button>
              </div>

              {signalsList.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🎯</div>
                  <div className="text-xl text-gray-300 mb-2">Nenhum sinal gerado ainda</div>
                  <div className="text-gray-400">Clique em "Gerar Sinais" para criar uma lista de predições</div>
                </div>
              ) : (
                <div className="space-y-4">
                  {signalsList.map((signal, index) => (
                    <div key={signal.id} className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-lg p-4 border border-white/10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="text-lg font-bold text-blue-300">
                            {signal.time}
                          </div>
                          <div className={`w-6 h-6 rounded-full ${getColorClass(signal.color)}`}></div>
                          <div className="text-lg font-medium">
                            {getColorText(signal.color)}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <div className={`text-lg font-bold ${getConfidenceClass(signal.confidence)}`}>
                            {signal.confidence}%
                          </div>
                          {index === 0 && (
                            <div className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                              PRÓXIMO
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App


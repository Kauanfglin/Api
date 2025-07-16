import { useState, useEffect, useCallback } from 'react'
import { BlazeApiService, BlazeAnalyzer, SignalGenerator } from '../services/blazeApi'

// Hook personalizado para gerenciar dados do Blaze
export const useBlaze = () => {
  const [gameData, setGameData] = useState([])
  const [currentAnalysis, setCurrentAnalysis] = useState(null)
  const [signals, setSignals] = useState([])
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState(new Date())

  // Instâncias dos serviços
  const [apiService] = useState(() => new BlazeApiService())
  const [analyzer] = useState(() => new BlazeAnalyzer())
  const [signalGenerator] = useState(() => new SignalGenerator(analyzer))

  // Carregar dados iniciais
  const loadInitialData = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await apiService.getRecentGames()
      setGameData(data)
      setLastUpdate(new Date())
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setIsLoading(false)
    }
  }, [apiService])

  // Analisar dados atuais
  const analyzeCurrentData = useCallback(() => {
    if (gameData.length > 0) {
      const analysis = analyzer.analyze(gameData)
      setCurrentAnalysis(analysis)
      return analysis
    }
    return null
  }, [gameData, analyzer])

  // Gerar sinais
  const generateSignals = useCallback((count = 10) => {
    if (gameData.length > 0) {
      const newSignals = signalGenerator.generateSignals(gameData, count)
      setSignals(newSignals)
      return newSignals
    }
    return []
  }, [gameData, signalGenerator])

  // Conectar ao WebSocket
  const connectToLive = useCallback(() => {
    apiService.connectWebSocket()
    
    // Listener para novos dados
    apiService.addListener((newGame) => {
      setGameData(prevData => {
        const updated = [newGame, ...prevData.slice(0, 19)] // Manter últimos 20
        return updated
      })
      setLastUpdate(new Date())
    })
    
    setIsConnected(true)
  }, [apiService])

  // Desconectar
  const disconnect = useCallback(() => {
    apiService.disconnect()
    setIsConnected(false)
  }, [apiService])

  // Atualizar dados manualmente
  const refreshData = useCallback(async () => {
    await loadInitialData()
    analyzeCurrentData()
  }, [loadInitialData, analyzeCurrentData])

  // Obter estatísticas
  const getStatistics = useCallback(() => {
    if (gameData.length === 0) return null

    const total = gameData.length
    const redCount = gameData.filter(game => game.color === 'red').length
    const blackCount = gameData.filter(game => game.color === 'black').length
    const whiteCount = gameData.filter(game => game.color === 'white').length

    return {
      total,
      red: {
        count: redCount,
        percentage: ((redCount / total) * 100).toFixed(1)
      },
      black: {
        count: blackCount,
        percentage: ((blackCount / total) * 100).toFixed(1)
      },
      white: {
        count: whiteCount,
        percentage: ((whiteCount / total) * 100).toFixed(1)
      }
    }
  }, [gameData])

  // Obter últimas sequências
  const getRecentSequences = useCallback(() => {
    if (gameData.length < 5) return []

    const sequences = []
    let currentColor = gameData[0]?.color
    let currentCount = 1

    for (let i = 1; i < Math.min(gameData.length, 15); i++) {
      if (gameData[i].color === currentColor) {
        currentCount++
      } else {
        if (currentCount >= 2) {
          sequences.push({
            color: currentColor,
            count: currentCount,
            endTime: gameData[i-1].time
          })
        }
        currentColor = gameData[i].color
        currentCount = 1
      }
    }

    return sequences.slice(0, 5) // Últimas 5 sequências
  }, [gameData])

  // Verificar se há padrão de gale
  const checkGalePattern = useCallback(() => {
    if (gameData.length < 3) return null

    const lastThree = gameData.slice(0, 3)
    const colors = lastThree.map(game => game.color)
    
    // Verificar se há sequência para gale
    if (colors[0] === colors[1] && colors[0] !== 'white') {
      return {
        color: colors[0] === 'red' ? 'black' : 'red',
        confidence: 70,
        reason: `Gale após 2 ${colors[0]}s consecutivos`
      }
    }

    return null
  }, [gameData])

  // Carregar dados na inicialização
  useEffect(() => {
    loadInitialData()
  }, [loadInitialData])

  // Auto-análise quando dados mudam
  useEffect(() => {
    if (gameData.length > 0) {
      analyzeCurrentData()
    }
  }, [gameData, analyzeCurrentData])

  return {
    // Estados
    gameData,
    currentAnalysis,
    signals,
    isConnected,
    isLoading,
    lastUpdate,

    // Ações
    loadInitialData,
    analyzeCurrentData,
    generateSignals,
    connectToLive,
    disconnect,
    refreshData,

    // Utilitários
    getStatistics,
    getRecentSequences,
    checkGalePattern
  }
}


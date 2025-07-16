import { useState, useEffect, useCallback, useRef } from 'react'
import { BlazeRealApiService, AdvancedBlazeAnalyzer } from '../services/blazeApiReal'
import { SignalGenerator } from '../services/blazeApi'

// Hook para usar a API real do Blaze
export const useBlazeReal = () => {
  const [gameData, setGameData] = useState([])
  const [currentAnalysis, setCurrentAnalysis] = useState(null)
  const [signals, setSignals] = useState([])
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState(new Date())
  const [connectionStatus, setConnectionStatus] = useState('disconnected')
  const [error, setError] = useState(null)

  // Refs para manter instâncias
  const apiServiceRef = useRef(null)
  const analyzerRef = useRef(null)
  const signalGeneratorRef = useRef(null)

  // Inicializar serviços
  useEffect(() => {
    apiServiceRef.current = new BlazeRealApiService()
    analyzerRef.current = new AdvancedBlazeAnalyzer()
    signalGeneratorRef.current = new SignalGenerator(analyzerRef.current)
  }, [])

  // Carregar dados iniciais
  const loadInitialData = useCallback(async () => {
    if (!apiServiceRef.current) return

    setIsLoading(true)
    setError(null)
    
    try {
      console.log('Carregando dados iniciais do Blaze...')
      const data = await apiServiceRef.current.getRecentGames()
      
      if (data && data.length > 0) {
        setGameData(data)
        setLastUpdate(new Date())
        console.log(`${data.length} jogos carregados com sucesso`)
      } else {
        throw new Error('Nenhum dado retornado da API')
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      setError('Erro ao carregar dados do Blaze')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Analisar dados atuais
  const analyzeCurrentData = useCallback(() => {
    if (!analyzerRef.current || gameData.length === 0) return null

    try {
      const analysis = analyzerRef.current.analyze(gameData)
      setCurrentAnalysis(analysis)
      console.log('Análise atualizada:', analysis)
      return analysis
    } catch (error) {
      console.error('Erro na análise:', error)
      setError('Erro ao analisar dados')
      return null
    }
  }, [gameData])

  // Gerar sinais
  const generateSignals = useCallback((count = 10) => {
    if (!signalGeneratorRef.current || gameData.length === 0) return []

    try {
      const newSignals = signalGeneratorRef.current.generateSignals(gameData, count)
      setSignals(newSignals)
      console.log(`${newSignals.length} sinais gerados`)
      return newSignals
    } catch (error) {
      console.error('Erro ao gerar sinais:', error)
      setError('Erro ao gerar sinais')
      return []
    }
  }, [gameData])

  // Conectar ao WebSocket
  const connectToLive = useCallback(() => {
    if (!apiServiceRef.current) return

    try {
      setConnectionStatus('connecting')
      console.log('Iniciando conexão ao vivo...')
      
      // Listener para novos dados
      apiServiceRef.current.addListener((newGame) => {
        console.log('Novo jogo recebido:', newGame)
        
        setGameData(prevData => {
          // Adicionar novo jogo e manter últimos 20
          const updated = [newGame, ...prevData.slice(0, 19)]
          return updated
        })
        
        setLastUpdate(new Date())
        
        // Auto-analisar quando receber novos dados
        setTimeout(() => {
          if (analyzerRef.current) {
            const analysis = analyzerRef.current.analyze([newGame, ...gameData.slice(0, 19)])
            setCurrentAnalysis(analysis)
          }
        }, 100)
      })
      
      // Conectar WebSocket
      apiServiceRef.current.connectWebSocket()
      
      // Verificar status da conexão
      setTimeout(() => {
        const status = apiServiceRef.current.getConnectionStatus()
        setIsConnected(status.isConnected)
        setConnectionStatus(status.isConnected ? 'connected' : 'simulated')
      }, 2000)
      
    } catch (error) {
      console.error('Erro ao conectar:', error)
      setError('Erro ao conectar ao Blaze')
      setConnectionStatus('error')
    }
  }, [gameData])

  // Desconectar
  const disconnect = useCallback(() => {
    if (!apiServiceRef.current) return

    try {
      apiServiceRef.current.disconnect()
      setIsConnected(false)
      setConnectionStatus('disconnected')
      console.log('Desconectado do Blaze')
    } catch (error) {
      console.error('Erro ao desconectar:', error)
    }
  }, [])

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
    if (gameData.length < 3) return []

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

    return sequences.slice(0, 5)
  }, [gameData])

  // Verificar padrão de gale
  const checkGalePattern = useCallback(() => {
    if (gameData.length < 3) return null

    const lastThree = gameData.slice(0, 3)
    const colors = lastThree.map(game => game.color)
    
    // Verificar sequência para gale
    if (colors[0] === colors[1] && colors[0] !== 'white') {
      return {
        color: colors[0] === 'red' ? 'black' : 'red',
        confidence: 75,
        reason: `Gale após 2 ${colors[0]}s consecutivos`,
        sequence: colors.slice(0, 2)
      }
    }

    // Verificar sequência de 3
    if (colors[0] === colors[1] && colors[1] === colors[2] && colors[0] !== 'white') {
      return {
        color: colors[0] === 'red' ? 'black' : 'red',
        confidence: 85,
        reason: `Gale forte após 3 ${colors[0]}s consecutivos`,
        sequence: colors.slice(0, 3)
      }
    }

    return null
  }, [gameData])

  // Obter próxima predição
  const getNextPrediction = useCallback(() => {
    if (!currentAnalysis || !currentAnalysis.prediction) return null

    return {
      color: currentAnalysis.prediction,
      confidence: currentAnalysis.confidence,
      reason: currentAnalysis.reason,
      timestamp: new Date(),
      analyses: currentAnalysis.analyses || []
    }
  }, [currentAnalysis])

  // Verificar se há alertas importantes
  const getAlerts = useCallback(() => {
    const alerts = []

    // Alerta de sequência longa
    const sequences = getRecentSequences()
    sequences.forEach(seq => {
      if (seq.count >= 4) {
        alerts.push({
          type: 'sequence',
          level: 'high',
          message: `Sequência de ${seq.count} ${seq.color}s detectada!`,
          color: seq.color,
          count: seq.count
        })
      }
    })

    // Alerta de gale
    const galePattern = checkGalePattern()
    if (galePattern) {
      alerts.push({
        type: 'gale',
        level: 'medium',
        message: galePattern.reason,
        color: galePattern.color,
        confidence: galePattern.confidence
      })
    }

    // Alerta de análise com alta confiança
    if (currentAnalysis && currentAnalysis.confidence >= 80) {
      alerts.push({
        type: 'prediction',
        level: 'high',
        message: `Predição com ${currentAnalysis.confidence}% de confiança: ${currentAnalysis.prediction}`,
        color: currentAnalysis.prediction,
        confidence: currentAnalysis.confidence
      })
    }

    return alerts
  }, [getRecentSequences, checkGalePattern, currentAnalysis])

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

  // Limpar erro após um tempo
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error])

  return {
    // Estados
    gameData,
    currentAnalysis,
    signals,
    isConnected,
    isLoading,
    lastUpdate,
    connectionStatus,
    error,

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
    checkGalePattern,
    getNextPrediction,
    getAlerts
  }
}


// Serviço para integração com a API do Blaze Double
class BlazeApiService {
  constructor() {
    this.baseUrl = 'https://blaze.com/api/roulette_games/recent'
    this.wsUrl = 'wss://api-v2.blaze.com/replication/?EIO=3&transport=websocket'
    this.isConnected = false
    this.listeners = []
  }

  // Buscar dados recentes da API
  async getRecentGames() {
    try {
      // Simulação de dados da API (substitua pela chamada real)
      const mockData = await this.generateMockData()
      return mockData
    } catch (error) {
      console.error('Erro ao buscar dados da API:', error)
      return this.generateMockData()
    }
  }

  // Gerar dados simulados (para demonstração)
  generateMockData() {
    const colors = ['red', 'black', 'white']
    const data = []
    const now = new Date()

    for (let i = 0; i < 20; i++) {
      const time = new Date(now.getTime() - (i * 60000)) // Últimos 20 minutos
      const color = colors[Math.floor(Math.random() * colors.length)]
      const number = this.generateNumberByColor(color)
      
      data.push({
        id: Date.now() + i,
        time: time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        timestamp: time.getTime(),
        color: color,
        number: number,
        roll: number
      })
    }

    return data.reverse() // Mais recentes primeiro
  }

  // Gerar número baseado na cor
  generateNumberByColor(color) {
    if (color === 'white') return 0
    if (color === 'red') {
      const redNumbers = [1, 3, 5, 7, 9, 12, 14]
      return redNumbers[Math.floor(Math.random() * redNumbers.length)]
    }
    if (color === 'black') {
      const blackNumbers = [2, 4, 6, 8, 10, 11, 13]
      return blackNumbers[Math.floor(Math.random() * blackNumbers.length)]
    }
  }

  // Conectar via WebSocket (simulado)
  connectWebSocket() {
    // Simulação de conexão WebSocket
    console.log('Conectando ao WebSocket do Blaze...')
    
    setTimeout(() => {
      this.isConnected = true
      console.log('Conectado ao WebSocket!')
      
      // Simular recebimento de dados a cada 30 segundos
      setInterval(() => {
        const newGame = this.generateSingleGame()
        this.notifyListeners(newGame)
      }, 30000)
    }, 1000)
  }

  // Gerar um único jogo
  generateSingleGame() {
    const colors = ['red', 'black', 'white']
    const color = colors[Math.floor(Math.random() * colors.length)]
    const number = this.generateNumberByColor(color)
    const now = new Date()

    return {
      id: Date.now(),
      time: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      timestamp: now.getTime(),
      color: color,
      number: number,
      roll: number
    }
  }

  // Adicionar listener para novos dados
  addListener(callback) {
    this.listeners.push(callback)
  }

  // Notificar listeners
  notifyListeners(data) {
    this.listeners.forEach(callback => callback(data))
  }

  // Desconectar
  disconnect() {
    this.isConnected = false
    this.listeners = []
  }
}

// Classe para análise de padrões
class BlazeAnalyzer {
  constructor() {
    this.patterns = {
      martingale: this.analyzeMartingale.bind(this),
      sequence: this.analyzeSequence.bind(this),
      frequency: this.analyzeFrequency.bind(this),
      trend: this.analyzeTrend.bind(this)
    }
  }

  // Análise principal
  analyze(gameData) {
    if (!gameData || gameData.length < 5) {
      return {
        prediction: null,
        confidence: 0,
        reason: 'Dados insuficientes para análise'
      }
    }

    const analyses = []

    // Executar todas as análises
    Object.keys(this.patterns).forEach(patternName => {
      const result = this.patterns[patternName](gameData)
      if (result) {
        analyses.push({
          type: patternName,
          ...result
        })
      }
    })

    // Combinar resultados
    return this.combineAnalyses(analyses)
  }

  // Análise Martingale (após sequências)
  analyzeMartingale(data) {
    const recent = data.slice(-5) // Últimos 5 jogos
    const colors = recent.map(game => game.color)
    
    // Verificar sequências de mesma cor
    let currentSequence = 1
    let lastColor = colors[colors.length - 1]
    
    for (let i = colors.length - 2; i >= 0; i--) {
      if (colors[i] === lastColor) {
        currentSequence++
      } else {
        break
      }
    }

    if (currentSequence >= 3) {
      const oppositeColor = lastColor === 'red' ? 'black' : 'red'
      return {
        prediction: oppositeColor,
        confidence: Math.min(60 + (currentSequence * 10), 90),
        reason: `Sequência de ${currentSequence} ${lastColor}s - Martingale sugere ${oppositeColor}`
      }
    }

    return null
  }

  // Análise de sequência
  analyzeSequence(data) {
    const recent = data.slice(-10)
    const pattern = recent.map(game => game.color).join('')
    
    // Padrões conhecidos
    const knownPatterns = {
      'redblackred': { next: 'black', confidence: 70 },
      'blackredblack': { next: 'red', confidence: 70 },
      'redredblack': { next: 'red', confidence: 65 },
      'blackblackred': { next: 'black', confidence: 65 }
    }

    for (const [patternKey, prediction] of Object.entries(knownPatterns)) {
      if (pattern.includes(patternKey)) {
        return {
          prediction: prediction.next,
          confidence: prediction.confidence,
          reason: `Padrão ${patternKey} detectado`
        }
      }
    }

    return null
  }

  // Análise de frequência
  analyzeFrequency(data) {
    const recent = data.slice(-15)
    const colorCount = {
      red: recent.filter(g => g.color === 'red').length,
      black: recent.filter(g => g.color === 'black').length,
      white: recent.filter(g => g.color === 'white').length
    }

    const total = recent.length
    const redPercent = (colorCount.red / total) * 100
    const blackPercent = (colorCount.black / total) * 100

    // Se uma cor está muito abaixo da média (33%), sugerir ela
    if (redPercent < 25) {
      return {
        prediction: 'red',
        confidence: 60,
        reason: `Vermelho abaixo da média (${redPercent.toFixed(1)}%)`
      }
    }

    if (blackPercent < 25) {
      return {
        prediction: 'black',
        confidence: 60,
        reason: `Preto abaixo da média (${blackPercent.toFixed(1)}%)`
      }
    }

    return null
  }

  // Análise de tendência
  analyzeTrend(data) {
    const recent = data.slice(-8)
    const colors = recent.map(game => game.color)
    
    // Contar transições
    let redToBlack = 0
    let blackToRed = 0
    
    for (let i = 1; i < colors.length; i++) {
      if (colors[i-1] === 'red' && colors[i] === 'black') redToBlack++
      if (colors[i-1] === 'black' && colors[i] === 'red') blackToRed++
    }

    if (redToBlack > blackToRed + 2) {
      return {
        prediction: 'black',
        confidence: 55,
        reason: 'Tendência: vermelho → preto'
      }
    }

    if (blackToRed > redToBlack + 2) {
      return {
        prediction: 'red',
        confidence: 55,
        reason: 'Tendência: preto → vermelho'
      }
    }

    return null
  }

  // Combinar análises
  combineAnalyses(analyses) {
    if (analyses.length === 0) {
      return {
        prediction: null,
        confidence: 0,
        reason: 'Nenhum padrão detectado'
      }
    }

    // Agrupar por predição
    const grouped = {}
    analyses.forEach(analysis => {
      if (!grouped[analysis.prediction]) {
        grouped[analysis.prediction] = []
      }
      grouped[analysis.prediction].push(analysis)
    })

    // Encontrar a predição com maior confiança combinada
    let bestPrediction = null
    let bestConfidence = 0
    let bestReason = ''

    Object.keys(grouped).forEach(prediction => {
      const group = grouped[prediction]
      const avgConfidence = group.reduce((sum, a) => sum + a.confidence, 0) / group.length
      const combinedConfidence = Math.min(avgConfidence + (group.length * 5), 95)

      if (combinedConfidence > bestConfidence) {
        bestConfidence = combinedConfidence
        bestPrediction = prediction
        bestReason = group.map(a => a.reason).join(' + ')
      }
    })

    return {
      prediction: bestPrediction,
      confidence: Math.round(bestConfidence),
      reason: bestReason,
      analyses: analyses
    }
  }
}

// Gerador de sinais
class SignalGenerator {
  constructor(analyzer) {
    this.analyzer = analyzer
  }

  // Gerar lista de sinais futuros
  generateSignals(gameData, count = 10) {
    const signals = []
    const now = new Date()
    
    // Simular análise para próximos horários
    for (let i = 1; i <= count; i++) {
      const futureTime = new Date(now.getTime() + (i * 60000)) // Próximos minutos
      
      // Análise baseada em dados atuais + variação
      const analysis = this.analyzer.analyze(gameData)
      const colors = ['red', 'black', 'white']
      
      let prediction = analysis.prediction || colors[Math.floor(Math.random() * colors.length)]
      let confidence = analysis.confidence || (Math.floor(Math.random() * 30) + 60)
      
      // Adicionar variação para tornar mais realista
      if (Math.random() < 0.3) {
        prediction = colors[Math.floor(Math.random() * colors.length)]
        confidence = Math.floor(Math.random() * 40) + 50
      }

      signals.push({
        id: i,
        time: futureTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        timestamp: futureTime.getTime(),
        color: prediction,
        confidence: Math.min(confidence, 95),
        analysis: i === 1 ? analysis.reason : 'Análise preditiva'
      })
    }

    return signals
  }
}

// Exportar serviços
export { BlazeApiService, BlazeAnalyzer, SignalGenerator }


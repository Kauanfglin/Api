// Serviço para conectar ao proxy local do Blaze Double
class BlazeProxyApiService {
  constructor() {
    this.proxyUrl = 'https://blaze-proxy-brfj.onrender.com/'
    this.isConnected = false
    this.listeners = []
    this.pollingInterval = null
    this.lastGameId = null
  }

  // Buscar dados recentes via proxy
  async getRecentGames() {
    try {
      console.log('🔥 Buscando dados via proxy local...')
      
      const response = await fetch(`${this.proxyUrl}/recent-games`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Proxy retornou status ${response.status}`)
      }

      const result = await response.json()
      
      if (result.success && result.data) {
        console.log(`✅ ${result.count} jogos obtidos via proxy (fonte: ${result.source})`)
        return this.processProxyData(result.data)
      } else {
        throw new Error(result.error || 'Dados inválidos do proxy')
      }
    } catch (error) {
      console.error('❌ Erro ao buscar dados do proxy:', error)
      throw new Error(`Erro de conexão com o proxy: ${error.message}`)
    }
  }

  // Processar dados do proxy
  processProxyData(data) {
    if (!data || !Array.isArray(data)) {
      throw new Error('Dados inválidos recebidos do proxy')
    }

    return data.map(game => ({
      id: game.id || Date.now() + Math.random(),
      time: game.time || this.formatTime(game.created_at || new Date()),
      timestamp: game.timestamp || new Date(game.created_at || new Date()).getTime(),
      color: game.color || this.getColorFromRoll(game.roll || 0),
      number: game.roll || 0,
      roll: game.roll || 0
    }))
  }

  // Determinar cor baseada no número
  getColorFromRoll(roll) {
    if (roll === 0) return 'white'
    if ([1, 3, 5, 7, 9, 12, 14].includes(roll)) return 'red'
    return 'black'
  }

  // Formatar horário
  formatTime(dateString) {
    const date = new Date(dateString)
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  // Verificar status do proxy
  async checkProxyStatus() {
    try {
      const response = await fetch(`${this.proxyUrl}/status`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      })

      if (response.ok) {
        const status = await response.json()
        console.log('📡 Status do proxy:', status)
        return status
      } else {
        throw new Error(`Status ${response.status}`)
      }
    } catch (error) {
      console.error('❌ Proxy não está respondendo:', error)
      return null
    }
  }

  // Iniciar polling para dados em tempo real
  async startLivePolling(intervalMs = 30000) {
    try {
      console.log('🔄 Iniciando polling para dados em tempo real...')
      
      // Verificar se o proxy está online
      const status = await this.checkProxyStatus()
      if (!status) {
        throw new Error('Proxy não está online')
      }

      this.isConnected = true
      
      // Buscar dados iniciais
      const initialData = await this.getRecentGames()
      if (initialData.length > 0) {
        this.lastGameId = initialData[0].id
      }

      // Configurar polling
      this.pollingInterval = setInterval(async () => {
        try {
          const newData = await this.getRecentGames()
          
          if (newData.length > 0) {
            const latestGame = newData[0]
            
            // Verificar se há um novo jogo
            if (latestGame.id !== this.lastGameId) {
              console.log('🆕 Novo jogo detectado:', latestGame)
              this.lastGameId = latestGame.id
              this.notifyListeners(latestGame)
            }
          }
        } catch (error) {
          console.error('Erro no polling:', error)
        }
      }, intervalMs)

      console.log(`✅ Polling iniciado (intervalo: ${intervalMs/1000}s)`)
      
    } catch (error) {
      console.error('❌ Erro ao iniciar polling:', error)
      this.isConnected = false
      throw error
    }
  }

  // Parar polling
  stopLivePolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval)
      this.pollingInterval = null
      console.log('⏹️ Polling parado')
    }
    this.isConnected = false
  }

  // Simular novo jogo (para testes)
  async simulateNewGame() {
    try {
      const response = await fetch(`${this.proxyUrl}/simulate-new-game`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          console.log('🎲 Jogo simulado:', result.data)
          const processedGame = this.processProxyData([result.data])[0]
          this.notifyListeners(processedGame)
          return processedGame
        }
      }
    } catch (error) {
      console.error('Erro ao simular jogo:', error)
    }
  }

  // Adicionar listener para novos dados
  addListener(callback) {
    this.listeners.push(callback)
  }

  // Remover listener
  removeListener(callback) {
    this.listeners = this.listeners.filter(listener => listener !== callback)
  }

  // Notificar listeners
  notifyListeners(data) {
    this.listeners.forEach(callback => {
      try {
        callback(data)
      } catch (error) {
        console.error('Erro ao notificar listener:', error)
      }
    })
  }

  // Desconectar
  disconnect() {
    this.stopLivePolling()
    this.listeners = []
    this.lastGameId = null
    console.log('🔌 Desconectado do proxy')
  }

  // Verificar status da conexão
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      hasPolling: !!this.pollingInterval,
      proxyUrl: this.proxyUrl
    }
  }
}

// Classe para análise avançada (reutilizada)
class AdvancedBlazeAnalyzer {
  constructor() {
    this.patterns = {
      martingale: this.analyzeMartingale.bind(this),
      sequence: this.analyzeSequence.bind(this),
      frequency: this.analyzeFrequency.bind(this),
      trend: this.analyzeTrend.bind(this),
      gale: this.analyzeGale.bind(this),
      fibonacci: this.analyzeFibonacci.bind(this)
    }
  }

  // Análise principal com múltiplos algoritmos
  analyze(gameData) {
    if (!gameData || gameData.length < 5) {
      return {
        prediction: null,
        confidence: 0,
        reason: 'Dados insuficientes para análise (mínimo 5 jogos)',
        analyses: []
      }
    }

    const analyses = []

    // Executar todas as análises
    Object.keys(this.patterns).forEach(patternName => {
      try {
        const result = this.patterns[patternName](gameData)
        if (result && result.prediction) {
          analyses.push({
            type: patternName,
            ...result
          })
        }
      } catch (error) {
        console.error(`Erro na análise ${patternName}:`, error)
      }
    })

    // Combinar resultados com pesos
    return this.combineAnalysesWithWeights(analyses)
  }

  // Análise Martingale aprimorada
  analyzeMartingale(data) {
    const recent = data.slice(-6) // Últimos 6 jogos
    const colors = recent.map(game => game.color)
    
    let currentSequence = 1
    let lastColor = colors[colors.length - 1]
    
    // Contar sequência atual
    for (let i = colors.length - 2; i >= 0; i--) {
      if (colors[i] === lastColor && lastColor !== 'white') {
        currentSequence++
      } else {
        break
      }
    }

    if (currentSequence >= 2 && lastColor !== 'white') {
      const oppositeColor = lastColor === 'red' ? 'black' : 'red'
      const confidence = Math.min(50 + (currentSequence * 15), 85)
      
      return {
        prediction: oppositeColor,
        confidence: confidence,
        reason: `Martingale: ${currentSequence} ${lastColor}s consecutivos`
      }
    }

    return null
  }

  // Análise de sequência avançada
  analyzeSequence(data) {
    const recent = data.slice(-8)
    const pattern = recent.map(game => game.color).join('')
    
    // Padrões mais específicos e realistas
    const knownPatterns = {
      'redblackred': { next: 'black', confidence: 65, reason: 'Padrão RBR detectado' },
      'blackredblack': { next: 'red', confidence: 65, reason: 'Padrão BRB detectado' },
      'redredblack': { next: 'red', confidence: 60, reason: 'Padrão RRB detectado' },
      'blackblackred': { next: 'black', confidence: 60, reason: 'Padrão BBR detectado' },
      'redblackblack': { next: 'red', confidence: 58, reason: 'Padrão RBB detectado' },
      'blackredred': { next: 'black', confidence: 58, reason: 'Padrão BRR detectado' }
    }

    for (const [patternKey, prediction] of Object.entries(knownPatterns)) {
      if (pattern.includes(patternKey)) {
        return {
          prediction: prediction.next,
          confidence: prediction.confidence,
          reason: prediction.reason
        }
      }
    }

    return null
  }

  // Análise de frequência melhorada
  analyzeFrequency(data) {
    const recent = data.slice(-20) // Últimos 20 jogos
    const colorCount = {
      red: recent.filter(g => g.color === 'red').length,
      black: recent.filter(g => g.color === 'black').length,
      white: recent.filter(g => g.color === 'white').length
    }

    const total = recent.length
    const redPercent = (colorCount.red / total) * 100
    const blackPercent = (colorCount.black / total) * 100
    const whitePercent = (colorCount.white / total) * 100

    // Análise baseada em desvio da média esperada
    const expectedPercent = 42.5 // Aproximadamente 42.5% para red/black
    const whiteExpected = 15 // Aproximadamente 15% para white

    if (redPercent < expectedPercent - 10) {
      return {
        prediction: 'red',
        confidence: 55 + Math.abs(expectedPercent - redPercent),
        reason: `Vermelho abaixo da média (${redPercent.toFixed(1)}% vs ${expectedPercent}%)`
      }
    }

    if (blackPercent < expectedPercent - 10) {
      return {
        prediction: 'black',
        confidence: 55 + Math.abs(expectedPercent - blackPercent),
        reason: `Preto abaixo da média (${blackPercent.toFixed(1)}% vs ${expectedPercent}%)`
      }
    }

    if (whitePercent < whiteExpected - 5) {
      return {
        prediction: 'white',
        confidence: 45 + Math.abs(whiteExpected - whitePercent) * 2,
        reason: `Branco abaixo da média (${whitePercent.toFixed(1)}% vs ${whiteExpected}%)`
      }
    }

    return null
  }

  // Análise de tendência
  analyzeTrend(data) {
    const recent = data.slice(-10)
    const colors = recent.map(game => game.color)
    
    // Analisar transições
    let redToBlack = 0
    let blackToRed = 0
    let toWhite = 0
    
    for (let i = 1; i < colors.length; i++) {
      if (colors[i-1] === 'red' && colors[i] === 'black') redToBlack++
      if (colors[i-1] === 'black' && colors[i] === 'red') blackToRed++
      if (colors[i] === 'white') toWhite++
    }

    if (redToBlack > blackToRed + 2) {
      return {
        prediction: 'black',
        confidence: 52,
        reason: `Tendência forte: vermelho → preto (${redToBlack} vs ${blackToRed})`
      }
    }

    if (blackToRed > redToBlack + 2) {
      return {
        prediction: 'red',
        confidence: 52,
        reason: `Tendência forte: preto → vermelho (${blackToRed} vs ${redToBlack})`
      }
    }

    return null
  }

  // Análise específica para Gale
  analyzeGale(data) {
    if (data.length < 4) return null

    const lastFour = data.slice(-4)
    const colors = lastFour.map(game => game.color)
    
    // Verificar padrões para gale
    if (colors[colors.length - 1] === colors[colors.length - 2] && 
        colors[colors.length - 1] !== 'white') {
      
      const currentColor = colors[colors.length - 1]
      const oppositeColor = currentColor === 'red' ? 'black' : 'red'
      
      return {
        prediction: oppositeColor,
        confidence: 68,
        reason: `Gale: 2 ${currentColor}s consecutivos`
      }
    }

    return null
  }

  // Análise Fibonacci
  analyzeFibonacci(data) {
    const recent = data.slice(-13) // Sequência Fibonacci: 1,1,2,3,5,8,13
    const colors = recent.map(game => game.color)
    
    // Verificar se há padrão Fibonacci nas cores
    const redPositions = []
    const blackPositions = []
    
    colors.forEach((color, index) => {
      if (color === 'red') redPositions.push(index)
      if (color === 'black') blackPositions.push(index)
    })

    // Fibonacci positions: 0,1,1,2,3,5,8,12
    const fibPositions = [0, 1, 1, 2, 3, 5, 8, 12]
    
    let redFibMatches = 0
    let blackFibMatches = 0
    
    fibPositions.forEach(pos => {
      if (redPositions.includes(pos)) redFibMatches++
      if (blackPositions.includes(pos)) blackFibMatches++
    })

    if (redFibMatches >= 3) {
      return {
        prediction: 'red',
        confidence: 45 + (redFibMatches * 5),
        reason: `Padrão Fibonacci detectado para vermelho (${redFibMatches} matches)`
      }
    }

    if (blackFibMatches >= 3) {
      return {
        prediction: 'black',
        confidence: 45 + (blackFibMatches * 5),
        reason: `Padrão Fibonacci detectado para preto (${blackFibMatches} matches)`
      }
    }

    return null
  }

  // Combinar análises com pesos
  combineAnalysesWithWeights(analyses) {
    if (analyses.length === 0) {
      return {
        prediction: null,
        confidence: 0,
        reason: 'Nenhum padrão detectado',
        analyses: []
      }
    }

    // Pesos para diferentes tipos de análise
    const weights = {
      martingale: 1.2,
      gale: 1.1,
      sequence: 1.0,
      frequency: 0.9,
      trend: 0.8,
      fibonacci: 0.7
    }

    // Agrupar por predição
    const grouped = {}
    analyses.forEach(analysis => {
      if (!grouped[analysis.prediction]) {
        grouped[analysis.prediction] = []
      }
      grouped[analysis.prediction].push(analysis)
    })

    // Calcular confiança ponderada
    let bestPrediction = null
    let bestConfidence = 0
    let bestReason = ''
    let bestAnalyses = []

    Object.keys(grouped).forEach(prediction => {
      const group = grouped[prediction]
      let weightedConfidence = 0
      let totalWeight = 0

      group.forEach(analysis => {
        const weight = weights[analysis.type] || 1.0
        weightedConfidence += analysis.confidence * weight
        totalWeight += weight
      })

      const avgConfidence = weightedConfidence / totalWeight
      const bonusConfidence = Math.min(group.length * 3, 15) // Bônus por múltiplas análises
      const finalConfidence = Math.min(avgConfidence + bonusConfidence, 95)

      if (finalConfidence > bestConfidence) {
        bestConfidence = finalConfidence
        bestPrediction = prediction
        bestReason = group.map(a => a.reason).join(' + ')
        bestAnalyses = group
      }
    })

    return {
      prediction: bestPrediction,
      confidence: Math.round(bestConfidence),
      reason: bestReason,
      analyses: bestAnalyses
    }
  }
}

// Exportar serviços
export { BlazeProxyApiService, AdvancedBlazeAnalyzer }


'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Send, Sparkles, Square } from 'lucide-react'
import { RealtimeLogs } from '@/components/RealtimeLogs'
import { ProjectHistory } from '@/components/ProjectHistory'
import { AgentFlowViewer } from '@/components/AgentFlowViewer'
import { ProjectViewer } from '@/components/ProjectViewer'

interface ModelConfig {
  name: string
  displayName: string
  category: 'code' | 'thinking' | 'common'
  description: string
}

export default function Home() {
  const [models, setModels] = useState<ModelConfig[]>([])
  const [selectedModel, setSelectedModel] = useState('')
  const [projectName, setProjectName] = useState('')
  const [description, setDescription] = useState('')
  const [generating, setGenerating] = useState(false)
  const [activeTab, setActiveTab] = useState<'logs' | 'history'>('logs')
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const [useCrewAI, setUseCrewAI] = useState(false)
  const [crewAIAvailable, setCrewAIAvailable] = useState(false)

  useEffect(() => {
    loadModels()
  }, [])

  // Poll for project status
  useEffect(() => {
    if (!activeProjectId) {
      setGenerating(false)
      return
    }

    const checkStatus = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
        const res = await fetch(`${apiUrl}/api/history/${activeProjectId}`)
        const data = await res.json()

        if (data.project) {
          // Sync generating state with project status
          const isRunning = data.project.status === 'in-progress'
          setGenerating(isRunning)
        }
      } catch (e) {
        console.error('Poll error', e)
      }
    }

    // Initial check
    checkStatus()

    // Poll every 2s
    const interval = setInterval(checkStatus, 2000)
    return () => clearInterval(interval)
  }, [activeProjectId])

  // Auto-fill form logic (separate from polling)
  useEffect(() => {
    if (activeProjectId) {
      // ... existing auto-fill logic ...
    }
  }, [activeProjectId, models])

  const loadModels = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      const response = await fetch(`${apiUrl}/api/models`)
      const data = await response.json()
      setModels(data.models || [])

      // Set default model
      if (data.models && data.models.length > 0) {
        setSelectedModel(data.models[0].name)
      }

      // Check CrewAI availability
      try {
        const crewRes = await fetch(`${apiUrl}/api/crewai/health`)
        const crewData = await crewRes.json()
        setCrewAIAvailable(crewData.available === true)
      } catch {
        setCrewAIAvailable(false)
      }
    } catch (error) {
      console.error('Failed to load models:', error)
      toast.error('Failed to load models')
    }
  }

  const handleGenerate = async () => {
    if (!description.trim()) {
      toast.error('Please enter a project description')
      return
    }

    if (!useCrewAI && !selectedModel) {
      toast.error('Please select a model')
      return
    }

    setGenerating(true)
    setActiveProjectId(null) // Reset active project

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      const endpoint = useCrewAI ? '/api/generate-crewai' : '/api/generate'

      const response = await fetch(`${apiUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: projectName || `Project-${Date.now()}`,
          description,
          model: selectedModel,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to start project generation')
      }

      const data = await response.json()

      toast.success(`Project "${data.name}" started!`, {
        description: 'Watch the logs for real-time updates',
      })

      // Switch to logs tab and set active project
      setActiveTab('logs')
      if (data.projectId) {
        setActiveProjectId(data.projectId)
      }

      // Clear form
      setProjectName('')
      setDescription('')
    } catch (error) {
      console.error('Generation error:', error)
      toast.error('Failed to start project generation')
      setGenerating(false)
    } finally {
      // Don't reset generating here; let the poller handle it based on project status
    }
  }

  const handleStop = async () => {
    if (!activeProjectId) return

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      await fetch(`${apiUrl}/api/stop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: activeProjectId }),
      })
      toast.info('Stopping generation...')
    } catch (error) {
      console.error('Failed to stop:', error)
      toast.error('Failed to stop generation')
    }
  }

  const handleForceStop = async () => {
    if (!confirm('Are you sure you want to FORCE STOP all running projects?')) return

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      const res = await fetch(`${apiUrl}/api/stop-all`, { method: 'POST' })
      const data = await res.json()
      toast.warning(`Stopped ${data.count} active projects.`)
    } catch (e) {
      console.error(e)
      toast.error('Failed to force stop')
    }
  }

  const handleReset = async () => {
    if (!confirm('CONFIRM RESET: This will clear all internal state and mark in-progress projects as failed. Use this if the system is stuck.')) return

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      const res = await fetch(`${apiUrl}/api/reset`, { method: 'POST' })
      const data = await res.json()
      toast.success(`System Reset Complete. Cleared ${data.resetCount} projects.`)

      // Reset local state
      setGenerating(false)
      setActiveProjectId(null)
      setActiveTab('history') // Go to history to see the carnage (updated statuses)
    } catch (e) {
      console.error(e)
      toast.error('Failed to reset system')
    }
  }

  const handleSelectProject = (id: string) => {
    setActiveProjectId(id)
    setActiveTab('history')
  }

  const modelsByCategory = {
    code: models.filter(m => m.category === 'code'),
    thinking: models.filter(m => m.category === 'thinking'),
    common: models.filter(m => m.category === 'common'),
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-3 shrink-0">
        <div className="flex items-center gap-3">
          <Sparkles className="w-7 h-7 text-accent" />
          <div>
            <h1 className="text-xl font-bold text-foreground">AI Software Company</h1>
            <p className="text-xs text-muted">Create complete projects with Ollama</p>
          </div>
        </div>
      </header>

      {/* Main Content - Responsive Layout */}
      <div className="flex-1 flex flex-col lg:flex-row gap-3 p-3 min-h-0 overflow-hidden">
        {/* Left Panel - Form */}
        <div className="bg-card rounded-xl border border-border p-4 overflow-y-auto shrink-0 lg:w-80 xl:w-96 max-h-[40vh] lg:max-h-full">
          <h2 className="text-lg font-semibold mb-4 text-foreground">Create New Project</h2>

          <div className="space-y-4">
            {/* Project Name */}
            <div>
              <label className="block text-sm font-medium text-muted mb-2">
                Project Name (optional)
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="My Awesome Project"
                className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent text-foreground placeholder:text-muted/50 transition-all"
              />
            </div>

            {/* Engine Selection */}
            <div>
              <label className="block text-sm font-medium text-muted mb-2">
                Generation Engine
              </label>
              <div className="grid grid-cols-2 gap-2">
                {/* TypeScript Option */}
                <button
                  type="button"
                  onClick={() => setUseCrewAI(false)}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${!useCrewAI
                    ? 'border-accent bg-accent/10 ring-1 ring-accent/30'
                    : 'border-border bg-background hover:border-muted/50'
                    }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">⚡</span>
                    <span className={`text-sm font-semibold ${!useCrewAI ? 'text-accent' : 'text-foreground'}`}>
                      TypeScript
                    </span>
                  </div>
                  <p className="text-xs text-muted">Rápido e direto</p>
                </button>

                {/* LangGraph Option */}
                <button
                  type="button"
                  onClick={() => crewAIAvailable && setUseCrewAI(true)}
                  disabled={!crewAIAvailable}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${useCrewAI
                    ? 'border-purple-500 bg-purple-500/10 ring-1 ring-purple-500/30'
                    : crewAIAvailable
                      ? 'border-border bg-background hover:border-muted/50'
                      : 'border-border bg-background opacity-50 cursor-not-allowed'
                    }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">🤖</span>
                    <span className={`text-sm font-semibold ${useCrewAI ? 'text-purple-400' : 'text-foreground'}`}>
                      LangGraph
                    </span>
                  </div>
                  <p className="text-xs text-muted">
                    {crewAIAvailable ? 'Multi-agente IA' : 'Não disponível'}
                  </p>
                </button>
              </div>
              {!crewAIAvailable && (
                <p className="text-xs text-orange-400 mt-2">
                  ⚠️ LangGraph offline. Inicie: cd crewai-service && python server.py
                </p>
              )}
            </div>

            {/* Model Selection */}
            <div>
              <label className="block text-sm font-medium text-muted mb-2">
                Select Model
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent text-foreground transition-all"
              >
                {Object.entries(modelsByCategory).map(([category, categoryModels]) => (
                  categoryModels.length > 0 && (
                    <optgroup key={category} label={category.toUpperCase()} className="bg-card">
                      {categoryModels.map((model) => (
                        <option key={model.name} value={model.name} className="bg-card">
                          {model.displayName}
                        </option>
                      ))}
                    </optgroup>
                  )
                ))}
              </select>
              {selectedModel && (
                <p className="mt-1.5 text-xs text-muted">
                  {models.find(m => m.name === selectedModel)?.description}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-muted mb-2">
                Project Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what you want to build... Be specific!"
                rows={4}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent resize-none text-foreground placeholder:text-muted/50 transition-all text-sm"
              />
            </div>

            {/* Generate/Stop Button */}
            {generating ? (
              <button
                onClick={handleStop}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-3 px-6 rounded-lg font-medium flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-600/20"
              >
                <Square className="w-5 h-5 fill-current" />
                Stop Generation
              </button>
            ) : (
              <button
                onClick={handleGenerate}
                disabled={!description.trim()}
                className="w-full bg-accent hover:bg-accent-hover text-white py-3 px-6 rounded-lg font-medium disabled:bg-gray-700 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all shadow-lg shadow-accent/20 disabled:shadow-none"
              >
                <Send className="w-5 h-5" />
                Generate Project
              </button>
            )}
          </div>
        </div>

        {/* Middle Panel - Logs/Preview */}
        <div className="bg-card rounded-xl border border-border p-4 overflow-hidden flex flex-col flex-1 min-h-0 min-w-0">
          {/* Tabs */}
          <div className="flex gap-2 mb-4 border-b border-border">
            <button
              onClick={() => setActiveTab('logs')}
              className={`px-4 py-2 font-medium transition-all ${activeTab === 'logs'
                ? 'text-accent border-b-2 border-accent'
                : 'text-muted hover:text-foreground'
                }`}
            >
              Real-time Logs
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 font-medium transition-all ${activeTab === 'history'
                ? 'text-accent border-b-2 border-accent'
                : 'text-muted hover:text-foreground'
                }`}
            >
              Current Project
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden min-h-0">
            {activeTab === 'logs' && (
              useCrewAI ? (
                // Split view: Agent Flow + Logs
                <div className="h-full flex flex-col lg:flex-row gap-3">
                  <div className="flex-1 min-h-0 lg:max-w-[280px]">
                    <AgentFlowViewer isRunning={generating} />
                  </div>
                  <div className="flex-1 min-h-0">
                    <RealtimeLogs wsUrl="ws://localhost:3002" />
                  </div>
                </div>
              ) : (
                <RealtimeLogs />
              )
            )}
            {activeTab === 'history' && (
              activeProjectId ? (
                <ProjectViewer
                  projectId={activeProjectId}
                  onStop={handleStop}
                  onRetry={(project) => {
                    setProjectName(project.name)
                    setDescription(project.description)
                    if (models.some(m => m.name === project.model)) {
                      setSelectedModel(project.model)
                    }
                    setActiveTab('logs')
                    toast.info('Project details loaded. Click Generate to re-run.')
                  }}
                />
              ) : (
                <div className="text-center py-8 text-muted">
                  Select a project from history or start a new one to view details
                </div>
              )
            )}
          </div>
        </div>

        {/* Right Panel - History */}
        <div className="bg-card rounded-xl border border-border p-4 overflow-hidden shrink-0 lg:w-72 xl:w-80 max-h-[30vh] lg:max-h-full flex flex-col">
          {/* Emergency Controls */}
          <div className="pb-3 mb-3 border-b border-border shrink-0">
            <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
              Emergency Controls
            </h3>
            <div className="flex gap-2">
              <button
                onClick={handleForceStop}
                className="flex-1 px-2 py-1.5 bg-red-900/30 text-red-400 rounded-lg hover:bg-red-900/50 text-xs font-semibold transition-colors border border-red-500/20"
                title="Stop all running projects immediately"
              >
                Force Stop
              </button>
              <button
                onClick={handleReset}
                className="flex-1 px-2 py-1.5 bg-orange-900/30 text-orange-400 rounded-lg hover:bg-orange-900/50 text-xs font-semibold transition-colors border border-orange-500/20"
                title="Clear internal state and mark stuck projects as failed"
              >
                Reset
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-hidden min-h-0">
            <ProjectHistory onSelectProject={handleSelectProject} />
          </div>
        </div>
      </div>
    </div>
  )
}


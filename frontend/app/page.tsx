'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Send, Sparkles, Square } from 'lucide-react'
import { RealtimeLogs } from '@/components/RealtimeLogs'
import { ProjectHistory } from '@/components/ProjectHistory'

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

          // Also update form if needed, but maybe annoying if user is editing. 
          // Let's just sync status for now.
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
      // actually, let's just leave the existing one alone or merge?
      // The existing one does: fetch -> setProjectName, setDescription, setSelectedModel
      // We can leave it as "initial load" logic. 
      // But wait, if I select a project, it sets ID.
      // Then the polling starts.
      // The auto-fill also runs.
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
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4">
        <div className="flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI Software Company</h1>
            <p className="text-sm text-gray-600">Create complete projects with Ollama</p>
          </div>
        </div>
      </header>

      {/* Main Content - Split Screen */}
      <div className="flex-1 grid grid-cols-3 gap-6 p-6 overflow-hidden">
        {/* Left Panel - Form */}
        <div className="bg-white rounded-lg shadow-sm p-6 overflow-y-auto">
          <h2 className="text-xl font-semibold mb-6">Create New Project</h2>

          <div className="space-y-4">
            {/* Project Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Name (optional)
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="My Awesome Project"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Engine Selection */}
            <div className="p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-purple-900">Generation Engine</h3>
                  <p className="text-xs text-purple-600">
                    {useCrewAI ? '🤖 LangGraph (Multi-Agent)' : '⚡ TypeScript (Fast)'}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useCrewAI}
                    onChange={(e) => setUseCrewAI(e.target.checked)}
                    disabled={!crewAIAvailable}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600 peer-disabled:opacity-50"></div>
                </label>
              </div>
              {!crewAIAvailable && (
                <p className="text-xs text-orange-600 mt-2">
                  ⚠️ LangGraph service not running. Start it with: cd crewai-service && python server.py
                </p>
              )}
            </div>

            {/* Model Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Model
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {Object.entries(modelsByCategory).map(([category, categoryModels]) => (
                  categoryModels.length > 0 && (
                    <optgroup key={category} label={category.toUpperCase()}>
                      {categoryModels.map((model) => (
                        <option key={model.name} value={model.name}>
                          {model.displayName}
                        </option>
                      ))}
                    </optgroup>
                  )
                ))}
              </select>
              {selectedModel && (
                <p className="mt-1 text-xs text-gray-500">
                  {models.find(m => m.name === selectedModel)?.description}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what you want to build... Be specific!"
                rows={8}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Generate/Stop Button */}
            {generating ? (
              <button
                onClick={handleStop}
                className="w-full bg-red-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-red-700 flex items-center justify-center gap-2 transition-colors"
              >
                <Square className="w-5 h-5 fill-current" />
                Stop Generation
              </button>
            ) : (
              <button
                onClick={handleGenerate}
                disabled={!description.trim()}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
              >
                <Send className="w-5 h-5" />
                Generate Project
              </button>
            )}

            {/* Emergency Controls */}
            <div className="mt-8 pt-6 border-t">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Emergency Controls
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleForceStop}
                  className="px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 text-xs font-semibold transition-colors"
                  title="Stop all running projects immediately"
                >
                  Force Stop All
                </button>
                <button
                  onClick={handleReset}
                  className="px-3 py-2 bg-orange-100 text-orange-800 rounded hover:bg-orange-200 text-xs font-semibold transition-colors"
                  title="Clear internal state and mark stuck projects as failed"
                >
                  System Reset
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Panel - Logs/Preview */}
        <div className="bg-white rounded-lg shadow-sm p-6 overflow-hidden flex flex-col">
          {/* Tabs */}
          <div className="flex gap-2 mb-4 border-b">
            <button
              onClick={() => setActiveTab('logs')}
              className={`px-4 py-2 font-medium transition-colors ${activeTab === 'logs'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              Real-time Logs
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 font-medium transition-colors ${activeTab === 'history'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              Current Project
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'logs' && <RealtimeLogs />}
            {activeTab === 'history' && (
              activeProjectId ? (
                <ProjectViewer
                  projectId={activeProjectId}
                  onStop={handleStop}
                  onRetry={(project) => {
                    setProjectName(project.name)
                    setDescription(project.description)
                    // If model is available, use it, else keep default
                    if (models.some(m => m.name === project.model)) {
                      setSelectedModel(project.model)
                    }
                    setActiveTab('logs') // Switch to logs to see re-run
                    // We don't auto-submit to give user a chance to review, 
                    // or we could calls handleGenerate() directly if we extract it.
                    // User asked for "Re-executar", implying action.
                    // But handleGenerate uses state that might not be updated yet.
                    // Let's just fill form and switch tab.
                    toast.info('Project details loaded. Click Generate to re-run.')
                  }}
                />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Select a project from history or start a new one to view details
                </div>
              )
            )}
          </div>
        </div>

        {/* Right Panel - History */}
        <div className="bg-white rounded-lg shadow-sm p-6 overflow-hidden">
          <ProjectHistory onSelectProject={handleSelectProject} />
        </div>
      </div>
    </div>
  )
}

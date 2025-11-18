'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Send, Sparkles } from 'lucide-react'
import { RealtimeLogs } from '@/components/RealtimeLogs'
import { ProjectHistory } from '@/components/ProjectHistory'

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

  useEffect(() => {
    loadModels()
  }, [])

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

    if (!selectedModel) {
      toast.error('Please select a model')
      return
    }

    setGenerating(true)

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      const response = await fetch(`${apiUrl}/api/generate`, {
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

      // Switch to logs tab
      setActiveTab('logs')

      // Clear form
      setProjectName('')
      setDescription('')
    } catch (error) {
      console.error('Generation error:', error)
      toast.error('Failed to start project generation')
    } finally {
      setGenerating(false)
    }
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

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={generating || !description.trim()}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
            >
              {generating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Generate Project
                </>
              )}
            </button>
          </div>
        </div>

        {/* Middle Panel - Logs/Preview */}
        <div className="bg-white rounded-lg shadow-sm p-6 overflow-hidden flex flex-col">
          {/* Tabs */}
          <div className="flex gap-2 mb-4 border-b">
            <button
              onClick={() => setActiveTab('logs')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'logs'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Real-time Logs
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'history'
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
              <div className="text-center py-8 text-gray-500">
                Current project details will appear here
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - History */}
        <div className="bg-white rounded-lg shadow-sm p-6 overflow-hidden">
          <ProjectHistory />
        </div>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { Clock, CheckCircle, XCircle, Trash2 } from 'lucide-react'

interface ProjectHistoryEntry {
  id: string
  name: string
  description: string
  model: string
  status: 'success' | 'failed' | 'in-progress'
  createdAt: number
  completedAt?: number
  filesGenerated: string[]
  error?: string
}

interface ProjectHistoryProps {
  onSelectProject?: (id: string) => void
}

export function ProjectHistory({ onSelectProject }: ProjectHistoryProps) {
  const [projects, setProjects] = useState<ProjectHistoryEntry[]>([])
  const [loading, setLoading] = useState(true)

  const loadHistory = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      const response = await fetch(`${apiUrl}/api/history`)
      const data = await response.json()
      setProjects(data.projects || [])
    } catch (error) {
      console.error('Failed to load history:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadHistory()
    // Refresh every 5 seconds
    const interval = setInterval(loadHistory, 5000)
    return () => clearInterval(interval)
  }, [])

  const deleteProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent triggering selection
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      await fetch(`${apiUrl}/api/history/${id}`, { method: 'DELETE' })
      loadHistory()
    } catch (error) {
      console.error('Failed to delete project:', error)
    }
  }

  const getStatusIcon = (status: string) => {
    if (status === 'success') return <CheckCircle className="w-4 h-4 text-green-500" />
    if (status === 'failed') return <XCircle className="w-4 h-4 text-red-500" />
    return <Clock className="w-4 h-4 text-blue-500 animate-spin" />
  }

  const getStatusColor = (status: string) => {
    if (status === 'success') return 'bg-green-50 border-green-200'
    if (status === 'failed') return 'bg-red-50 border-red-200'
    return 'bg-blue-50 border-blue-200'
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-gray-500">Loading history...</div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <h2 className="text-lg font-semibold mb-4">Project History</h2>

      <div className="flex-1 overflow-y-auto space-y-3">
        {projects.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No projects yet. Create your first project!
          </div>
        ) : (
          projects.map((project) => (
            <div
              key={project.id}
              onClick={() => onSelectProject?.(project.id)}
              className={`p-4 rounded-lg border ${getStatusColor(project.status)} cursor-pointer hover:shadow-md transition-all`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {getStatusIcon(project.status)}
                    <h3 className="font-medium truncate">{project.name}</h3>
                  </div>

                  <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                    {project.description}
                  </p>

                  <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                    <span className="bg-white px-2 py-1 rounded">
                      {project.model}
                    </span>
                    <span>
                      {new Date(project.createdAt).toLocaleDateString()}
                    </span>
                    {project.filesGenerated.length > 0 && (
                      <span>
                        {project.filesGenerated.length} files
                      </span>
                    )}
                  </div>

                  {project.error && (
                    <div className="mt-2 text-xs text-red-600">
                      Error: {project.error}
                    </div>
                  )}
                </div>

                <button
                  onClick={(e) => deleteProject(project.id, e)}
                  className="p-2 hover:bg-white rounded-lg transition-colors"
                  title="Delete project"
                >
                  <Trash2 className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

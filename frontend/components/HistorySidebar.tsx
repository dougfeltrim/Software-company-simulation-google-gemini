'use client'

import { useState, useEffect } from 'react'
import { Clock, RefreshCcw, Trash2, FileCode, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'

interface Project {
    id: string
    name: string
    description: string
    model: string
    status: 'success' | 'failed' | 'in-progress'
    createdAt: number
    filesGenerated: string[]
    error?: string
    logs?: string[]
}

interface HistorySidebarProps {
    onSelectProject: (project: Project) => void
    onResendProject: (project: Project) => void
    refreshTrigger: number // Hack to trigger refresh
}

export function HistorySidebar({ onSelectProject, onResendProject, refreshTrigger }: HistorySidebarProps) {
    const [projects, setProjects] = useState<Project[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchHistory()
    }, [refreshTrigger])

    const fetchHistory = async () => {
        setLoading(true)
        try {
            // Fetch from Node.js backend (port 3001)
            const res = await fetch('http://localhost:3001/api/history')
            const data = await res.json()
            setProjects(data.projects || [])
        } catch (e) {
            console.error('Failed to fetch history', e)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation()
        if (!confirm('Are you sure you want to delete this project?')) return

        try {
            await fetch(`http://localhost:3001/api/history/${id}`, {
                method: 'DELETE'
            })
            fetchHistory() // Refresh list
        } catch (e) {
            console.error('Failed to delete', e)
        }
    }

    const formatDate = (ts: number) => {
        return new Date(ts).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    return (
        <div className="h-full bg-card/10 border-l border-white/10 flex flex-col w-80">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <h2 className="font-semibold flex items-center gap-2">
                    <Clock className="w-4 h-4 text-purple-400" />
                    Project History
                </h2>
                <button
                    onClick={fetchHistory}
                    className="p-1.5 hover:bg-white/5 rounded-md transition-colors"
                >
                    <RefreshCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {projects.length === 0 && !loading && (
                    <div className="text-center text-gray-500 text-sm py-8">
                        No projects found.
                        <br />
                        Start generating to build history!
                    </div>
                )}

                {projects.map(project => (
                    <div
                        key={project.id}
                        className="group bg-black/20 border border-white/5 rounded-lg p-3 hover:bg-white/5 hover:border-purple-500/30 transition-all cursor-pointer relative"
                        onClick={() => onSelectProject(project)}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="font-medium text-sm truncate pr-6" title={project.name}>
                                {project.name}
                            </h3>
                            <div onClick={(e) => handleDelete(e, project.id)} className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity absolute top-2 right-2">
                                <Trash2 className="w-3.5 h-3.5" />
                            </div>
                        </div>

                        <p className="text-xs text-gray-400 line-clamp-2 mb-3">
                            {project.description}
                        </p>

                        <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500 font-mono">
                                {formatDate(project.createdAt)}
                            </span>

                            <div className="flex items-center gap-2">
                                {project.status === 'success' && <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />}
                                {project.status === 'failed' && <XCircle className="w-3.5 h-3.5 text-red-500" />}
                                {project.status === 'in-progress' && <RefreshCcw className="w-3.5 h-3.5 text-blue-500 animate-spin" />}
                            </div>
                        </div>

                        <div className="mt-3 flex items-center gap-2 pt-3 border-t border-white/5">
                            <span className="text-[10px] bg-white/5 px-1.5 py-0.5 rounded text-gray-400 border border-white/5">
                                {project.model}
                            </span>
                            <div className="flex-1" />
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onResendProject(project)
                                }}
                                className="text-[10px] bg-purple-500/10 text-purple-400 px-2 py-1 rounded border border-purple-500/20 hover:bg-purple-500/20 transition-colors"
                            >
                                Resend
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

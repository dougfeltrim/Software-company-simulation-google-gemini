'use client'

import { useState, useEffect } from 'react'
import { File, Folder, ChevronRight, ChevronDown, Download, RotateCw, Square } from 'lucide-react'

interface ProjectViewerProps {
    projectId: string
    onRetry?: (project: ProjectDetails) => void
    onStop?: () => void
}

interface ProjectDetails {
    id: string
    name: string
    description: string
    status: 'success' | 'failed' | 'in-progress'
    filesGenerated: string[]
    model: string
}

export function ProjectViewer({ projectId, onRetry, onStop }: ProjectViewerProps) {
    const [project, setProject] = useState<ProjectDetails | null>(null)
    const [selectedFile, setSelectedFile] = useState<string | null>(null)
    const [fileContent, setFileContent] = useState<string>('')
    const [loadingFile, setLoadingFile] = useState(false)

    useEffect(() => {
        loadProject()
    }, [projectId])

    const loadProject = async () => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
            const response = await fetch(`${apiUrl}/api/history/${projectId}`)
            const data = await response.json()
            setProject(data.project)

            // Select first file by default if available
            if (data.project.filesGenerated.length > 0) {
                selectFile(data.project.filesGenerated[0])
            }
        } catch (error) {
            console.error('Failed to load project:', error)
        }
    }

    const selectFile = async (filePath: string) => {
        setSelectedFile(filePath)
        setLoadingFile(true)
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
            const response = await fetch(`${apiUrl}/api/history/${projectId}/file?path=${encodeURIComponent(filePath)}`)
            const data = await response.json()
            setFileContent(data.content)
        } catch (error) {
            console.error('Failed to load file content:', error)
            setFileContent('Error loading file content')
        } finally {
            setLoadingFile(false)
        }
    }

    if (!project) {
        return <div className="p-4 text-center text-muted">Loading project...</div>
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'success': return 'bg-green-900/40 text-green-300 border-green-500/30'
            case 'failed': return 'bg-red-900/40 text-red-300 border-red-500/30'
            case 'in-progress': return 'bg-blue-900/40 text-blue-300 border-blue-500/30'
            default: return 'bg-gray-800 text-gray-300 border-gray-600'
        }
    }

    return (
        <div className="h-full flex flex-col border border-border rounded-xl overflow-hidden bg-card">
            {/* Project Header */}
            <div className="p-4 border-b border-border bg-background flex justify-between items-start">
                <div>
                    <h2 className="text-xl font-bold text-foreground leading-tight">{project.name}</h2>
                    <p className="text-muted text-sm mt-1 line-clamp-2">{project.description}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-4">
                    {onStop && project.status === 'in-progress' && (
                        <button
                            onClick={onStop}
                            className="px-3 py-1.5 text-sm font-medium text-red-400 hover:bg-red-900/30 border border-red-500/30 rounded-lg transition-colors flex items-center gap-1.5 bg-transparent"
                            title="Stop currently running generation"
                        >
                            <Square className="w-4 h-4 fill-current" />
                            Stop
                        </button>
                    )}
                    {onRetry && project.status !== 'in-progress' && (
                        <button
                            onClick={() => onRetry(project)}
                            className="px-3 py-1.5 text-sm font-medium text-accent hover:bg-accent/10 border border-accent/30 rounded-lg transition-colors flex items-center gap-1.5 bg-transparent"
                            title="Re-run this project with the same settings"
                        >
                            <RotateCw className="w-4 h-4" />
                            Re-run
                        </button>
                    )}
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium uppercase tracking-wide border ${getStatusColor(project.status)}`}>
                        {project.status}
                    </span>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 flex flex-col md:flex-row min-h-0">
                {/* File List Sidebar */}
                <div className="w-full md:w-64 bg-background border-r border-border overflow-y-auto">
                    <div className="p-3 font-medium border-b border-border text-sm text-muted bg-card">
                        Files
                    </div>
                    <div className="p-2 space-y-1">
                        {project.filesGenerated.map((file) => (
                            <button
                                key={file}
                                onClick={() => selectFile(file)}
                                className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors ${selectedFile === file
                                    ? 'bg-accent/20 text-accent font-medium'
                                    : 'hover:bg-card-hover text-muted'
                                    }`}
                            >
                                <File className="w-4 h-4 flex-shrink-0" />
                                <span className="truncate">{file}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Code Viewer */}
                <div className="flex-1 flex flex-col min-h-0 bg-background">
                    {selectedFile ? (
                        <>
                            <div className="p-3 border-b border-border flex items-center justify-between bg-card shrink-0">
                                <span className="font-mono text-sm font-medium text-muted">
                                    {selectedFile}
                                </span>
                            </div>
                            <div className="flex-1 overflow-auto bg-gray-950 text-gray-100 p-4 font-mono text-sm whitespace-pre">
                                {loadingFile ? (
                                    <div className="text-muted">Loading content...</div>
                                ) : (
                                    fileContent
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-muted bg-background">
                            Select a file to view content
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}


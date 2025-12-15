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
        return <div className="p-4 text-center text-gray-500">Loading project...</div>
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'success': return 'bg-green-100 text-green-800'
            case 'failed': return 'bg-red-100 text-red-800'
            case 'in-progress': return 'bg-blue-100 text-blue-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    return (
        <div className="h-full flex flex-col border rounded-lg overflow-hidden bg-white">
            {/* Project Header */}
            <div className="p-4 border-b bg-gray-50 flex justify-between items-start">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 leading-tight">{project.name}</h2>
                    <p className="text-gray-500 text-sm mt-1 line-clamp-2">{project.description}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-4">
                    {onStop && project.status === 'in-progress' && (
                        <button
                            onClick={onStop}
                            className="px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition-colors flex items-center gap-1.5 bg-white"
                            title="Stop currently running generation"
                        >
                            <Square className="w-4 h-4 fill-current" />
                            Stop
                        </button>
                    )}
                    {onRetry && project.status === 'failed' && (
                        <button
                            onClick={() => onRetry(project)}
                            className="px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition-colors flex items-center gap-1.5 bg-white"
                            title="Retry failed project"
                        >
                            <RotateCw className="w-4 h-4" />
                            Retry Failed Task
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
                <div className="w-full md:w-64 bg-gray-50 border-r overflow-y-auto">
                    <div className="p-3 font-medium border-b text-sm text-gray-700 bg-white">
                        Files
                    </div>
                    <div className="p-2 space-y-1">
                        {project.filesGenerated.map((file) => (
                            <button
                                key={file}
                                onClick={() => selectFile(file)}
                                className={`w-full text-left px-3 py-2 rounded text-sm flex items-center gap-2 transition-colors ${selectedFile === file
                                    ? 'bg-blue-100 text-blue-700 font-medium'
                                    : 'hover:bg-gray-100 text-gray-700'
                                    }`}
                            >
                                <File className="w-4 h-4 flex-shrink-0" />
                                <span className="truncate">{file}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Code Viewer */}
                <div className="flex-1 flex flex-col min-h-0 bg-white">
                    {selectedFile ? (
                        <>
                            <div className="p-3 border-b flex items-center justify-between bg-white shrink-0">
                                <span className="font-mono text-sm font-medium text-gray-700">
                                    {selectedFile}
                                </span>
                            </div>
                            <div className="flex-1 overflow-auto bg-gray-900 text-gray-100 p-4 font-mono text-sm whitespace-pre">
                                {loadingFile ? (
                                    <div className="text-gray-400">Loading content...</div>
                                ) : (
                                    fileContent
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-gray-400 bg-gray-50/50">
                            Select a file to view content
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

'use client'

import { useState, useEffect } from 'react'
import { Folder, FileCode, ChevronRight, Loader2, AlertCircle } from 'lucide-react'

interface Project {
    id: string
    name: string
    description: string
    filesGenerated: string[]
}

interface ProjectViewerProps {
    project: Project
}

export function ProjectViewer({ project }: ProjectViewerProps) {
    const [selectedFile, setSelectedFile] = useState<string | null>(null)
    const [fileContent, setFileContent] = useState<string>('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Select first file by default or README if available
    useEffect(() => {
        if (project.filesGenerated.length > 0 && !selectedFile) {
            const readme = project.filesGenerated.find(f => f.toLowerCase().includes('readme'))
            handleFileSelect(readme || project.filesGenerated[0])
        }
    }, [project])

    const handleFileSelect = async (filePath: string) => {
        setSelectedFile(filePath)
        setLoading(true)
        setError(null)
        try {
            const res = await fetch(`http://localhost:3001/api/history/${project.id}/file?path=${encodeURIComponent(filePath)}`)
            if (!res.ok) throw new Error('Failed to fetch file content')
            const data = await res.json()
            setFileContent(data.content)
        } catch (e) {
            setError('Could not load file content')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="h-full flex bg-background border border-border rounded-xl osverflow-hidden shadow-2xl">
            {/* File Explorer */}
            <div className="w-1/3 border-r border-border bg-card/20 flex flex-col min-w-[200px]">
                <div className="p-3 border-b border-white/10 text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Folder className="w-4 h-4 text-purple-400" />
                    Project Files
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {project.filesGenerated.length === 0 && (
                        <div className="text-center text-xs text-muted-foreground py-10">
                            No files found.
                        </div>
                    )}
                    {project.filesGenerated.map(file => (
                        <button
                            key={file}
                            onClick={() => handleFileSelect(file)}
                            className={`w-full text-left px-3 py-2 rounded text-xs truncate flex items-center gap-2 transition-colors ${selectedFile === file
                                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/20'
                                    : 'hover:bg-white/5 text-gray-400'
                                }`}
                        >
                            <FileCode className="w-3.5 h-3.5 opacity-70" />
                            {file}
                        </button>
                    ))}
                </div>
            </div>

            {/* Editor / Viewer */}
            <div className="flex-1 flex flex-col bg-[#1e1e1e] min-w-0">
                {selectedFile ? (
                    <>
                        <div className="h-9 border-b border-black/40 flex items-center px-4 bg-[#252526] text-xs text-gray-400 select-none">
                            <span className="opacity-50 mr-2">PREVIEW:</span>
                            {selectedFile}
                        </div>
                        <div className="flex-1 overflow-auto p-4 font-mono text-sm leading-relaxed text-gray-300">
                            {loading ? (
                                <div className="flex items-center justify-center h-full text-gray-500 gap-2">
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Loading...
                                </div>
                            ) : error ? (
                                <div className="flex items-center justify-center h-full text-red-400 gap-2">
                                    <AlertCircle className="w-5 h-5" />
                                    {error}
                                </div>
                            ) : (
                                <pre className="whitespace-pre-wrap decoration-rose-950">{fileContent}</pre>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-600">
                        Select a file to view content
                    </div>
                )}
            </div>
        </div>
    )
}

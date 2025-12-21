'use client'

import { useEffect, useRef, useState } from 'react'
import { Code, FileCode } from 'lucide-react'

interface CodeChunk {
    file: string
    content: string
    timestamp: number
}

interface LiveCodePanelProps {
    codeChunks: CodeChunk[]
    currentFile?: string
}

export function LiveCodePanel({ codeChunks, currentFile }: LiveCodePanelProps) {
    const bottomRef = useRef<HTMLDivElement>(null)
    const [displayedContent, setDisplayedContent] = useState('')

    // Get the latest code for the current file
    const latestChunks = codeChunks.filter(c => c.file === currentFile)
    const latestContent = latestChunks.length > 0
        ? latestChunks[latestChunks.length - 1].content
        : ''

    // Simulate typing effect
    useEffect(() => {
        if (latestContent !== displayedContent) {
            setDisplayedContent(latestContent)
        }
    }, [latestContent])

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [displayedContent])

    // Get unique files for tabs
    const uniqueFiles = [...new Set(codeChunks.map(c => c.file))]

    return (
        <div className="h-full flex flex-col bg-[#1e1e1e] rounded-xl overflow-hidden border border-white/10">
            {/* Header */}
            <div className="shrink-0 h-10 bg-[#252526] border-b border-black/40 flex items-center px-4 gap-3">
                <Code className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-medium text-gray-300">Live Code Generation</span>
                <div className="flex-1" />
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            </div>

            {/* File Tabs */}
            {uniqueFiles.length > 0 && (
                <div className="shrink-0 h-8 bg-[#2d2d2d] border-b border-black/30 flex items-center gap-1 px-2 overflow-x-auto">
                    {uniqueFiles.slice(-5).map((file, i) => (
                        <div
                            key={i}
                            className={`px-3 py-1 text-[10px] rounded flex items-center gap-1.5 ${file === currentFile
                                    ? 'bg-[#1e1e1e] text-white'
                                    : 'text-gray-500 hover:text-gray-300'
                                }`}
                        >
                            <FileCode className="w-3 h-3" />
                            {file.split('/').pop()}
                        </div>
                    ))}
                </div>
            )}

            {/* Code Content */}
            <div className="flex-1 overflow-auto p-4 font-mono text-sm">
                {!currentFile && codeChunks.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-gray-600 text-sm">
                        <div className="text-center">
                            <Code className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p>Waiting for code generation...</p>
                        </div>
                    </div>
                ) : (
                    <div className="relative">
                        {/* Line numbers */}
                        <div className="absolute left-0 top-0 text-gray-600 select-none pr-4 text-right" style={{ width: '3rem' }}>
                            {displayedContent.split('\n').map((_, i) => (
                                <div key={i} className="leading-6">{i + 1}</div>
                            ))}
                        </div>

                        {/* Code */}
                        <pre
                            className="pl-14 text-gray-300 leading-6 whitespace-pre-wrap break-words"
                            style={{ tabSize: 2 }}
                        >
                            {displayedContent}
                            <span className="inline-block w-2 h-4 bg-purple-500 animate-pulse ml-1">_</span>
                        </pre>
                        <div ref={bottomRef} />
                    </div>
                )}
            </div>
        </div>
    )
}

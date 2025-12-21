'use client'

import { useEffect, useRef } from 'react'
import { Terminal, Play, AlertCircle } from 'lucide-react'

interface TerminalLine {
    output: string
    isError: boolean
    timestamp: number
}

interface TerminalPanelProps {
    lines: TerminalLine[]
    isRunning?: boolean
}

export function TerminalPanel({ lines, isRunning }: TerminalPanelProps) {
    const bottomRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [lines])

    return (
        <div className="h-full flex flex-col bg-[#0d0d0d] rounded-xl overflow-hidden border border-white/10">
            {/* Header */}
            <div className="shrink-0 h-10 bg-[#1a1a1a] border-b border-white/5 flex items-center px-4 gap-3">
                <Terminal className="w-4 h-4 text-green-400" />
                <span className="text-xs font-medium text-gray-300">Test Execution Terminal</span>
                <div className="flex-1" />
                {isRunning && (
                    <div className="flex items-center gap-2 text-[10px] text-green-400">
                        <Play className="w-3 h-3 fill-current" />
                        Running
                    </div>
                )}
            </div>

            {/* Terminal Content */}
            <div className="flex-1 overflow-auto p-4 font-mono text-xs">
                {lines.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-gray-600">
                        <div className="text-center">
                            <Terminal className="w-10 h-10 mx-auto mb-3 opacity-30" />
                            <p>Terminal output will appear here</p>
                            <p className="text-[10px] mt-1 opacity-50">QA Agent will test generated code</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {lines.map((line, i) => (
                            <div
                                key={i}
                                className={`flex items-start gap-2 animate-in fade-in slide-in-from-left-2 duration-200 ${line.isError ? 'text-red-400' : 'text-green-400'
                                    }`}
                            >
                                <span className="opacity-50 shrink-0">
                                    {line.isError ? (
                                        <AlertCircle className="w-3 h-3 mt-0.5" />
                                    ) : (
                                        <span className="text-gray-600">$</span>
                                    )}
                                </span>
                                <span className="break-all whitespace-pre-wrap">{line.output}</span>
                            </div>
                        ))}

                        {/* Cursor */}
                        {isRunning && (
                            <div className="flex items-center gap-2 text-green-400">
                                <span className="text-gray-600">$</span>
                                <span className="w-2 h-4 bg-green-500 animate-pulse" />
                            </div>
                        )}

                        <div ref={bottomRef} />
                    </div>
                )}
            </div>

            {/* Status Bar */}
            <div className="shrink-0 h-6 bg-[#1a1a1a] border-t border-white/5 flex items-center px-4 text-[10px] text-gray-500">
                <span>QA Testing Environment</span>
                <div className="flex-1" />
                <span>{lines.length} lines</span>
            </div>
        </div>
    )
}

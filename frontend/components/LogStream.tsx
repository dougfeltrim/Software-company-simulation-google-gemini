'use client'

import { useEffect, useRef } from 'react'
import { MessageSquare } from 'lucide-react'

interface LogMessage {
    id: number
    agentType?: string
    message: string
    timestamp: string
}

interface LogStreamProps {
    logs: LogMessage[]
}

export function LogStream({ logs }: LogStreamProps) {
    const bottomRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [logs])

    const getAgentColor = (msg: string) => {
        if (msg.includes('Product Manager')) return 'text-purple-400'
        if (msg.includes('Architect')) return 'text-blue-400'
        if (msg.includes('UX/UI')) return 'text-pink-400'
        if (msg.includes('Frontend')) return 'text-cyan-400'
        if (msg.includes('Backend')) return 'text-indigo-400'
        if (msg.includes('QA')) return 'text-orange-400'
        if (msg.includes('DevOps')) return 'text-red-400'
        return 'text-gray-400'
    }

    return (
        <div className="h-full flex flex-col bg-background border border-border rounded-xl overflow-hidden">
            <div className="p-3 border-b border-border bg-card shrink-0 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-purple-400" />
                <h2 className="font-semibold text-foreground text-sm">Team Communication</h2>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-xs">
                {logs.length === 0 && (
                    <div className="text-muted text-center italic mt-10">
                        No communication yet...
                    </div>
                )}

                {logs.map((log) => (
                    <div key={log.id} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="flex items-baseline justify-between mb-1 opacity-50">
                            <span className="text-[10px]">{log.timestamp}</span>
                        </div>
                        <div className={`p-2 rounded border border-border/50 bg-card/30 break-words whitespace-pre-wrap ${getAgentColor(log.message)}`}>
                            {log.message}
                        </div>
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>
        </div>
    )
}

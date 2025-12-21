'use client'

import { Terminal, FileCode, Activity } from 'lucide-react'

interface LiveWorkspaceProps {
    activeAgent?: {
        name: string
        role: string
        status: string
        task?: string
        file?: string
    }
    latestLog?: string | null
}

export function LiveWorkspace({ activeAgent, latestLog }: LiveWorkspaceProps) {
    if (!activeAgent || activeAgent.status === 'idle') {
        return (
            <div className="h-full flex flex-col items-center justify-center text-muted border border-border rounded-xl bg-card/20 border-dashed">
                <Activity className="w-12 h-12 mb-4 opacity-50" />
                <h3 className="text-lg font-medium">Workspace Idle</h3>
                <p className="text-sm">Waiting for active tasks...</p>
            </div>
        )
    }

    return (
        <div className="h-full flex flex-col bg-background border border-border rounded-xl overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="p-4 border-b border-border bg-card/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Terminal className="w-5 h-5 text-accent" />
                    <div>
                        <h2 className="font-semibold text-foreground">Live Workspace</h2>
                        <div className="flex items-center gap-2 text-xs text-muted">
                            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                            {activeAgent.role} is working...
                        </div>
                    </div>
                </div>
                <div className="px-3 py-1 bg-accent/10 border border-accent/20 rounded-full text-xs text-accent">
                    {activeAgent.status}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 p-6 font-mono text-sm overflow-hidden flex flex-col">
                <div className="mb-6 space-y-2">
                    <label className="text-xs font-bold text-muted uppercase tracking-wider">Current Activity</label>
                    <div className="text-xl text-foreground font-light">
                        {activeAgent.task || 'Processing...'}
                    </div>
                </div>

                {activeAgent.file && (
                    <div className="flex-1 flex flex-col min-h-0">
                        <label className="text-xs font-bold text-muted uppercase tracking-wider mb-2 flex items-center gap-2">
                            <FileCode className="w-4 h-4" />
                            Target File
                        </label>
                        <div className="border border-border rounded-lg bg-[#0d0d0d] flex-1 p-4 overflow-hidden relative group">
                            <div className="absolute top-0 left-0 right-0 h-8 bg-[#1e1e1e] border-b border-border flex items-center px-4 text-xs text-gray-400">
                                {activeAgent.file}
                            </div>
                            <div className="mt-8 text-gray-400 animate-pulse">
                                {/* Simulated cursor/typing effect */}
                                Generating content for {activeAgent.file}...
                                <br />
                                {latestLog && (
                                    <span className="text-purple-400 text-xs block mt-2 opacity-80 break-words whitespace-pre-wrap">
                                        &gt; {latestLog}
                                    </span>
                                )}
                                <span className="inline-block w-2 H-4 bg-accent animate-blink mt-1">_</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

'use client'

import { useEffect, useState } from 'react'
import { Brain, FileCode, FolderTree, CheckCircle2, Loader2, Clock, Zap } from 'lucide-react'

interface AgentNode {
    id: string
    name: string
    role: string
    icon: 'brain' | 'folder' | 'code' | 'check'
    status: 'idle' | 'active' | 'waiting' | 'completed'
    progress?: number
    metrics?: {
        duration?: number
        tokens?: number
        files?: number
    }
}

interface AgentFlowViewerProps {
    isRunning: boolean
}

const initialNodes: AgentNode[] = [
    { id: 'analyze', name: 'Análise', role: 'Product Manager', icon: 'brain', status: 'idle' },
    { id: 'plan', name: 'Planejamento', role: 'Product Manager', icon: 'folder', status: 'idle' },
    { id: 'generate', name: 'Geração', role: 'Developer', icon: 'code', status: 'idle' },
    { id: 'finalize', name: 'Finalização', role: 'Sistema', icon: 'check', status: 'idle' },
]

export function AgentFlowViewer({ isRunning }: AgentFlowViewerProps) {
    const [nodes, setNodes] = useState<AgentNode[]>(initialNodes)
    const [metrics, setMetrics] = useState({
        totalTime: 0,
        filesGenerated: 0,
        currentStep: 0,
        totalSteps: 4,
    })
    const [connected, setConnected] = useState(false)

    useEffect(() => {
        // Connect to LangGraph WebSocket
        const ws = new WebSocket('ws://localhost:3002/ws')

        ws.onopen = () => {
            setConnected(true)
            console.log('Connected to LangGraph service')
        }

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data)

                if (data.type === 'agent_update') {
                    updateAgentState(data.agent, data.status, data.metrics)
                } else if (data.type === 'log') {
                    // Parse log messages to update agent states
                    parseLogMessage(data.message)
                }
            } catch (e) {
                console.error('Parse error:', e)
            }
        }

        ws.onerror = () => setConnected(false)
        ws.onclose = () => setConnected(false)

        return () => ws.close()
    }, [])

    // Reset when generation starts
    useEffect(() => {
        if (isRunning) {
            setNodes(initialNodes.map(n => ({ ...n, status: 'waiting' })))
            setMetrics({ totalTime: 0, filesGenerated: 0, currentStep: 0, totalSteps: 4 })
        }
    }, [isRunning])

    const parseLogMessage = (message: string) => {
        if (message.includes('Product Manager: Analyzing')) {
            updateAgentState('analyze', 'active')
        } else if (message.includes('Requirements analyzed')) {
            updateAgentState('analyze', 'completed')
            updateAgentState('plan', 'active')
        } else if (message.includes('Planning file structure') || message.includes('Planned')) {
            if (message.includes('Planned')) {
                updateAgentState('plan', 'completed')
                updateAgentState('generate', 'active')
                const match = message.match(/(\d+) files/)
                if (match) {
                    setMetrics(m => ({ ...m, totalSteps: parseInt(match[1]) + 2 }))
                }
            }
        } else if (message.includes('Developer: Generating')) {
            updateAgentState('generate', 'active')
        } else if (message.includes('Generated')) {
            setMetrics(m => ({ ...m, filesGenerated: m.filesGenerated + 1 }))
        } else if (message.includes('completed') || message.includes('complete')) {
            updateAgentState('generate', 'completed')
            updateAgentState('finalize', 'completed')
        }
    }

    const updateAgentState = (agentId: string, status: AgentNode['status'], agentMetrics?: AgentNode['metrics']) => {
        setNodes(prev => prev.map(node => {
            if (node.id === agentId) {
                return { ...node, status, metrics: agentMetrics || node.metrics }
            }
            // If this agent is becoming active, set previous ones to completed
            if (status === 'active') {
                const currentIndex = prev.findIndex(n => n.id === agentId)
                const nodeIndex = prev.findIndex(n => n.id === node.id)
                if (nodeIndex < currentIndex && node.status !== 'completed') {
                    return { ...node, status: 'completed' }
                }
            }
            return node
        }))

        if (status === 'active' || status === 'completed') {
            const stepIndex = initialNodes.findIndex(n => n.id === agentId)
            setMetrics(m => ({ ...m, currentStep: stepIndex + (status === 'completed' ? 1 : 0) }))
        }
    }

    const getIcon = (icon: AgentNode['icon'], status: AgentNode['status']) => {
        const baseClass = 'w-6 h-6'
        const colorClass = status === 'active'
            ? 'text-accent animate-pulse'
            : status === 'completed'
                ? 'text-green-400'
                : 'text-muted'

        switch (icon) {
            case 'brain': return <Brain className={`${baseClass} ${colorClass}`} />
            case 'folder': return <FolderTree className={`${baseClass} ${colorClass}`} />
            case 'code': return <FileCode className={`${baseClass} ${colorClass}`} />
            case 'check': return <CheckCircle2 className={`${baseClass} ${colorClass}`} />
        }
    }

    const getStatusBadge = (status: AgentNode['status']) => {
        switch (status) {
            case 'active':
                return (
                    <span className="flex items-center gap-1 text-xs text-accent bg-accent/20 px-2 py-0.5 rounded-full">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Ativo
                    </span>
                )
            case 'completed':
                return (
                    <span className="flex items-center gap-1 text-xs text-green-400 bg-green-400/20 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" />
                        Concluído
                    </span>
                )
            case 'waiting':
                return (
                    <span className="flex items-center gap-1 text-xs text-muted bg-muted/20 px-2 py-0.5 rounded-full">
                        <Clock className="w-3 h-3" />
                        Aguardando
                    </span>
                )
            default:
                return (
                    <span className="text-xs text-muted/50 px-2 py-0.5">
                        Inativo
                    </span>
                )
        }
    }

    const progress = (metrics.currentStep / metrics.totalSteps) * 100

    return (
        <div className="h-full flex flex-col bg-background border border-border rounded-xl overflow-hidden">
            {/* Header */}
            <div className="p-3 border-b border-border bg-card shrink-0">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <Zap className="w-5 h-5 text-purple-400" />
                        <h2 className="font-semibold text-foreground text-sm">LangGraph Agents</h2>
                        <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
                    </div>
                    <span className="text-xs text-muted">{Math.round(progress)}%</span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
                    <div
                        className="bg-gradient-to-r from-purple-500 to-accent h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Agent Flow */}
            <div className="flex-1 p-4 overflow-y-auto">
                <div className="space-y-3">
                    {nodes.map((node, index) => (
                        <div key={node.id} className="relative">
                            {/* Connection Line */}
                            {index > 0 && (
                                <div className="absolute left-5 -top-3 w-0.5 h-3 bg-border" />
                            )}

                            {/* Agent Card */}
                            <div
                                className={`p-3 rounded-xl border transition-all ${node.status === 'active'
                                        ? 'border-accent bg-accent/5 shadow-lg shadow-accent/10'
                                        : node.status === 'completed'
                                            ? 'border-green-500/30 bg-green-500/5'
                                            : 'border-border bg-card/50'
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    {/* Icon */}
                                    <div className={`p-2 rounded-lg ${node.status === 'active'
                                            ? 'bg-accent/20'
                                            : node.status === 'completed'
                                                ? 'bg-green-500/20'
                                                : 'bg-muted/10'
                                        }`}>
                                        {getIcon(node.icon, node.status)}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <h3 className="font-medium text-foreground text-sm">{node.name}</h3>
                                            {getStatusBadge(node.status)}
                                        </div>
                                        <p className="text-xs text-muted mt-0.5">{node.role}</p>
                                    </div>
                                </div>

                                {/* Metrics for completed nodes */}
                                {node.status === 'completed' && node.id === 'generate' && metrics.filesGenerated > 0 && (
                                    <div className="mt-2 pt-2 border-t border-border/50 flex gap-4 text-xs text-muted">
                                        <span>📄 {metrics.filesGenerated} arquivos</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer Metrics */}
            <div className="p-3 border-t border-border bg-card shrink-0">
                <div className="flex justify-between text-xs">
                    <span className="text-muted">
                        Etapa {metrics.currentStep}/{metrics.totalSteps}
                    </span>
                    <span className="text-muted">
                        {metrics.filesGenerated > 0 && `${metrics.filesGenerated} arquivos gerados`}
                    </span>
                </div>
            </div>
        </div>
    )
}

'use client'

import { useEffect, useState } from 'react'
import { Brain, FileCode, FolderTree, CheckCircle2, Loader2, Clock, Zap, Palette, Server, BookOpen, Layers, FlaskConical, Bug } from 'lucide-react'

interface AgentNode {
    id: string
    name: string
    role: string
    department: 'Strategy' | 'Design' | 'Engineering' | 'Quality' | 'Documentation'
    icon: 'brain' | 'folder' | 'code' | 'check' | 'palette' | 'server' | 'book' | 'flask' | 'bug'
    status: 'idle' | 'active' | 'waiting' | 'completed'
    metrics?: {
        files?: number
    }
}

interface AgentFlowViewerProps {
    isRunning: boolean
    connected?: boolean
    latestUpdate?: {
        agent: string
        status: string
        metrics?: any
    } | null
    latestLog?: string | null
}

const initialNodes: AgentNode[] = [
    { id: 'analyze', name: 'Product Manager', role: 'Requirements', department: 'Strategy', icon: 'brain', status: 'idle' },
    { id: 'plan', name: 'Architect', role: 'System Design', department: 'Engineering', icon: 'folder', status: 'idle' },
    { id: 'tech_lead', name: 'Tech Lead', role: 'Task Breakdown', department: 'Engineering', icon: 'code', status: 'idle' },
    { id: 'frontend_dev', name: 'Developer', role: 'Code Generation', department: 'Engineering', icon: 'code', status: 'idle' },
    { id: 'qa_engineer', name: 'QA Engineer', role: 'Testing & Fixes', department: 'Quality', icon: 'flask', status: 'idle' },
]

export function AgentFlowViewer({ isRunning, connected = false, latestUpdate, latestLog }: AgentFlowViewerProps) {
    const [nodes, setNodes] = useState<AgentNode[]>(initialNodes)
    const [activeDepartment, setActiveDepartment] = useState<string | null>(null)

    // Handle updates from props
    useEffect(() => {
        if (latestUpdate) {
            updateAgentState(latestUpdate.agent, latestUpdate.status as any)
        }
    }, [latestUpdate])

    useEffect(() => {
        if (latestLog) {
            parseLogMessage(latestLog)
        }
    }, [latestLog])

    useEffect(() => {
        if (isRunning) {
            setNodes(initialNodes.map(n => ({ ...n, status: 'waiting' })))
            updateAgentState('analyze', 'active')
        } else {
            setNodes(prev => prev.map(n =>
                (n.status === 'active' || n.status === 'waiting') ? { ...n, status: 'idle' } : n
            ))
            setActiveDepartment(null)
        }
    }, [isRunning])

    const parseLogMessage = (message: string) => {
        // Parse log messages to update agent states
        if (message.includes('Product Manager')) updateAgentState('analyze', 'active')
        if (message.includes('Architect')) updateAgentState('plan', 'active')
        if (message.includes('Tech Lead')) updateAgentState('tech_lead', 'active')
        if (message.includes('Developer:')) updateAgentState('frontend_dev', 'active')
        if (message.includes('QA Engineer')) updateAgentState('qa_engineer', 'active')

        // Completion checks
        if (message.includes('Requirements defined')) updateAgentState('analyze', 'completed')
        if (message.includes('Architecture design complete')) updateAgentState('plan', 'completed')
        if (message.includes('Tech Lead: Planned')) updateAgentState('tech_lead', 'completed')
        if (message.includes('Developer: Completed') || message.includes('frontend_dev') && message.includes('completed')) {
            updateAgentState('frontend_dev', 'completed')
        }
        if (message.includes('QA Engineer: Validation phase complete') || message.includes('qa_engineer') && message.includes('completed')) {
            updateAgentState('qa_engineer', 'completed')
        }
    }

    const updateAgentState = (agentId: string, status: AgentNode['status']) => {
        setNodes(prev => {
            const newNodes = prev.map(node => node.id === agentId ? { ...node, status } : node)

            // Determine active department
            const activeNode = newNodes.find(n => n.status === 'active')
            if (activeNode) setActiveDepartment(activeNode.department)

            return newNodes
        })
    }

    const departments = ['Strategy', 'Engineering', 'Quality']

    const getIconComponent = (icon: string) => {
        switch (icon) {
            case 'code': return <FileCode size={16} />
            case 'brain': return <Brain size={16} />
            case 'palette': return <Palette size={16} />
            case 'server': return <Server size={16} />
            case 'check': return <CheckCircle2 size={16} />
            case 'book': return <BookOpen size={16} />
            case 'flask': return <FlaskConical size={16} />
            case 'bug': return <Bug size={16} />
            default: return <FolderTree size={16} />
        }
    }

    return (
        <div className="h-full flex flex-col bg-background border border-border rounded-xl overflow-hidden">
            <div className="p-3 border-b border-border bg-card flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-purple-400" />
                    <h2 className="font-semibold text-foreground text-sm">Team</h2>
                </div>
                <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
            </div>

            <div className="flex-1 p-3 overflow-y-auto space-y-4">
                {departments.map(dept => {
                    const deptNodes = nodes.filter(n => n.department === dept)
                    const isActive = activeDepartment === dept

                    return (
                        <div key={dept} className={`rounded-xl border p-2 transition-all ${isActive ? 'border-accent bg-accent/5' : 'border-border/50 bg-card/20'}`}>
                            <h3 className={`text-[10px] font-bold uppercase mb-2 ${isActive ? 'text-accent' : 'text-muted'}`}>
                                {dept}
                            </h3>
                            <div className="space-y-1">
                                {deptNodes.map(node => (
                                    <div key={node.id} className={`flex items-center gap-2 p-1.5 rounded-lg transition-all ${node.status === 'active' ? 'bg-background shadow-sm border border-accent/20' :
                                        node.status === 'completed' ? 'opacity-60' : 'opacity-40'
                                        }`}>
                                        <div className={`p-1 rounded-md ${node.status === 'active'
                                                ? node.id === 'qa_engineer'
                                                    ? 'bg-orange-500/20 text-orange-400'
                                                    : 'bg-accent/20 text-accent'
                                                : 'bg-muted/20 text-muted'
                                            }`}>
                                            {getIconComponent(node.icon)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-xs font-medium truncate">{node.name}</div>
                                            <div className="text-[9px] text-muted-foreground truncate">{node.role}</div>
                                        </div>
                                        {node.status === 'active' && <Loader2 className="w-3 h-3 shrink-0 animate-spin text-accent" />}
                                        {node.status === 'completed' && <CheckCircle2 className="w-3 h-3 shrink-0 text-green-500" />}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

'use client'

import { useState, useEffect } from 'react'
import { AgentFlowViewer } from '@/components/AgentFlowViewer'
import { LiveWorkspace } from '@/components/LiveWorkspace'
import { LogStream } from '@/components/LogStream'
import { ChatInterface } from '@/components/ChatInterface'
import { BrowserControl } from '@/components/BrowserControl'
import { HistorySidebar } from '@/components/HistorySidebar'
import { ProjectViewer } from '@/components/ProjectViewer'
import { LiveCodePanel } from '@/components/LiveCodePanel'
import { TerminalPanel } from '@/components/TerminalPanel'
import { AIThoughtsOverlay } from '@/components/AIThoughtsOverlay'
import { Zap, Play, Loader2, Bot, LayoutDashboard, History, RotateCcw, MonitorPlay, Power, Square, X, Code, Terminal } from 'lucide-react'
import { Toaster, toast } from 'sonner'

interface LogMessage {
  id: number
  agentType?: string
  message: string
  timestamp: string
}

interface Model {
  name: string
  displayName?: string
}

interface CodeChunk {
  file: string
  content: string
  timestamp: number
}

interface TerminalLine {
  output: string
  isError: boolean
  timestamp: number
}

export default function Home() {
  // State
  const [prompt, setPrompt] = useState('')
  const [projectName, setProjectName] = useState('')
  const [selectedModel, setSelectedModel] = useState('llama3.1')
  const [availableModels, setAvailableModels] = useState<Model[]>([])

  const [isRunning, setIsRunning] = useState(false)
  const [connected, setConnected] = useState(false)
  const [logs, setLogs] = useState<LogMessage[]>([])

  const [mode, setMode] = useState<'simulation' | 'agent'>('simulation')
  const [showHistory, setShowHistory] = useState(false)
  const [refreshHistoryTrigger, setRefreshHistoryTrigger] = useState(0)

  // Project Viewing State
  const [viewingProject, setViewingProject] = useState<any>(null)

  // Prop state for children
  const [latestUpdate, setLatestUpdate] = useState<any>(null)
  const [latestLog, setLatestLog] = useState<string | null>(null)
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null)

  // NEW: Live UI State
  const [codeChunks, setCodeChunks] = useState<CodeChunk[]>([])
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([])
  const [currentThought, setCurrentThought] = useState<string | null>(null)
  const [currentFile, setCurrentFile] = useState<string | null>(null)

  // Derived state for Workspace
  const [activeAgent, setActiveAgent] = useState({
    name: 'System', role: 'Orchestrator', status: 'idle', task: '', file: ''
  })

  // Fetch Initial Data
  useEffect(() => {
    fetchModels();
  }, [])

  const fetchModels = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/models');
      const data = await res.json();
      if (data.models) {
        setAvailableModels(data.models);
        if (data.models.length > 0 && !selectedModel) {
          setSelectedModel(data.models[0].name);
        }
      }
    } catch (e) {
      console.error("Failed to fetch models", e);
      addLog('System', 'Failed to fetch models from Backend');
    }
  }

  // WebSocket Connection
  useEffect(() => {
    let ws: WebSocket;
    let reconnectTimer: NodeJS.Timeout;

    const connect = () => {
      ws = new WebSocket('ws://localhost:3002/ws')

      ws.onopen = () => {
        setConnected(true)
        addLog('System', 'Connected to Autonomous Brain')
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)

          if (data.type === 'log') {
            addLog('Agent', data.message)
            setLatestLog(data.message)
            parseAgentActivity(data.message)
          } else if (data.type === 'agent_update') {
            setLatestUpdate(data)
            updateActiveAgentFromStatus(data)
          } else if (data.type === 'thought') {
            // NEW: Handle AI thought
            setCurrentThought(data.content)
          } else if (data.type === 'code_chunk') {
            // NEW: Handle code chunk
            setCodeChunks(prev => [...prev, {
              file: data.file,
              content: data.chunk,
              timestamp: Date.now()
            }])
            setCurrentFile(data.file)
          } else if (data.type === 'terminal') {
            // NEW: Handle terminal output
            setTerminalLines(prev => [...prev, {
              output: data.output,
              isError: data.isError || false,
              timestamp: Date.now()
            }])
          }
        } catch (e) {
          console.error('Parse error', e)
        }
      }

      ws.onclose = () => {
        setConnected(false)
        reconnectTimer = setTimeout(connect, 3000)
      }
    }

    connect()

    return () => {
      ws?.close()
      clearTimeout(reconnectTimer)
    }
  }, [])

  const addLog = (type: string, msg: string) => {
    setLogs(prev => [...prev, {
      id: Date.now(),
      agentType: type,
      message: msg,
      timestamp: new Date().toLocaleTimeString()
    }].slice(-100))
  }

  const parseAgentActivity = (msg: string) => {
    // Extract file being written from developer messages
    if (msg.includes('Developer: Writing')) {
      const match = msg.match(/Writing (.+?)\.\.\./)
      if (match) {
        setCurrentFile(match[1])
      }
    }
  }

  const updateActiveAgentFromStatus = (update: any) => {
    const { agent, status, metrics } = update

    if (agent === 'analyze') {
      setActiveAgent({ name: 'Alice', role: 'Product Manager', status: 'Analyzing', task: 'Defining Requirements', file: 'requirements.md' })
    } else if (agent === 'plan') {
      setActiveAgent({ name: 'Bob', role: 'Architect', status: 'Planning', task: 'Designing Structure', file: 'architecture.json' })
    } else if (agent === 'ux') {
      setActiveAgent({ name: 'Carol', role: 'Designer', status: 'Designing', task: 'Creating Design', file: 'design.md' })
    } else if (agent === 'frontend_dev' || agent === 'backend_dev') {
      const file = metrics?.file || 'code'
      const role = agent === 'frontend_dev' ? 'Frontend' : 'Backend'
      setActiveAgent({ name: 'Dev', role: role, status: 'Coding', task: `Writing ${file}`, file: file })
      setCurrentFile(file)
    } else if (agent === 'qa_engineer') {
      const file = metrics?.file || ''
      setActiveAgent({ name: 'QA', role: 'QA Engineer', status: 'Testing', task: `Testing ${file || 'code'}`, file: file })
    } else if (agent === 'finalize') {
      setActiveAgent({ name: 'System', role: 'Orchestrator', status: 'Idle', task: 'Project Complete', file: '' })
      setIsRunning(false)
      setRefreshHistoryTrigger(p => p + 1)
      addLog('System', 'Project Generation Complete!')
      toast.success('Project Generation Complete!')
      setCurrentProjectId(null)
    }
  }

  const handleStart = async () => {
    if (!prompt.trim()) return

    setIsRunning(true)
    setViewingProject(null)
    setLogs([])
    setCodeChunks([])
    setTerminalLines([])
    setCurrentThought(null)
    setCurrentFile(null)
    addLog('System', `Starting project: ${prompt}`)

    const timeString = new Date().toLocaleTimeString().replace(/:/g, '-');
    const finalName = projectName.trim() ? projectName.trim() : `Project ${timeString}`;

    try {
      const res = await fetch('http://localhost:3001/api/generate-crewai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: finalName,
          description: prompt,
          model: selectedModel
        })
      })

      if (!res.ok) throw new Error('Failed to start')

      const data = await res.json()
      setCurrentProjectId(data.projectId)
      addLog('System', `Project ID: ${data.projectId}`)
      setRefreshHistoryTrigger(p => p + 1)

    } catch (e) {
      addLog('Error', 'Failed to start generation')
      setIsRunning(false)
      toast.error('Failed to start generation')
    }
  }

  const handleStop = async () => {
    if (!currentProjectId) return;
    try {
      await fetch('http://localhost:3001/api/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: currentProjectId })
      });
      addLog('System', 'Stop signal sent.');
      toast.warning('Stopping generation...');
    } catch (e) {
      console.error(e);
    }
  }

  const handleResetSystem = async () => {
    if (!confirm('Are you sure you want to reset all services? This will clear current state.')) return;

    try {
      await fetch('http://localhost:3001/api/reset', { method: 'POST' });
      setLogs([]);
      setCodeChunks([]);
      setTerminalLines([]);
      setCurrentThought(null);
      setIsRunning(false);
      setViewingProject(null);
      setActiveAgent({
        name: 'System', role: 'Orchestrator', status: 'idle', task: '', file: ''
      });
      setRefreshHistoryTrigger(p => p + 1);
      toast.success('System Reset Successfully');
    } catch (e) {
      toast.error('Failed to reset system');
    }
  }

  const handleResendProject = (project: any) => {
    setPrompt(project.description);
    setProjectName(project.name || '');
    if (availableModels.find(m => m.name === project.model)) {
      setSelectedModel(project.model);
    }
    toast.info(`Loaded project "${project.name}" into prompt.`);
    if (window.innerWidth < 1024) setShowHistory(false);
  }

  const handleViewProject = (project: any) => {
    setViewingProject(project);
    setPrompt(project.description || '');
    setProjectName(project.name || '');
    if (project.model) setSelectedModel(project.model);

    if (project.logs && Array.isArray(project.logs)) {
      setLogs(project.logs.map((msg: string, i: number) => ({
        id: i,
        agentType: 'History',
        message: msg,
        timestamp: ''
      })));
    } else {
      setLogs([]);
    }

    if (window.innerWidth < 1024) setShowHistory(false);
  }

  // Determine if we should show split-screen live view
  const showLiveView = isRunning && !viewingProject

  return (
    <main className="h-screen bg-[#09090b] text-foreground flex flex-col overflow-hidden font-sans">
      <Toaster position="top-right" theme="dark" />

      {/* AI Thoughts Overlay */}
      <AIThoughtsOverlay thought={currentThought} />

      {/* Top Bar */}
      <header className="shrink-0 flex flex-col md:flex-row items-center justify-between border-b border-white/10 px-4 py-2 md:h-16 bg-[#09090b] z-10 gap-2 md:gap-0">
        <div className="flex items-center justify-between w-full md:w-auto gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg shadow-lg shadow-purple-900/20">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="font-bold text-lg tracking-tight leading-none">Autonomous Software Co.</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500'}`} />
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                  {connected ? 'System Online' : 'Connecting...'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Center - Generation Controls */}
        {mode === 'simulation' && (
          <div className="flex-1 w-full md:max-w-4xl md:mx-4 lg:mx-8 flex gap-2">
            <div className="flex-[2] relative group">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your software idea..."
                className="w-full bg-black/50 border border-white/10 rounded-lg pl-3 pr-2 py-2.5 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all placeholder:text-gray-600"
                disabled={isRunning}
              />
            </div>

            <div className="flex-1 relative group min-w-[100px] hidden md:block">
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Name (Optional)"
                className="w-full bg-black/50 border border-white/10 rounded-lg pl-3 pr-2 py-2.5 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all placeholder:text-gray-600"
                disabled={isRunning}
              />
            </div>

            <div className="flex items-center gap-2">
              <div className="relative hidden xl:block">
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="bg-[#18181b] text-white border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-purple-500 appearance-none min-w-[120px] cursor-pointer hover:bg-[#27272a] transition-colors [&>option]:bg-[#18181b] [&>option]:text-white"
                  disabled={isRunning}
                >
                  {availableModels.length === 0 && <option value="llama3.1">Loading...</option>}
                  {availableModels.map(m => (
                    <option key={m.name} value={m.name} className="bg-[#18181b] text-white">
                      {m.displayName || m.name}
                    </option>
                  ))}
                </select>
              </div>

              {isRunning ? (
                <button
                  onClick={handleStop}
                  className="px-4 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 transition-all shadow-lg bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20"
                >
                  <Square className="w-4 h-4 fill-current" />
                  <span className="hidden sm:inline">Stop</span>
                </button>
              ) : (
                <button
                  onClick={handleStart}
                  disabled={!connected}
                  className="px-6 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 transition-all shadow-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-900/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span className="hidden sm:inline">Launch</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Right Actions */}
        <div className="flex items-center gap-2 md:gap-3">
          <button
            onClick={handleResetSystem}
            className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/20"
            title="Reset System Services"
          >
            <Power className="w-5 h-5" />
          </button>

          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`p-2 rounded-lg transition-colors border ${showHistory ? 'bg-purple-500/20 border-purple-500/50 text-purple-300' : 'text-gray-400 hover:bg-white/5 border-transparent'}`}
            title="Project History"
          >
            <History className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* Main Grid/Workspace */}
        <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300`}>
          {mode === 'simulation' ? (
            <div className="flex-1 flex flex-col lg:grid lg:grid-cols-12 gap-4 p-4 min-h-0 overflow-y-auto lg:overflow-hidden">

              {/* Left: Department Status */}
              <div className="lg:col-span-2 min-w-0 h-64 lg:h-full flex flex-col gap-4 order-2 lg:order-1">
                <div className="flex-1 max-h-full overflow-hidden border border-white/10 rounded-xl bg-card/10 backdrop-blur-sm">
                  <AgentFlowViewer
                    isRunning={isRunning}
                    connected={connected}
                    latestUpdate={latestUpdate}
                    latestLog={latestLog}
                  />
                </div>
              </div>

              {/* Center: Live Split View OR Project Viewer */}
              <div className="lg:col-span-7 min-w-0 h-[60vh] lg:h-full order-1 lg:order-2">
                {viewingProject ? (
                  <div className="h-full relative border border-white/10 rounded-xl overflow-hidden bg-card/5 backdrop-blur-sm shadow-2xl">
                    <ProjectViewer project={viewingProject} />
                    <div className="absolute top-0 right-0 p-2 z-10">
                      <button
                        onClick={() => setViewingProject(null)}
                        className="text-xs bg-black/50 border border-white/10 px-2 py-1 rounded hover:bg-white/10 transition-colors flex items-center gap-1"
                      >
                        <X className="w-3 h-3" />
                        Close Viewer
                      </button>
                    </div>
                  </div>
                ) : showLiveView ? (
                  /* LIVE SPLIT VIEW */
                  <div className="h-full grid grid-cols-2 gap-4">
                    {/* Left: Live Code */}
                    <LiveCodePanel
                      codeChunks={codeChunks}
                      currentFile={currentFile || undefined}
                    />

                    {/* Right: Terminal */}
                    <TerminalPanel
                      lines={terminalLines}
                      isRunning={isRunning}
                    />
                  </div>
                ) : (
                  /* Default Workspace */
                  <div className="h-full border border-white/10 rounded-xl overflow-hidden bg-card/5 backdrop-blur-sm shadow-2xl relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-900/5 to-blue-900/5 pointer-events-none" />
                    <LiveWorkspace activeAgent={activeAgent} latestLog={latestLog} />
                  </div>
                )}
              </div>

              {/* Right: Log Stream */}
              <div className="lg:col-span-3 min-w-0 h-48 lg:h-full border border-white/10 rounded-xl overflow-hidden bg-black/40 order-3 lg:order-3">
                <LogStream logs={logs} />
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col lg:grid lg:grid-cols-12 gap-4 p-4 min-h-0 overflow-hidden">
              <div className="lg:col-span-4 min-w-0 h-full border border-white/10 rounded-xl overflow-hidden bg-card/10">
                <ChatInterface />
              </div>
              <div className="lg:col-span-8 min-w-0 h-full border border-white/10 rounded-xl overflow-hidden bg-black">
                <BrowserControl />
              </div>
            </div>
          )}
        </div>

        {/* History Sidebar */}
        {showHistory && (
          <div className="absolute right-0 top-0 bottom-0 w-80 border-l border-white/10 bg-black/95 backdrop-blur-xl h-full shadow-2xl z-20 animate-in slide-in-from-right duration-300">
            <div className="absolute top-2 right-2 md:hidden z-30">
              <button onClick={() => setShowHistory(false)} className="p-2 text-gray-400">
                <X className="w-5 h-5 fill-current" />
              </button>
            </div>
            <HistorySidebar
              refreshTrigger={refreshHistoryTrigger}
              onSelectProject={handleViewProject}
              onResendProject={handleResendProject}
            />
          </div>
        )}

      </div>
    </main>
  )
}

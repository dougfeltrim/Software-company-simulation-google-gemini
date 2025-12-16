'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, Circle, AlertCircle } from 'lucide-react'

interface LogEvent {
  type: 'file-edit' | 'file-complete' | 'progress' | 'status' | 'error'
  file?: string
  status?: string
  message?: string
  progress?: number
  timestamp: number
}

export function RealtimeLogs({ wsUrl }: { wsUrl?: string } = {}) {
  const [logs, setLogs] = useState<LogEvent[]>([])
  const [connected, setConnected] = useState(false)
  const [progress, setProgress] = useState(0)
  const [statusMessage, setStatusMessage] = useState('')

  useEffect(() => {
    const targetUrl = wsUrl || (process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001') + '/ws'
    // Ensure we don't double append /ws if it's already there (rudimentary check)
    const finalUrl = targetUrl.endsWith('/ws/ws') ? targetUrl.replace('/ws/ws', '/ws') : targetUrl

    const ws = new WebSocket(finalUrl)

    ws.onopen = () => {
      setConnected(true)
      console.log('WebSocket connected')
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)

        if (data.type === 'history') {
          // Reconstruct history
          const historyLogs = data.logs || []
          setLogs(historyLogs)
          // Try to restore progress from last log if possible, or just default
          if (historyLogs.length > 0) {
            const last = historyLogs[historyLogs.length - 1]
            if (last.progress) setProgress(last.progress)
          }
        } else {
          // Normalize log data
          const logEntry: LogEvent = {
            type: data.type === 'log' ? 'status' : (data.type || 'status'),
            message: data.message,
            timestamp: data.timestamp || Date.now(),
            file: data.file,
            status: data.status,
            progress: data.progress
          }

          // Filter out agent updates if they come through here (handled by AgentFlowViewer)
          if (data.type === 'agent_update') return

          // Update global state
          if (data.progress !== undefined) {
            setProgress(data.progress)
          }
          if (data.message) {
            setStatusMessage(data.message)
          }

          // Add to log list
          setLogs((prev) => [...prev, logEntry])
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error)
      }
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      setConnected(false)
    }

    ws.onclose = () => {
      setConnected(false)
      console.log('WebSocket disconnected')
    }

    return () => {
      ws.close()
    }
  }, [])

  // Auto-scroll to bottom
  useEffect(() => {
    const container = document.getElementById('logs-container')
    if (container) {
      container.scrollTop = container.scrollHeight
    }
  }, [logs])

  const getLogIcon = (log: LogEvent) => {
    if (log.type === 'error') return <AlertCircle className="w-4 h-4 text-red-400 mt-0.5" />
    if (log.type === 'file-complete') return <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5" />
    return <Circle className="w-3 h-3 text-gray-500 mt-1" />
  }

  return (
    <div className="h-full flex flex-col bg-background border border-border rounded-xl overflow-hidden min-h-0">
      {/* Header & Progress Bar */}
      <div className="p-3 border-b border-border bg-card shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-foreground">Generation Progress</h2>
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} title={connected ? 'Connected' : 'Disconnected'} />
          </div>
          <span className="text-sm font-medium text-muted">{progress}%</span>
        </div>

        {/* Global Progress Bar */}
        <div className="w-full bg-gray-800 rounded-full h-2.5 mb-2 overflow-hidden">
          <div
            className="bg-accent h-2.5 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Current Status Message */}
        <div className="text-sm text-muted font-medium truncate min-h-[20px]">
          {statusMessage || 'Ready to start...'}
        </div>
      </div>

      {/* Scrollable Logs Area */}
      <div
        id="logs-container"
        className="flex-1 overflow-y-auto p-4 space-y-1 bg-gray-950 font-mono text-sm"
      >
        {logs.length === 0 ? (
          <div className="text-gray-500 text-center py-4 italic">Waiting for logs...</div>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="flex gap-3 text-gray-300 hover:bg-gray-900/50 p-1.5 rounded">
              <span className="shrink-0 opacity-60 text-gray-500">
                {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
              <div className="flex-1 break-words">
                {log.file && <span className="text-blue-400 font-semibold mr-2">[{log.file}]</span>}
                <span className={log.type === 'error' ? 'text-red-400' : ''}>
                  {log.message}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}


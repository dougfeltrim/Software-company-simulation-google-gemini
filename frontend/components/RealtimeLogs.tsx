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

export function RealtimeLogs() {
  const [logs, setLogs] = useState<LogEvent[]>([])
  const [connected, setConnected] = useState(false)
  const [progress, setProgress] = useState(0)
  const [statusMessage, setStatusMessage] = useState('')

  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001'
    const ws = new WebSocket(`${wsUrl}/ws`)

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
          // Update global state
          if (data.progress !== undefined) {
            setProgress(data.progress)
          }
          if (data.message) {
            setStatusMessage(data.message)
          }

          // Add to log list
          setLogs((prev) => [...prev, data])
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
    if (log.type === 'error') return <AlertCircle className="w-4 h-4 text-red-500 mt-0.5" />
    if (log.type === 'file-complete') return <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />
    return <Circle className="w-3 h-3 text-gray-400 mt-1" />
  }

  return (
    <div className="h-full flex flex-col bg-white border rounded-lg overflow-hidden">
      {/* Header & Progress Bar */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-gray-900">Generation Progress</h2>
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} title={connected ? 'Connected' : 'Disconnected'} />
          </div>
          <span className="text-sm font-medium text-gray-600">{progress}%</span>
        </div>

        {/* Global Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2 overflow-hidden">
          <div
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Current Status Message */}
        <div className="text-sm text-gray-700 font-medium truncate min-h-[20px]">
          {statusMessage || 'Ready to start...'}
        </div>
      </div>

      {/* Scrollable Logs Area */}
      <div
        id="logs-container"
        className="flex-1 overflow-y-auto p-4 space-y-1 bg-gray-900 font-mono text-sm"
      >
        {logs.length === 0 ? (
          <div className="text-gray-500 text-center py-4 italic">Waiting for logs...</div>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="flex gap-3 text-gray-300 hover:bg-gray-800/50 p-1 rounded">
              <span className="shrink-0 opacity-70">
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

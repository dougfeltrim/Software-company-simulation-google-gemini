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
          setLogs(data.logs || [])
        } else {
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

  const getLogIcon = (log: LogEvent) => {
    if (log.type === 'error') {
      return <AlertCircle className="w-4 h-4 text-red-500" />
    }
    if (log.type === 'file-complete') {
      return <CheckCircle2 className="w-4 h-4 text-green-500" />
    }
    return <Circle className="w-4 h-4 text-blue-500" />
  }

  const getLogColor = (log: LogEvent) => {
    if (log.type === 'error') return 'bg-red-50 border-red-200'
    if (log.type === 'file-complete') return 'bg-green-50 border-green-200'
    if (log.type === 'progress') return 'bg-blue-50 border-blue-200'
    return 'bg-gray-50 border-gray-200'
  }

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Real-time Logs</h2>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm text-gray-600">
            {connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2">
        {logs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No logs yet. Start a project to see real-time updates.
          </div>
        ) : (
          logs.map((log, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg border ${getLogColor(log)} transition-all`}
            >
              <div className="flex items-start gap-2">
                {getLogIcon(log)}
                <div className="flex-1 min-w-0">
                  {log.file && (
                    <div className="font-medium text-sm truncate">
                      {log.file}
                    </div>
                  )}
                  {log.message && (
                    <div className="text-sm text-gray-700">
                      {log.message}
                    </div>
                  )}
                  {log.progress !== undefined && (
                    <div className="mt-1">
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className="bg-blue-600 h-1.5 rounded-full transition-all"
                          style={{ width: `${log.progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

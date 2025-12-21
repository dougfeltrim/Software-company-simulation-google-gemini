'use client'

import { useEffect, useState } from 'react'
import { Brain, Sparkles } from 'lucide-react'

interface AIThoughtsOverlayProps {
    thought: string | null
}

export function AIThoughtsOverlay({ thought }: AIThoughtsOverlayProps) {
    const [visible, setVisible] = useState(false)
    const [displayedThought, setDisplayedThought] = useState<string | null>(null)

    useEffect(() => {
        if (thought) {
            setDisplayedThought(thought)
            setVisible(true)

            // Auto-hide after 5 seconds
            const timer = setTimeout(() => {
                setVisible(false)
            }, 5000)

            return () => clearTimeout(timer)
        }
    }, [thought])

    if (!visible || !displayedThought) {
        return null
    }

    return (
        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="relative">
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 blur-xl" />

                {/* Main content */}
                <div className="relative bg-black/90 backdrop-blur-xl border border-purple-500/30 rounded-2xl px-6 py-4 max-w-xl shadow-2xl shadow-purple-900/20">
                    <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div className="shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                            <Brain className="w-5 h-5 text-white" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">AI Thinking</span>
                                <Sparkles className="w-3 h-3 text-purple-400 animate-pulse" />
                            </div>
                            <p className="text-sm text-gray-300 leading-relaxed">
                                {displayedThought}
                            </p>
                        </div>
                    </div>

                    {/* Animated border */}
                    <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/50 to-purple-500/0 animate-shimmer"
                            style={{
                                animation: 'shimmer 2s infinite',
                                backgroundSize: '200% 100%'
                            }}
                        />
                    </div>
                </div>

                {/* Speech bubble tail */}
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-black/90 border-b border-r border-purple-500/30 rotate-45" />
            </div>
        </div>
    )
}

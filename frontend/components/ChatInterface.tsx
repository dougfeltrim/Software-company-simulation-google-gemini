import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User } from 'lucide-react'

interface Message {
    role: 'user' | 'assistant'
    content: string
}

export function ChatInterface() {
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [isTyping, setIsTyping] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages])

    const sendMessage = async () => {
        if (!input.trim()) return

        const userMsg = input
        setInput('')
        setMessages(prev => [...prev, { role: 'user', content: userMsg }])
        setIsTyping(true)

        try {
            const response = await fetch('http://localhost:3002/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMsg })
            })
            const data = await response.json()
            setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
        } catch (e) {
            setMessages(prev => [...prev, { role: 'assistant', content: "Error: Could not connect to agent." }])
        } finally {
            setIsTyping(false)
        }
    }

    return (
        <div className="flex flex-col h-full bg-card/10 rounded-xl border border-white/10 overflow-hidden">
            <div className="p-3 border-b border-white/10 bg-black/20 font-medium flex items-center gap-2">
                <Bot className="w-4 h-4 text-purple-400" />
                Agent Chat
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${msg.role === 'user'
                                ? 'bg-purple-600 text-white rounded-br-none'
                                : 'bg-white/10 text-gray-200 rounded-bl-none'
                            }`}>
                            {msg.content}
                        </div>
                    </div>
                ))}
                {isTyping && (
                    <div className="flex gap-2 text-gray-400 text-xs animate-pulse">
                        <Bot className="w-3 h-3" /> Agent is thinking...
                    </div>
                )}
            </div>

            <div className="p-3 bg-black/20 border-t border-white/10 flex gap-2">
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type a command..."
                    className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
                />
                <button
                    onClick={sendMessage}
                    className="p-2 bg-purple-600 rounded-lg hover:bg-purple-500 transition-colors"
                >
                    <Send className="w-4 h-4" />
                </button>
            </div>
        </div>
    )
}

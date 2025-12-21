import { RefreshCw, Monitor } from 'lucide-react'

export function BrowserControl() {
    return (
        <div className="flex flex-col h-full bg-card/10 rounded-xl border border-white/10 overflow-hidden">
            <div className="p-3 border-b border-white/10 bg-black/20 font-medium flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Monitor className="w-4 h-4 text-blue-400" />
                    Live Browser View
                </div>
                <div className="flex items-center gap-2 text-xs">
                    <span className="flex items-center gap-1.5 px-2 py-1 rounded bg-green-500/20 text-green-400 border border-green-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        Connected
                    </span>
                </div>
            </div>

            <div className="flex-1 bg-black relative flex items-center justify-center group">
                {/* Placeholder for VNC/Stream */}
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1610563166150-b34df4f3bcd6?q=80&w=2576&auto=format&fit=crop')] bg-cover bg-center opacity-50 grayscale group-hover:grayscale-0 transition-all duration-500" />

                <div className="relative z-10 text-center space-y-2 p-6 bg-black/80 rounded-xl border border-white/10 backdrop-blur-sm">
                    <Monitor className="w-12 h-12 text-white/20 mx-auto" />
                    <h3 className="text-white font-medium">Browser Session Active</h3>
                    <p className="text-white/40 text-sm max-w-xs">
                        Viewing agent navigation stream via VNC.
                        Interactive control enabled.
                    </p>
                </div>

                {/* Overlay Controls */}
                <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-2 bg-white/10 hover:bg-white/20 rounded-lg backdrop-blur-md text-white transition-colors" title="Reload Page">
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    )
}

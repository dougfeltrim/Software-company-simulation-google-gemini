"""
LangGraph Multi-Agent FastAPI Server
Uses LangGraph instead of CrewAI for better Windows compatibility.
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import asyncio
import json
import os
from dotenv import load_dotenv

# Load environment
load_dotenv()

app = FastAPI(title="LangGraph Software Company", version="2.0.0")

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# WebSocket clients for real-time logs
connected_clients: list[WebSocket] = []


class GenerateRequest(BaseModel):
    name: str
    description: str
    model: Optional[str] = None


class GenerateResponse(BaseModel):
    success: bool
    project_id: str
    files: list
    message: str


async def broadcast_log(message: str):
    """Send log message to all connected WebSocket clients"""
    if connected_clients:
        data = json.dumps({"type": "log", "message": message})
        for client in connected_clients.copy():
            try:
                await client.send_text(data)
            except:
                connected_clients.remove(client)


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "service": "langgraph"}


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket for real-time log streaming"""
    await websocket.accept()
    connected_clients.append(websocket)
    
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        connected_clients.remove(websocket)


def run_graph_generation(name: str, description: str, model: str | None, log_callback):
    """Run LangGraph generation"""
    from graph import SoftwareCompanyGraph
    
    graph = SoftwareCompanyGraph(model=model, on_log=log_callback)
    return graph.generate_project(name, description)


@app.post("/generate")
async def generate_project(request: GenerateRequest):
    """Generate a project using LangGraph agents."""
    project_id = f"{request.name.lower().replace(' ', '-')}-{int(asyncio.get_event_loop().time())}"
    
    logs = []
    
    def sync_log(message: str):
        """Sync log wrapper"""
        logs.append(message)
        print(message)  # Also print to console
    
    try:
        await broadcast_log(f"📦 Starting LangGraph generation for: {request.name}")
        
        loop = asyncio.get_event_loop()
        
        result = await loop.run_in_executor(
            None,
            lambda: run_graph_generation(request.name, request.description, request.model, sync_log)
        )
        
        # Broadcast collected logs
        for log in logs:
            await broadcast_log(log)
        
        await broadcast_log(f"✅ LangGraph generation complete!")
        
        return GenerateResponse(
            success=True,
            project_id=project_id,
            files=result["files"],
            message=f"Generated {len(result['files'])} files"
        )
        
    except Exception as e:
        await broadcast_log(f"❌ Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    
    port = int(os.getenv("PORT", 3002))
    print(f"🚀 LangGraph Service starting on port {port}")
    
    uvicorn.run(app, host="0.0.0.0", port=port)

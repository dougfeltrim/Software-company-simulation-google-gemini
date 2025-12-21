
import os
import re
import asyncio
from fastapi import FastAPI, WebSocket, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
from typing import List, Dict, Any, Optional
from langchain_community.chat_models import ChatOllama
from langchain_core.messages import HumanMessage, SystemMessage
from langgraph.graph import StateGraph, END

# Import our agent definitions
from agents import (
    ProductManagerState,
    ProductManagerAgent,
    SoftwareArchitectState,
    SoftwareArchitectAgent,
    TechLeadState,
    TechLeadAgent,
    DeveloperState,
    DeveloperAgent,
    QAEngineerState,
    QAEngineerAgent,
    CodeReviewerState,
    CodeReviewerAgent
)

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# WebSockets for finding active clients
active_connections: List[WebSocket] = []

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    active_connections.append(websocket)
    try:
        while True:
            # Just keep connection open and listen for pings
            await websocket.receive_text()
    except Exception:
        if websocket in active_connections:
            active_connections.remove(websocket)


async def _broadcast(data: dict):
    """Internal broadcast helper."""
    to_remove = []
    for connection in active_connections:
        try:
            await connection.send_json(data)
        except:
            to_remove.append(connection)
    
    for c in to_remove:
        if c in active_connections:
            active_connections.remove(c)


async def broadcast_log(message: str):
    """Broadcasts a log message to all connected WebSocket clients."""
    await _broadcast({"type": "log", "message": message})


async def broadcast_agent_update(agent_id: str, status: str, metrics: dict):
    """Broadcasts agent status updates."""
    await _broadcast({
        "type": "agent_update", 
        "agent": agent_id, 
        "status": status,
        "metrics": metrics
    })


async def broadcast_thought(thought: str):
    """Broadcasts an AI thought/reasoning message."""
    await _broadcast({"type": "thought", "content": thought})


async def broadcast_code_chunk(file_path: str, chunk: str):
    """Broadcasts a code chunk being written."""
    await _broadcast({"type": "code_chunk", "file": file_path, "chunk": chunk})


async def broadcast_terminal(output: str, is_error: bool = False):
    """Broadcasts terminal output from subprocess execution."""
    await _broadcast({"type": "terminal", "output": output, "isError": is_error})


class GenerateRequest(BaseModel):
    name: str
    description: str
    model: str = "llama3"


def run_graph_generation(project_name: str, description: str, model: str, log_callback, update_callback):
    """
    Synchronous wrapper to run the LangGraph workflow.
    Includes QA Engineer for testing and fixing.
    """
    log_callback(f"🚀 Initializing Autonomous Team with model: {model}")
    
    # Initialize LLM
    llm = ChatOllama(model=model, temperature=0.7)
    
    # Define Agents
    pm = ProductManagerAgent(llm, log_callback, update_callback)
    architect = SoftwareArchitectAgent(llm, log_callback, update_callback)
    tech_lead = TechLeadAgent(llm, log_callback, update_callback)
    developer = DeveloperAgent(llm, log_callback, update_callback)
    qa_engineer = QAEngineerAgent(llm, log_callback, update_callback)
    
    # Create LangGraph workflow
    workflow = StateGraph(Dict[str, Any])
    
    # Add Nodes
    workflow.add_node("product_manager", pm.analyze_requirements)
    workflow.add_node("architect", architect.design_architecture)
    workflow.add_node("tech_lead", tech_lead.breakdown_tasks)
    workflow.add_node("developer", developer.write_code)
    workflow.add_node("qa_engineer", qa_engineer.validate_and_test)
    
    # Define Edges (sequential flow)
    workflow.set_entry_point("product_manager")
    workflow.add_edge("product_manager", "architect")
    workflow.add_edge("architect", "tech_lead")
    workflow.add_edge("tech_lead", "developer")
    workflow.add_edge("developer", "qa_engineer")
    workflow.add_edge("qa_engineer", END)
    
    # Compile
    app_graph = workflow.compile()
    
    log_callback("✅ Team Assembled: PM → Architect → Tech Lead → Developer → QA Engineer")
    log_callback("🏃 Starting Workflow...")
    
    # Execute Graph
    initial_state = {
        "project_name": project_name,
        "description": description,
        "requirements": "",
        "architecture": "",
        "tasks": [],
        "code_files": [],
        "test_results": []
    }
    
    try:
        # invoke() returns the final state
        final_state = app_graph.invoke(initial_state)
        
        update_callback("finalize", "Success", {})
        log_callback("🏁 Project Generation & Testing Completed Successfully!")
        
        return {
            "files": final_state.get("code_files", []),
            "test_results": final_state.get("test_results", [])
        }
        
    except Exception as e:
        log_callback(f"❌ Error during execution: {str(e)}")
        import traceback
        traceback.print_exc()
        raise e


@app.get("/health")
def health_check():
    return {"status": "running", "service": "langgraph-agent-service"}


@app.post("/generate")
async def generate_project(request: GenerateRequest):
    """Generate a project using LangGraph agents with QA testing."""
    # Sanitize filename for Windows
    raw_name = request.name
    safe_name = re.sub(r'[<>:"/\\|?*]', '', raw_name)
    safe_name = safe_name.strip().replace(' ', '-').lower()
    
    project_id = f"{safe_name}-{int(asyncio.get_event_loop().time())}"
    
    loop = asyncio.get_running_loop()
    
    # Thread-safe callbacks that bridge to the async loop
    def sync_log(message: str):
        asyncio.run_coroutine_threadsafe(broadcast_log(message), loop)
        
        # Also broadcast thoughts, code chunks, and terminal output based on prefix
        if message.startswith("💭 [AI Thought]:"):
            thought = message.replace("💭 [AI Thought]:", "").strip()
            asyncio.run_coroutine_threadsafe(broadcast_thought(thought), loop)
        elif message.startswith("📝 [Code]"):
            parts = message.split(":", 2)
            if len(parts) >= 3:
                file_path = parts[1].strip()
                chunk = parts[2].strip()
                asyncio.run_coroutine_threadsafe(broadcast_code_chunk(file_path, chunk), loop)
        elif message.startswith("📟 [stdout]:") or message.startswith("❌ [stderr]:"):
            is_error = message.startswith("❌")
            output = message.split(":", 1)[1].strip() if ":" in message else message
            asyncio.run_coroutine_threadsafe(broadcast_terminal(output, is_error), loop)
        
        print(message)
    
    def sync_agent_update(agent_id: str, status: str, metrics: dict):
        asyncio.run_coroutine_threadsafe(broadcast_agent_update(agent_id, status, metrics), loop)
        print(f"[Agent] {agent_id}: {status}")
    
    try:
        await broadcast_log(f"📦 Starting Autonomous Team for: {request.name}")
        
        # Run the synchronous graph in a separate thread
        result = await loop.run_in_executor(
            None,
            lambda: run_graph_generation(request.name, request.description, request.model, sync_log, sync_agent_update)
        )
        
        # Save to disk
        output_dir = os.path.join("..", "output", project_id)
        os.makedirs(output_dir, exist_ok=True)
        
        files_to_return = []
        for file_obj in result.get('files', []):
            file_path = file_obj.get('path')
            content = file_obj.get('content')
            
            if file_path and content:
                full_path = os.path.join(output_dir, file_path)
                os.makedirs(os.path.dirname(full_path), exist_ok=True)
                with open(full_path, "w", encoding="utf-8") as f:
                    f.write(content)
                files_to_return.append({"path": file_path, "content": content})
        
        # Save test results summary
        test_results = result.get('test_results', [])
        if test_results:
            summary_path = os.path.join(output_dir, "test_results.json")
            import json
            with open(summary_path, "w", encoding="utf-8") as f:
                json.dump(test_results, f, indent=2)
        
        return {"project_id": project_id, "files": files_to_return, "test_results": test_results}

    except Exception as e:
        await broadcast_log(f"💥 Critical Failure: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/chat")
async def chat_endpoint(request: Request):
    try:
        data = await request.json()
        message = data.get("message", "")
        return {"reply": f"🤖 Agent received: {message}\n(Browser/Chat functionality is currently in restoration mode)"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    
    port = int(os.getenv("PORT", 3002))
    print(f"LangGraph Autonomous Service starting on port {port}")
    
    uvicorn.run("server:app", host="0.0.0.0", port=port, reload=True)

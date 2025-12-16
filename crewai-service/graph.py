"""
LangGraph Multi-Agent System
Implements a software development team using LangGraph with Ollama.
"""

from langchain_ollama import ChatOllama
from langgraph.graph import StateGraph, END
from typing import TypedDict, Annotated, List, Optional, Callable
import operator
import json
import re
import os


class ProjectState(TypedDict):
    """State shared between agents"""
    name: str
    description: str
    requirements: str
    file_structure: List[dict]
    generated_files: List[dict]
    current_file_index: int
    status: str
    logs: List[str]


def get_llm(model: str = None):
    """Get Ollama LLM instance"""
    model_name = model or os.getenv("DEFAULT_MODEL", "llama3.1:8b")
    ollama_host = os.getenv("OLLAMA_HOST", "http://localhost:11434")
    
    return ChatOllama(
        model=model_name,
        base_url=ollama_host,
        temperature=0.7,
    )


class SoftwareCompanyGraph:
    """
    A LangGraph-based multi-agent system for generating software projects.
    """
    
    def __init__(self, model: str = None, on_log: Optional[Callable[[str], None]] = None, on_agent_update: Optional[Callable[[str, str, dict], None]] = None):
        self.model = model
        self.on_log = on_log or print
        self.on_agent_update = on_agent_update  # callback(agent_id, status, metrics)
        self.llm = get_llm(model)
        self.graph = self._build_graph()
    
    def log(self, message: str):
        """Send log message to callback"""
        self.on_log(message)
    
    def update_agent(self, agent_id: str, status: str, metrics: dict = None):
        """Send agent state update"""
        if self.on_agent_update:
            self.on_agent_update(agent_id, status, metrics or {})
    
    def _build_graph(self) -> StateGraph:
        """Build the LangGraph workflow"""
        
        # Define the graph
        workflow = StateGraph(ProjectState)
        
        # Add nodes
        workflow.add_node("analyze_requirements", self._analyze_requirements)
        workflow.add_node("plan_structure", self._plan_structure)
        workflow.add_node("generate_file", self._generate_file)
        workflow.add_node("finalize", self._finalize)
        
        # Define edges
        workflow.set_entry_point("analyze_requirements")
        workflow.add_edge("analyze_requirements", "plan_structure")
        workflow.add_edge("plan_structure", "generate_file")
        workflow.add_conditional_edges(
            "generate_file",
            self._should_continue_generating,
            {
                "continue": "generate_file",
                "done": "finalize"
            }
        )
        workflow.add_edge("finalize", END)
        
        return workflow.compile()
    
    def _analyze_requirements(self, state: ProjectState) -> ProjectState:
        """Product Manager: Analyze requirements"""
        self.update_agent("analyze", "active")
        self.log("📋 Product Manager: Analyzing requirements...")
        
        prompt = f"""You are an experienced Product Manager. Analyze this project request and create detailed requirements.

Project: {state['name']}
Description: {state['description']}

Create detailed requirements including:
1. Core features and functionality
2. Technical requirements
3. User interface considerations
4. Implementation priorities

Be specific and actionable."""

        try:
            response = self.llm.invoke(prompt)
            requirements = response.content
        except Exception as e:
            self.log(f"❌ Error invoking LLM: {str(e)}")
            import traceback
            traceback.print_exc()
            raise e
        
        self.log(f"✅ Requirements analyzed ({len(requirements)} chars)")
        self.update_agent("analyze", "completed")
        
        return {
            **state,
            "requirements": requirements,
            "logs": state["logs"] + ["Requirements analyzed"]
        }
    
    def _plan_structure(self, state: ProjectState) -> ProjectState:
        """Product Manager: Plan file structure"""
        self.update_agent("plan", "active")
        self.log("📁 Product Manager: Planning file structure...")
        
        prompt = f"""Based on these requirements, create a JSON file structure.

Requirements:
{state['requirements']}

Output ONLY a valid JSON array with files to create:
[
  {{"path": "index.html", "description": "Main HTML file"}},
  {{"path": "styles.css", "description": "CSS styles"}},
  {{"path": "script.js", "description": "JavaScript logic"}}
]

Include all necessary files for a complete project."""



        try:
            response = self.llm.invoke(prompt)
        except Exception as e:
            self.log(f"❌ Error invoking LLM (planning): {str(e)}")
            # Fallback response so we don't crash entirely? Or just re-raise.
            # Re-raising is safer for now to expose the error.
            raise e
        
        # Parse JSON from response
        try:
            match = re.search(r'\[[\s\S]*\]', response.content)
            if match:
                file_structure = json.loads(match.group())
            else:
                file_structure = [
                    {"path": "index.html", "description": "Main HTML file"},
                    {"path": "styles.css", "description": "CSS styles"},
                    {"path": "script.js", "description": "JavaScript logic"}
                ]
        except json.JSONDecodeError:
            file_structure = [
                {"path": "index.html", "description": "Main HTML file"},
                {"path": "styles.css", "description": "CSS styles"},
                {"path": "script.js", "description": "JavaScript logic"}
            ]
        
        self.log(f"✅ Planned {len(file_structure)} files")
        self.update_agent("plan", "completed", {"files": len(file_structure)})
        
        return {
            **state,
            "file_structure": file_structure,
            "current_file_index": 0,
            "logs": state["logs"] + [f"Planned {len(file_structure)} files"]
        }
    
    def _generate_file(self, state: ProjectState) -> ProjectState:
        """Developer: Generate code for current file"""
        idx = state["current_file_index"]
        file_info = state["file_structure"][idx]
        file_path = file_info["path"]
        file_desc = file_info.get("description", "")
        
        self.update_agent("generate", "active", {"file": file_path, "index": idx + 1, "total": len(state["file_structure"])})
        self.log(f"💻 Developer: Generating {file_path}...")
        
        prompt = f"""You are a senior developer. Generate the complete code for this file.

File: {file_path}
Purpose: {file_desc}

Project Requirements:
{state['requirements'][:1500]}

Write production-ready code. Output ONLY the code, no explanations.
Include proper structure, comments, and best practices."""



        try:
            response = self.llm.invoke(prompt)
        except Exception as e:
            self.log(f"❌ Error invoking LLM (generation): {str(e)}")
            raise e
        
        # Clean the code (remove markdown blocks)
        code = response.content
        code = re.sub(r'^```\w*\n?', '', code)
        code = re.sub(r'\n?```$', '', code)
        code = code.strip()
        
        generated_files = state["generated_files"] + [{
            "path": file_path,
            "content": code
        }]
        
        self.log(f"✅ Generated {file_path} ({len(code)} chars)")
        
        return {
            **state,
            "generated_files": generated_files,
            "current_file_index": idx + 1,
            "logs": state["logs"] + [f"Generated {file_path}"]
        }
    
    def _should_continue_generating(self, state: ProjectState) -> str:
        """Check if there are more files to generate"""
        if state["current_file_index"] < len(state["file_structure"]):
            return "continue"
        return "done"
    
    def _finalize(self, state: ProjectState) -> ProjectState:
        """Finalize the project"""
        self.update_agent("generate", "completed", {"files": len(state["generated_files"])})
        self.update_agent("finalize", "active")
        self.log(f"🎉 Project '{state['name']}' completed with {len(state['generated_files'])} files!")
        self.update_agent("finalize", "completed")
        
        return {
            **state,
            "status": "completed",
            "logs": state["logs"] + ["Project completed"]
        }
    
    def generate_project(self, name: str, description: str) -> dict:
        """
        Generate a complete project.
        
        Returns:
            dict with 'files' (list of {path, content}) and 'requirements' (str)
        """
        self.log(f"🚀 Starting project: {name}")
        
        initial_state: ProjectState = {
            "name": name,
            "description": description,
            "requirements": "",
            "file_structure": [],
            "generated_files": [],
            "current_file_index": 0,
            "status": "starting",
            "logs": []
        }
        
        # Run the graph
        final_state = self.graph.invoke(initial_state)
        
        return {
            "files": final_state["generated_files"],
            "requirements": final_state["requirements"]
        }

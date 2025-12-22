"""
LangGraph Multi-Agent System
Implements a software development company with specialized departments and EXPERT agents.
"""

from langchain_ollama import ChatOllama
from langgraph.graph import StateGraph, END
from typing import TypedDict, Annotated, List, Optional, Callable, Dict, Any
import operator
import json
import re
import os


class ProjectState(TypedDict):
    """State shared between agents"""
    name: str
    description: str
    requirements: str
    architecture: str
    design_system: str
    file_structure: List[dict]
    generated_files: List[dict]
    current_file_index: int
    review_feedback: Dict[str, str]
    status: str
    logs: List[str]
    retry_count: int


def get_llm(model: str = None):
    """Get Ollama LLM instance"""
    model_name = model or os.getenv("DEFAULT_MODEL", "gemma3:4b")
    ollama_host = os.getenv("OLLAMA_HOST", "http://127.0.0.1:11434")
    print(f"DEBUG: Connecting to Ollama at {ollama_host} with model {model_name}")
    
    return ChatOllama(
        model=model_name,
        base_url=ollama_host,
        temperature=0.7,
        num_gpu=99,
        num_ctx=8192
    )


class SoftwareCompanyGraph:
    """
    A LangGraph-based multi-agent system for generating software projects.
    """
    
    def __init__(self, model: str = None, on_log: Optional[Callable[[str], None]] = None, on_agent_update: Optional[Callable[[str, str, dict], None]] = None):
        self.model = model
        self.on_log = on_log or print
        self.on_agent_update = on_agent_update
        self.llm = get_llm(model)
        self.graph = self._build_graph()
    
    def log(self, message: str):
        self.on_log(message)
    
    def update_agent(self, agent_id: str, status: str, metrics: dict = None):
        if self.on_agent_update:
            self.on_agent_update(agent_id, status, metrics or {})
    
    def _build_graph(self) -> StateGraph:
        """Build the LangGraph workflow"""
        
        workflow = StateGraph(ProjectState)
        
        # Add nodes
        workflow.add_node("analyze_requirements", self._analyze_requirements)
        workflow.add_node("plan_architecture", self._plan_architecture)
        workflow.add_node("define_ux", self._define_ux)
        
        # Specialists
        workflow.add_node("frontend_dev", self._frontend_coding)
        workflow.add_node("backend_dev", self._backend_coding)
        
        # Validators
        workflow.add_node("review_design", self._review_design)
        workflow.add_node("review_code", self._review_code)
        
        workflow.add_node("create_deployment", self._create_deployment)
        workflow.add_node("write_docs", self._write_docs)
        workflow.add_node("finalize", self._finalize)
        
        # Define edges
        workflow.set_entry_point("analyze_requirements")
        workflow.add_edge("analyze_requirements", "plan_architecture")
        workflow.add_edge("plan_architecture", "define_ux")
        
        # Routing to specialists
        workflow.add_conditional_edges(
            "define_ux",
            self._route_development,
            {
                "frontend": "frontend_dev",
                "backend": "backend_dev",
                "done": "create_deployment" 
            }
        )
        
        # Validation Paths
        workflow.add_edge("frontend_dev", "review_design")
        
        workflow.add_conditional_edges(
            "review_design",
            self._handle_design_review,
            {
                "approved": "review_code",
                "rejected": "frontend_dev"
            }
        )
        
        workflow.add_edge("backend_dev", "review_code")
        
        # QA Loop
        workflow.add_conditional_edges(
            "review_code",
            self._route_development,
            {
                "frontend": "frontend_dev",
                "backend": "backend_dev",
                "done": "create_deployment"
            }
        )
        
        # Post-coding
        workflow.add_edge("create_deployment", "write_docs")
        workflow.add_edge("write_docs", "finalize") 
        workflow.add_edge("finalize", END)
        
        return workflow.compile()
    
    # --- Expert Nodes ---
    
    def _analyze_requirements(self, state: ProjectState) -> ProjectState:
        """Senior Product Manager"""
        self.update_agent("analyze", "active")
        self.log("📋 Senior PM: Analyzing market requirements and user stories...")
        
        prompt = f"""You are a Senior Product Manager at a Top Tier Tech Company.
Project Name: {state['name']}
High-Level Description: {state['description']}

Your Task:
1. Elaborate on the user's idea, filling in missing feature details.
2. Define a set of clear User Stories.
3. List Functional and Non-Functional Requirements.
4. Establish the MVP (Minimum Viable Product) scope.

Output: A professional Requirements Document (PRD) in Markdown."""

        try:
            response = self.llm.invoke(prompt)
            requirements = response.content
        except Exception as e:
            self.log(f"Error: {e}")
            requirements = "Standard Requirements"
        
        self.update_agent("analyze", "completed")
        return {**state, "requirements": requirements}
    
    def _plan_architecture(self, state: ProjectState) -> ProjectState:
        """Principal Systems Architect"""
        self.update_agent("plan", "active")
        self.log("🏗️ Principal Architect: Designing system topology & stack...")
        
        prompt = f"""You are a Principal Software Architect.
Requirements:
{state['requirements'][:2000]}

Your Task:
1. Choose the best Tech Stack (Backend: Python/FastAPI/Node, Frontend: HTML/CSS/JS or React).
2. Design a clean, modular file structure.
3. Assign each file to 'frontend' or 'backend' team.
4. IMPORTANT: Include 'requirements.txt' or 'package.json' if needed.

Output ONLY a raw JSON array of file objects.
Example:
[
  {{"path": "index.html", "description": "Landing page with Hero section", "owner": "frontend"}},
  {{"path": "api.py", "description": "FastAPI entry point", "owner": "backend"}},
  {{"path": "requirements.txt", "description": "Python dependencies", "owner": "backend"}}
]"""
        
        try:
            response = self.llm.invoke(prompt)
            match = re.search(r'\[[\s\S]*\]', response.content)
            file_structure = json.loads(match.group()) if match else [{"path":"README.md","owner":"backend"}]
        except: 
            file_structure = [{"path":"README.md","owner":"backend"}]
            architecture = "Standard Architecture"
        else:
            architecture = response.content
        
        self.update_agent("plan", "completed", {"files": len(file_structure)})
        return {**state, "architecture": architecture, "file_structure": file_structure, "current_file_index": 0, "retry_count": 0}

    def _define_ux(self, state: ProjectState) -> ProjectState:
        """Creative Director (UX/UI)"""
        self.update_agent("ux", "active")
        self.log("🎨 Creative Director: Establishing design language...")
        
        prompt = f"""You are a Creative Director.
Requirements: {state['requirements'][:2000]}

Your Task:
Define a Design System:
1. Color Palette (Primary, Secondary, Accent, Background - HEX codes).
2. Typography (Fonts, sizes, weights).
3. Component Style (Buttons, Cards, Inputs).
4. Layout Principles (Flexbox/Grid strategies).

Output: A visual style guide in Markdown."""
        try: 
            response = self.llm.invoke(prompt)
            design_system = response.content
        except: 
            design_system = "Standard Design"
        self.update_agent("ux", "completed")
        return {**state, "design_system": design_system}

    def _route_development(self, state: ProjectState) -> str:
        """Router"""
        idx = state["current_file_index"]
        if idx >= len(state["file_structure"]): return "done"
        
        current_file = state["file_structure"][idx]["path"]
        feedback_owner = None
        if state.get("review_feedback", {}).get(current_file):
            # Route back for fixes
            owner_str = state["file_structure"][idx].get("owner", "backend").lower()
            if "frontend" in owner_str or any(x in current_file for x in ['.html','.css','.js','.tsx']):
                return "frontend"
            return "backend"

        # Standard routing
        file_info = state["file_structure"][idx]
        owner = file_info.get("owner", "backend").lower()
        if "frontend" in owner or any(x in file_info["path"] for x in ['.html','.css','.js','.tsx']): 
            return "frontend"
        return "backend"

    def _frontend_coding(self, state: ProjectState) -> ProjectState:
        return self._generate_code(state, "frontend_dev", "Senior Frontend Engineer", "Crafting UI")

    def _backend_coding(self, state: ProjectState) -> ProjectState:
        return self._generate_code(state, "backend_dev", "Senior Backend Engineer", "Implementing Logic")

    def _generate_code(self, state: ProjectState, agent_id: str, role: str, action: str) -> ProjectState:
        idx = state["current_file_index"]
        file_info = state["file_structure"][idx]
        file_path = file_info["path"]
        file_desc = file_info.get("description", "No description")
        feedback = state.get("review_feedback", {}).get(file_path)
        
        self.update_agent(agent_id, "active", {"file": file_path, "status": "fixing" if feedback else "coding"})
        self.log(f"💻 {role}: {action} for {file_path}...")
        
        context = f"""
PROJECT CONTEXT:
Requirements: {state['requirements'][:500]}...
Design System: {state.get('design_system', '')[:500]}...

CURRENT TASK:
File: {file_path}
Description: {file_desc}
"""

        if feedback:
            prompt = f"""You are a {role}.
CRITICAL TASK: Fix Code based on review breakdown.
Breakdown: {feedback}

{context}

Respond ONLY with the complete, corrected code."""
        else:
            prompt = f"""You are a {role}.
Task: Write production-ready code for '{file_path}'.

{context}

Guidelines:
- Modern Best Practices.
- Proper Error Handling.
- Clean Code & Comments.
- If HTML/CSS, make it RESPONSIVE (mobile-first).

Respond ONLY with the complete code block."""

        try: code = self._clean_code(self.llm.invoke(prompt).content)
        except: code = "// Error generating code"
        
        # Replace or append
        files = [f for f in state["generated_files"] if f["path"] != file_path]
        files.append({"path": file_path, "content": code})
        
        self.update_agent(agent_id, "completed")
        return {**state, "generated_files": files}

    def _review_design(self, state: ProjectState) -> ProjectState:
        """Design Lead"""
        idx = state["current_file_index"]
        file_path = state["file_structure"][idx]["path"]
        content = next((f["content"] for f in state["generated_files"] if f["path"] == file_path), "")
        
        self.update_agent("design_lead", "active", {"file": file_path})
        self.log(f"🎨 Design Lead: Auditing {file_path}...")

        # CIRCUIT BREAKER
        retry_count = state.get("retry_count", 0)
        if retry_count >= 3:
            self.log(f"⚠️ Design Lead: Max retries ({retry_count}) reached. Forcing approval to proceed.")
            feedback_map = state.get("review_feedback", {}).copy()
            if file_path in feedback_map: del feedback_map[file_path]
            self.update_agent("design_lead", "completed")
            return {**state, "review_feedback": feedback_map, "retry_count": 0}
        
        prompt = f"""You are a strict Design Lead. Audit this UI file.
File: {file_path}
Code Preview:
{content[:1500]}...

Checklist:
1. Is it aesthetically pleasing?
2. Is it responsive (uses media queries/@media)?
3. Does it follow modern UI patterns?
4. Are there no broken placeholders?

Verdict:
- APPROVED
- REJECTED: <Specific actionable reason>"""
        
        try: review = self.llm.invoke(prompt).content.strip()
        except: review = "APPROVED"
        
        feedback_map = state.get("review_feedback", {}).copy()
        
        if "APPROVED" in review.upper() and "REJECTED" not in review.upper():
            self.log(f"✅ Design Lead: {file_path} Passed Audit.")
            if file_path in feedback_map: del feedback_map[file_path]
            self.update_agent("design_lead", "completed")
            return {**state, "review_feedback": feedback_map, "retry_count": 0}
        else:
            reason = review.replace("REJECTED:", "").strip()
            self.log(f"❌ Design Lead: Rejected {file_path}. {reason}")
            feedback_map[file_path] = f"Design Audit Fix: {reason}"
            self.update_agent("design_lead", "completed")
            return {**state, "review_feedback": feedback_map, "retry_count": retry_count + 1}

    def _handle_design_review(self, state: ProjectState) -> str:
        idx = state["current_file_index"]
        file_path = state["file_structure"][idx]["path"]
        if state.get("review_feedback", {}).get(file_path): return "rejected"
        return "approved"

    def _review_code(self, state: ProjectState) -> ProjectState:
        """QA Lead"""
        idx = state["current_file_index"]
        file_path = state["file_structure"][idx]["path"]
        content = next((f["content"] for f in state["generated_files"] if f["path"] == file_path), "")
        
        self.update_agent("qa", "active", {"file": file_path})
        self.log(f"🕵️ QA Lead: Validating logic for {file_path}...")

        # CIRCUIT BREAKER
        retry_count = state.get("retry_count", 0)
        if retry_count >= 3:
            self.log(f"⚠️ QA Lead: Max retries ({retry_count}) reached. Forcing approval to proceed.")
            feedback_map = state.get("review_feedback", {}).copy()
            if file_path in feedback_map: del feedback_map[file_path]
            self.update_agent("qa", "completed")
            return {**state, "current_file_index": idx + 1, "review_feedback": feedback_map, "retry_count": 0}
        
        prompt = f"""You are a QA Lead. Validate this code.
File: {file_path}
Requirements Summary: {state['requirements'][:800]}

Code:
{content[:2000]}...

Checklist:
1. Does it fulfill the core requirement?
2. Is the logic sound?
3. Are there obvious bugs?

Verdict:
- APPROVED
- REJECTED: <Specific actionable reason>"""
        
        try: review = self.llm.invoke(prompt).content.strip()
        except: review = "APPROVED"
        
        feedback_map = state.get("review_feedback", {}).copy()
        
        if "APPROVED" in review.upper() and "REJECTED" not in review.upper():
            self.log(f"✅ QA Lead: {file_path} Verified.")
            if file_path in feedback_map: del feedback_map[file_path]
            self.update_agent("qa", "completed")
            
            # Move to next file on success
            return {**state, "current_file_index": idx + 1, "review_feedback": feedback_map, "retry_count": 0}
        else:
            reason = review.replace("REJECTED:", "").strip()
            self.log(f"❌ QA Lead: Rejected {file_path}. {reason}")
            feedback_map[file_path] = f"QA Fix: {reason}"
            self.update_agent("qa", "completed")
            return {**state, "review_feedback": feedback_map, "retry_count": retry_count + 1}

    def _create_deployment(self, state: ProjectState) -> ProjectState:
        """DevOps Engineer"""
        self.update_agent("devops", "active")
        self.log("🚀 DevOps Engineer: Containerizing application...")
        
        prompt = f"""You are a DevOps Engineer. Create a Dockerfile.
Stack Context: {state['architecture'][:500]}
File Structure: {[f['path'] for f in state['file_structure']]}

Output ONLY valid Dockerfile content."""
        
        try: dockerfile = self._clean_code(self.llm.invoke(prompt).content)
        except: dockerfile = "# Dockerfile generation failed"
        
        files = state["generated_files"] + [{"path": "Dockerfile", "content": dockerfile}]
        self.update_agent("devops", "completed")
        return {**state, "generated_files": files}

    def _write_docs(self, state: ProjectState) -> ProjectState:
        """Technical Writer"""
        self.update_agent("writer", "active")
        self.log("📝 Tech Writer: Compiling documentation...")
        
        prompt = f"""You are a Technical Writer. Write a README.md.
Project: {state['name']}
Description: {state['description']}
Stack: {state.get('architecture', 'Standard')}

Include:
1. Project Overview
2. Installation Instructions
3. Usage Guide

Output Markdown."""
        
        try: readme = self.llm.invoke(prompt).content
        except: readme = "# README"
        
        files = state["generated_files"] + [{"path": "README.md", "content": readme}]
        self.update_agent("writer", "completed")
        return {**state, "generated_files": files}

    def _finalize(self, state: ProjectState) -> ProjectState:
        self.update_agent("finalize", "active")
        self.log(f"🎉 MISSION ACCOMPLISHED: {state['name']} is ready!")
        self.update_agent("finalize", "completed")
        return {**state, "status": "completed"}
        
    def _clean_code(self, code: str) -> str:
        # Extract content between triple backticks if present
        match = re.search(r'```(?:\w+)?\n?(.*?)```', code, re.DOTALL)
        if match:
            return match.group(1).strip()
        
        # Fallback: remove simple backticks if logic fails
        code = re.sub(r'^```\w*\n?', '', code, flags=re.MULTILINE)
        code = re.sub(r'\n?```$', '', code, flags=re.MULTILINE)
        return code.strip()

    def generate_project(self, name: str, description: str) -> dict:
        self.log(f"🚀 INITIATING PROJECT: {name}")
        state = {
            "name": name, "description": description, "requirements": "", "architecture": "",
            "design_system": "", "file_structure": [], "generated_files": [], 
            "current_file_index": 0, "review_feedback": {}, "status": "starting", "logs": [],
            "retry_count": 0
        }
        return {"files": self.graph.invoke(state, {"recursion_limit": 100})["generated_files"]}

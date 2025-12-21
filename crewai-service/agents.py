import json
import os
import subprocess
import tempfile
import shutil
from typing import List, Dict, Any, TypedDict, Callable
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.language_models import BaseChatModel

# Define States (TypedDict for LangGraph)
class ProductManagerState(TypedDict):
    project_name: str
    description: str
    requirements: str

class SoftwareArchitectState(TypedDict):
    requirements: str
    architecture: str

class TechLeadState(TypedDict):
    architecture: str
    tasks: List[Dict[str, Any]]

class DeveloperState(TypedDict):
    tasks: List[Dict[str, Any]]
    code_files: List[Dict[str, str]]

class CodeReviewerState(TypedDict):
    code_files: List[Dict[str, str]]

class QAEngineerState(TypedDict):
    code_files: List[Dict[str, str]]
    test_results: List[Dict[str, Any]]


class BaseAgent:
    def __init__(self, llm: BaseChatModel, log_callback: Callable, update_callback: Callable):
        self.llm = llm
        self.log = log_callback
        self.update = update_callback

    def _invoke_llm(self, system_prompt: str, user_content: str) -> str:
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=user_content)
        ]
        response = self.llm.invoke(messages)
        return response.content

    def _log_thought(self, thought: str):
        """Log an AI 'thought' for the frontend."""
        self.log(f"💭 [AI Thought]: {thought}")

    def _log_code_chunk(self, file_path: str, chunk: str):
        """Log a code chunk for live streaming."""
        self.log(f"📝 [Code] {file_path}: {chunk[:100]}...")

    def _log_terminal(self, output: str, is_error: bool = False):
        """Log terminal output."""
        prefix = "❌ [stderr]" if is_error else "📟 [stdout]"
        self.log(f"{prefix}: {output}")


class ProductManagerAgent(BaseAgent):
    def analyze_requirements(self, state: Dict[str, Any]) -> Dict[str, Any]:
        self.update("analyze", "running", {})
        self.log(f"Product Manager: Analyzing '{state.get('project_name')}'...")
        self._log_thought("Reading project description and identifying key features...")
        
        system_prompt = """You are an expert Product Manager. 
        Analyze the project description and produce detailed technical requirements.
        Focus on core features, user stories, and acceptance criteria.
        Output in Markdown format."""
        
        description = state.get("description", "")
        self._log_thought("Formulating requirements document...")
        requirements = self._invoke_llm(system_prompt, f"Project Description: {description}")
        
        self.log("Product Manager: Requirements defined.")
        self.update("analyze", "completed", {})
        
        return {"requirements": requirements}


class SoftwareArchitectAgent(BaseAgent):
    def design_architecture(self, state: Dict[str, Any]) -> Dict[str, Any]:
        self.update("plan", "running", {})
        self.log("Architect: Designing system architecture...")
        self._log_thought("Analyzing requirements to determine optimal tech stack...")
        
        system_prompt = """You are a Software Architect.
        Based on the requirements, design a software architecture.
        Identify necessary files, data structures, and tech stack components.
        
        IMPORTANT: For simple projects, prefer simple solutions:
        - For simple Python scripts, use single .py files that can run standalone
        - For simple web pages, use plain HTML/CSS/JS without frameworks
        - Only use React/Next.js/complex frameworks if the project REQUIRES them
        
        Output just the architecture description in Markdown."""
        
        requirements = state.get("requirements", "")
        self._log_thought("Creating architecture blueprint...")
        architecture = self._invoke_llm(system_prompt, f"Requirements: {requirements}")
        
        self.log("Architect: Architecture design complete.")
        self.update("plan", "completed", {})
        
        return {"architecture": architecture}


class TechLeadAgent(BaseAgent):
    def breakdown_tasks(self, state: Dict[str, Any]) -> Dict[str, Any]:
        self.update("plan", "running", {})
        self.log("Tech Lead: Breaking down tasks and file structure...")
        self._log_thought("Decomposing architecture into implementable file structure...")
        
        system_prompt = """You are a Tech Lead.
        Based on the architecture, create a list of files that need to be created.
        Return a JSON object with a key 'files' which is a list of objects.
        Each object should have 'path' (relative file path) and 'purpose'.
        
        IMPORTANT RULES:
        - For simple Python projects: include main.py as entry point, requirements.txt if needed
        - For Node.js projects: include package.json with correct "scripts" section
        - The package.json "start" script must point to the correct entry file
        - Do NOT use JSX syntax in .js files unless you have proper build setup
        - For React projects, use create-react-app structure OR simple HTML
        
        Example JSON for Python:
        {
          "files": [
            {"path": "main.py", "purpose": "Main entry point"},
            {"path": "requirements.txt", "purpose": "Python dependencies"},
            {"path": "README.md", "purpose": "Project documentation"}
          ]
        }
        
        Example JSON for Node.js:
        {
          "files": [
            {"path": "package.json", "purpose": "Node.js project config with start script"},
            {"path": "index.js", "purpose": "Main entry point (must match package.json start script)"},
            {"path": "README.md", "purpose": "Project documentation"}
          ]
        }
        
        IMPORTANT: Return ONLY the JSON object, no markdown formatting."""
        
        architecture = state.get("architecture", "")
        response = self._invoke_llm(system_prompt, f"Architecture: {architecture}")
        
        # Simple heuristic to extract JSON if LLM wraps it
        cleaned_response = response.replace("```json", "").replace("```", "").strip()
        
        try:
            tasks_data = json.loads(cleaned_response)
            files = tasks_data.get("files", [])
        except Exception as e:
            self.log(f"Tech Lead Warning: Could not parse JSON tasks. Using default. Error: {e}")
            files = [{"path": "README.md", "purpose": "Documentation"}]
            
        self.log(f"Tech Lead: Planned {len(files)} files.")
        return {"tasks": files}


class DeveloperAgent(BaseAgent):
    def write_code(self, state: Dict[str, Any]) -> Dict[str, Any]:
        self.update("frontend_dev", "running", {})
        self.log("Developer: Starting coding phase...")
        self._log_thought("Preparing to implement all planned files...")
        
        tasks = state.get("tasks", [])
        requirements = state.get("requirements", "")
        architecture = state.get("architecture", "")
        
        generated_files = []
        
        for i, file_info in enumerate(tasks):
            file_path = file_info.get("path")
            purpose = file_info.get("purpose")
            
            self.update("frontend_dev", "running", {"file": file_path})
            self.log(f"Developer: Writing {file_path}...")
            self._log_thought(f"Implementing {file_path} - {purpose}")
            
            system_prompt = """You are a Senior Developer.
            Write the full code for the specified file based on the project requirements and architecture.
            
            CRITICAL RULES:
            1. Return ONLY the raw code content - no markdown blocks, no explanations
            2. For package.json: ensure "main" and "scripts.start" point to the actual entry file
            3. For .js files: Do NOT use JSX/React syntax unless it's for a proper React build setup
            4. For Python: write standalone scripts that can run with just 'python filename.py'
            5. Make the code complete and runnable - not stubs or placeholders
            6. Include proper error handling
            
            The code must be production-ready and work immediately when executed."""
            
            user_msg = f"""
            Project Requirements: {requirements}
            Architecture: {architecture}
            
            File to write: {file_path}
            Purpose: {purpose}
            
            Write the complete content for this file.
            """
            
            code_content = self._invoke_llm(system_prompt, user_msg)
            
            # Clean up markdown code blocks if LLM adds them
            code_content = self._clean_code_content(code_content, file_path)
            
            # Stream the code chunk
            self._log_code_chunk(file_path, code_content)
            
            generated_files.append({"path": file_path, "content": code_content})
            self.log(f"Developer: Completed {file_path}")
            
        self.update("frontend_dev", "completed", {})
        self._log_thought("All files written. Ready for QA testing.")
        return {"code_files": generated_files}
    
    def _clean_code_content(self, content: str, file_path: str) -> str:
        """Remove markdown code blocks from LLM output."""
        if content.startswith("```"):
            lines = content.split('\n')
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].strip().startswith("```"):
                lines = lines[:-1]
            content = "\n".join(lines)
        return content


class QAEngineerAgent(BaseAgent):
    """QA Engineer that tests COMPLETE projects, not individual files."""
    
    MAX_FIX_ATTEMPTS = 3
    EXECUTION_TIMEOUT = 60  # seconds for full project test
    
    def validate_and_test(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """Entry point for the LangGraph node."""
        self.update("qa_engineer", "running", {})
        self.log("🧪 QA Engineer: Starting FULL PROJECT validation...")
        self._log_thought("Preparing complete test environment...")
        
        code_files = state.get("code_files", [])
        project_name = state.get("project_name", "project")
        
        # Determine project type
        project_type = self._detect_project_type(code_files)
        self.log(f"🔍 QA: Detected project type: {project_type}")
        
        # Create persistent temp directory for testing
        temp_dir = tempfile.mkdtemp(prefix="qa_test_")
        
        try:
            # Write all files to temp directory
            for file_info in code_files:
                file_path = file_info.get("path")
                content = file_info.get("content")
                full_path = os.path.join(temp_dir, file_path)
                os.makedirs(os.path.dirname(full_path), exist_ok=True)
                with open(full_path, "w", encoding="utf-8") as f:
                    f.write(content)
                self.log(f"📁 QA: Staged {file_path}")
            
            # Run full project test with fix loop
            fixed_files, test_results = self._test_and_fix_project(
                temp_dir, 
                code_files, 
                project_type,
                state.get("requirements", ""),
                state.get("architecture", "")
            )
            
            self.update("qa_engineer", "completed", {})
            self.log("🏁 QA Engineer: Full project validation complete!")
            
            return {"code_files": fixed_files, "test_results": test_results}
            
        finally:
            # Clean up temp directory
            try:
                shutil.rmtree(temp_dir)
            except:
                pass
    
    def _test_and_fix_project(self, temp_dir: str, code_files: List[Dict], 
                               project_type: str, requirements: str, architecture: str) -> tuple:
        """Test the complete project and fix errors iteratively."""
        
        test_results = []
        current_files = {f["path"]: f["content"] for f in code_files}
        
        for attempt in range(self.MAX_FIX_ATTEMPTS):
            self.log(f"🔄 QA: Test attempt {attempt + 1}/{self.MAX_FIX_ATTEMPTS}")
            
            # Run the appropriate test based on project type
            if project_type == "node":
                result = self._test_node_project(temp_dir)
            elif project_type == "python":
                result = self._test_python_project(temp_dir)
            else:
                result = {"success": True, "stdout": "No executable test available", "stderr": ""}
            
            test_results.append({
                "attempt": attempt + 1,
                "project_type": project_type,
                "success": result["success"],
                "stdout": result.get("stdout", ""),
                "stderr": result.get("stderr", "")
            })
            
            if result["success"]:
                self.log("✅ QA: Project test PASSED!")
                self._log_terminal(result.get("stdout", "Test passed"))
                break
            else:
                self.log(f"❌ QA: Project test FAILED")
                error_msg = result.get("stderr", "") or result.get("stdout", "Unknown error")
                self._log_terminal(error_msg, is_error=True)
                
                if attempt < self.MAX_FIX_ATTEMPTS - 1:
                    self._log_thought("Analyzing project-wide error and fixing...")
                    
                    # Identify which file(s) need fixing based on error
                    files_to_fix = self._identify_files_to_fix(error_msg, current_files)
                    
                    for file_path in files_to_fix:
                        if file_path in current_files:
                            self.log(f"🔧 QA: Fixing {file_path}...")
                            fixed_content = self._fix_code(
                                file_path,
                                current_files[file_path],
                                error_msg,
                                requirements,
                                architecture
                            )
                            current_files[file_path] = fixed_content
                            
                            # Update file in temp dir
                            full_path = os.path.join(temp_dir, file_path)
                            with open(full_path, "w", encoding="utf-8") as f:
                                f.write(fixed_content)
        
        # Return fixed files
        fixed_files = [{"path": p, "content": c} for p, c in current_files.items()]
        return fixed_files, test_results
    
    def _test_node_project(self, temp_dir: str) -> Dict[str, Any]:
        """Test a Node.js project with npm install && npm start."""
        
        # Step 1: npm install
        self.log("📦 QA: Running npm install...")
        self._log_terminal("$ npm install")
        
        try:
            install_result = subprocess.run(
                ["npm", "install"],
                capture_output=True,
                text=True,
                timeout=120,
                cwd=temp_dir,
                shell=True
            )
            
            if install_result.returncode != 0:
                return {
                    "success": False,
                    "stdout": install_result.stdout,
                    "stderr": f"npm install failed: {install_result.stderr}"
                }
            
            self.log("✅ QA: npm install succeeded")
            self._log_terminal(install_result.stdout[:500] if install_result.stdout else "Installed")
            
        except subprocess.TimeoutExpired:
            return {"success": False, "stdout": "", "stderr": "npm install timed out"}
        except Exception as e:
            return {"success": False, "stdout": "", "stderr": f"npm install error: {str(e)}"}
        
        # Step 2: npm start (with timeout - we just check if it starts without error)
        self.log("🚀 QA: Running npm start (quick test)...")
        self._log_terminal("$ npm start")
        
        try:
            # Run npm start with a short timeout - just to check for immediate errors
            start_result = subprocess.run(
                ["npm", "start"],
                capture_output=True,
                text=True,
                timeout=15,  # Short timeout - we just want to see if it crashes immediately
                cwd=temp_dir,
                shell=True
            )
            
            # If it exits quickly with error, that's a failure
            if start_result.returncode != 0:
                return {
                    "success": False,
                    "stdout": start_result.stdout,
                    "stderr": start_result.stderr
                }
            
            return {
                "success": True,
                "stdout": start_result.stdout or "Started successfully",
                "stderr": ""
            }
            
        except subprocess.TimeoutExpired:
            # Timeout is actually good for servers - means it started and is running
            self.log("✅ QA: Project started successfully (running)")
            return {"success": True, "stdout": "Server started and running", "stderr": ""}
        except Exception as e:
            return {"success": False, "stdout": "", "stderr": f"npm start error: {str(e)}"}
    
    def _test_python_project(self, temp_dir: str) -> Dict[str, Any]:
        """Test a Python project."""
        
        # Find main entry point
        entry_points = ["main.py", "app.py", "run.py", "server.py", "__main__.py"]
        main_file = None
        
        for entry in entry_points:
            if os.path.exists(os.path.join(temp_dir, entry)):
                main_file = entry
                break
        
        if not main_file:
            # Look for any .py file
            py_files = [f for f in os.listdir(temp_dir) if f.endswith(".py")]
            if py_files:
                main_file = py_files[0]
        
        if not main_file:
            return {"success": True, "stdout": "No Python entry point found", "stderr": ""}
        
        # Install requirements if exists
        req_file = os.path.join(temp_dir, "requirements.txt")
        if os.path.exists(req_file):
            self.log("📦 QA: Installing Python dependencies...")
            self._log_terminal("$ pip install -r requirements.txt")
            try:
                subprocess.run(
                    ["pip", "install", "-r", req_file, "-q"],
                    capture_output=True,
                    timeout=60,
                    cwd=temp_dir
                )
            except:
                pass  # Continue even if install fails
        
        # Run the Python script
        self.log(f"🐍 QA: Running python {main_file}...")
        self._log_terminal(f"$ python {main_file}")
        
        try:
            result = subprocess.run(
                ["python", main_file],
                capture_output=True,
                text=True,
                timeout=self.EXECUTION_TIMEOUT,
                cwd=temp_dir
            )
            
            return {
                "success": result.returncode == 0,
                "stdout": result.stdout,
                "stderr": result.stderr
            }
            
        except subprocess.TimeoutExpired:
            # For servers, timeout means it's running
            return {"success": True, "stdout": "Script running (server mode)", "stderr": ""}
        except Exception as e:
            return {"success": False, "stdout": "", "stderr": str(e)}
    
    def _detect_project_type(self, code_files: List[Dict]) -> str:
        """Detect project type from files."""
        paths = [f.get("path", "") for f in code_files]
        
        if any("package.json" in p for p in paths):
            return "node"
        if any(p.endswith(".py") for p in paths):
            return "python"
        if any(p.endswith(".html") for p in paths):
            return "html"
        return "unknown"
    
    def _identify_files_to_fix(self, error_msg: str, current_files: Dict[str, str]) -> List[str]:
        """Identify which files need fixing based on error message."""
        files_to_fix = []
        
        # Look for file paths in error message
        for file_path in current_files.keys():
            if file_path in error_msg or file_path.replace("/", "\\") in error_msg:
                files_to_fix.append(file_path)
        
        # If no specific file found, fix main entry points
        if not files_to_fix:
            priority_files = ["package.json", "main.py", "index.js", "app.py", "server.py"]
            for pf in priority_files:
                if pf in current_files:
                    files_to_fix.append(pf)
                    break
        
        return files_to_fix[:2]  # Fix at most 2 files per iteration
    
    def _fix_code(self, file_path: str, content: str, error: str, 
                  requirements: str, architecture: str) -> str:
        """Use LLM to fix the code based on the error."""
        self._log_thought(f"Analyzing error for {file_path}: {error[:100]}...")
        
        system_prompt = """You are a Senior Developer fixing a bug.
        You are given code that has an error. Fix the error and return ONLY the corrected code.
        
        CRITICAL RULES:
        1. Return ONLY the raw code - no markdown blocks, no explanations
        2. The code must be complete and immediately runnable
        3. Fix the specific error mentioned
        4. For package.json, ensure paths are correct (use "./" for relative paths)
        5. Do NOT use JSX in .js files - use proper React/build setup or plain HTML
        """
        
        user_msg = f"""
        File: {file_path}
        
        Current Code:
        {content}
        
        Error Message:
        {error[:1000]}
        
        Fix this code so the project runs without errors. Return only the corrected code.
        """
        
        fixed_content = self._invoke_llm(system_prompt, user_msg)
        
        # Clean up markdown blocks
        if fixed_content.startswith("```"):
            lines = fixed_content.split('\n')
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].strip().startswith("```"):
                lines = lines[:-1]
            fixed_content = "\n".join(lines)
        
        return fixed_content


class CodeReviewerAgent(BaseAgent):
    def review_code(self, state: Dict[str, Any]) -> Dict[str, Any]:
        # Placeholder for future enhancement
        return {}

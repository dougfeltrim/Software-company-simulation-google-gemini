"""
CrewAI Crew Definition
Orchestrates agents working together on project generation.
"""

from crewai import Crew, Process
from agents import create_product_manager, create_developer, create_qa_engineer
from tasks import (
    create_requirements_task,
    create_file_structure_task,
    create_code_generation_task,
    create_review_task
)
import json
import re
from typing import Callable, Optional


class SoftwareCompanyCrew:
    """
    A crew of AI agents that work together to generate software projects.
    """
    
    def __init__(self, model: str = None, on_log: Optional[Callable[[str], None]] = None):
        self.model = model
        self.on_log = on_log or print
        
        # Create agents
        self.pm = create_product_manager(model)
        self.developer = create_developer(model)
        self.qa = create_qa_engineer(model)
        
    def log(self, message: str):
        """Send log message to callback"""
        self.on_log(message)
    
    def generate_project(self, name: str, description: str) -> dict:
        """
        Generate a complete project based on description.
        
        Returns:
            dict with 'files' (list of {path, content}) and 'requirements' (str)
        """
        self.log(f"🚀 Starting project: {name}")
        
        # Step 1: Product Manager analyzes requirements
        self.log("📋 Product Manager: Analyzing requirements...")
        
        req_task = create_requirements_task(description, self.pm)
        req_crew = Crew(
            agents=[self.pm],
            tasks=[req_task],
            process=Process.sequential,
            verbose=True
        )
        requirements = req_crew.kickoff()
        requirements_str = str(requirements)
        
        self.log(f"✅ Requirements defined ({len(requirements_str)} chars)")
        
        # Step 2: Product Manager plans file structure
        self.log("📁 Product Manager: Planning file structure...")
        
        structure_task = create_file_structure_task(requirements_str, self.pm)
        structure_crew = Crew(
            agents=[self.pm],
            tasks=[structure_task],
            process=Process.sequential,
            verbose=True
        )
        structure_result = structure_crew.kickoff()
        
        # Parse JSON from result
        files_to_create = self._parse_file_structure(str(structure_result))
        self.log(f"✅ Planned {len(files_to_create)} files")
        
        # Step 3: Developer generates each file
        generated_files = []
        
        for i, file_info in enumerate(files_to_create):
            file_path = file_info.get("path", f"file_{i}.txt")
            file_desc = file_info.get("description", "")
            
            self.log(f"💻 Developer: Generating {file_path}...")
            
            code_task = create_code_generation_task(
                file_path, file_desc, requirements_str, self.developer
            )
            code_crew = Crew(
                agents=[self.developer],
                tasks=[code_task],
                process=Process.sequential,
                verbose=True
            )
            code_result = code_crew.kickoff()
            code = self._clean_code(str(code_result))
            
            # Optional: QA review
            # self.log(f"🔍 QA: Reviewing {file_path}...")
            # review_task = create_review_task(code, file_path, self.qa)
            # ... (can be added for more thorough generation)
            
            generated_files.append({
                "path": file_path,
                "content": code
            })
            
            self.log(f"✅ Generated {file_path} ({len(code)} chars)")
        
        self.log(f"🎉 Project '{name}' completed with {len(generated_files)} files!")
        
        return {
            "files": generated_files,
            "requirements": requirements_str
        }
    
    def _parse_file_structure(self, result: str) -> list:
        """Extract JSON array from LLM response"""
        try:
            # Try to find JSON array in response
            match = re.search(r'\[[\s\S]*\]', result)
            if match:
                return json.loads(match.group())
        except json.JSONDecodeError:
            pass
        
        # Fallback: assume simple web project
        return [
            {"path": "index.html", "description": "Main HTML file"},
            {"path": "styles.css", "description": "CSS styles"},
            {"path": "script.js", "description": "JavaScript logic"}
        ]
    
    def _clean_code(self, code: str) -> str:
        """Clean LLM response to extract just the code"""
        # Remove markdown code blocks if present
        code = re.sub(r'^```\w*\n?', '', code)
        code = re.sub(r'\n?```$', '', code)
        return code.strip()

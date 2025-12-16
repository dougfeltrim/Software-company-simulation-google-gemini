"""
CrewAI Task Definitions
Defines the tasks that agents will perform.
"""

from crewai import Task
from agents import create_product_manager, create_developer, create_qa_engineer


def create_requirements_task(description: str, pm_agent) -> Task:
    """Task for analyzing requirements"""
    return Task(
        description=f"""Analyze the following project request and create detailed requirements:

{description}

Your output should include:
1. Project overview
2. Core features list
3. Technical requirements
4. File structure recommendation (list each file with its purpose)
5. Implementation priorities

Be specific and actionable.""",
        agent=pm_agent,
        expected_output="Detailed project requirements document with file structure"
    )


def create_file_structure_task(requirements: str, pm_agent) -> Task:
    """Task for planning file structure"""
    return Task(
        description=f"""Based on these requirements, create a JSON file structure:

{requirements}

Output ONLY a valid JSON array like this:
[
  {{"path": "index.html", "description": "Main HTML file with page structure"}},
  {{"path": "styles.css", "description": "CSS styles for the application"}},
  {{"path": "script.js", "description": "JavaScript logic and interactivity"}}
]

Include all necessary files for a complete, functional project.""",
        agent=pm_agent,
        expected_output="JSON array of files to create"
    )


def create_code_generation_task(file_path: str, file_description: str, 
                                 project_context: str, dev_agent) -> Task:
    """Task for generating code for a specific file"""
    return Task(
        description=f"""Generate the complete code for this file:

**File:** {file_path}
**Purpose:** {file_description}

**Project Context:**
{project_context}

Write production-ready code. Output ONLY the code, no explanations.
If it's HTML, include complete doctype and structure.
If it's CSS, include all necessary styles.
If it's JavaScript, include proper error handling.""",
        agent=dev_agent,
        expected_output=f"Complete code for {file_path}"
    )


def create_review_task(code: str, file_path: str, qa_agent) -> Task:
    """Task for reviewing generated code"""
    return Task(
        description=f"""Review this code for quality and potential issues:

**File:** {file_path}
**Code:**
```
{code}
```

Check for:
1. Syntax errors
2. Best practices violations
3. Potential bugs
4. Performance issues
5. Security concerns

If the code is good, respond with "APPROVED".
If there are issues, list them clearly.""",
        agent=qa_agent,
        expected_output="Code review results"
    )

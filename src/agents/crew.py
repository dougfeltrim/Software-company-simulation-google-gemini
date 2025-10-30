"""
CrewAI-based software company simulation with multiple agents.
"""

from crewai import Agent, Task, Crew, Process
from langchain_community.llms import Ollama
from typing import Dict, List, Optional, Tuple
import time


class SoftwareCompanyCrewAI:
    """Software company simulation using CrewAI and Ollama."""
    
    def __init__(self, model_name: str = "llama3:3b", ollama_host: str = "http://localhost:11434", 
                 temperature: float = 0.7, hardware_mode: str = "cpu"):
        """
        Initialize the software company with CrewAI agents.
        
        Args:
            model_name: Name of the Ollama model to use
            ollama_host: Ollama API endpoint
            temperature: Model temperature for response generation
            hardware_mode: Hardware mode (cpu or gpu)
        """
        self.model_name = model_name
        self.ollama_host = ollama_host
        self.temperature = temperature
        self.hardware_mode = hardware_mode
        
        # Initialize Ollama LLM
        self.llm = Ollama(
            model=model_name,
            base_url=ollama_host,
            temperature=temperature
        )
        
        # Initialize agents
        self.agents = self._create_agents()
        
    def _create_agents(self) -> Dict[str, Agent]:
        """Create all agents for the software company."""
        
        agents = {}
        
        # Product Manager Agent
        agents['product_manager'] = Agent(
            role='Product Manager',
            goal='Define clear software requirements and product vision',
            backstory="""You are an experienced Product Manager with a keen eye for user needs 
            and market requirements. You excel at translating client needs into clear, 
            actionable requirements that guide the development team.""",
            verbose=True,
            allow_delegation=False,
            llm=self.llm
        )
        
        # Software Architect Agent
        agents['architect'] = Agent(
            role='Software Architect',
            goal='Design robust and scalable software architecture',
            backstory="""You are a seasoned Software Architect with deep knowledge of design 
            patterns, system architecture, and best practices. You create technical designs 
            that are both elegant and practical.""",
            verbose=True,
            allow_delegation=False,
            llm=self.llm
        )
        
        # Developer Agent
        agents['developer'] = Agent(
            role='Software Developer',
            goal='Write clean, efficient, and well-documented code',
            backstory="""You are a skilled Software Developer who writes production-ready code. 
            You follow best practices, write clean code, and ensure everything works correctly. 
            You are proficient in Python and other modern programming languages.""",
            verbose=True,
            allow_delegation=False,
            llm=self.llm
        )
        
        # Technical Writer Agent
        agents['technical_writer'] = Agent(
            role='Technical Writer',
            goal='Create comprehensive and clear technical documentation',
            backstory="""You are an expert Technical Writer who creates documentation that 
            developers and users love. You explain complex concepts clearly and ensure all 
            documentation is accurate and helpful.""",
            verbose=True,
            allow_delegation=False,
            llm=self.llm
        )
        
        # QA Engineer Agent
        agents['qa_engineer'] = Agent(
            role='QA Engineer',
            goal='Ensure software quality through testing and validation',
            backstory="""You are a meticulous QA Engineer who ensures software meets quality 
            standards. You design test cases, identify bugs, and validate that everything 
            works as expected.""",
            verbose=True,
            allow_delegation=False,
            llm=self.llm
        )
        
        return agents
    
    def _create_tasks(self, project_description: str) -> List[Task]:
        """Create tasks for the software development process."""
        
        tasks = []
        
        # Task 1: Product Requirements
        task_requirements = Task(
            description=f"""Analyze the following project description and create detailed 
            software requirements:
            
            Project: {project_description}
            
            Provide:
            1. Clear project objectives
            2. Functional requirements
            3. Non-functional requirements
            4. User stories (if applicable)
            5. Success criteria
            
            Be specific and actionable.""",
            agent=self.agents['product_manager'],
            expected_output="Detailed software requirements document"
        )
        tasks.append(task_requirements)
        
        # Task 2: Architecture Design
        task_architecture = Task(
            description="""Based on the requirements, design the software architecture:
            
            Include:
            1. System architecture overview
            2. Component breakdown
            3. Technology stack recommendations
            4. Design patterns to use
            5. Data flow and structure
            
            Make it practical and implementable.""",
            agent=self.agents['architect'],
            expected_output="Software architecture design document",
            context=[task_requirements]
        )
        tasks.append(task_architecture)
        
        # Task 3: Code Development
        task_development = Task(
            description="""Implement the software based on the requirements and architecture:
            
            Provide:
            1. Complete, working Python code
            2. Well-structured modules/files
            3. Comments explaining key sections
            4. Error handling
            5. Code that follows best practices
            
            Make it production-ready.""",
            agent=self.agents['developer'],
            expected_output="Complete Python code implementation",
            context=[task_requirements, task_architecture]
        )
        tasks.append(task_development)
        
        # Task 4: Testing
        task_testing = Task(
            description="""Review the code and create a testing plan:
            
            Include:
            1. Test cases for main functionality
            2. Edge cases to consider
            3. Validation approach
            4. Potential issues identified
            5. Testing recommendations
            
            Be thorough and practical.""",
            agent=self.agents['qa_engineer'],
            expected_output="Testing plan and quality assessment",
            context=[task_development]
        )
        tasks.append(task_testing)
        
        # Task 5: Documentation
        task_documentation = Task(
            description="""Create comprehensive documentation for the project:
            
            Include:
            1. Project overview
            2. Installation instructions
            3. Usage guide with examples
            4. API/Function documentation
            5. Troubleshooting section
            
            Make it clear and helpful for users.""",
            agent=self.agents['technical_writer'],
            expected_output="Complete technical documentation",
            context=[task_requirements, task_development]
        )
        tasks.append(task_documentation)
        
        return tasks
    
    def generate_project(self, project_description: str, verbose: bool = True) -> Dict[str, str]:
        """
        Generate a complete software project using CrewAI.
        
        Args:
            project_description: Description of the project to create
            verbose: Whether to show detailed output
            
        Returns:
            Dictionary with project components
        """
        print(f"\n{'='*60}")
        print(f"Starting Software Company Project Generation")
        print(f"Model: {self.model_name} | Hardware: {self.hardware_mode}")
        print(f"{'='*60}\n")
        
        start_time = time.time()
        
        # Create tasks
        tasks = self._create_tasks(project_description)
        
        # Create crew
        crew = Crew(
            agents=list(self.agents.values()),
            tasks=tasks,
            process=Process.sequential,
            verbose=verbose
        )
        
        # Execute the crew
        print("Crew is working on the project...\n")
        result = crew.kickoff()
        
        end_time = time.time()
        duration = end_time - start_time
        
        # Parse results
        project_components = {
            'requirements': tasks[0].output.raw_output if hasattr(tasks[0].output, 'raw_output') else str(tasks[0].output),
            'architecture': tasks[1].output.raw_output if hasattr(tasks[1].output, 'raw_output') else str(tasks[1].output),
            'code': tasks[2].output.raw_output if hasattr(tasks[2].output, 'raw_output') else str(tasks[2].output),
            'testing': tasks[3].output.raw_output if hasattr(tasks[3].output, 'raw_output') else str(tasks[3].output),
            'documentation': tasks[4].output.raw_output if hasattr(tasks[4].output, 'raw_output') else str(tasks[4].output),
            'full_output': str(result),
            'duration_seconds': round(duration, 2),
            'model': self.model_name,
            'hardware_mode': self.hardware_mode
        }
        
        print(f"\n{'='*60}")
        print(f"Project Generation Complete!")
        print(f"Duration: {duration:.2f} seconds")
        print(f"{'='*60}\n")
        
        return project_components


def create_software_company(model_name: str = "llama3:3b", 
                           ollama_host: str = "http://localhost:11434",
                           temperature: float = 0.7,
                           hardware_mode: str = "cpu") -> SoftwareCompanyCrewAI:
    """
    Factory function to create a SoftwareCompanyCrewAI instance.
    
    Args:
        model_name: Name of the Ollama model to use
        ollama_host: Ollama API endpoint
        temperature: Model temperature
        hardware_mode: Hardware mode (cpu or gpu)
        
    Returns:
        SoftwareCompanyCrewAI instance
    """
    return SoftwareCompanyCrewAI(
        model_name=model_name,
        ollama_host=ollama_host,
        temperature=temperature,
        hardware_mode=hardware_mode
    )

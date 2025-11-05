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
        
        # Product Manager Agent - Coordinates and splits tasks
        agents['product_manager'] = Agent(
            role='Product Manager',
            goal='Define clear software requirements, split tasks, and coordinate the team',
            backstory="""You are an experienced Product Manager with a keen eye for user needs 
            and market requirements. You excel at translating client needs into clear, 
            actionable requirements and breaking down projects into parallel workstreams 
            for the development team.""",
            verbose=True,
            allow_delegation=True,  # Can delegate to coordinate parallel work
            llm=self.llm
        )
        
        # Software Architect Agent
        agents['architect'] = Agent(
            role='Software Architect',
            goal='Design robust and scalable software architecture with modular components',
            backstory="""You are a seasoned Software Architect with deep knowledge of design 
            patterns, system architecture, and best practices. You create technical designs 
            that are modular, allowing multiple developers to work in parallel. You excel 
            at defining clear interfaces between components.""",
            verbose=True,
            allow_delegation=True,
            llm=self.llm
        )
        
        # Developer Agents (multiple for parallel work)
        agents['developer_1'] = Agent(
            role='Backend Developer',
            goal='Develop backend components and APIs',
            backstory="""You are a skilled Backend Developer who specializes in server-side 
            logic, databases, and APIs. You write production-ready code and work collaboratively 
            with other developers to ensure components integrate seamlessly.""",
            verbose=True,
            allow_delegation=True,
            llm=self.llm
        )
        
        agents['developer_2'] = Agent(
            role='Frontend Developer',
            goal='Develop frontend components and user interfaces',
            backstory="""You are a skilled Frontend Developer who specializes in user 
            interfaces and client-side logic. You write clean, maintainable code and ensure 
            your components integrate well with backend services.""",
            verbose=True,
            allow_delegation=True,
            llm=self.llm
        )
        
        # Integration Engineer - Tests connections between components
        agents['integration_engineer'] = Agent(
            role='Integration Engineer',
            goal='Integrate components, test connections, and identify integration issues',
            backstory="""You are an Integration Engineer who specializes in bringing 
            different code components together. You test how modules connect, identify 
            integration problems, and work with the team to resolve them.""",
            verbose=True,
            allow_delegation=True,
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
            standards. You design test cases, identify bugs, and work with the team to 
            validate that everything works as expected.""",
            verbose=True,
            allow_delegation=True,
            llm=self.llm
        )
        
        return agents
    
    def _create_tasks(self, project_description: str) -> List[Task]:
        """Create tasks for parallel software development with integration and discussion."""
        
        tasks = []
        
        # Phase 1: Requirements and Architecture (Sequential foundation)
        task_requirements = Task(
            description=f"""Analyze the project and create detailed requirements with task breakdown:
            
            Project: {project_description}
            
            Provide:
            1. Clear project objectives
            2. Functional requirements
            3. Non-functional requirements
            4. Component breakdown for parallel development
            5. Success criteria
            
            Split the project into at least 2-3 independent components that can be developed in parallel.""",
            agent=self.agents['product_manager'],
            expected_output="Requirements document with component breakdown for parallel work"
        )
        tasks.append(task_requirements)
        
        task_architecture = Task(
            description="""Design modular architecture for parallel development:
            
            Include:
            1. System architecture with clear component boundaries
            2. Interface definitions between components
            3. Technology stack for each component
            4. Design patterns for modularity
            5. Integration points and APIs
            
            Ensure components can be developed independently and integrated later.""",
            agent=self.agents['architect'],
            expected_output="Modular architecture design with integration specifications",
            context=[task_requirements]
        )
        tasks.append(task_architecture)
        
        # Phase 2: Parallel Development
        task_backend = Task(
            description="""Develop backend components based on the architecture:
            
            Focus on:
            1. Server-side logic and business rules
            2. Database models and data access
            3. API endpoints with clear interfaces
            4. Error handling and validation
            5. Backend utilities and helpers
            
            Ensure your code follows the interface specifications from the architecture.""",
            agent=self.agents['developer_1'],
            expected_output="Complete backend implementation with documented interfaces",
            context=[task_requirements, task_architecture]
        )
        tasks.append(task_backend)
        
        task_frontend = Task(
            description="""Develop frontend components based on the architecture:
            
            Focus on:
            1. User interface and interaction logic
            2. Client-side validation
            3. API client to consume backend services
            4. User experience flow
            5. Frontend utilities
            
            Ensure your code integrates with the backend API interfaces.""",
            agent=self.agents['developer_2'],
            expected_output="Complete frontend implementation with API integration",
            context=[task_requirements, task_architecture],
            async_execution=True  # Run in parallel with backend
        )
        tasks.append(task_frontend)
        
        # Phase 3: Integration and Testing
        task_integration = Task(
            description="""Integrate all components and test connections:
            
            Review:
            1. Backend code and its interfaces
            2. Frontend code and its API calls
            3. Integration points between components
            4. Data flow across the system
            5. Error handling across boundaries
            
            Test the connections and identify any integration issues. If problems exist,
            document them clearly for the team to discuss and resolve.""",
            agent=self.agents['integration_engineer'],
            expected_output="Integration report with test results and any issues found",
            context=[task_backend, task_frontend]
        )
        tasks.append(task_integration)
        
        # Phase 4: Issue Resolution (if needed)
        task_qa_validation = Task(
            description="""Validate the integrated system and work with team to resolve issues:
            
            Review:
            1. Integration test results
            2. Any issues or bugs identified
            3. Code quality across all components
            4. Test coverage and edge cases
            
            If issues are found, coordinate with developers to discuss and fix them.
            Ensure the full system works correctly after integration.""",
            agent=self.agents['qa_engineer'],
            expected_output="QA validation report and resolution status",
            context=[task_integration, task_backend, task_frontend]
        )
        tasks.append(task_qa_validation)
        
        # Phase 5: Documentation
        task_documentation = Task(
            description="""Create comprehensive documentation for the complete system:
            
            Include:
            1. Project overview
            2. Architecture and component descriptions
            3. Installation and setup instructions
            4. API documentation (if applicable)
            5. Usage examples
            6. Troubleshooting guide
            
            Cover both frontend and backend components.""",
            agent=self.agents['technical_writer'],
            expected_output="Complete technical documentation",
            context=[task_requirements, task_architecture, task_backend, task_frontend, task_qa_validation]
        )
        tasks.append(task_documentation)
        
        return tasks
    
    def generate_project(self, project_description: str, verbose: bool = True) -> Dict[str, str]:
        """
        Generate a complete software project using CrewAI with parallel agent collaboration.
        
        Args:
            project_description: Description of the project to create
            verbose: Whether to show detailed output
            
        Returns:
            Dictionary with project components
        """
        print(f"\n{'='*60}")
        print(f"Starting Software Company Project Generation")
        print(f"Model: {self.model_name} | Hardware: {self.hardware_mode}")
        print(f"Mode: PARALLEL COLLABORATION")
        print(f"{'='*60}\n")
        
        start_time = time.time()
        
        # Create tasks for parallel work
        tasks = self._create_tasks(project_description)
        
        # Create crew with hierarchical process for better collaboration
        crew = Crew(
            agents=list(self.agents.values()),
            tasks=tasks,
            process=Process.hierarchical,  # Changed from sequential to hierarchical
            manager_llm=self.llm,  # Manager coordinates parallel work
            verbose=verbose
        )
        
        # Execute the crew
        print("Crew is working on the project in parallel...\n")
        print("🔄 Agents will split tasks, work in parallel, integrate, and discuss issues together.\n")
        result = crew.kickoff()
        
        end_time = time.time()
        duration = end_time - start_time
        
        # Parse results - now including separate backend and frontend
        project_components = {
            'requirements': tasks[0].output.raw_output if hasattr(tasks[0].output, 'raw_output') else str(tasks[0].output),
            'architecture': tasks[1].output.raw_output if hasattr(tasks[1].output, 'raw_output') else str(tasks[1].output),
            'backend_code': tasks[2].output.raw_output if hasattr(tasks[2].output, 'raw_output') else str(tasks[2].output),
            'frontend_code': tasks[3].output.raw_output if hasattr(tasks[3].output, 'raw_output') else str(tasks[3].output),
            'integration_report': tasks[4].output.raw_output if hasattr(tasks[4].output, 'raw_output') else str(tasks[4].output),
            'testing': tasks[5].output.raw_output if hasattr(tasks[5].output, 'raw_output') else str(tasks[5].output),
            'documentation': tasks[6].output.raw_output if hasattr(tasks[6].output, 'raw_output') else str(tasks[6].output),
            'full_output': str(result),
            'duration_seconds': round(duration, 2),
            'model': self.model_name,
            'hardware_mode': self.hardware_mode
        }
        
        print(f"\n{'='*60}")
        print(f"Project Generation Complete!")
        print(f"Duration: {duration:.2f} seconds")
        print(f"Components: Backend, Frontend, Integration, Tests, Docs")
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

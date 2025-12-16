"""
CrewAI Agent Definitions
Defines the agents that make up the software development crew.
Updated for CrewAI 1.x with Ollama LLM support.
"""

from crewai import Agent, LLM
import os


def get_llm(model: str = None):
    """Get LLM instance configured for Ollama"""
    model_name = model or os.getenv("DEFAULT_MODEL", "gemma3:4b")
    ollama_host = os.getenv("OLLAMA_HOST", "http://localhost:11434")
    
    # CrewAI 1.x uses LiteLLM format: "ollama/<model_name>"
    return LLM(
        model=f"ollama/{model_name}",
        base_url=ollama_host,
    )


def create_product_manager(model: str = None) -> Agent:
    """Create the Product Manager agent"""
    return Agent(
        role="Product Manager",
        goal="Analyze requirements and create detailed project specifications",
        backstory="""You are an experienced Product Manager with expertise in 
        translating business requirements into technical specifications. You excel 
        at breaking down complex projects into manageable tasks and defining clear 
        file structures for development teams.""",
        llm=get_llm(model),
        verbose=True,
        allow_delegation=False,
    )


def create_developer(model: str = None) -> Agent:
    """Create the Developer agent"""
    return Agent(
        role="Senior Developer",
        goal="Write clean, efficient, and well-documented code",
        backstory="""You are a senior full-stack developer with 10+ years of experience.
        You write production-quality code with proper error handling, documentation,
        and best practices. You're proficient in multiple languages and frameworks.""",
        llm=get_llm(model),
        verbose=True,
        allow_delegation=False,
    )


def create_qa_engineer(model: str = None) -> Agent:
    """Create the QA Engineer agent"""
    return Agent(
        role="QA Engineer",
        goal="Review code quality and suggest improvements",
        backstory="""You are a meticulous QA engineer who ensures code quality
        and catches potential bugs before they reach production. You provide
        constructive feedback to improve code reliability.""",
        llm=get_llm(model),
        verbose=True,
        allow_delegation=False,
    )

"""
Configuration management for the software company simulation.
"""

import os
from typing import Dict, Optional
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """Application settings."""
    
    # Ollama settings
    ollama_host: str = Field(default="http://localhost:11434", description="Ollama API host")
    ollama_model: str = Field(default="llama3.2:3b", description="Default Ollama model")
    
    # Hardware settings
    use_gpu: bool = Field(default=True, description="Use GPU if available")
    hardware_mode: str = Field(default="auto", description="Hardware mode: auto, gpu, or cpu")
    
    # Model settings
    temperature: float = Field(default=0.7, description="Model temperature")
    max_tokens: int = Field(default=2048, description="Maximum output tokens")
    
    # Application settings
    port: int = Field(default=7860, description="Web interface port")
    host: str = Field(default="0.0.0.0", description="Web interface host")
    
    # Project settings
    default_rounds: int = Field(default=3, description="Default number of collaboration rounds")
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


def load_settings() -> Settings:
    """Load application settings."""
    return Settings()


def get_model_config(model_name: str, hardware_mode: str = "cpu") -> Dict:
    """Get configuration for a specific model."""
    
    # Base configuration
    config = {
        "model": model_name,
        "temperature": 0.7,
        "num_ctx": 2048,  # Context window
        "num_predict": 1024,  # Max tokens to generate
    }
    
    # Add GPU-specific settings if using GPU
    if hardware_mode == "gpu":
        config.update({
            "num_gpu": 1,
            "gpu_layers": 35,  # Number of layers to offload to GPU
        })
    else:
        config.update({
            "num_gpu": 0,
            "num_thread": os.cpu_count() or 4,
        })
    
    return config


# Model configurations with descriptions
MODEL_CONFIGS = {
    "llama3:8b": {
        "name": "Llama 3 8B",
        "description": "Meta's Llama 3 model with 8 billion parameters. Great balance of quality and speed.",
        "min_ram_gb": 8,
        "min_vram_gb": 8,
        "recommended": "gpu"
    },
    "llama3:3b": {
        "name": "Llama 3 3B",
        "description": "Smaller Llama 3 model, faster with lower resource requirements.",
        "min_ram_gb": 4,
        "min_vram_gb": 4,
        "recommended": "both"
    },
    "mistral:7b": {
        "name": "Mistral 7B",
        "description": "Powerful 7B parameter model from Mistral AI.",
        "min_ram_gb": 8,
        "min_vram_gb": 8,
        "recommended": "gpu"
    },
    "phi3:mini": {
        "name": "Phi-3 Mini",
        "description": "Microsoft's efficient 3.8B parameter model.",
        "min_ram_gb": 4,
        "min_vram_gb": 4,
        "recommended": "both"
    },
    "phi3:medium": {
        "name": "Phi-3 Medium",
        "description": "Microsoft's 14B parameter model with excellent quality.",
        "min_ram_gb": 16,
        "min_vram_gb": 12,
        "recommended": "gpu"
    },
    "gemma:2b": {
        "name": "Gemma 2B",
        "description": "Google's lightweight 2B parameter model.",
        "min_ram_gb": 3,
        "min_vram_gb": 3,
        "recommended": "cpu"
    },
    "tinyllama:1.1b": {
        "name": "TinyLlama 1.1B",
        "description": "Very small and fast model for resource-constrained systems.",
        "min_ram_gb": 2,
        "min_vram_gb": 2,
        "recommended": "cpu"
    },
    "qwen:1.8b": {
        "name": "Qwen 1.8B",
        "description": "Efficient model from Alibaba Cloud.",
        "min_ram_gb": 2,
        "min_vram_gb": 2,
        "recommended": "cpu"
    }
}


def get_available_models() -> Dict[str, Dict]:
    """Get all available model configurations."""
    return MODEL_CONFIGS

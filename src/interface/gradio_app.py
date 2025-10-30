"""
Gradio-based web interface for the software company simulation.
Provides a ChatGPT-like interface for interacting with the AI agents.
"""

import gradio as gr
from typing import List, Tuple, Optional
import json
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from agents.crew import create_software_company
from utils.benchmark import SystemBenchmark
from utils.config import Settings, get_available_models, load_settings


class SoftwareCompanyInterface:
    """Web interface for the software company simulation."""
    
    def __init__(self):
        self.settings = load_settings()
        self.benchmark = SystemBenchmark()
        self.current_company = None
        self.system_info = None
        self.recommendations = None
        
    def initialize_system(self) -> str:
        """Initialize and benchmark the system."""
        try:
            self.system_info, self.recommendations = self.benchmark.get_system_info(), self.benchmark.recommend_models()
            
            report = "🖥️ **System Information**\n\n"
            report += f"**Platform:** {self.system_info['platform']} {self.system_info['platform_release']}\n"
            report += f"**CPU:** {self.system_info['cpu_cores']} cores / {self.system_info['cpu_threads']} threads\n"
            report += f"**RAM:** {self.system_info['ram_gb']} GB\n"
            report += f"**GPU:** {'✅ Available' if self.system_info['gpu_available'] else '❌ Not available'}\n"
            
            if self.system_info['gpu_available']:
                report += "\n**GPU Details:**\n"
                for gpu in self.system_info['gpu_info']:
                    report += f"- {gpu['name']}: {gpu['memory']} MB VRAM\n"
            
            report += f"\n**Hardware Mode:** {self.recommendations['hardware_mode'].upper()}\n"
            report += "\n✅ System initialized successfully!"
            
            return report
        except Exception as e:
            return f"❌ Error initializing system: {str(e)}"
    
    def get_recommended_models(self) -> List[str]:
        """Get list of recommended models."""
        if not self.recommendations:
            self.system_info, self.recommendations = self.benchmark.get_system_info(), self.benchmark.recommend_models()
        
        return self.recommendations['primary'] + self.recommendations['fallback']
    
    def generate_project(self, project_description: str, model_name: str, 
                        progress=gr.Progress()) -> Tuple[str, str, str, str, str, str]:
        """
        Generate a software project based on the description.
        
        Returns tuple of (requirements, architecture, code, testing, documentation, summary)
        """
        if not project_description.strip():
            error_msg = "❌ Please provide a project description"
            return error_msg, "", "", "", "", ""
        
        try:
            progress(0, desc="Initializing...")
            
            # Get hardware mode
            hardware_mode = self.recommendations['hardware_mode'] if self.recommendations else 'cpu'
            
            # Create company instance
            progress(0.1, desc="Creating AI team...")
            self.current_company = create_software_company(
                model_name=model_name,
                ollama_host=self.settings.ollama_host,
                temperature=self.settings.temperature,
                hardware_mode=hardware_mode
            )
            
            # Generate project
            progress(0.2, desc="AI team is working on your project...")
            result = self.current_company.generate_project(project_description, verbose=True)
            
            progress(1.0, desc="Complete!")
            
            # Format summary
            summary = f"""## 🎉 Project Generation Complete!

**Model Used:** {result['model']}  
**Hardware Mode:** {result['hardware_mode'].upper()}  
**Duration:** {result['duration_seconds']} seconds

The AI team has successfully created your project. Review each section below.
"""
            
            return (
                result['requirements'],
                result['architecture'],
                result['code'],
                result['testing'],
                result['documentation'],
                summary
            )
            
        except Exception as e:
            error_msg = f"❌ **Error generating project:**\n\n{str(e)}\n\nPlease make sure Ollama is running and the model is pulled."
            return error_msg, "", "", "", "", ""
    
    def download_project(self, requirements: str, architecture: str, code: str, 
                        testing: str, documentation: str) -> str:
        """Create a downloadable project file."""
        project_data = {
            "requirements": requirements,
            "architecture": architecture,
            "code": code,
            "testing": testing,
            "documentation": documentation
        }
        
        # Save to JSON
        output_file = "/tmp/software_project.json"
        with open(output_file, 'w') as f:
            json.dump(project_data, f, indent=2)
        
        return output_file
    
    def create_interface(self) -> gr.Blocks:
        """Create the Gradio interface."""
        
        with gr.Blocks(title="AI Software Company", theme=gr.themes.Soft()) as interface:
            gr.Markdown("""
            # 🏢 AI Software Company
            ### Create complete software projects with AI agents powered by Ollama
            
            This tool uses multiple AI agents (Product Manager, Architect, Developer, QA Engineer, and Technical Writer) 
            to collaboratively create a complete software project based on your description.
            """)
            
            with gr.Tab("🚀 Generate Project"):
                with gr.Row():
                    with gr.Column(scale=1):
                        gr.Markdown("### Project Settings")
                        
                        model_dropdown = gr.Dropdown(
                            choices=self.get_recommended_models(),
                            value=self.get_recommended_models()[0] if self.get_recommended_models() else "llama3:3b",
                            label="Select Model",
                            info="Choose an AI model based on your hardware"
                        )
                        
                        project_input = gr.Textbox(
                            label="Project Description",
                            placeholder="Describe the software you want to create...\n\nExample: Develop a calculator script to be executed in the terminal",
                            lines=5
                        )
                        
                        generate_btn = gr.Button("🎨 Generate Project", variant="primary", size="lg")
                        
                    with gr.Column(scale=1):
                        gr.Markdown("### Quick Tips")
                        gr.Markdown("""
                        **📝 Writing good descriptions:**
                        - Be specific about what you want
                        - Mention the type of software (CLI, web, etc.)
                        - Include key features you need
                        - Specify the programming language if needed
                        
                        **⏱️ Generation time:**
                        - Small projects: 2-5 minutes
                        - Medium projects: 5-10 minutes
                        - Complex projects: 10-20 minutes
                        
                        **💡 Examples:**
                        - "Create a Python web scraper for news articles"
                        - "Build a REST API for a todo list application"
                        - "Develop a command-line file organizer"
                        """)
                
                gr.Markdown("---")
                
                summary_output = gr.Markdown(label="Summary")
                
                with gr.Tabs():
                    with gr.Tab("📋 Requirements"):
                        requirements_output = gr.Markdown()
                    
                    with gr.Tab("🏗️ Architecture"):
                        architecture_output = gr.Markdown()
                    
                    with gr.Tab("💻 Code"):
                        code_output = gr.Code(language="python", label="Generated Code")
                    
                    with gr.Tab("🧪 Testing"):
                        testing_output = gr.Markdown()
                    
                    with gr.Tab("📚 Documentation"):
                        documentation_output = gr.Markdown()
                
                download_btn = gr.Button("💾 Download Project", variant="secondary")
                download_file = gr.File(label="Project File", visible=False)
            
            with gr.Tab("⚙️ System Info"):
                system_info_output = gr.Markdown()
                refresh_btn = gr.Button("🔄 Refresh System Info")
                
                gr.Markdown("### 📦 Available Models")
                
                models_info = get_available_models()
                models_md = ""
                for model_id, info in models_info.items():
                    models_md += f"""
**{info['name']}** (`{model_id}`)  
{info['description']}  
*Requirements:* {info['min_ram_gb']}GB RAM, {info['min_vram_gb']}GB VRAM  
*Recommended for:* {info['recommended'].upper()}

---
"""
                gr.Markdown(models_md)
            
            with gr.Tab("ℹ️ About"):
                gr.Markdown("""
                ## About This Project
                
                This is a containerized version of the Software Company Simulation that runs locally using:
                
                - **Ollama**: Local LLM inference engine
                - **CrewAI**: Multi-agent orchestration framework
                - **Gradio**: Web interface for easy interaction
                
                ### Features
                
                ✅ Runs completely locally (no API keys needed)  
                ✅ GPU and CPU support with automatic detection  
                ✅ Multiple AI agents working together  
                ✅ System benchmark to select optimal models  
                ✅ ChatGPT-like interface  
                ✅ Containerized with Docker  
                
                ### How It Works
                
                1. **Product Manager** defines requirements
                2. **Software Architect** designs the architecture
                3. **Developer** writes the code
                4. **QA Engineer** creates testing plans
                5. **Technical Writer** documents everything
                
                ### Requirements
                
                - Docker and Docker Compose
                - Ollama running locally
                - 8GB+ RAM recommended
                - GPU optional but recommended for better performance
                
                ### Source Code
                
                GitHub: [dougfeltrim/Software-company-simulation-google-gemini](https://github.com/dougfeltrim/Software-company-simulation-google-gemini)
                """)
            
            # Event handlers
            generate_btn.click(
                fn=self.generate_project,
                inputs=[project_input, model_dropdown],
                outputs=[requirements_output, architecture_output, code_output, 
                        testing_output, documentation_output, summary_output]
            )
            
            download_btn.click(
                fn=self.download_project,
                inputs=[requirements_output, architecture_output, code_output,
                       testing_output, documentation_output],
                outputs=[download_file]
            )
            
            refresh_btn.click(
                fn=self.initialize_system,
                outputs=[system_info_output]
            )
            
            # Initialize on load
            interface.load(
                fn=self.initialize_system,
                outputs=[system_info_output]
            )
        
        return interface


def launch_interface(host: str = "0.0.0.0", port: int = 7860, share: bool = False):
    """Launch the web interface."""
    app = SoftwareCompanyInterface()
    interface = app.create_interface()
    interface.launch(server_name=host, server_port=port, share=share)


if __name__ == "__main__":
    launch_interface()

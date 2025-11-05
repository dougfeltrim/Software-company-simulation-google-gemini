"""
Main entry point for the software company simulation.
Can be run standalone or imported as a module.
"""

import sys
import os
import argparse

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from utils.benchmark import run_benchmark
from utils.config import load_settings


def run_benchmark_command():
    """Run the system benchmark."""
    print("Running system benchmark...")
    run_benchmark()


def run_interface_command(args):
    """Run the web interface."""
    # Import here to avoid loading gradio when not needed
    from interface.gradio_app import launch_interface
    
    settings = load_settings()
    
    host = args.host or settings.host
    port = args.port or settings.port
    share = args.share
    
    print(f"Starting web interface on {host}:{port}")
    if share:
        print("Share mode enabled - generating public link...")
    
    launch_interface(host=host, port=port, share=share)


def run_cli_command(args):
    """Run the CLI version (direct generation without web interface)."""
    # Import here to avoid loading heavy dependencies when not needed
    from agents.crew import create_software_company
    
    settings = load_settings()
    
    if not args.description:
        print("Error: Project description is required")
        print("Usage: python main.py cli --description 'Your project description'")
        sys.exit(1)
    
    # Run benchmark first
    from utils.benchmark import SystemBenchmark
    benchmark = SystemBenchmark()
    system_info, recommendations = benchmark.display_report()
    
    # Select model
    model = args.model or recommendations['primary'][0]
    hardware_mode = recommendations['hardware_mode']
    
    print(f"\nUsing model: {model}")
    print(f"Hardware mode: {hardware_mode}\n")
    
    # Create company and generate project
    company = create_software_company(
        model_name=model,
        ollama_host=settings.ollama_host,
        temperature=settings.temperature,
        hardware_mode=hardware_mode
    )
    
    result = company.generate_project(args.description, verbose=True)
    
    # Save results
    output_dir = args.output or "output"
    os.makedirs(output_dir, exist_ok=True)
    
    # Save each component with new parallel structure
    components = {
        'requirements.md': result['requirements'],
        'architecture.md': result['architecture'],
        'backend_code.py': result['backend_code'],
        'frontend_code.py': result['frontend_code'],
        'integration_report.md': result['integration_report'],
        'testing.md': result['testing'],
        'documentation.md': result['documentation']
    }
    
    for filename, content in components.items():
        filepath = os.path.join(output_dir, filename)
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Saved: {filepath}")
    
    print(f"\n✅ Project saved to {output_dir}/")
    print(f"⏱️  Duration: {result['duration_seconds']} seconds")


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="AI Software Company - Create complete software projects with AI agents",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Run system benchmark
  python main.py benchmark

  # Start web interface
  python main.py interface

  # Start web interface on custom port
  python main.py interface --port 8080

  # Generate project via CLI
  python main.py cli --description "Create a calculator app"

  # Generate project with specific model
  python main.py cli --description "Build a web scraper" --model llama3:8b
        """
    )
    
    subparsers = parser.add_subparsers(dest='command', help='Command to run')
    
    # Benchmark command
    subparsers.add_parser('benchmark', help='Run system benchmark')
    
    # Interface command
    interface_parser = subparsers.add_parser('interface', help='Start web interface')
    interface_parser.add_argument('--host', type=str, help='Host to bind to')
    interface_parser.add_argument('--port', type=int, help='Port to bind to')
    interface_parser.add_argument('--share', action='store_true', help='Create public share link')
    
    # CLI command
    cli_parser = subparsers.add_parser('cli', help='Generate project via CLI')
    cli_parser.add_argument('--description', '-d', type=str, required=True, 
                           help='Project description')
    cli_parser.add_argument('--model', '-m', type=str, help='Model to use')
    cli_parser.add_argument('--output', '-o', type=str, help='Output directory')
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        sys.exit(1)
    
    if args.command == 'benchmark':
        run_benchmark_command()
    elif args.command == 'interface':
        run_interface_command(args)
    elif args.command == 'cli':
        run_cli_command(args)


if __name__ == "__main__":
    main()

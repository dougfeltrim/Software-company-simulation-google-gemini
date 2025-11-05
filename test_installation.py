#!/usr/bin/env python3
"""
Test script to validate the installation and configuration.
"""

import sys
import os

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

def test_imports():
    """Test that all modules can be imported."""
    print("Testing imports...")
    
    try:
        from utils.benchmark import SystemBenchmark
        print("✅ utils.benchmark imported")
    except Exception as e:
        print(f"❌ utils.benchmark failed: {e}")
        return False
    
    try:
        from utils.config import load_settings, get_available_models
        print("✅ utils.config imported")
    except Exception as e:
        print(f"❌ utils.config failed: {e}")
        return False
    
    return True


def test_benchmark():
    """Test the benchmark functionality."""
    print("\nTesting benchmark...")
    
    try:
        from utils.benchmark import SystemBenchmark
        
        benchmark = SystemBenchmark()
        info = benchmark.get_system_info()
        recommendations = benchmark.recommend_models()
        
        print(f"✅ Benchmark completed")
        print(f"   - CPU cores: {info['cpu_cores']}")
        print(f"   - RAM: {info['ram_gb']} GB")
        print(f"   - GPU: {info['gpu_available']}")
        print(f"   - Recommended models: {len(recommendations['primary'])}")
        
        return True
    except Exception as e:
        print(f"❌ Benchmark failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_config():
    """Test the configuration functionality."""
    print("\nTesting configuration...")
    
    try:
        from utils.config import load_settings, get_available_models, get_model_config
        
        settings = load_settings()
        models = get_available_models()
        config = get_model_config('llama3:3b', 'cpu')
        
        print(f"✅ Configuration loaded")
        print(f"   - Ollama host: {settings.ollama_host}")
        print(f"   - Available models: {len(models)}")
        
        return True
    except Exception as e:
        print(f"❌ Configuration failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Run all tests."""
    print("="*60)
    print("AI Software Company - Installation Test")
    print("="*60)
    print()
    
    results = []
    
    # Test imports
    results.append(("Imports", test_imports()))
    
    # Test benchmark
    results.append(("Benchmark", test_benchmark()))
    
    # Test config
    results.append(("Configuration", test_config()))
    
    # Print summary
    print("\n" + "="*60)
    print("Test Summary")
    print("="*60)
    
    all_passed = True
    for name, passed in results:
        status = "✅ PASSED" if passed else "❌ FAILED"
        print(f"{name}: {status}")
        if not passed:
            all_passed = False
    
    print()
    
    if all_passed:
        print("✅ All tests passed! The installation is ready.")
        print("\nNext steps:")
        print("1. Start the services: ./start.sh")
        print("2. Pull a model: ./pull-model.sh llama3:3b")
        print("3. Access the web interface: http://localhost:7860")
        return 0
    else:
        print("❌ Some tests failed. Please check the installation.")
        print("\nTry:")
        print("1. pip install -r requirements.txt")
        print("2. Check that all dependencies are installed")
        return 1


if __name__ == "__main__":
    sys.exit(main())

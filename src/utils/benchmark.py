"""
System benchmark utility to detect hardware capabilities and recommend models.
"""

import psutil
import platform
import subprocess
from typing import Dict, List, Tuple
import time


class SystemBenchmark:
    """Benchmark system capabilities to recommend appropriate models."""
    
    def __init__(self):
        self.gpu_available = False
        self.gpu_memory = 0
        self.cpu_cores = psutil.cpu_count(logical=False)
        self.cpu_threads = psutil.cpu_count(logical=True)
        self.ram_gb = psutil.virtual_memory().total / (1024**3)
        self.gpu_info = []
        
    def detect_gpu(self) -> bool:
        """Detect if GPU is available and get its specs."""
        try:
            import GPUtil
            gpus = GPUtil.getGPUs()
            if gpus:
                self.gpu_available = True
                for gpu in gpus:
                    self.gpu_info.append({
                        'name': gpu.name,
                        'memory': gpu.memoryTotal,
                        'driver': gpu.driver
                    })
                    self.gpu_memory = max(self.gpu_memory, gpu.memoryTotal)
                return True
        except ImportError:
            print("GPUtil not available, checking for NVIDIA GPU via nvidia-smi...")
        except Exception as e:
            print(f"Error detecting GPU with GPUtil: {e}")
        
        # Fallback to nvidia-smi
        try:
            result = subprocess.run(
                ['nvidia-smi', '--query-gpu=name,memory.total', '--format=csv,noheader'],
                capture_output=True,
                text=True,
                timeout=5
            )
            if result.returncode == 0 and result.stdout.strip():
                self.gpu_available = True
                lines = result.stdout.strip().split('\n')
                for line in lines:
                    parts = line.split(',')
                    if len(parts) >= 2:
                        name = parts[0].strip()
                        memory_str = parts[1].strip().split()[0]
                        memory = int(memory_str)
                        self.gpu_info.append({
                            'name': name,
                            'memory': memory,
                            'driver': 'unknown'
                        })
                        self.gpu_memory = max(self.gpu_memory, memory)
                return True
        except (subprocess.SubprocessError, FileNotFoundError, Exception) as e:
            print(f"nvidia-smi not available or failed: {e}")
        
        return False
    
    def run_cpu_benchmark(self) -> float:
        """Run a simple CPU benchmark to measure performance."""
        print("Running CPU benchmark...")
        start_time = time.time()
        
        # Simple computation benchmark
        result = 0
        iterations = 1000000
        for i in range(iterations):
            result += i * i
        
        end_time = time.time()
        duration = end_time - start_time
        score = iterations / duration  # Higher is better
        
        return score
    
    def get_system_info(self) -> Dict:
        """Get comprehensive system information."""
        self.detect_gpu()
        cpu_score = self.run_cpu_benchmark()
        
        info = {
            'platform': platform.system(),
            'platform_release': platform.release(),
            'platform_version': platform.version(),
            'architecture': platform.machine(),
            'processor': platform.processor(),
            'cpu_cores': self.cpu_cores,
            'cpu_threads': self.cpu_threads,
            'cpu_score': cpu_score,
            'ram_gb': round(self.ram_gb, 2),
            'gpu_available': self.gpu_available,
            'gpu_memory_mb': self.gpu_memory,
            'gpu_info': self.gpu_info
        }
        
        return info
    
    def recommend_models(self) -> Dict[str, List[str]]:
        """Recommend models based on system capabilities."""
        recommendations = {
            'primary': [],
            'fallback': [],
            'hardware_mode': 'cpu'
        }
        
        # Determine hardware mode
        if self.gpu_available:
            if self.gpu_memory >= 8000:  # 8GB+ VRAM
                recommendations['hardware_mode'] = 'gpu'
                recommendations['primary'] = [
                    'llama3:8b',
                    'mistral:7b',
                    'phi3:medium'
                ]
                recommendations['fallback'] = [
                    'llama3:3b',
                    'phi3:mini',
                    'gemma:2b'
                ]
            elif self.gpu_memory >= 4000:  # 4GB+ VRAM
                recommendations['hardware_mode'] = 'gpu'
                recommendations['primary'] = [
                    'llama3:3b',
                    'phi3:mini',
                    'mistral:7b-instruct-q4'
                ]
                recommendations['fallback'] = [
                    'gemma:2b',
                    'tinyllama:1.1b'
                ]
            else:  # Less than 4GB VRAM
                recommendations['hardware_mode'] = 'cpu'
        
        # CPU-based recommendations
        if recommendations['hardware_mode'] == 'cpu':
            if self.ram_gb >= 16 and self.cpu_threads >= 8:
                recommendations['primary'] = [
                    'llama3:3b',
                    'phi3:mini',
                    'gemma:2b'
                ]
                recommendations['fallback'] = [
                    'tinyllama:1.1b',
                    'qwen:1.8b'
                ]
            elif self.ram_gb >= 8:
                recommendations['primary'] = [
                    'gemma:2b',
                    'phi3:mini',
                    'tinyllama:1.1b'
                ]
                recommendations['fallback'] = [
                    'qwen:1.8b'
                ]
            else:  # Less than 8GB RAM
                recommendations['primary'] = [
                    'tinyllama:1.1b',
                    'qwen:1.8b'
                ]
                recommendations['fallback'] = []
        
        return recommendations
    
    def display_report(self):
        """Display a comprehensive system report."""
        info = self.get_system_info()
        recommendations = self.recommend_models()
        
        print("\n" + "="*60)
        print("SYSTEM BENCHMARK REPORT")
        print("="*60)
        print(f"\nPlatform: {info['platform']} {info['platform_release']}")
        print(f"Architecture: {info['architecture']}")
        print(f"Processor: {info['processor']}")
        print(f"\nCPU Cores: {info['cpu_cores']} physical / {info['cpu_threads']} threads")
        print(f"CPU Score: {info['cpu_score']:.2f} ops/sec")
        print(f"RAM: {info['ram_gb']} GB")
        
        print(f"\nGPU Available: {info['gpu_available']}")
        if info['gpu_available']:
            print("GPU Information:")
            for gpu in info['gpu_info']:
                print(f"  - {gpu['name']}: {gpu['memory']} MB VRAM")
        
        print(f"\n{'='*60}")
        print("RECOMMENDED MODELS")
        print("="*60)
        print(f"\nHardware Mode: {recommendations['hardware_mode'].upper()}")
        print(f"\nPrimary Models (Recommended):")
        for model in recommendations['primary']:
            print(f"  - {model}")
        
        if recommendations['fallback']:
            print(f"\nFallback Models (If primary fails):")
            for model in recommendations['fallback']:
                print(f"  - {model}")
        
        print("\n" + "="*60 + "\n")
        
        return info, recommendations


def run_benchmark():
    """Run the benchmark and return results."""
    benchmark = SystemBenchmark()
    info, recommendations = benchmark.display_report()
    return info, recommendations


if __name__ == "__main__":
    run_benchmark()

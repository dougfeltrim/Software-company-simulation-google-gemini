import os
import sys
from graph import SoftwareCompanyGraph

# Ensure we can run this
sys.path.append(os.getcwd())

def test_pm_agent():
    print("\n--- Testing Product Manager ---")
    graph = SoftwareCompanyGraph()
    state = {
        "name": "Test Project",
        "description": "A simple todo list app",
        "requirements": "",
        "logs": []
    }
    result = graph._analyze_requirements(state)
    print(f"Result Keys: {result.keys()}")
    print(f"Requirements Length: {len(result.get('requirements', ''))}")
    assert result.get("requirements") and len(result["requirements"]) > 10
    return result

def test_architect_agent(state):
    print("\n--- Testing Architect ---")
    graph = SoftwareCompanyGraph()
    result = graph._plan_architecture(state)
    print(f"Architecture Length: {len(result.get('architecture', ''))}")
    print(f"File Structure: {result.get('file_structure')}")
    assert result.get("architecture")
    assert result.get("file_structure")
    return result

def test_ux_agent(state):
    print("\n--- Testing UX Designer ---")
    graph = SoftwareCompanyGraph()
    result = graph._define_ux(state)
    print(f"Design System Length: {len(result.get('design_system', ''))}")
    assert result.get("design_system")
    return result

def test_dev_agent(state):
    print("\n--- Testing Developer (Frontend) ---")
    graph = SoftwareCompanyGraph()
    # Mock a file to work on
    state["file_structure"] = [{"path": "index.html", "description": "Main page", "owner": "frontend"}]
    state["current_file_index"] = 0
    state["generated_files"] = []
    
    result = graph._frontend_coding(state)
    print(f"Generated Files: {len(result['generated_files'])}")
    if result['generated_files']:
        print(f"Content Preview: {result['generated_files'][0]['content'][:50]}...")
    assert result['generated_files']
    return result

if __name__ == "__main__":
    try:
        s1 = test_pm_agent()
        s2 = test_architect_agent(s1)
        s3 = test_ux_agent(s2)
        s4 = test_dev_agent(s3)
        print("\n✅ ALL AGENTS PASSED BASIC CHECKS")
    except Exception as e:
        print(f"\n❌ TEST FAILED: {e}")
        import traceback
        traceback.print_exc()

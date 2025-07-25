#!/usr/bin/env python3
import yaml
import subprocess
import sys
import os

def run_command(cmd):
    """Run a shell command and return the output."""
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        return result.returncode == 0, result.stdout, result.stderr
    except Exception as e:
        return False, "", str(e)

def validate_github_workflow(file_path):
    """Validate GitHub Actions workflow file."""
    print("\n🔍 Validating GitHub Workflow...")
    try:
        with open(file_path, 'r') as f:
            content = f.read()
            workflow = yaml.safe_load(content)
        
        # Check required top-level keys
        required_keys = ['name', 'jobs']
        missing_keys = [key for key in required_keys if key not in workflow]
        
        if missing_keys:
            print(f"❌ Missing required keys: {missing_keys}")
            return False
            
        # Check if 'on' key exists (can be 'on' or True in YAML)
        if 'on' not in workflow and True not in workflow:
            print("❌ Missing 'on' trigger definition")
            return False
            
        print("✅ Valid YAML syntax")
        print(f"   📋 Workflow: {workflow.get('name')}")
        print(f"   📋 Jobs: {len(workflow.get('jobs', {}))}")
        
        # Check for secrets usage
        secrets_count = content.count('${{ secrets.')
        print(f"   📋 Secrets referenced: {secrets_count}")
        
        return True
        
    except yaml.YAMLError as e:
        print(f"❌ YAML syntax error: {e}")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def validate_docker_compose(file_path):
    """Validate docker-compose file."""
    print("\n🔍 Validating Docker Compose file...")
    
    # First check YAML syntax
    try:
        with open(file_path, 'r') as f:
            compose_config = yaml.safe_load(f)
        print("✅ Valid YAML syntax")
    except yaml.YAMLError as e:
        print(f"❌ YAML syntax error: {e}")
        return False
    
    # Check docker-compose config
    success, stdout, stderr = run_command(f"docker-compose -f {file_path} config --quiet")
    if success:
        print("✅ Valid docker-compose configuration")
    else:
        print(f"❌ Docker-compose validation failed: {stderr}")
        return False
    
    # Check for environment variables
    env_vars = []
    for service_name, service_config in compose_config.get('services', {}).items():
        if 'environment' in service_config:
            for key, value in service_config['environment'].items():
                if isinstance(value, str) and value.startswith('${') and value.endswith('}'):
                    env_vars.append(value[2:-1])
    
    if env_vars:
        print(f"   📋 Environment variables required: {len(set(env_vars))}")
        print(f"   📋 Variables: {', '.join(sorted(set(env_vars)))[:5]}...")
    
    return True

def check_secrets_consistency(workflow_file, compose_file):
    """Check if secrets in workflow match those needed in docker-compose."""
    print("\n🔍 Checking secrets consistency...")
    
    # Extract secrets from workflow
    workflow_secrets = set()
    try:
        with open(workflow_file, 'r') as f:
            content = f.read()
            import re
            matches = re.findall(r'\$\{\{ secrets\.([A-Z_]+) \}\}', content)
            workflow_secrets = set(matches)
    except Exception as e:
        print(f"❌ Error reading workflow: {e}")
        return False
    
    # Extract environment variables from docker-compose
    compose_vars = set()
    try:
        with open(compose_file, 'r') as f:
            compose_config = yaml.safe_load(f)
            for service_name, service_config in compose_config.get('services', {}).items():
                if 'environment' in service_config:
                    for key, value in service_config['environment'].items():
                        if isinstance(value, str) and value.startswith('${') and value.endswith('}'):
                            compose_vars.add(value[2:-1])
    except Exception as e:
        print(f"❌ Error reading docker-compose: {e}")
        return False
    
    # Compare
    missing_in_workflow = compose_vars - workflow_secrets
    if missing_in_workflow:
        print(f"❌ Secrets in docker-compose but not in workflow: {missing_in_workflow}")
        return False
    else:
        print("✅ All docker-compose variables are defined in workflow")
        return True

def main():
    print("🚀 Deployment Configuration Validator")
    print("=" * 50)
    
    base_path = "/var/www/html/Attendance_tracker"
    workflow_file = os.path.join(base_path, ".github/workflows/deploy.yml")
    compose_file = os.path.join(base_path, "docker-compose.prod.yml")
    
    results = []
    
    # Validate workflow
    if os.path.exists(workflow_file):
        results.append(validate_github_workflow(workflow_file))
    else:
        print(f"❌ Workflow file not found: {workflow_file}")
        results.append(False)
    
    # Validate docker-compose
    if os.path.exists(compose_file):
        results.append(validate_docker_compose(compose_file))
    else:
        print(f"❌ Docker-compose file not found: {compose_file}")
        results.append(False)
    
    # Check consistency
    if os.path.exists(workflow_file) and os.path.exists(compose_file):
        results.append(check_secrets_consistency(workflow_file, compose_file))
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 SUMMARY")
    if all(results):
        print("✅ All validations passed!")
        return 0
    else:
        print("❌ Some validations failed. Please fix the issues above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())

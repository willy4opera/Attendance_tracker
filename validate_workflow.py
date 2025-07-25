import yaml
import sys

def validate_workflow(file_path):
    """Check for required keys in a GitHub workflow YAML file."""
    try:
        with open(file_path, 'r') as f:
            workflow = yaml.safe_load(f)

        # Keys 'on' can be interpreted as True in YAML
        required_keys = ['name', 'jobs']
        if not ('on' in workflow or True in workflow):
            print('❌ Missing required key: on or True')
            return False

        for key in required_keys:
            if key not in workflow:
                print(f'❌ Missing required key: {key}')
                return False

        print('✅ All required keys are present')
        return True

    except yaml.YAMLError as e:
        print(f'❌ YAML syntax error: {e}')
        return False
    except Exception as e:
        print(f'❌ Error: {e}')
        return False

print('=== Validating GitHub Workflow ===')
validate_workflow('/var/www/html/Attendance_tracker/.github/workflows/deploy.yml')

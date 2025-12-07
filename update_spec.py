import json
import copy

# Load the current spec
with open('current-spec.json', 'r') as f:
    spec = json.load(f)

# Define the AI service
ai_service = {
    "name": "ai-service",
    "github": {
        "repo": "Mwaqarulmulk/MegiLance",
        "branch": "main",
        "deploy_on_push": True
    },
    "dockerfile_path": "ai/Dockerfile",
    "envs": [
        { "key": "PORT", "value": "8001", "scope": "RUN_TIME" },
        { "key": "ML_WORKERS", "value": "1", "scope": "RUN_TIME" },
        { "key": "CORS_ORIGINS", "value": "*", "scope": "RUN_TIME" }
    ],
    "instance_size_slug": "basic-s",
    "instance_count": 1,
    "http_port": 8001,
    "health_check": {
        "initial_delay_seconds": 120,
        "period_seconds": 30,
        "timeout_seconds": 10,
        "success_threshold": 1,
        "failure_threshold": 5,
        "http_path": "/health"
    }
}

# Add AI service if not exists
service_names = [s['name'] for s in spec['services']]
if "ai-service" not in service_names:
    spec['services'].append(ai_service)
else:
    # Update existing
    for i, s in enumerate(spec['services']):
        if s['name'] == "ai-service":
            spec['services'][i] = ai_service

# Update Backend to link to AI service
for service in spec['services']:
    if service['name'] == 'backend':
        # Check if env exists
        env_exists = False
        for env in service['envs']:
            if env['key'] == 'AI_SERVICE_URL':
                env['value'] = "http://ai-service:8001"
                env_exists = True
                break
        
        if not env_exists:
            service['envs'].append({
                "key": "AI_SERVICE_URL",
                "value": "http://ai-service:8001",
                "scope": "RUN_TIME"
            })

# Save the new spec
with open('do-app-spec-final.json', 'w') as f:
    json.dump(spec, f, indent=2)

print("Successfully generated do-app-spec-final.json")

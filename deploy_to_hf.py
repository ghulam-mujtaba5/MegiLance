import os
import time
from huggingface_hub import HfApi, login

def deploy_to_huggingface():
    print("==================================================")
    print("   MegiLance AI Service -> Hugging Face Deployer  ")
    print("==================================================")
    print("This script will deploy your local 'ai/' folder to a new Hugging Face Space.")
    print("You need a Hugging Face Account and a Write Token.")
    print("Get your token here: https://huggingface.co/settings/tokens")
    print("==================================================\n")

    # 1. Authentication
    import sys
    if len(sys.argv) > 1:
        token = sys.argv[1]
        print("Token received from command line.")
    else:
        token = input("Enter your Hugging Face Write Token: ").strip()
    
    if not token:
        print("Error: Token is required.")
        return

    try:
        login(token=token)
        api = HfApi(token=token)
        user_info = api.whoami()
        username = user_info['name']
        print(f"✅ Logged in as: {username}")
    except Exception as e:
        print(f"❌ Login failed: {e}")
        return

    # 2. Space Configuration
    space_name = "megilance-ai-service"
    repo_id = f"{username}/{space_name}"
    
    print(f"\nTarget Space: {repo_id}")
    print("Creating Space (if it doesn't exist)...")
    
    try:
        api.create_repo(
            repo_id=repo_id,
            repo_type="space",
            space_sdk="docker",
            private=False, # Public space for easier access, or True if you want private
            exist_ok=True
        )
        print("✅ Space created/verified.")
    except Exception as e:
        print(f"❌ Failed to create space: {e}")
        return

    # 3. Prepare Files
    # We need to upload the contents of 'ai/' to the root of the Space
    print("\nUploading files...")
    
    local_ai_folder = os.path.join(os.getcwd(), "ai")
    if not os.path.exists(local_ai_folder):
        print(f"❌ Error: Local folder '{local_ai_folder}' not found.")
        return

    try:
        # Upload the folder contents
        # path_in_repo='.' means upload to root
        api.upload_folder(
            folder_path=local_ai_folder,
            repo_id=repo_id,
            repo_type="space",
            path_in_repo=".",
            commit_message="Deploy MegiLance AI Service"
        )
        print("✅ Files uploaded successfully.")
    except Exception as e:
        print(f"❌ Upload failed: {e}")
        return

    # 4. Success & Next Steps
    space_url = f"https://{username}-{space_name}.hf.space"
    print("\n==================================================")
    print("🚀 DEPLOYMENT SUCCESSFUL!")
    print("==================================================")
    print(f"Your AI Service is building at: https://huggingface.co/spaces/{repo_id}")
    print(f"Direct API URL: {space_url}")
    print("\nIMPORTANT: It may take 2-5 minutes to build.")
    print("Once the status is 'Running', update your DigitalOcean Backend Config:")
    print(f"Set AI_SERVICE_URL = {space_url}")
    print("==================================================")

if __name__ == "__main__":
    deploy_to_huggingface()

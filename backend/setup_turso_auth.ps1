Write-Host "Initiating Turso Login..."
turso auth login

if ($LASTEXITCODE -eq 0) {
    Write-Host "Login successful. Fetching token..."
    $token = turso auth token
    $token = $token.Trim()
    
    if ($token) {
        Write-Host "Token retrieved."
        
        $envFile = ".env"
        if (Test-Path $envFile) {
            $content = Get-Content $envFile
            # Escape special characters in token if necessary, but usually it's base64-like
            # We use a simple replace. Note: Regex special chars in token might break this if not careful.
            # But JWTs are usually alphanumeric + - _ .
            
            # Safer way to replace
            $newContent = @()
            foreach ($line in $content) {
                if ($line -match "^TURSO_AUTH_TOKEN=") {
                    $newContent += "TURSO_AUTH_TOKEN=$token"
                } else {
                    $newContent += $line
                }
            }
            
            $newContent | Set-Content $envFile
            Write-Host "Updated .env with new token."
            
            Write-Host "Running migration..."
            python apply_referrals_migration.py
        } else {
            Write-Host "Error: .env file not found."
        }
    } else {
        Write-Host "Error: Could not retrieve token."
    }
} else {
    Write-Host "Login failed."
}

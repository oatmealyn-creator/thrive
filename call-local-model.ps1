param(
    [Parameter(Mandatory=$true)][string]$prompt,
    [string]$repoRoot = "$(Get-Location)"
)

# ------------------------------------------------------------
# Helper: collect a concise snapshot of the repo to give the model
# ------------------------------------------------------------
function Get-RepoSnapshot {
    param([string]$root)
    # Get a short git status (untracked, modified, staged)
    $gitStatus = git -C $root status --porcelain | Out-String
    # Get the last 5 commit messages (helps the model understand recent changes)
    $gitLog = git -C $root log -n 5 --pretty=format:"%h %s" | Out-String
    # List top‑level files (up to 200 files) to avoid blowing the prompt size
    $files = Get-ChildItem -Path $root -Recurse -File -Force -ErrorAction SilentlyContinue |
        Where-Object { $_.Length -lt 200KB } |
        Select-Object -First 200 |
        ForEach-Object { "${($_.FullName)}:`n$(Get-Content -Path $_.FullName -Raw -ErrorAction SilentlyContinue | Out-String)" }
    $filesCombined = $files -join "`n---\n"
    return @{
        gitStatus = $gitStatus.Trim();
        gitLog    = $gitLog.Trim();
        files     = $filesCombined;
    }
}

$snapshot = Get-RepoSnapshot -root $repoRoot

# ------------------------------------------------------------
# Build the prompt for the local model
# ------------------------------------------------------------
$fullPrompt = @"
You are a coding assistant (Hermes‑style). Use the information below to answer the user's request.
---
Git status:
$snapshot.gitStatus
---
Recent commits:
$snapshot.gitLog
---
Relevant files (first 200 files, truncated if large):
$snapshot.files
---
User request: $prompt
---
Respond with ONLY the commands you would run (one command per line). Do NOT add explanations unless the user asked for them.
"@

# ------------------------------------------------------------
# Call Ollama (or any local model that exposes the /api/generate endpoint)
# ------------------------------------------------------------
$body = @{
    model = "hermes3:mistral-7b-q4_0"   # change this if you pulled a different model
    prompt = $fullPrompt
    stream = $false
} | ConvertTo-Json -Depth 5

try {
    $response = Invoke-RestMethod -Method Post -Uri "http://127.0.0.1:11434/api/generate" -Body $body -ContentType "application/json"
    $output = $response.response.Trim()
    Write-Host "--- Model output --------------------------------------------------"
    Write-Host $output
    Write-Host "--- End ---------------------------------------------------------"
} catch {
    Write-Error "Failed to contact local model at http://127.0.0.1:11434. Make sure Ollama is running and the model name is correct."
    $_
}

# deploy-mods.ps1
# Copies the latest built JAR from each custom mod into the modpack's mods/ folder.
# Run this after building any mod with .\gradlew build.

$scriptDir = $PSScriptRoot
$modsDir   = Join-Path $scriptDir "mods"

$modProjects = @(
    "..\hostilemobscore",
    "..\hostilemobsoverworld",
    "..\fracturedworlds"
)

if (-not (Test-Path $modsDir)) {
    New-Item -ItemType Directory -Path $modsDir | Out-Null
}

$anyFailed = $false

foreach ($rel in $modProjects) {
    $libsDir = Join-Path $scriptDir "$rel\build\libs"
    $libsDir = [System.IO.Path]::GetFullPath($libsDir)

    if (-not (Test-Path $libsDir)) {
        Write-Warning "[$rel] build\libs not found - skipping (run .\gradlew build first)"
        $anyFailed = $true
        continue
    }

    # Pick the main JAR: exclude -sources, -javadoc, -all, -dev suffixes
    $jar = Get-ChildItem -Path $libsDir -Filter "*.jar" |
           Where-Object { $_.Name -notmatch '-(sources|javadoc|all|dev)\.jar$' } |
           Sort-Object LastWriteTime -Descending |
           Select-Object -First 1

    if (-not $jar) {
        Write-Warning "[$rel] No built JAR found in $libsDir - skipping"
        $anyFailed = $true
        continue
    }

    # Remove any previous version of this mod (same base name prefix up to the version dash)
    $baseName = ($jar.BaseName -replace '-\d+.*$', '')
    Get-ChildItem $modsDir -Filter "${baseName}*.jar" -ErrorAction SilentlyContinue | Remove-Item -Force

    Copy-Item -Path $jar.FullName -Destination $modsDir
    Write-Host "[$rel] Deployed $($jar.Name)" -ForegroundColor Green
}

if ($anyFailed) {
    Write-Host ""
    Write-Warning "One or more mods were skipped. Build them with .\gradlew build and re-run this script."
}

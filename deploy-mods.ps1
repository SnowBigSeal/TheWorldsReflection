# deploy-mods.ps1
# Builds each custom mod with Gradle, then copies the resulting JAR into the modpack's mods/ folder.
# Also syncs config/ and datapacks/ from this repo into the fracturedworlds dev run folder.

$scriptDir = $PSScriptRoot
$modsDir   = Join-Path $scriptDir "mods"
$runDir    = [System.IO.Path]::GetFullPath((Join-Path $scriptDir "..\fracturedworlds\run"))

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
    $projectDir = [System.IO.Path]::GetFullPath((Join-Path $scriptDir $rel))

    if (-not (Test-Path $projectDir)) {
        Write-Warning "[$rel] Project directory not found - skipping"
        $anyFailed = $true
        continue
    }

    # Build the mod
    Write-Host "[$rel] Building..." -ForegroundColor Cyan
    $gradlew = Join-Path $projectDir "gradlew.bat"
    & $gradlew -p $projectDir build --quiet
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "[$rel] Build failed (exit code $LASTEXITCODE) - skipping"
        $anyFailed = $true
        continue
    }

    $libsDir = Join-Path $projectDir "build\libs"

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
    Write-Warning "One or more mods failed to build or were skipped."
    exit 1
}

# Sync config/ and datapacks/ into the dev run folder
if (Test-Path $runDir) {
    foreach ($folder in @("config", "datapacks")) {
        $src = Join-Path $scriptDir $folder
        $dst = Join-Path $runDir $folder
        if (Test-Path $src) {
            Copy-Item -Path "$src\*" -Destination $dst -Recurse -Force
            Write-Host "Synced $folder\ -> run\$folder\" -ForegroundColor Cyan
        }
    }
} else {
    Write-Warning "Run folder not found at $runDir — skipping config/datapack sync"
}

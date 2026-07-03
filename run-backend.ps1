# PT Expro Gio Nusantara - Auto Maven Downloader & Spring Boot Launcher
# Plain ASCII version to prevent Windows PowerShell encoding issues

$MavenVersion = "3.9.6"
$MavenDir = "$PSScriptRoot\.maven"
$MavenZip = "$PSScriptRoot\maven.zip"
$MavenUrl = "https://archive.apache.org/dist/maven/maven-3/$MavenVersion/binaries/apache-maven-$MavenVersion-bin.zip"
$MvnPath = "$MavenDir\apache-maven-$MavenVersion\bin\mvn.cmd"

# 1. Download Apache Maven if not present
if (!(Test-Path $MvnPath)) {
    Write-Host "Maven not detected locally. Downloading Apache Maven $MavenVersion..."
    
    # Bypass SSL verification
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    
    # Download zip file
    try {
        Invoke-WebRequest -Uri $MavenUrl -OutFile $MavenZip -ErrorAction Stop
    } catch {
        Write-Error "Failed to download Maven from: $MavenUrl"
        Write-Error $_.Exception.Message
        exit 1
    }
    
    # Extract zip file
    if (Test-Path $MavenZip) {
        Write-Host "Extracting Maven to project directory..."
        try {
            Expand-Archive -Path $MavenZip -DestinationPath $MavenDir -Force
            Remove-Item $MavenZip -Force
            Write-Host "Maven successfully prepared."
        } catch {
            Write-Error "Failed to extract Maven. Please check permissions."
            Write-Error $_.Exception.Message
            exit 1
        }
    } else {
        Write-Error "Downloaded file maven.zip not found."
        exit 1
    }
}

# 2. Run Spring Boot Backend
Write-Host "Running Java Spring Boot Backend (Port: 8081)..."
Write-Host "Database: H2 In-Memory Database (Active)"
Write-Host "Profile: dev-local (Keycloak SSO Simulated)"

if (Test-Path $MvnPath) {
    Set-Location "$PSScriptRoot\fincorp-backend"
    & $MvnPath spring-boot:run
} else {
    Write-Error "Maven path not found: $MvnPath"
    exit 1
}

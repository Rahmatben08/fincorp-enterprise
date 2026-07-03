# PT Expro Gio Nusantara - Auto Maven Downloader & Spring Boot Launcher
# Connected to PostgreSQL Docker Database

$MavenVersion = "3.9.6"
$MavenDir = "$PSScriptRoot\.maven"
$MavenZip = "$PSScriptRoot\maven.zip"
$MavenUrl = "https://archive.apache.org/dist/maven/maven-3/$MavenVersion/binaries/apache-maven-$MavenVersion-bin.zip"
$MvnPath = "$MavenDir\apache-maven-$MavenVersion\bin\mvn.cmd"

# 1. Download Apache Maven if not present
if (!(Test-Path $MvnPath)) {
    Write-Host "Maven not detected locally. Downloading Apache Maven $MavenVersion..."
    
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    
    try {
        Invoke-WebRequest -Uri $MavenUrl -OutFile $MavenZip -ErrorAction Stop
    } catch {
        Write-Error "Failed to download Maven from: $MavenUrl"
        Write-Error $_.Exception.Message
        exit 1
    }
    
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

# 2. Run Spring Boot Backend connected to PostgreSQL
Write-Host "=========================================="
Write-Host " PT Expro Gio Nusantara - FinCorp Backend"
Write-Host "=========================================="
Write-Host "Backend Port   : 8081"
Write-Host "Database       : PostgreSQL (Docker - port 5433)"
Write-Host "Auth Mode      : Mock SSO (X-User-Email / X-User-Role headers)"
Write-Host "=========================================="

# Set environment variables to connect to PostgreSQL instead of H2
$env:SPRING_DATASOURCE_URL = "jdbc:postgresql://localhost:5433/fincorp_enterprise_db"
$env:SPRING_DATASOURCE_USERNAME = "fincorp_admin"
$env:SPRING_DATASOURCE_PASSWORD = "SecretPassword123"
# Override profile to NOT use dev-local H2, but also load LocalSecurityConfig trick
$env:SPRING_PROFILES_ACTIVE = "pg-local"

if (Test-Path $MvnPath) {
    Set-Location "$PSScriptRoot\fincorp-backend"
    & $MvnPath spring-boot:run
} else {
    Write-Error "Maven path not found: $MvnPath"
    exit 1
}

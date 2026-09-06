$ErrorActionPreference = 'Stop'
$hp67Root = $PSScriptRoot
$hp67Url = 'http://127.0.0.1:6767'
function Test-HP67Running {
    try {
        $hp67Response = Invoke-RestMethod -Uri "$hp67Url/api/state" -TimeoutSec 2
        return ($hp67Response.state.version -eq 1 -and $null -ne $hp67Response.token)
    } catch { return $false }
}
try {
    if (-not (Test-HP67Running)) {
        $hp67Node = Get-Command node.exe -ErrorAction SilentlyContinue
        if (-not $hp67Node) { throw 'Node.js fehlt. Bitte Node.js ab Version 22 installieren und erneut starten.' }
        $hp67Process = Start-Process -FilePath $hp67Node.Source -ArgumentList 'server.mjs' -WorkingDirectory $hp67Root -WindowStyle Hidden -PassThru
        $hp67Ready = $false
        for ($hp67Attempt = 0; $hp67Attempt -lt 20; $hp67Attempt++) {
            if (Test-HP67Running) { $hp67Ready = $true; break }
            if ($hp67Process.HasExited) { break }
            Start-Sleep -Milliseconds 300
        }
        if (-not $hp67Ready) { throw 'Das Programm konnte nicht gestartet werden. Für Details im Ordner: node server.mjs' }
    }
    Start-Process $hp67Url
    Write-Host 'HooDPlaka67 ist im Browser geöffnet. Deine Daten liegen im Unterordner data.'
} catch {
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

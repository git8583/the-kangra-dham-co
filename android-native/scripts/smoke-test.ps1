param(
    [Parameter(Mandatory = $true)][string]$Serial,
    [Parameter(Mandatory = $true)][string]$Apk
)

$ErrorActionPreference = 'Stop'
$adb = Join-Path $env:ANDROID_HOME 'platform-tools\adb.exe'
if (-not (Test-Path $adb)) { throw 'ANDROID_HOME must contain platform-tools\adb.exe.' }
if (-not (Test-Path -LiteralPath $Apk)) { throw 'APK not found.' }

function Run-Adb {
    param([string[]]$Arguments)
    $result = & $adb -s $Serial @Arguments 2>&1
    if ($LASTEXITCODE -ne 0) { throw "adb failed: $result" }
    return $result
}

function Read-Screen {
    Run-Adb @('shell', 'uiautomator', 'dump', '/sdcard/kangra-native-test.xml') | Out-Null
    $xml = Run-Adb @('shell', 'cat', '/sdcard/kangra-native-test.xml')
    return [xml]($xml -join "`n")
}

function Find-Node {
    param([xml]$Screen, [string]$Text)
    return $Screen.SelectSingleNode("//*[@text='$Text']")
}

function Tap {
    param([string]$Text)
    $node = $null
    for ($attempt = 0; $attempt -lt 6; $attempt++) {
        $node = Find-Node (Read-Screen) $Text
        if ($null -ne $node) { break }
        $size = (Run-Adb @('shell', 'wm', 'size')) -join ' '
        if ($size -notmatch '(\d+)x(\d+)') { throw 'Unable to determine screen size.' }
        $x = [int]([int]$Matches[1] / 2)
        $bottom = [int]([int]$Matches[2] * 0.8)
        $top = [int]([int]$Matches[2] * 0.3)
        Run-Adb @('shell', 'input', 'swipe', "$x", "$bottom", "$x", "$top", '400') | Out-Null
    }
    if ($null -eq $node) { throw "Not visible: $Text" }
    if ($node.bounds -notmatch '\[(\d+),(\d+)\]\[(\d+),(\d+)\]') { throw "No bounds: $Text" }
    $x = [int](([int]$Matches[1] + [int]$Matches[3]) / 2)
    $y = [int](([int]$Matches[2] + [int]$Matches[4]) / 2)
    Run-Adb @('shell', 'input', 'tap', "$x", "$y") | Out-Null
    Start-Sleep -Seconds 1
}

function Require-Text {
    param([string]$Text)
    if ($null -eq (Find-Node (Read-Screen) $Text)) { throw "Not visible: $Text" }
}

try {
    Run-Adb @('install', '-r', $Apk) | Out-Null
    Run-Adb @('shell', 'am', 'force-stop', 'co.thekangradham.nativeapp') | Out-Null
    Run-Adb @('shell', 'am', 'start', '-n', 'co.thekangradham.nativeapp/.MainActivity') | Out-Null
    Start-Sleep -Seconds 5
    Require-Text 'Tradition, Taste & Emotion'
    Tap 'Local'
    Require-Text '1 listing found.'
    Tap 'Search listings'
    Run-Adb @('shell', 'input', 'text', 'hospital') | Out-Null
    Run-Adb @('shell', 'input', 'keyevent', 'KEYCODE_BACK') | Out-Null
    Require-Text 'No listings match. Try a different search or clear the filters.'
    Tap 'Clear filters'
    Run-Adb @('shell', 'input', 'keyevent', 'KEYCODE_BACK') | Out-Null
    Require-Text '1 listing found.'
    Tap 'More'
    Tap 'Contact enquiry'
    Tap 'Send enquiry'
    Require-Text 'Complete all required fields.'
    Write-Output 'Native read-only smoke tests passed; no production writes were sent.'
} finally {
    Run-Adb @('shell', 'rm', '-f', '/sdcard/kangra-native-test.xml') | Out-Null
}

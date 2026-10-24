Add-Type @"
using System;
using System.Runtime.InteropServices;

public class WallpaperHelper {
    [DllImport("user32.dll", SetLastError = true)]
    public static extern IntPtr FindWindow(string lpClassName, string lpWindowName);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern IntPtr SendMessageTimeout(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam, uint fuFlags, uint uTimeout, out IntPtr lpdwResult);

    [DllImport("user32.dll")]
    public static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);

    public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern IntPtr FindWindowEx(IntPtr parentHandle, IntPtr childAfter, string className, string windowTitle);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern IntPtr SetParent(IntPtr hWndChild, IntPtr hWndNewParent);

    [DllImport("user32.dll")]
    public static extern bool SetWindowPos(IntPtr hWnd, IntPtr hWndInsertAfter, int X, int Y, int cx, int cy, uint uFlags);
}
"@

$progman = [WallpaperHelper]::FindWindow("Progman", $null)
$result = [IntPtr]::Zero
[WallpaperHelper]::SendMessageTimeout($progman, 0x052C, [IntPtr]::Zero, [IntPtr]::Zero, 0, 1000, [ref]$result) | Out-Null

$workerw = [IntPtr]::Zero
[WallpaperHelper]::EnumWindows({
    param($topHandle, $lParam)
    $shellDll = [WallpaperHelper]::FindWindowEx($topHandle, [IntPtr]::Zero, "SHELLDLL_DefView", $null)
    if ($shellDll -ne [IntPtr]::Zero) {
        $script:workerw = [WallpaperHelper]::FindWindowEx([IntPtr]::Zero, $topHandle, "WorkerW", $null)
    }
    return $true
}, [IntPtr]::Zero) | Out-Null

Write-Host "WorkerW handle found: $workerw"

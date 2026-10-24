Add-Type @"
using System;
using System.Text;
using System.Runtime.InteropServices;

public class WinEnum {
    [DllImport("user32.dll")]
    public static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);
    public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

    [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
    public static extern int GetClassName(IntPtr hWnd, StringBuilder lpClassName, int nMaxCount);

    [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern IntPtr FindWindowEx(IntPtr parentHandle, IntPtr childAfter, string className, string windowTitle);
}
"@

[WinEnum]::EnumWindows({
    param($hWnd, $lParam)
    $sbClass = New-Object System.Text.StringBuilder 256
    [WinEnum]::GetClassName($hWnd, $sbClass, 256) | Out-Null
    $className = $sbClass.ToString()
    if ($className -eq "WorkerW" -or $className -eq "Progman") {
        $sbText = New-Object System.Text.StringBuilder 256
        [WinEnum]::GetWindowText($hWnd, $sbText, 256) | Out-Null
        $defView = [WinEnum]::FindWindowEx($hWnd, [IntPtr]::Zero, "SHELLDLL_DefView", $null)
        Write-Host "Handle: $hWnd | Class: $className | Title: '$($sbText.ToString())' | HasDefView: $($defView -ne [IntPtr]::Zero)"
    }
    return $true
}, [IntPtr]::Zero) | Out-Null

Add-Type @"
using System;
using System.Runtime.InteropServices;

public class Win32WorkerW {
    [DllImport("user32.dll", SetLastError = true)]
    public static extern IntPtr FindWindow(string lpClassName, string lpWindowName);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern IntPtr SendMessageTimeout(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam, uint fuFlags, uint uTimeout, out IntPtr lpdwResult);

    [DllImport("user32.dll")]
    [return: MarshalAs(UnmanagedType.Bool)]
    public static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);

    public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern IntPtr FindWindowEx(IntPtr parentHandle, IntPtr childAfter, string className, string windowTitle);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern IntPtr SetParent(IntPtr hWndChild, IntPtr hWndNewParent);

    public static IntPtr WorkerWHandle = IntPtr.Zero;

    public static IntPtr GetWorkerW() {
        IntPtr progman = FindWindow("Progman", null);
        IntPtr result = IntPtr.Zero;
        SendMessageTimeout(progman, 0x052C, IntPtr.Zero, IntPtr.Zero, 0, 1000, out result);

        EnumWindows((hWnd, lParam) => {
            IntPtr shellView = FindWindowEx(hWnd, IntPtr.Zero, "SHELLDLL_DefView", null);
            if (shellView != IntPtr.Zero) {
                WorkerWHandle = FindWindowEx(IntPtr.Zero, hWnd, "WorkerW", null);
            }
            return true;
        }, IntPtr.Zero);

        return WorkerWHandle;
    }

    public static void AttachToWallpaper(IntPtr childHwnd) {
        IntPtr workerW = GetWorkerW();
        if (workerW != IntPtr.Zero) {
            SetParent(childHwnd, workerW);
        }
    }
}
"@

$workerW = [Win32WorkerW]::GetWorkerW()
Write-Host "WorkerW Handle: $workerW"

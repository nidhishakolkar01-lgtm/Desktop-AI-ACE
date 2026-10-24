try {
    $battery = Get-CimInstance Win32_Battery -ErrorAction SilentlyContinue | Select-Object -First 1
    $cpu = Get-CimInstance Win32_Processor | Select-Object -First 1
    $os = Get-CimInstance Win32_OperatingSystem
    $drive = Get-PSDrive C -ErrorAction SilentlyContinue

    $cpuLoad = 0
    if ($cpu -and $cpu.LoadPercentage -ne $null) {
        $cpuLoad = [int]$cpu.LoadPercentage
    }

    $batteryPercent = -1
    $isCharging = $true
    if ($battery) {
        if ($battery.EstimatedChargeRemaining -ne $null) { $batteryPercent = [int]$battery.EstimatedChargeRemaining }
        if ($battery.BatteryStatus -ne $null) { $isCharging = ($battery.BatteryStatus -eq 2) }
    }

    $freeRam = [math]::Round($os.FreePhysicalMemory / 1MB, 2)
    $totalRam = [math]::Round($os.TotalVisibleMemorySize / 1MB, 2)
    $freeDisk = [math]::Round($drive.Free / 1GB, 2)

    $obj = [PSCustomObject]@{
        CPU = if ($cpu) { $cpu.Name.Trim() } else { "AMD Ryzen AI" }
        CPULoad = $cpuLoad
        BatteryPercent = $batteryPercent
        BatteryCharging = $isCharging
        FreeRamGB = $freeRam
        TotalRamGB = $totalRam
        FreeDiskGB = $freeDisk
        Time = (Get-Date).ToString("hh:mm:ss tt")
        Date = (Get-Date).ToString("dddd, MMMM dd, yyyy")
    }

    $obj | ConvertTo-Json -Compress
} catch {
    Write-Output "{}"
}

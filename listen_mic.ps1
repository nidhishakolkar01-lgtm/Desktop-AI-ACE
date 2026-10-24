Add-Type -AssemblyName System.Speech
try {
    $rec = New-Object System.Speech.Recognition.SpeechRecognitionEngine
    $rec.SetInputToDefaultAudioDevice()
    $grammar = New-Object System.Speech.Recognition.DictationGrammar
    $rec.LoadGrammar($grammar)
    
    # Listen for speech with a 5-second initial silence timeout and 6-second total timeout
    $result = $rec.Recognize([TimeSpan]::FromSeconds(5))
    if ($result -and $result.Text) {
        Write-Output $result.Text.Trim()
    } else {
        Write-Output ""
    }
} catch {
    Write-Output ""
} finally {
    if ($rec) { $rec.Dispose() }
}

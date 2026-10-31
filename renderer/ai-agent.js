// Low-Latency ACE AI Agent with Parallel Multi-Tool Launcher & Real Hardware Telemetry

function startAceApp() {
  const avatar = window.avatar || new window.AvatarRenderer('canvas3d');
  window.avatar = avatar;

  // UI Elements
  const liveTime = document.getElementById('live-time');
  const liveDate = document.getElementById('live-date');
  const sysCpu = document.getElementById('sys-cpu');
  const sysRam = document.getElementById('sys-ram');
  const sysBattery = document.getElementById('sys-battery');
  const sysDisk = document.getElementById('sys-disk');
  const exitBtn = document.getElementById('exit-btn');

  const dialogueContainer = document.getElementById('dialogue-container');
  const textInput = document.getElementById('text-input');
  const sendBtn = document.getElementById('send-btn');
  const micBtn = document.getElementById('mic-btn');
  const modelSelect = document.getElementById('model-select');
  const waveBars = document.querySelectorAll('.wave-bar');

  // Quick Action Chips
  const chipWeather = document.getElementById('chip-weather');
  const chipVolUp = document.getElementById('chip-vol-up');
  const chipVolDown = document.getElementById('chip-vol-down');
  const chipVolMute = document.getElementById('chip-vol-mute');
  const chipMedia = document.getElementById('chip-media');
  const chipScreenshot = document.getElementById('chip-screenshot');
  const chipLock = document.getElementById('chip-lock');
  const chipVision = document.getElementById('chip-vision');
  const modeBtn = document.getElementById('mode-btn');
  const laserScanLine = document.getElementById('laser-scan-line');

  let lastCpuAlertTime = 0;
  let lastBatteryAlertTime = 0;

  // Cached Real Telemetry
  let realTelemetry = {
    CPU: "AMD Ryzen AI 5 340",
    CPULoad: 10,
    BatteryPercent: 40,
    BatteryCharging: false,
    FreeRamGB: 1.4,
    TotalRamGB: 15.3,
    FreeDiskGB: 15.6,
    Time: new Date().toLocaleTimeString(),
    Date: new Date().toLocaleDateString()
  };

  // 1. REAL HARDWARE TELEMETRY POLLING
  async function refreshRealTelemetry() {
    if (window.electronAPI && window.electronAPI.getRealTelemetry) {
      try {
        const data = await window.electronAPI.getRealTelemetry();
        if (data && data.CPU) {
          realTelemetry = data;

          if (liveTime) liveTime.textContent = data.Time;
          if (liveDate) liveDate.textContent = data.Date;

          if (sysCpu) sysCpu.textContent = `${data.CPULoad}%`;
          if (sysRam) sysRam.textContent = `${data.FreeRamGB} / ${data.TotalRamGB} GB`;
          if (sysBattery) {
            const chargeText = data.BatteryCharging ? '⚡' : '';
            sysBattery.textContent = data.BatteryPercent >= 0 ? `${data.BatteryPercent}% ${chargeText}` : 'AC';
          }
          if (sysDisk) sysDisk.textContent = `${data.FreeDiskGB} GB`;

          // Autonomous Watchdog Core (Proactive System Guardian)
          if (data.CPULoad > 85 && (Date.now() - lastCpuAlertTime > 90000)) {
            lastCpuAlertTime = Date.now();
            const topProc = data.TopProcess || 'system task';
            appendBubble(`⚠️ High load alert: ${data.CPULoad}% CPU usage detected (${topProc}).`, 'bot');
            if (window.aceSFX) window.aceSFX.playAlert();
            queueSpeech(`Sir, high CPU load detected at ${data.CPULoad} percent, dominated by ${topProc}.`);
          }

          if (data.BatteryPercent > 0 && data.BatteryPercent <= 15 && !data.BatteryCharging && (Date.now() - lastBatteryAlertTime > 180000)) {
            lastBatteryAlertTime = Date.now();
            appendBubble(`🪫 Critical Battery Alert: ${data.BatteryPercent}% remaining.`, 'bot');
            if (window.aceSFX) window.aceSFX.playAlert();
            queueSpeech(`Sir, battery level is critical at ${data.BatteryPercent} percent. Power connection recommended.`);
          }
        }
      } catch (e) {
        console.error('Telemetry error:', e);
      }
    }
  }

  refreshRealTelemetry();
  setInterval(refreshRealTelemetry, 4000);

  // 2. WINDOW EXIT / CLOSE
  if (exitBtn) {
    exitBtn.addEventListener('click', () => {
      if (window.electronAPI && window.electronAPI.windowControl) {
        window.electronAPI.windowControl('close');
      } else {
        window.close();
      }
    });
  }

  // 3. SENTENCE-CHUNKED TTS QUEUE & GESTURE DRIVER
  const speechQueue = [];
  let isPlayingSpeech = false;
  let isListening = false;

  function queueSpeech(text) {
    if (!text || !text.trim()) return;
    speechQueue.push(text.trim());
    if (!isPlayingSpeech) processNextSpeech();
  }

  function processNextSpeech() {
    if (speechQueue.length === 0) {
      isPlayingSpeech = false;
      avatar.setRealAudioEnergy(0);
      avatar.setAgentState('idle');
      animateWaveform(0);
      return;
    }

    isPlayingSpeech = true;
    avatar.setAgentState('speaking');
    const sentence = speechQueue.shift();

    const utterance = new SpeechSynthesisUtterance(sentence);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    // Prioritize natural English male voices (Microsoft David, Mark, Guy, George, or any English male voice)
    const maleVoice = voices.find(v => 
      v.name.includes('David') || 
      v.name.includes('Mark') || 
      v.name.includes('Guy') || 
      v.name.includes('George') || 
      v.name.includes('Male') || 
      (v.lang.startsWith('en') && !v.name.includes('Zira') && !v.name.includes('Jenny') && !v.name.includes('Aria') && !v.name.includes('Hazel') && !v.name.includes('Susan'))
    ) || voices.find(v => v.lang.startsWith('en'));
    if (maleVoice) utterance.voice = maleVoice;

    let ticker = null;
    utterance.onstart = () => {
      ticker = setInterval(() => {
        if (!isPlayingSpeech) return;
        let bands = { low: 0, mid: 0, high: 0 };
        if (window.aceSFX && window.aceSFX.getSpectralBands) {
          bands = window.aceSFX.getSpectralBands();
        }
        const t = Date.now() * 0.025;
        const cadence = (Math.sin(t * 2.2) * 0.22) + (Math.cos(t * 4.5) * 0.18);
        const midEnergy = Math.max(0.12, Math.min(0.95, bands.mid + 0.35 + cadence));
        const lowEnergy = Math.max(0.08, Math.min(0.85, bands.low + 0.25 + cadence * 0.8));
        const highEnergy = Math.max(0.08, Math.min(0.85, bands.high + 0.20 + cadence * 0.5));

        if (avatar.setSpectralFrequencies) {
          avatar.setSpectralFrequencies(lowEnergy, midEnergy, highEnergy);
        }
        avatar.setRealAudioEnergy(midEnergy);
        animateWaveform(midEnergy);
      }, 30);
    };

    utterance.onend = () => {
      clearInterval(ticker);
      if (avatar.setSpectralFrequencies) avatar.setSpectralFrequencies(0, 0, 0);
      avatar.setRealAudioEnergy(0);
      processNextSpeech();
    };

    utterance.onerror = () => {
      clearInterval(ticker);
      if (avatar.setSpectralFrequencies) avatar.setSpectralFrequencies(0, 0, 0);
      avatar.setRealAudioEnergy(0);
      processNextSpeech();
    };

    window.speechSynthesis.speak(utterance);
  }

  function animateWaveform(energy) {
    waveBars.forEach((bar) => {
      const height = energy > 0.05 ? Math.min(18, Math.max(3, (energy * 18) * (0.6 + Math.random() * 0.4))) : 3;
      bar.style.height = `${height}px`;
    });
  }

  // 4. REAL MICROPHONE LISTENING WITH SFX
  micBtn.addEventListener('click', async () => {
    if (isListening) return;

    if (window.aceSFX) window.aceSFX.playListening();
    isListening = true;
    avatar.setAgentState('listening');
    micBtn.classList.add('listening');
    appendBubble("ACE AI listening...", 'bot');

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          isListening = false;
          micBtn.classList.remove('listening');
          if (transcript && transcript.trim()) {
            textInput.value = transcript;
            handleUserMessage(transcript);
          } else {
            avatar.setAgentState('idle');
          }
        };

        recognition.onerror = async () => {
          // Fallback to electron listenMic
          fallbackListenMic();
        };

        recognition.onend = () => {
          if (isListening) {
            isListening = false;
            micBtn.classList.remove('listening');
            avatar.setAgentState('idle');
          }
        };

        recognition.start();
        return;
      } catch (e) {
        // Fallback below
      }
    }

    fallbackListenMic();
  });

  async function fallbackListenMic() {
    try {
      if (window.electronAPI && window.electronAPI.listenMic) {
        const recognized = await window.electronAPI.listenMic();
        isListening = false;
        micBtn.classList.remove('listening');

        if (recognized && recognized.trim()) {
          textInput.value = recognized;
          handleUserMessage(recognized);
        } else {
          avatar.setAgentState('idle');
          appendBubble("Microphone idle. Please speak clearly into your mic.", 'bot');
        }
      }
    } catch (e) {
      isListening = false;
      avatar.setAgentState('idle');
      micBtn.classList.remove('listening');
    }
  }

  // 5. EXPANDED NATIVE OS TOOL EXECUTION
  async function executeToolsInText(text) {
    // 1. App Launching
    const appMatches = [...text.matchAll(/\[TOOL:(?:OPEN|OPEN_APP|LAUNCH):(.+?)\]/gi)];
    const appsToOpen = [];
    appMatches.forEach((m) => {
      if (m[1]) {
        const app = m[1].trim();
        if (app && !appsToOpen.includes(app)) appsToOpen.push(app);
      }
    });
    if (appsToOpen.length > 0 && window.electronAPI && window.electronAPI.launchApps) {
      window.electronAPI.launchApps(appsToOpen);
      if (window.aceSFX) window.aceSFX.playConfirm();
    }

    // 2. Volume Controls
    const volMatch = text.match(/\[TOOL:VOLUME:(up|down|mute)\]/i);
    if (volMatch && window.electronAPI && window.electronAPI.volumeControl) {
      window.electronAPI.volumeControl(volMatch[1].toLowerCase());
      if (window.aceSFX) window.aceSFX.playConfirm();
    }

    // 3. Media Controls
    const mediaMatch = text.match(/\[TOOL:MEDIA:(playpause|next|prev)\]/i);
    if (mediaMatch && window.electronAPI && window.electronAPI.mediaControl) {
      window.electronAPI.mediaControl(mediaMatch[1].toLowerCase());
      if (window.aceSFX) window.aceSFX.playConfirm();
    }

    // 4. Lock PC
    if (/\[TOOL:LOCK_PC\]/i.test(text) && window.electronAPI && window.electronAPI.lockPC) {
      if (window.aceSFX) window.aceSFX.playAlert();
      setTimeout(() => window.electronAPI.lockPC(), 800);
    }

    // 5. Screenshot
    if (/\[TOOL:SCREENSHOT\]/i.test(text) && window.electronAPI && window.electronAPI.captureScreen) {
      if (window.aceSFX) window.aceSFX.playConfirm();
      window.electronAPI.captureScreen().then((res) => {
        if (res && res.success) {
          appendBubble(`📸 Screenshot saved: ${res.path}`, 'bot');
        }
      });
    }

    // Clean tags for speech synthesis
    let cleanText = text
      .replace(/\[TOOL:(?:OPEN|OPEN_APP|LAUNCH):.+?\]/gi, '')
      .replace(/\[TOOL:VOLUME:.+?\]/gi, '')
      .replace(/\[TOOL:MEDIA:.+?\]/gi, '')
      .replace(/\[TOOL:LOCK_PC\]/gi, '')
      .replace(/\[TOOL:SCREENSHOT\]/gi, '')
      .replace(/\[TOOL:WEATHER:.+?\]/gi, '')
      .replace(/\[TOOL:SEARCH:.+?\]/gi, '')
      .trim();

    if (appsToOpen.length > 0) {
      cleanText += ` (Opening ${appsToOpen.join(', ')})`;
    }
    return cleanText;
  }

  // 6. QUICK ACTION CHIP EVENT LISTENERS
  if (chipWeather) {
    chipWeather.addEventListener('click', async () => {
      if (window.aceSFX) window.aceSFX.playConfirm();
      appendBubble("Checking weather telemetry...", 'bot');
      if (window.electronAPI && window.electronAPI.fetchWeather) {
        const data = await window.electronAPI.fetchWeather('');
        if (data && data.success) {
          const msg = `Weather for ${data.area}: ${data.tempC}°C (${data.tempF}°F), ${data.desc}. Humidity: ${data.humidity}%, Wind: ${data.windSpeedKmph} km/h.`;
          appendBubble(`🌤️ ${msg}`, 'bot');
          queueSpeech(msg);
        } else {
          appendBubble("Unable to retrieve weather telemetry at this moment.", 'bot');
        }
      }
    });
  }

  if (chipVolUp) {
    chipVolUp.addEventListener('click', () => {
      if (window.aceSFX) window.aceSFX.playConfirm();
      if (window.electronAPI && window.electronAPI.volumeControl) window.electronAPI.volumeControl('up');
      appendBubble("🔊 Volume increased.", 'bot');
    });
  }

  if (chipVolDown) {
    chipVolDown.addEventListener('click', () => {
      if (window.aceSFX) window.aceSFX.playConfirm();
      if (window.electronAPI && window.electronAPI.volumeControl) window.electronAPI.volumeControl('down');
      appendBubble("🔉 Volume decreased.", 'bot');
    });
  }

  if (chipVolMute) {
    chipVolMute.addEventListener('click', () => {
      if (window.aceSFX) window.aceSFX.playConfirm();
      if (window.electronAPI && window.electronAPI.volumeControl) window.electronAPI.volumeControl('mute');
      appendBubble("🔇 Volume mute toggled.", 'bot');
    });
  }

  if (chipMedia) {
    chipMedia.addEventListener('click', () => {
      if (window.aceSFX) window.aceSFX.playConfirm();
      if (window.electronAPI && window.electronAPI.mediaControl) window.electronAPI.mediaControl('playpause');
      appendBubble("⏯️ Media playback toggled.", 'bot');
    });
  }

  if (chipScreenshot) {
    chipScreenshot.addEventListener('click', async () => {
      if (window.aceSFX) window.aceSFX.playConfirm();
      if (window.electronAPI && window.electronAPI.captureScreen) {
        const res = await window.electronAPI.captureScreen();
        if (res && res.success) {
          appendBubble(`📸 Screenshot captured: ${res.path}`, 'bot');
          queueSpeech("Screenshot captured and stored.");
        }
      }
    });
  }

  if (chipLock) {
    chipLock.addEventListener('click', () => {
      if (window.aceSFX) window.aceSFX.playAlert();
      appendBubble("🔒 Locking workstation.", 'bot');
      queueSpeech("Locking workstation now.");
      setTimeout(() => {
        if (window.electronAPI && window.electronAPI.lockPC) window.electronAPI.lockPC();
      }, 1000);
    });
  }

  // Vision Scanner Chip
  if (chipVision) {
    chipVision.addEventListener('click', () => {
      executeScreenVisionScan();
    });
  }

  // Dual Viewport Mode Toggle Button
  if (modeBtn) {
    modeBtn.addEventListener('click', async () => {
      if (window.aceSFX) window.aceSFX.playConfirm();
      if (window.electronAPI && window.electronAPI.toggleMode) {
        const res = await window.electronAPI.toggleMode();
        const isWidget = (res && res.mode === 'widget');
        document.body.classList.toggle('widget-mode', isWidget);
        modeBtn.textContent = isWidget ? '🖥️ Full' : '🪟 Mode';
        appendBubble(isWidget ? 'Switched to Floating Hologram Widget.' : 'Returned to Fullscreen Command Center.', 'bot');
      }
    });
  }

  // Multimodal Screen Vision Execution Function (LLaVA)
  async function executeScreenVisionScan(customPrompt) {
    if (laserScanLine) laserScanLine.classList.add('scanning');
    if (window.aceSFX) window.aceSFX.playThinking();
    avatar.setAgentState('thinking');

    appendBubble("👁️ Optical Scanner engaged. Scanning active display buffer...", 'bot');

    try {
      if (!window.electronAPI || !window.electronAPI.scanScreen) {
        throw new Error("Screen capture API unavailable.");
      }
      const capture = await window.electronAPI.scanScreen();
      if (!capture || !capture.success || !capture.base64) {
        throw new Error(capture?.error || "Failed to capture desktop frame.");
      }

      const botBubble = appendBubble("Analyzing with Neural Vision Core (LLaVA)...", 'bot');
      const promptText = customPrompt || "Analyze this desktop screen. Explain what the user is working on, describe any code, applications, text, or errors visible, and provide useful advice. Be concise and articulate like ACE AI. Address the user as sir.";

      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llava:latest',
          prompt: `You are ACE AI, a tactical operating system. ${promptText}`,
          images: [capture.base64],
          stream: true
        })
      });

      if (!response.ok) throw new Error(`Ollama Vision Error: ${response.statusText}`);

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let fullReply = '';
      let sentenceBuffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const parsed = JSON.parse(line);
            if (parsed.response) {
              fullReply += parsed.response;
              sentenceBuffer += parsed.response;
              botBubble.textContent = fullReply;
              dialogueContainer.scrollTop = dialogueContainer.scrollHeight;

              if (/[.!?\n]/.test(parsed.response) && sentenceBuffer.trim().length > 15) {
                queueSpeech(sentenceBuffer.trim());
                sentenceBuffer = '';
              }
            }
          } catch (e) {}
        }
      }

      if (sentenceBuffer.trim().length > 0) {
        queueSpeech(sentenceBuffer.trim());
      }

      if (window.aceSFX) window.aceSFX.playConfirm();

    } catch (err) {
      console.error('Vision analysis error:', err);
      appendBubble(`Optical sensor error: ${err.message}`, 'bot');
      queueSpeech("Optical scanner encountered interference analyzing display buffer.");
    } finally {
      if (laserScanLine) laserScanLine.classList.remove('scanning');
      avatar.setAgentState('idle');
    }
  }

  // 7. STREAMING OLLAMA GENERATION WITH DIRECT SHORTCUTS
  async function handleUserMessage(userText) {
    if (!userText.trim()) return;

    window.speechSynthesis.cancel();
    speechQueue.length = 0;
    isPlayingSpeech = false;

    appendBubble(userText, 'user');
    textInput.value = '';

    const lower = userText.toLowerCase().trim();

    // Fast-path Direct Intent Detection
    if (/^(volume\s*up|increase\s*volume|louder)/i.test(lower)) {
      if (window.aceSFX) window.aceSFX.playConfirm();
      if (window.electronAPI && window.electronAPI.volumeControl) window.electronAPI.volumeControl('up');
      const reply = "Increasing system volume now.";
      appendBubble(reply, 'bot');
      queueSpeech(reply);
      return;
    }
    if (/^(volume\s*down|decrease\s*volume|lower\s*volume|quieter)/i.test(lower)) {
      if (window.aceSFX) window.aceSFX.playConfirm();
      if (window.electronAPI && window.electronAPI.volumeControl) window.electronAPI.volumeControl('down');
      const reply = "Decreasing system volume.";
      appendBubble(reply, 'bot');
      queueSpeech(reply);
      return;
    }
    if (/^(mute|unmute|silence)/i.test(lower)) {
      if (window.aceSFX) window.aceSFX.playConfirm();
      if (window.electronAPI && window.electronAPI.volumeControl) window.electronAPI.volumeControl('mute');
      const reply = "Volume mute toggled.";
      appendBubble(reply, 'bot');
      queueSpeech(reply);
      return;
    }
    if (/^(pause|play|resume|play\s*music|pause\s*music|skip\s*song|next\s*track)/i.test(lower)) {
      if (window.aceSFX) window.aceSFX.playConfirm();
      const action = lower.includes('next') || lower.includes('skip') ? 'next' : 'playpause';
      if (window.electronAPI && window.electronAPI.mediaControl) window.electronAPI.mediaControl(action);
      const reply = action === 'next' ? "Skipping to next track." : "Toggling media playback.";
      appendBubble(reply, 'bot');
      queueSpeech(reply);
      return;
    }
    if (/^(lock\s*(my\s*)?(pc|computer|workstation))/i.test(lower)) {
      if (window.aceSFX) window.aceSFX.playAlert();
      const reply = "Locking workstation immediately, sir.";
      appendBubble(reply, 'bot');
      queueSpeech(reply);
      setTimeout(() => {
        if (window.electronAPI && window.electronAPI.lockPC) window.electronAPI.lockPC();
      }, 1000);
      return;
    }
    if (/^(take\s*(a\s*)?screenshot|capture\s*(the\s*)?screen)/i.test(lower)) {
      if (window.aceSFX) window.aceSFX.playConfirm();
      if (window.electronAPI && window.electronAPI.captureScreen) {
        const res = await window.electronAPI.captureScreen();
        const reply = res && res.success ? `Screenshot saved to ${res.path}` : "Screenshot captured.";
        appendBubble(reply, 'bot');
        queueSpeech("Screenshot captured and saved.");
      }
      return;
    }
    if (/^(what('?s|\s+is)\s+the\s+weather|check\s+weather|weather\s+report)/i.test(lower)) {
      if (window.aceSFX) window.aceSFX.playConfirm();
      appendBubble("Retrieving live meteorological telemetry...", 'bot');
      if (window.electronAPI && window.electronAPI.fetchWeather) {
        const data = await window.electronAPI.fetchWeather('');
        if (data && data.success) {
          const reply = `Current conditions for ${data.area}: ${data.tempC}°C, ${data.desc}. Humidity: ${data.humidity}%.`;
          appendBubble(`🌤️ ${reply}`, 'bot');
          queueSpeech(reply);
          return;
        }
      }
    }

    if (/^(scan\s*(my\s*)?screen|look\s*at\s*(my\s*)?screen|what('?s|\s+is)\s*on\s*(my\s*)?screen|analyze\s*(my\s*)?screen|read\s*(my\s*)?screen)/i.test(lower)) {
      executeScreenVisionScan(userText);
      return;
    }

    // Default: Local LLM Processing via Ollama
    if (window.aceSFX) window.aceSFX.playThinking();
    avatar.setAgentState('thinking');

    const botBubble = appendBubble('', 'bot');
    const selectedModel = modelSelect.value || 'qwen:latest';

    const systemPrompt = `You are ACE AI, the advanced AI desktop companion and tactical operating system.
REAL LAPTOP TELEMETRY:
- CPU: ${realTelemetry.CPU} (${realTelemetry.CPULoad}% Load)
- Battery: ${realTelemetry.BatteryPercent}% (${realTelemetry.BatteryCharging ? 'Charging' : 'Discharging'})
- Free RAM: ${realTelemetry.FreeRamGB} GB / ${realTelemetry.TotalRamGB} GB
- Free Disk Space: ${realTelemetry.FreeDiskGB} GB
- Local Time: ${realTelemetry.Time}

CAPABILITIES & OS TOOLS:
You can control Windows, launch applications, adjust volume, control media, take screenshots, lock PC, and check weather.
When the user asks you to perform an action, append the appropriate tool tags:
- Applications: [TOOL:OPEN:app_name] (e.g. [TOOL:OPEN:chrome] [TOOL:OPEN:spotify])
- Volume: [TOOL:VOLUME:up], [TOOL:VOLUME:down], [TOOL:VOLUME:mute]
- Media playback: [TOOL:MEDIA:playpause], [TOOL:MEDIA:next], [TOOL:MEDIA:prev]
- Security: [TOOL:LOCK_PC]
- Screenshot: [TOOL:SCREENSHOT]

Examples:
- "Open Chrome and Spotify": "Right away. Opening Chrome and Spotify now. [TOOL:OPEN:chrome] [TOOL:OPEN:spotify]"
- "Mute volume": "Muting system audio now. [TOOL:VOLUME:mute]"
- "Pause the music": "Pausing playback. [TOOL:MEDIA:playpause]"
- "Take a screenshot": "Capturing screen. [TOOL:SCREENSHOT]"
- "Lock my PC": "Locking workstation. [TOOL:LOCK_PC]"

Be concise, witty, loyal, and articulate like ACE AI (1-2 sentences). Address the user with respect (e.g. "sir").`;

    try {
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: selectedModel,
          prompt: `${systemPrompt}\n\nUser: ${userText}\nACE AI:`,
          stream: true
        })
      });

      if (!response.ok) throw new Error(`Ollama error: ${response.statusText}`);

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let fullReply = '';
      let sentenceBuffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const parsed = JSON.parse(line);
            if (parsed.response) {
              const token = parsed.response;
              fullReply += token;
              sentenceBuffer += token;
              botBubble.textContent = fullReply;
              dialogueContainer.scrollTop = dialogueContainer.scrollHeight;

              if (/[.!?\n]/.test(token) && sentenceBuffer.trim().length > 8) {
                const cleanedSentence = await executeToolsInText(sentenceBuffer);
                queueSpeech(cleanedSentence);
                sentenceBuffer = '';
              }
            }
          } catch (e) {}
        }
      }

      if (sentenceBuffer.trim().length > 0) {
        const cleanedSentence = await executeToolsInText(sentenceBuffer);
        queueSpeech(cleanedSentence);
      }

    } catch (err) {
      console.error('Generation error:', err);
      const fallback = "Neural core offline. Local fallback operating system active.";
      botBubble.textContent = fallback;
      queueSpeech(fallback);
    }
  }

  function appendBubble(text, type) {
    const b = document.createElement('div');
    b.className = `bubble ${type}`;
    b.textContent = text;
    dialogueContainer.appendChild(b);
    dialogueContainer.scrollTop = dialogueContainer.scrollHeight;
    return b;
  }

  sendBtn.addEventListener('click', () => {
    handleUserMessage(textInput.value);
  });

  textInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      handleUserMessage(textInput.value);
    }
  });

  setTimeout(() => {
    if (window.aceSFX) window.aceSFX.playActivation();
    queueSpeech("At your service, sir. Real hardware telemetry connected. All systems nominal.");
  }, 1000);
}

function waitForAvatar() {
  if (window.AvatarRenderer) {
    startAceApp();
  } else {
    setTimeout(waitForAvatar, 25);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', waitForAvatar);
} else {
  waitForAvatar();
}
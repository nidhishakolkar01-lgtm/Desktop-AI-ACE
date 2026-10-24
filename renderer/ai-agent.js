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
        const t = Date.now() * 0.02;
        const energy = 0.25 + (Math.sin(t * 1.8) * 0.3) + (Math.cos(t * 3.5) * 0.25);
        const clamped = Math.max(0.08, Math.min(0.9, energy));
        avatar.setRealAudioEnergy(clamped);
        animateWaveform(clamped);
      }, 35);
    };

    utterance.onend = () => {
      clearInterval(ticker);
      avatar.setRealAudioEnergy(0);
      processNextSpeech();
    };

    utterance.onerror = () => {
      clearInterval(ticker);
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

  // 4. REAL MICROPHONE LISTENING VIA WINDOWS API
  micBtn.addEventListener('click', async () => {
    if (isListening) return;

    isListening = true;
    avatar.setAgentState('listening');
    micBtn.classList.add('listening');
    appendBubble("ACE AI listening to microphone...", 'bot');

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
  });

  // 5. PARALLEL MULTI-TOOL EXECUTION
  function executeToolsInText(text) {
    const appMatches = [...text.matchAll(/\[TOOL:(?:OPEN|OPEN_APP|LAUNCH):(.+?)\]/gi)];
    const appsToOpen = [];

    appMatches.forEach((m) => {
      if (m[1]) {
        const app = m[1].trim();
        if (app && !appsToOpen.includes(app)) {
          appsToOpen.push(app);
        }
      }
    });

    if (appsToOpen.length > 0 && window.electronAPI && window.electronAPI.launchApps) {
      window.electronAPI.launchApps(appsToOpen);
    }

    let cleanText = text.replace(/\[TOOL:(?:OPEN|OPEN_APP|LAUNCH):.+?\]/gi, '');
    if (appsToOpen.length > 0) {
      cleanText += ` (Opening ${appsToOpen.join(', ')})`;
    }
    return cleanText;
  }

  // 6. STREAMING OLLAMA GENERATION
  async function handleUserMessage(userText) {
    if (!userText.trim()) return;

    window.speechSynthesis.cancel();
    speechQueue.length = 0;
    isPlayingSpeech = false;

    appendBubble(userText, 'user');
    textInput.value = '';

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

CAPABILITIES & MULTI-APP LAUNCHING:
You can launch ANY application, program, game, website, or tool on Windows.
You can open MULTIPLE applications simultaneously! For each application to open, include [TOOL:OPEN:app_name].
Examples:
- "Open Chrome and Spotify": "Right away. Opening Chrome and Spotify now. [TOOL:OPEN:chrome] [TOOL:OPEN:spotify]"
- "Launch Calculator, Notepad, and YouTube": "Executing now. [TOOL:OPEN:calc] [TOOL:OPEN:notepad] [TOOL:OPEN:youtube]"
- "Open VS Code and Terminal": "On it. [TOOL:OPEN:code] [TOOL:OPEN:terminal]"

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
                const cleanedSentence = executeToolsInText(sentenceBuffer);
                queueSpeech(cleanedSentence);
                sentenceBuffer = '';
              }
            }
          } catch (e) {}
        }
      }

      if (sentenceBuffer.trim().length > 0) {
        const cleanedSentence = executeToolsInText(sentenceBuffer);
        queueSpeech(cleanedSentence);
      }

    } catch (err) {
      console.error('Generation error:', err);
      const fallback = "Systems experiencing interference connecting to local neural core.";
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
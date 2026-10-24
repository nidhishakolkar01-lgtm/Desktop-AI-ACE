import sys
import io
import sounddevice as sd
import numpy as np
from scipy.io import wavfile
import speech_recognition as sr

def record_and_recognize():
    fs = 16000
    duration = 4.5  # record 4.5 seconds
    try:
        recording = sd.rec(int(duration * fs), samplerate=fs, channels=1, dtype='int16')
        sd.wait()
        
        # Save to in-memory wav buffer
        wav_io = io.BytesIO()
        wavfile.write(wav_io, fs, recording)
        wav_io.seek(0)
        
        r = sr.Recognizer()
        r.energy_threshold = 300
        r.dynamic_energy_threshold = True
        
        with sr.AudioFile(wav_io) as source:
            audio = r.record(source)
            
        text = r.recognize_google(audio)
        print(text.strip())
    except Exception as e:
        # If quiet or recognition fails
        pass

if __name__ == '__main__':
    record_and_recognize()
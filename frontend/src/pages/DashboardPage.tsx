import React, { useState, useEffect, useRef } from 'react';
import { useRecognitionFeed } from '../services/recognitionFeed';
import { getConfidenceInfo } from '../types/recognition';
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  Trash2,
  Mic,
  MicOff,
  AlertCircle,
  Clock,
  Sparkles,
  Info,
  ChevronDown,
  ChevronUp,
  Camera,
  CameraOff,
  RefreshCw,
  Layers,
  CheckCircle2,
} from 'lucide-react';

// SpeechRecognition type declarations for browser compatibility
interface IWindow extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

export const DashboardPage: React.FC = () => {
  const {
    events,
    latestEvent,
    isActive,
    isLiveConnected,
    feedMode,
    setFeedMode,
    setIsActive,
    clearLog,
  } = useRecognitionFeed();

  // Text-To-Speech (TTS) state
  const [ttsEnabled, setTtsEnabled] = useState<boolean>(true);

  // Staff Speak collapsible state
  const [isStaffSpeakOpen, setIsStaffSpeakOpen] = useState<boolean>(false);

  // Speech Recognition state
  const [isListening, setIsListening] = useState<boolean>(false);
  const [speechTranscript, setSpeechTranscript] = useState<string>('');
  const [matchedStaffSign, setMatchedStaffSign] = useState<string | null>(null);
  const [speechSupported] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const win = window as unknown as IWindow;
    return !!(win.SpeechRecognition || win.webkitSpeechRecognition);
  });
  const recognitionRef = useRef<any>(null);

  // Auto-scroll ref for the recognition transcript log
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Real Webcam Video Stream State & Ref
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(true);
  const [cameraLoading, setCameraLoading] = useState<boolean>(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraKey, setCameraKey] = useState<number>(0);

  // Initialize and manage user webcam stream
  useEffect(() => {
    let isMounted = true;
    let localStream: MediaStream | null = null;
    const currentVideo = videoRef.current;

    const initCamera = async () => {
      if (!cameraActive) {
        setCameraLoading(false);
        if (currentVideo && currentVideo.srcObject) {
          const s = currentVideo.srcObject as MediaStream;
          s.getTracks().forEach((track) => track.stop());
          currentVideo.srcObject = null;
        }
        return;
      }

      setCameraLoading(true);
      setCameraError(null);

      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Webcam streaming not supported in this browser environment.');
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user',
          },
          audio: false,
        });

        if (isMounted) {
          localStream = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(() => {});
          }
          setCameraLoading(false);
        } else {
          stream.getTracks().forEach((t) => t.stop());
        }
      } catch (err: any) {
        if (isMounted) {
          console.error('[LowKeySigns] Error starting webcam:', err);
          setCameraLoading(false);
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            setCameraError('Camera permission was blocked. Please click the camera icon in your browser address bar to allow access, then click "Retry".');
          } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
            setCameraError('No webcam hardware detected. Please attach a USB webcam or enable your laptop camera.');
          } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
            setCameraError('Camera is already in use by another application. Please close other software using the camera and click "Retry".');
          } else {
            setCameraError(`Camera initialization failed: ${err.message || 'Unknown device error'}`);
          }
        }
      }
    };

    initCamera();

    return () => {
      isMounted = false;
      if (localStream) {
        localStream.getTracks().forEach((t) => t.stop());
      }
      if (currentVideo && currentVideo.srcObject) {
        const s = currentVideo.srcObject as MediaStream;
        s.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraActive, cameraKey]);

  // Check SpeechRecognition support on mount
  useEffect(() => {
    if (!speechSupported) return;

    try {
      const win = window as unknown as IWindow;
      const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;
      if (!SpeechRecognition) return;

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript.trim().toLowerCase();
        setSpeechTranscript(transcript);
        setIsListening(false);

        const words = transcript.split(/\s+/);
        const matched = words.find((w: string) => w.length > 1) || transcript;
        setMatchedStaffSign(matched);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } catch {
      // SpeechRecognition unavailable or blocked
    }
  }, [speechSupported]);

  // Handle SpeechSynthesis (TTS) when new word arrives
  useEffect(() => {
    if (!ttsEnabled || !latestEvent) return;

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(latestEvent.word);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  }, [latestEvent, ttsEnabled]);

  // Auto-scroll transcript container to bottom when new words arrive
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [events]);

  const toggleListening = () => {
    if (!speechSupported) return;

    if (isListening) {
      try {
        recognitionRef.current?.stop();
      } catch {
        // ignore
      }
      setIsListening(false);
    } else {
      setSpeechTranscript('');
      setMatchedStaffSign(null);
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch {
        setIsListening(false);
      }
    }
  };

  const confidenceInfo = latestEvent ? getConfidenceInfo(latestEvent.confidence) : null;

  return (
    <div className="flex-1 bg-slate-100 py-6 sm:py-8 px-4 sm:px-6 lg:px-8 flex flex-col">
      <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col gap-6">

        {/* Dashboard Top Control Bar */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Status indicator with pulsing dot & UI control */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="relative flex h-3 w-3">
                {isActive && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                )}
                <span
                  className={`relative inline-flex rounded-full h-3 w-3 ${
                    isActive ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                />
              </span>
              <span className="text-xs font-semibold text-slate-700">
                {isActive ? 'Active Recognition' : 'Feed Idle (Paused)'}
              </span>
            </div>

            <button
              onClick={() => setIsActive((prev) => !prev)}
              id="feed-toggle-btn"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                isActive
                  ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                  : 'bg-[#1F3864] border-[#1F3864] text-white hover:bg-[#162846]'
              }`}
            >
              {isActive ? (
                <>
                  <Pause className="w-3.5 h-3.5" aria-hidden="true" />
                  Pause Feed
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" aria-hidden="true" />
                  Resume Feed
                </>
              )}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full md:w-auto">
            {/* Feed Stream Mode Selector */}
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs font-semibold">
              <button
                onClick={() => setFeedMode('auto')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  feedMode === 'auto' ? 'bg-[#1F3864] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Auto-detect live ML stream with fallback"
              >
                Auto Feed
              </button>
              <button
                onClick={() => setFeedMode('demo')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  feedMode === 'demo' ? 'bg-[#1F3864] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Continuous demo cycle"
              >
                Demo Feed
              </button>
              <button
                onClick={() => setFeedMode('live')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  feedMode === 'live' ? 'bg-[#1F3864] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Strict live WebSocket stream only"
              >
                Live ML
              </button>
            </div>

            {/* Real Text-to-Speech Toggle */}
            <button
              onClick={() => setTtsEnabled((prev) => !prev)}
              id="tts-toggle-btn"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                ttsEnabled
                  ? 'bg-blue-50 border-blue-200 text-[#1F3864]'
                  : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-800'
              }`}
              title={ttsEnabled ? 'Speech synthesis active' : 'Speech synthesis muted'}
            >
              {ttsEnabled ? (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-[#1F3864]" aria-hidden="true" />
                  Voice Aloud: ON
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                  Voice Aloud: OFF
                </>
              )}
            </button>

            {/* Clear Transcript Button */}
            <button
              onClick={clearLog}
              id="clear-log-btn"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-rose-600 bg-white border border-slate-200 hover:border-rose-200 rounded-lg transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
              Clear Log
            </button>

            {/* Collapsible Staff Speak Toggle Button */}
            <button
              onClick={() => setIsStaffSpeakOpen((prev) => !prev)}
              id="staff-speak-toggle-btn"
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                isStaffSpeakOpen
                  ? 'bg-[#1F3864] text-white border-[#1F3864]'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              <Mic className="w-3.5 h-3.5" aria-hidden="true" />
              Staff Speak (Two-Way)
              {isStaffSpeakOpen ? (
                <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Collapsible Staff Speak Panel */}
        {isStaffSpeakOpen && (
          <div className="bg-white rounded-xl border border-slate-300 p-5 shadow-xs transition-all">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Mic className="w-4 h-4 text-[#1F3864]" aria-hidden="true" />
                  Two-Way Communication: Staff Speech to Sign Guide
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Counter clerk can speak directly into the microphone. Recognized words display corresponding reference sign graphics for the Deaf customer.
                </p>
              </div>
              <span className="text-xs font-mono text-slate-400 bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
                Mode: Reverse Sign Assist
              </span>
            </div>

            <div className="mt-4 flex flex-col md:flex-row items-start gap-6">
              <div className="w-full md:w-1/3 flex flex-col gap-3">
                {!speechSupported ? (
                  <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
                    <div>
                      <p className="text-xs font-semibold text-amber-900">
                        Voice input not supported in this browser
                      </p>
                      <p className="text-[11px] text-amber-700 mt-1">
                        SpeechRecognition is unavailable in this environment. Chrome, Edge, or Safari with Web Speech API enabled is recommended.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={toggleListening}
                      id="staff-mic-btn"
                      className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                        isListening
                          ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse focus:ring-rose-500'
                          : 'bg-[#1F3864] hover:bg-[#162846] text-white focus:ring-[#1F3864]'
                      }`}
                    >
                      {isListening ? (
                        <>
                          <MicOff className="w-4 h-4" aria-hidden="true" />
                          Listening... Click to Stop
                        </>
                      ) : (
                        <>
                          <Mic className="w-4 h-4" aria-hidden="true" />
                          Click & Speak (e.g. "wait", "form")
                        </>
                      )}
                    </button>
                    <p className="text-[11px] text-slate-500 text-center">
                      Uses browser Web Speech API. Speak clearly into your microphone.
                    </p>
                  </>
                )}
              </div>

              <div className="w-full md:w-2/3 bg-slate-50 rounded-lg p-4 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Transcribed Staff Input
                  </span>
                  <div className="text-base font-semibold text-slate-800 mt-1">
                    {speechTranscript ? `"${speechTranscript}"` : <span className="text-slate-400 italic">No speech captured yet.</span>}
                  </div>
                  {matchedStaffSign && (
                    <div className="mt-2 text-xs text-slate-600 flex items-center gap-1.5">
                      <span className="font-semibold text-[#1F3864]">Sign Target:</span>
                      <code className="bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-800">
                        {matchedStaffSign}
                      </code>
                    </div>
                  )}
                </div>

                <div className="w-36 h-28 bg-white rounded-lg border border-dashed border-slate-300 flex flex-col items-center justify-center p-2 text-center shrink-0">
                  {matchedStaffSign ? (
                    <div className="flex flex-col items-center justify-center w-full h-full">
                      <Layers className="w-5 h-5 text-[#1F3864] mb-1" aria-hidden="true" />
                      <span className="text-[11px] font-semibold text-[#1F3864] capitalize">
                        {matchedStaffSign}
                      </span>
                      <span className="text-[9px] font-mono text-slate-400 mt-0.5 truncate max-w-[120px]">
                        /assets/signs/{matchedStaffSign}.png
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <Layers className="w-5 h-5 mb-1" aria-hidden="true" />
                      <span className="text-[11px] font-medium text-slate-500">Sign Visual</span>
                      <span className="text-[9px] text-slate-400">Awaiting voice</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Recognition Layout: Camera Panel (60%) & Recognized-Text Panel (40%) */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch min-h-[520px]">
          
          {/* CAMERA PANEL (~60% width on Desktop, Left/Center) */}
          <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col overflow-hidden">
            {/* Panel Header */}
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-[#1F3864]" aria-hidden="true" />
                <h2 className="text-sm font-bold text-slate-900">
                  Camera Feed
                </h2>
              </div>

              {/* Camera Header Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCameraActive((prev) => !prev)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md border transition-colors ${
                    cameraActive && !cameraError
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                      : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                  }`}
                  title="Toggle hardware camera"
                >
                  {cameraActive && !cameraError ? (
                    <>
                      <Camera className="w-3.5 h-3.5 text-emerald-600" />
                      Live Camera: ON
                    </>
                  ) : (
                    <>
                      <CameraOff className="w-3.5 h-3.5 text-slate-500" />
                      Camera: OFF
                    </>
                  )}
                </button>

                <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-200/80 text-slate-700">
                  Optical Desk Sensor #1
                </span>
              </div>
            </div>

            {/* REAL LIVE CAMERA VIEWPORT & INTERACTIVE OVERLAY */}
            <div className="flex-1 bg-slate-950 relative flex flex-col items-center justify-center min-h-[380px] overflow-hidden">
              
              {/* Actual HTML5 Video Element Stream */}
              {cameraActive && (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`absolute inset-0 w-full h-full object-cover transform -scale-x-100 transition-opacity duration-300 ${
                    cameraLoading || cameraError ? 'opacity-0' : 'opacity-100'
                  }`}
                />
              )}

              {/* Viewfinder corner brackets on top of live video */}
              <div className="absolute top-5 left-5 w-8 h-8 border-t-2 border-l-2 border-emerald-400/80 rounded-tl pointer-events-none z-10" />
              <div className="absolute top-5 right-5 w-8 h-8 border-t-2 border-r-2 border-emerald-400/80 rounded-tr pointer-events-none z-10" />
              <div className="absolute bottom-12 left-5 w-8 h-8 border-b-2 border-l-2 border-emerald-400/80 rounded-bl pointer-events-none z-10" />
              <div className="absolute bottom-12 right-5 w-8 h-8 border-b-2 border-r-2 border-emerald-400/80 rounded-br pointer-events-none z-10" />

              {/* Floating Live Status Badge */}
              <div className="absolute top-5 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/70 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15 text-xs font-medium text-white z-20 shadow-md">
                <span className={`w-2 h-2 rounded-full ${cameraActive && !cameraError ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                <span>
                  {cameraActive && !cameraError
                    ? 'Live Camera Active — 30 FPS Optical Tracking'
                    : cameraLoading
                    ? 'Connecting to Camera Device...'
                    : 'Camera Disabled / Fallback Sensor Active'}
                </span>
              </div>

              {/* Camera Error or Off State Overlay */}
              {(!cameraActive || cameraError || cameraLoading) && (
                <div className="relative z-10 flex flex-col items-center text-center max-w-md p-6 bg-slate-900/90 rounded-2xl border border-white/10 backdrop-blur-md m-4">
                  {cameraLoading ? (
                    <>
                      <RefreshCw className="w-10 h-10 text-emerald-400 animate-spin mb-3" />
                      <h3 className="text-base font-bold text-white">Starting Optical Sensor</h3>
                      <p className="text-xs text-slate-300 mt-1">
                        Requesting camera stream from your browser...
                      </p>
                    </>
                  ) : cameraError ? (
                    <>
                      <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mb-3">
                        <AlertCircle className="w-6 h-6 text-amber-400" />
                      </div>
                      <h3 className="text-base font-bold text-white">Camera Access Required</h3>
                      <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                        {cameraError}
                      </p>
                      <button
                        onClick={() => {
                          setCameraActive(true);
                          setCameraKey((k) => k + 1);
                        }}
                        className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#1F3864] hover:bg-[#2b4c84] rounded-lg border border-white/20 transition-all shadow-sm"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Retry Camera Connection
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center mb-3">
                        <CameraOff className="w-6 h-6 text-slate-300" />
                      </div>
                      <h3 className="text-base font-bold text-white">Camera Paused</h3>
                      <p className="text-xs text-slate-300 mt-1">
                        Optical sensor is currently muted. Click below to turn your camera back on.
                      </p>
                      <button
                        onClick={() => setCameraActive(true)}
                        className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-all shadow-sm"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        Turn Camera On
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* Bottom active feedback strip */}
              <div className="absolute bottom-3 inset-x-4 z-20 flex items-center justify-between text-xs text-slate-300 bg-black/60 backdrop-blur-md px-4 py-2 rounded-lg border border-white/10">
                <span className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${cameraActive && !cameraError ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                  Resolution: 1080p / 720p Optical Stream
                </span>
                <span className="text-[11px] font-mono text-slate-300">
                  {cameraActive && !cameraError ? 'Active Mirror View' : 'Diagnostic Mode'}
                </span>
              </div>
            </div>
          </div>

          {/* RECOGNIZED-TEXT PANEL (Remaining ~40% width on Desktop, Right) */}
          <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col overflow-hidden">
            {/* Panel Header */}
            <div className="px-5 py-3.5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-slate-50/70">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#1F3864]" aria-hidden="true" />
                <h2 className="text-sm font-bold text-slate-900">
                  Live Recognized Transcript
                </h2>
              </div>
              <div className="flex items-center gap-2">
                {isLiveConnected ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
                    Live ML Stream
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md bg-amber-50 text-amber-900 border border-amber-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" aria-hidden="true" />
                    Continuous Demo Stream
                  </span>
                )}
                <span className="text-xs font-medium text-slate-500 hidden xl:inline">
                  ({events.length} {events.length === 1 ? 'event' : 'events'})
                </span>
              </div>
            </div>

            {/* Latest Recognized Word Highlight Banner */}
            {latestEvent ? (
              <div className="p-5 border-b border-slate-200 bg-gradient-to-br from-slate-50 to-white">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#1F3864]" aria-hidden="true" />
                    Latest Detected Sign
                  </span>
                  <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" aria-hidden="true" />
                    {new Date(latestEvent.timestamp).toLocaleTimeString()}
                  </span>
                </div>

                <div className="text-3xl sm:text-4xl font-extrabold text-[#1F3864] tracking-tight py-1 capitalize">
                  "{latestEvent.word}"
                </div>

                {confidenceInfo && (
                  <div className="mt-3 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            confidenceInfo.tier === 'high'
                              ? 'bg-emerald-500'
                              : confidenceInfo.tier === 'medium'
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                          aria-hidden="true"
                        />
                        {confidenceInfo.label}
                      </span>
                      <span className="font-mono font-bold text-slate-800">
                        {confidenceInfo.percentage}% ({latestEvent.confidence.toFixed(2)})
                      </span>
                    </div>

                    <div
                      className="w-full bg-slate-200 rounded-full h-2 overflow-hidden"
                      role="progressbar"
                      aria-valuenow={confidenceInfo.percentage}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label="Recognition confidence level"
                    >
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          confidenceInfo.tier === 'high'
                            ? 'bg-[#1F3864]'
                            : confidenceInfo.tier === 'medium'
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${confidenceInfo.percentage}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-5 border-b border-slate-200 bg-slate-50 text-center text-xs text-slate-500">
                Log cleared. Waiting for recognition event...
              </div>
            )}

            {/* Scrolling Conversation Log */}
            <div className="flex-1 flex flex-col p-4 bg-slate-50/50 overflow-hidden">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-1">
                <span>Transcript History</span>
                <span className="text-[10px] text-slate-400 font-normal">Auto-scrolling</span>
              </div>

              <div
                ref={logContainerRef}
                className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar max-h-[280px]"
                tabIndex={0}
                aria-label="Recognition transcript history"
              >
                {events.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400 italic">
                    No words recorded yet.
                  </div>
                ) : (
                  events.map((evt, idx) => {
                    const isLatest = idx === events.length - 1;
                    const conf = getConfidenceInfo(evt.confidence);
                    return (
                      <div
                        key={`${evt.timestamp}-${idx}`}
                        className={`p-3 rounded-lg border transition-all ${
                          isLatest
                            ? 'bg-white border-[#1F3864] shadow-xs'
                            : 'bg-white/80 border-slate-200 text-slate-600'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`capitalize ${
                              isLatest
                                ? 'text-lg font-bold text-[#1F3864]'
                                : 'text-sm font-medium text-slate-800'
                            }`}
                          >
                            {evt.word}
                          </span>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                                conf.tier === 'high'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : conf.tier === 'medium'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              {conf.label}: {conf.percentage}%
                            </span>
                            <span className="text-[11px] font-mono text-slate-400">
                              {new Date(evt.timestamp).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Footer summary info */}
            <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-[#1F3864]" aria-hidden="true" />
                Updates automatically every 2-3s
              </span>
              <span className="font-mono text-[11px] text-slate-400">
                JSON Event Stream
              </span>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

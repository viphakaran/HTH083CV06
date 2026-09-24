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
  Layers,
  CheckCircle2,
} from 'lucide-react';

// SpeechRecognition type declarations for browser compatibility
interface IWindow extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

export const DashboardPage: React.FC = () => {
  const { events, latestEvent, isActive, setIsActive, clearLog } = useRecognitionFeed();

  // Text-To-Speech (TTS) state
  const [ttsEnabled, setTtsEnabled] = useState<boolean>(true);

  // Staff Speak collapsible state
  const [isStaffSpeakOpen, setIsStaffSpeakOpen] = useState<boolean>(false);

  // Speech Recognition state
  const [isListening, setIsListening] = useState<boolean>(false);
  const [speechTranscript, setSpeechTranscript] = useState<string>('');
  const [matchedStaffSign, setMatchedStaffSign] = useState<string | null>(null);
  const [speechSupported, setSpeechSupported] = useState<boolean>(true);
  const recognitionRef = useRef<any>(null);

  // Auto-scroll ref for the recognition transcript log
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Check SpeechRecognition support on mount
  useEffect(() => {
    const win = window as unknown as IWindow;
    const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
    } else {
      setSpeechSupported(true);
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript.trim().toLowerCase();
          setSpeechTranscript(transcript);
          setIsListening(false);

          // Find if any word in the transcript matches our recognized vocabulary or set the first word
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
      } catch (e) {
        setSpeechSupported(false);
      }
    }
  }, []);

  // Handle SpeechSynthesis (TTS) when new mock word arrives
  useEffect(() => {
    if (!ttsEnabled || !latestEvent) return;

    if ('speechSynthesis' in window) {
      // Cancel previous utterance to avoid queue buildup
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
      } catch (err) {
        // ignore
      }
      setIsListening(false);
    } else {
      setSpeechTranscript('');
      setMatchedStaffSign(null);
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (err) {
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
              {/* Mic action column */}
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

              {/* Transcribed Speech & Sign Placeholder Layout */}
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

                {/* Sign image placeholder area at /assets/signs/{word}.png */}
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
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-200/80 text-slate-700">
                Optical Desk Sensor #1
              </span>
            </div>

            {/* Static Camera Placeholder Box / Visual Demonstration */}
            <div className="flex-1 bg-slate-900 relative flex flex-col items-center justify-center p-6 text-slate-100 min-h-[380px] overflow-hidden">
              {/* Subtle tech grid background */}
              <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:24px_24px]" />
              
              {/* Overlay camera feed viewfinder corners */}
              <div className="absolute top-6 left-6 w-8 h-8 border-t-2 border-l-2 border-slate-400/60 rounded-tl" />
              <div className="absolute top-6 right-6 w-8 h-8 border-t-2 border-r-2 border-slate-400/60 rounded-tr" />
              <div className="absolute bottom-6 left-6 w-8 h-8 border-b-2 border-l-2 border-slate-400/60 rounded-bl" />
              <div className="absolute bottom-6 right-6 w-8 h-8 border-b-2 border-r-2 border-slate-400/60 rounded-br" />

              {/* Feed Badge */}
              <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-xs font-medium">
                <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                <span>Simulated Feed — 30 FPS Landmark Tracking</span>
              </div>

              {/* Center Graphics */}
              <div className="relative z-10 flex flex-col items-center text-center max-w-sm">
                <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center mb-4">
                  <Camera className="w-8 h-8 text-slate-200" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-bold text-white tracking-wide">
                  Camera Feed Active
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Optical sensor focused on counter signing zone. Normalizing 21 hand landmarks & upper-body keypoints.
                </p>
                <div className="mt-4 px-3 py-1.5 rounded bg-white/10 border border-white/15 text-[11px] font-mono text-slate-300">
                  Target vocab: 20 locked words &bull; WLASL benchmark
                </div>
              </div>

              {/* Bottom active feedback strip */}
              <div className="absolute bottom-4 inset-x-6 z-10 flex items-center justify-between text-xs text-slate-400 bg-black/50 backdrop-blur-md px-4 py-2 rounded-lg border border-white/10">
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#365b99]" />
                  Resolution: 1080p Optical
                </span>
                <span className="text-[11px] font-mono text-slate-300">
                  Client-side inference
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
                <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md bg-amber-50 text-amber-900 border border-amber-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" aria-hidden="true" />
                  Simulated Demo Mode - Backend Offline
                </span>
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

                {/* Most recent entry visually emphasized (larger/bolder) */}
                <div className="text-3xl sm:text-4xl font-extrabold text-[#1F3864] tracking-tight py-1">
                  "{latestEvent.word}"
                </div>

                {/* Confidence display next to the latest word: Progress bar AND Text label */}
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

                    {/* Accessible Progress Bar */}
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

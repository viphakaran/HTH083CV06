import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  Volume2,
  Layers,
  MessageSquare,
  Building2,
  Stethoscope,
  Landmark,
  Eye,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-50 border-b border-slate-200 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column: Value Prop */}
            <div className="lg:col-span-7 flex flex-col items-start text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#1F3864]/10 text-[#1F3864] border border-[#1F3864]/20 mb-6">
                <span className="w-2 h-2 rounded-full bg-[#1F3864]" aria-hidden="true" />
                Accessibility Tech & Public Services Initiative
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-[1.12]">
                Real-time sign language interpretation for{' '}
                <span className="text-[#1F3864]">every service counter</span>.
              </h1>

              <p className="mt-6 text-lg sm:text-xl text-slate-600 leading-relaxed max-w-2xl">
                Deaf and hard-of-hearing citizens encounter silent barriers every day at essential desks.
                LowKeySigns is designed for real-time, discreet sign translation so civic staff can communicate clearly without delays.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
                <Link
                  to="/dashboard"
                  id="hero-cta-btn"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-base font-semibold text-white bg-[#1F3864] hover:bg-[#162846] rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1F3864]"
                >
                  View Live Demo
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>
                <Link
                  to="/vocabulary"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-base font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg shadow-2xs transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400"
                >
                  Explore 20-Word Vocabulary
                </Link>
              </div>

              {/* Quick stats / reassurance */}
              <div className="mt-10 pt-8 border-t border-slate-200 grid grid-cols-3 gap-6 w-full">
                <div>
                  <div className="text-2xl font-bold text-[#1F3864]">Real-Time</div>
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mt-0.5">Designed For Counter Use</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-[#1F3864]">20 Words</div>
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mt-0.5">Emergency Core</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-[#1F3864]">WLASL</div>
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mt-0.5">Benchmark Basis</div>
                </div>
              </div>
            </div>

            {/* Right Column: Clean SaaS Interface Preview Card */}
            <div className="lg:col-span-5">
              <div className="relative rounded-2xl bg-white border border-slate-200 shadow-xl overflow-hidden">
                {/* Header bar */}
                <div className="bg-[#1F3864] px-4 py-3 flex items-center justify-between text-white">
                  <div className="flex items-center gap-2 text-xs font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
                    <span>Intake Desk Terminal #04</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-300 bg-[#162846] px-2 py-0.5 rounded">
                    LIVE
                  </span>
                </div>

                {/* Simulated UI Content */}
                <div className="p-5 space-y-4 bg-slate-50">
                  {/* Camera status block */}
                  <div className="rounded-lg bg-slate-200 border border-slate-300 h-36 flex flex-col items-center justify-center text-slate-600 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#1F3864_1px,transparent_1px)] [background-size:12px_12px]" />
                    <Eye className="w-6 h-6 text-slate-500 mb-1.5" aria-hidden="true" />
                    <span className="text-xs font-semibold text-slate-700">Counter Camera Feed Active</span>
                    <span className="text-[11px] text-slate-500">Landmark detection grid calibrated</span>
                  </div>

                  {/* Recognition transcript item */}
                  <div className="bg-white rounded-lg p-3.5 border border-slate-200 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        Latest Recognized Sign
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" aria-hidden="true" />
                        94% High Confidence
                      </span>
                    </div>
                    <div className="text-2xl font-bold tracking-tight text-[#1F3864]">
                      "emergency"
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-[#1F3864] h-1.5 rounded-full w-[94%]" />
                    </div>
                  </div>

                  {/* Two-way indicator */}
                  <div className="flex items-center justify-between text-xs text-slate-600 px-2">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Volume2 className="w-3.5 h-3.5 text-[#1F3864]" aria-hidden="true" />
                      Speech synthesis enabled
                    </span>
                    <span className="text-[11px] text-slate-400">Standard USB Webcam</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* The Problem Section */}
      <section className="py-16 sm:py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#1F3864]">
              The Problem
            </h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              The Interpretation Gap at Vital Service Counters
            </p>
            <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
              When a Deaf individual walks up to a hospital emergency triage, a bank teller, or a municipal clerk, certified on-site ASL interpreters are rarely available on demand.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 flex flex-col">
              <div className="w-10 h-10 rounded-lg bg-[#1F3864]/10 text-[#1F3864] flex items-center justify-center mb-4">
                <Stethoscope className="w-5 h-5" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Hospital Triage</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Critical symptom descriptions like "pain", "doctor", and "sick" cannot wait for a scheduled video remote interpreter who may take 20 minutes to connect.
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 flex flex-col">
              <div className="w-10 h-10 rounded-lg bg-[#1F3864]/10 text-[#1F3864] flex items-center justify-center mb-4">
                <Landmark className="w-5 h-5" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Municipal Desks</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Administrative intake requires signing for forms, identity cards, and appointment schedules where both parties struggle with handwriting notes.
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 flex flex-col">
              <div className="w-10 h-10 rounded-lg bg-[#1F3864]/10 text-[#1F3864] flex items-center justify-center mb-4">
                <Building2 className="w-5 h-5" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Financial Counters</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Transactions involving sensitive inquiries ("money", "wait", "problem") demand respectful, instantaneous comprehension without compromising customer dignity.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 sm:py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#1F3864]">
              Workflow
            </h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              How LowKeySigns Works
            </p>
            <p className="mt-4 text-base sm:text-lg text-slate-600">
              A frictionless four-stage pipeline designed for standard counter hardware.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {/* Step 1 */}
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-2xs relative">
              <div className="flex items-center justify-between mb-4">
                <span className="w-8 h-8 rounded-full bg-[#1F3864] text-white font-bold text-sm flex items-center justify-center">
                  1
                </span>
                <span className="text-xs font-medium text-slate-400">Step 01</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Sign Performed</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                The visitor gestures naturally at the counter within the camera's normal field of view.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-2xs relative">
              <div className="flex items-center justify-between mb-4">
                <span className="w-8 h-8 rounded-full bg-[#1F3864] text-white font-bold text-sm flex items-center justify-center">
                  2
                </span>
                <span className="text-xs font-medium text-slate-400">Step 02</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Camera Captures</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                A simple desk-mounted optical camera streams continuous video frames without special sensor gloves.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-2xs relative">
              <div className="flex items-center justify-between mb-4">
                <span className="w-8 h-8 rounded-full bg-[#1F3864] text-white font-bold text-sm flex items-center justify-center">
                  3
                </span>
                <span className="text-xs font-medium text-slate-400">Step 03</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">AI Recognizes</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Landmark trajectory models classify the sign against our research-grade vocabulary with confidence scoring.
              </p>
            </div>

            {/* Step 4 */}
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-2xs relative">
              <div className="flex items-center justify-between mb-4">
                <span className="w-8 h-8 rounded-full bg-[#1F3864] text-white font-bold text-sm flex items-center justify-center">
                  4
                </span>
                <span className="text-xs font-medium text-slate-400">Step 04</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Text & Speech Output</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Instant high-contrast text appears on the clerk's display and synthesizes speech aloud in real time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 sm:py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#1F3864]">
              Capabilities
            </h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Engineered for Public Service Realities
            </p>
            <p className="mt-4 text-base sm:text-lg text-slate-600">
              High-contrast assistance designed for real-time use at service counters.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-xl border border-slate-200 bg-slate-50 flex flex-col">
              <div className="w-10 h-10 rounded-lg bg-[#1F3864] text-white flex items-center justify-center mb-4">
                <Zap className="w-5 h-5" aria-hidden="true" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">Real-Time Recognition</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Designed for real-time use to support natural dialogue at service counters.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-slate-200 bg-slate-50 flex flex-col">
              <div className="w-10 h-10 rounded-lg bg-[#1F3864] text-white flex items-center justify-center mb-4">
                <Layers className="w-5 h-5" aria-hidden="true" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">Lighting & Background Testing</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Robustness validated across backgrounds and lighting conditions during testing.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-slate-200 bg-slate-50 flex flex-col">
              <div className="w-10 h-10 rounded-lg bg-[#1F3864] text-white flex items-center justify-center mb-4">
                <Volume2 className="w-5 h-5" aria-hidden="true" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">Text + Speech Output</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Provides both visual transcripts and native browser text-to-speech to suit any counter arrangement.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-slate-200 bg-slate-50 flex flex-col">
              <div className="w-10 h-10 rounded-lg bg-[#1F3864] text-white flex items-center justify-center mb-4">
                <MessageSquare className="w-5 h-5" aria-hidden="true" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">Two-Way Support</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Features "Staff Speak" reverse lookup so hearing clerks can speak responses back into corresponding sign guides.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-14 bg-slate-50 border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#1F3864]/10 text-[#1F3864] mb-4">
            <ShieldCheck className="w-6 h-6" aria-hidden="true" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">
            Open, Research-Grade Sign Language Datasets
          </h2>
          <p className="mt-3 text-base text-slate-600 max-w-2xl mx-auto">
            LowKeySigns is built on peer-reviewed, academic benchmarks (including the WLASL dataset) ensuring standardized lexical representations and repeatable spatial tracking.
          </p>
          <div className="mt-6 flex flex-wrap justify-center items-center gap-6 text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#1F3864]" aria-hidden="true" />
              20 Locked Emergency Words
            </span>
            <span>&bull;</span>
            <span>WLASL Academic Benchmark</span>
            <span>&bull;</span>
            <span>High-Contrast Layout</span>
          </div>
        </div>
      </section>

      {/* CTA Bottom Banner */}
      <section className="py-16 bg-[#1F3864] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight">
            Ready to test live recognition?
          </h2>
          <p className="mt-3 text-base text-slate-200">
            Launch our interactive dashboard with simulated feed events and browser voice synthesis.
          </p>
          <div className="mt-8">
            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-base font-semibold text-[#1F3864] bg-white hover:bg-slate-100 rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white"
            >
              Open Live Dashboard
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

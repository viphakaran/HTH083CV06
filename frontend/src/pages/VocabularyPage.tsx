import React, { useState, useRef } from 'react';
import { LOCKED_VOCABULARY } from '../services/recognitionFeed';
import {
  BookOpen,
  Search,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Play,
  Film,
  Image as ImageIcon,
  Sparkles,
  X,
  Gauge,
  RotateCcw,
} from 'lucide-react';
import { Link } from 'react-router-dom';

// Categories and descriptions for the 20 locked vocabulary words
const WORD_CATEGORIES: Record<
  string,
  {
    category: string;
    description: string;
    instructions: string;
    pocketsignSlug?: string;
  }
> = {
  help: {
    category: 'Urgent Assistance',
    description: 'Request for immediate counter, medical, or emergency aid.',
    instructions:
      'Place your dominant closed-fist with thumb upright (10 handshape) on the flat open palm of your non-dominant hand and lift both upward together.',
    pocketsignSlug: 'help',
  },
  wait: {
    category: 'Queue & Timing',
    description: 'Indication to hold briefly, pause processing, or await turn.',
    instructions:
      'Hold both hands in front with palms facing you and fingers spread; gently wiggle your fingers up and down in a fluttering motion.',
    pocketsignSlug: 'wait',
  },
  money: {
    category: 'Financial & Payments',
    description: 'Pertaining to cashier fee payments, balances, or currency.',
    instructions:
      'Tap the back of your flat dominant hand (held like money bills) repeatedly against the flat palm of your non-dominant hand.',
    pocketsignSlug: 'money',
  },
  form: {
    category: 'Documentation',
    description: 'Physical or digital intake paperwork requiring completion.',
    instructions:
      'Use both hands to outline a rectangular sheet of paper or tap your dominant fingers across the palm indicating document fields.',
    pocketsignSlug: 'form',
  },
  pain: {
    category: 'Medical & Triage',
    description: 'Expression of physical discomfort, ache, or acute pain.',
    instructions:
      'Point index fingers toward each other with slight twisting motion near the location of discomfort or centered in chest neutral space.',
    pocketsignSlug: 'pain',
  },
  doctor: {
    category: 'Medical & Triage',
    description: 'Request for medical practitioner, nurse, or clinical staff.',
    instructions:
      'Tap the bent fingers (M or D handshape) of your dominant hand onto the inside of your non-dominant wrist, mimicking checking a pulse.',
    pocketsignSlug: 'doctor',
  },
  yes: {
    category: 'Affirmation',
    description: 'Affirmative response, assent, or positive verification.',
    instructions:
      'Form an "S" fist with your dominant hand and nod it forward at the wrist, mirroring a head nodding "yes".',
    pocketsignSlug: 'yes',
  },
  no: {
    category: 'Negation',
    description: 'Negative response, decline, or disagreement.',
    instructions:
      'Quickly snap your dominant index and middle fingers together against your thumb, mimicking a mouth firmly closing.',
    pocketsignSlug: 'no',
  },
  'thank you': {
    category: 'Courtesy & Dialogue',
    description: 'Polite expression of gratitude and closing interaction.',
    instructions:
      'Touch the fingertips of your flat open dominant hand to your chin/lips, then move your hand outward and slightly down toward the other person.',
    pocketsignSlug: 'thankyou',
  },
  sign: {
    category: 'Documentation',
    description: 'Request or prompt to provide official physical/digital signature.',
    instructions:
      'Extend the index and middle fingers of your dominant hand (H handshape) and slide or tap them across the flat open non-dominant palm.',
    pocketsignSlug: 'sign',
  },
  more: {
    category: 'Quantity & Modifiers',
    description: 'Request for additional items, time, or further assistance.',
    instructions:
      'Bring both hands together into flattened "O" handshapes (all fingertips touching thumbs) and tap them repeatedly against each other.',
    pocketsignSlug: 'more',
  },
  problem: {
    category: 'Urgent Assistance',
    description: 'Alerting desk staff to an issue, complication, or error.',
    instructions:
      'Form bent-V handshapes with both hands and twist knuckles past each other with wrists rotating.',
    pocketsignSlug: 'problem',
  },
  emergency: {
    category: 'Urgent Assistance',
    description: 'Critical priority alert requiring fast intervention.',
    instructions:
      'Hold the "E" handshape with your dominant hand and shake it gently side-to-side in front of your chest with urgency.',
    pocketsignSlug: 'emergency',
  },
  where: {
    category: 'Inquiry',
    description: 'Question regarding counter location, room, or direction.',
    instructions:
      'Hold your dominant index finger upright in front of you and wag it side-to-side with an inquiring facial expression.',
    pocketsignSlug: 'where',
  },
  name: {
    category: 'Identity & Intake',
    description: 'Inquiry or statement of personal identification.',
    instructions:
      'Form "H" handshapes (index and middle extended together) with both hands; tap your dominant fingers across the non-dominant fingers twice.',
    pocketsignSlug: 'name',
  },
  appointment: {
    category: 'Queue & Timing',
    description: 'Scheduled service reservation or time slot confirmation.',
    instructions:
      'Make an open circle in the air with your dominant "A" fist, then firmly place it down onto the back of your non-dominant fist.',
    pocketsignSlug: 'appointment',
  },
  sick: {
    category: 'Medical & Triage',
    description: 'Health status indication or unwell/fever condition.',
    instructions:
      'Touch your bent middle finger of your dominant hand to your forehead and the non-dominant bent middle finger to your stomach simultaneously.',
    pocketsignSlug: 'sick',
  },
  please: {
    category: 'Courtesy & Dialogue',
    description: 'Polite request modifier signaling respect.',
    instructions:
      'Place your flat open dominant hand on the center of your chest and rub it in a smooth clockwise circular motion.',
    pocketsignSlug: 'please',
  },
  here: {
    category: 'Location',
    description: 'Indicating current spot, counter presence, or arrival.',
    instructions:
      'Hold both flat hands out with palms facing upward; move them gently in small circles or pull them toward your body.',
    pocketsignSlug: 'here',
  },
  now: {
    category: 'Queue & Timing',
    description: 'Immediate timing, present moment, or right away.',
    instructions:
      'Form bent "Y" handshapes with both hands (thumbs and pinkies extended) with palms facing up; drop both hands downward together.',
    pocketsignSlug: 'now',
  },
  thankyou: {
    category: 'Courtesy & Dialogue',
    description: 'Polite expression of gratitude and closing interaction.',
    instructions:
      'Touch the fingertips of your flat open dominant hand to your chin/lips, then move your hand outward and slightly down toward the other person.',
    pocketsignSlug: 'thankyou',
  },
  owie: {
    category: 'Medical & Triage',
    description: 'Expression of physical discomfort, ache, or acute pain.',
    instructions:
      'Point index fingers toward each other with slight twisting motion near the location of discomfort or centered in chest neutral space.',
    pocketsignSlug: 'pain',
  },
  hello: {
    category: 'Courtesy & Dialogue',
    description: 'Standard greeting to initiate communication at the counter.',
    instructions:
      'Extend dominant flat hand to the temple and move it outward in a crisp salute motion.',
    pocketsignSlug: 'hello',
  },
  bye: {
    category: 'Courtesy & Dialogue',
    description: 'Farewell gesture indicating conclusion of counter visit.',
    instructions:
      'Hold dominant hand up with palm forward and wave fingers gently up and down.',
    pocketsignSlug: 'bye',
  },
  time: {
    category: 'Queue & Timing',
    description: 'Inquiry about schedule, duration, or current appointment hour.',
    instructions:
      'Tap index finger twice onto the back of your non-dominant wrist as if pointing to a watch.',
    pocketsignSlug: 'time',
  },
  water: {
    category: 'Basic Needs & Comfort',
    description: 'Request for drinking water or location of dispenser.',
    instructions:
      'Form a "W" handshape with dominant index, middle, and ring fingers; tap index against your chin twice.',
    pocketsignSlug: 'water',
  },
  finish: {
    category: 'Civic Administration',
    description: 'Indicates completed form submission or finished task.',
    instructions:
      'Hold both hands in front with palms facing you, then flick them outward so palms face down.',
    pocketsignSlug: 'finish',
  },
  police: {
    category: 'Security & Navigation',
    description: 'Request for security personnel or police officer assistance.',
    instructions:
      'Form a "C" handshape with your dominant hand and tap it over the left side of your chest where a badge rests.',
    pocketsignSlug: 'police',
  },
  fireman: {
    category: 'Medical & Triage',
    description: 'Alert for fire emergency or emergency firefighter services.',
    instructions:
      'Hold your flat dominant hand (B handshape) against your forehead with palm facing out, representing a firefighter badge.',
  },
  callonphone: {
    category: 'Medical & Triage',
    description: 'Request to place an urgent telephone call on visitor’s behalf.',
    instructions:
      'Form a "Y" handshape (thumb and pinky extended) and hold thumb to your ear and pinky toward your mouth like a phone.',
  },
  pen: {
    category: 'Civic Administration',
    description: 'Request for writing instrument to complete paperwork.',
    instructions:
      'Mime holding a pen with dominant fingers and write a stroke across your flat open non-dominant palm.',
    pocketsignSlug: 'pen',
  },
  who: {
    category: 'Civic Administration',
    description: 'Inquiry regarding identity of staff member or official in charge.',
    instructions:
      'Place thumb of dominant hand on chin with index finger extended, then wiggle the index finger up and down.',
    pocketsignSlug: 'who',
  },
  person: {
    category: 'Civic Administration',
    description: 'Request for a human representative or dedicated counter officer.',
    instructions:
      'Hold both flat open hands vertically facing each other in front of your chest and trace downward together.',
    pocketsignSlug: 'person',
  },
};

export const VocabularyPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [mediaMode, setMediaMode] = useState<'video' | 'gif' | 'still'>('video');
  const [inspectingWord, setInspectingWord] = useState<string | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);

  const modalVideoRef = useRef<HTMLVideoElement | null>(null);

  // Filter based on search query and category
  const filteredWords = LOCKED_VOCABULARY.filter((word) => {
    const meta = WORD_CATEGORIES[word] || { category: 'General', description: '' };
    const matchesSearch =
      word.toLowerCase().includes(searchQuery.toLowerCase()) ||
      meta.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      meta.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'All' || meta.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Extract unique categories
  const categories = [
    'All',
    ...Array.from(new Set(Object.values(WORD_CATEGORIES).map((c) => c.category))),
  ];

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (modalVideoRef.current) {
      modalVideoRef.current.playbackRate = speed;
    }
  };

  const handleRestartVideo = () => {
    if (modalVideoRef.current) {
      modalVideoRef.current.currentTime = 0;
      modalVideoRef.current.play();
    }
  };

  const activeMeta = inspectingWord ? WORD_CATEGORIES[inspectingWord] : null;
  const activeSlug = inspectingWord ? inspectingWord.replace(/\s+/g, '_') : '';
  const activePocketSignUrl = activeMeta?.pocketsignSlug
    ? `https://www.pocketsign.org/asl/${activeMeta.pocketsignSlug}`
    : 'https://www.pocketsign.org/asl';

  return (
    <div className="flex-1 bg-slate-50 py-10 sm:py-14 px-4 sm:px-6 lg:px-8 flex flex-col">
      <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col">
        {/* Header & Context */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-slate-200">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#1F3864]/10 text-[#1F3864] border border-[#1F3864]/20 mb-3">
              <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
              Locked Dataset Dictionary (20 Terms)
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
              Approved ASL Vocabulary Reference
            </h1>
            <p className="mt-2 text-base text-slate-600 max-w-2xl">
              Authentic ASL motion loops and video dictionaries for all 20 service counter signs.
              Click any sign card to inspect slow-motion articulation, medical reference notes, and signing tutorials.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#1F3864] hover:bg-[#162846] rounded-lg shadow-xs transition-colors"
            >
              Test in Live Dashboard
              <ExternalLink className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>
        </div>

        {/* View Mode & Search Filter Toolbar */}
        <div className="mt-8 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search signs, medical categories, or descriptions..."
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-300 rounded-lg shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#1F3864] focus:border-transparent text-slate-900 placeholder:text-slate-400"
              aria-label="Search approved vocabulary words"
            />
          </div>

          {/* Media Mode Toggle (Video / GIF / Still) */}
          <div className="flex items-center gap-1.5 p-1 bg-white border border-slate-200 rounded-xl shadow-2xs">
            <span className="text-xs font-semibold text-slate-500 px-2.5 hidden sm:inline">
              Media Mode:
            </span>
            <button
              onClick={() => setMediaMode('video')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                mediaMode === 'video'
                  ? 'bg-[#1F3864] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              Motion Video (60fps)
            </button>
            <button
              onClick={() => setMediaMode('gif')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                mediaMode === 'gif'
                  ? 'bg-[#1F3864] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Animated GIF
            </button>
            <button
              onClick={() => setMediaMode('still')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                mediaMode === 'still'
                  ? 'bg-[#1F3864] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              Keyframe Still
            </button>
          </div>

          {/* Quick Counter */}
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 self-center">
            <span>Showing</span>
            <span className="font-bold text-slate-900 px-2 py-0.5 rounded bg-white border border-slate-200">
              {filteredWords.length} of {LOCKED_VOCABULARY.length}
            </span>
            <span>signs</span>
          </div>
        </div>

        {/* Category Pills */}
        <div className="mt-4 flex flex-wrap items-center gap-1.5 pb-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedCategory === cat
                  ? 'bg-[#1F3864] text-white shadow-2xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Vocabulary Grid */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filteredWords.map((word, index) => {
            const meta = WORD_CATEGORIES[word] || {
              category: 'General',
              description: 'Public service counter term',
              instructions: '',
            };
            const fileSlug = word.replace(/\s+/g, '_');

            return (
              <div
                key={word}
                onClick={() => setInspectingWord(word)}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs hover:shadow-lg transition-all flex flex-col justify-between group cursor-pointer hover:border-[#1F3864]/50"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[11px] font-mono font-semibold text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                      #{String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="text-[10px] font-semibold text-[#1F3864] bg-[#1F3864]/5 px-2 py-0.5 rounded-full border border-[#1F3864]/10">
                      {meta.category}
                    </span>
                  </div>

                  {/* Embedded Sign Gesture Motion Display */}
                  <div className="w-full h-48 rounded-lg bg-slate-900 border border-slate-200 overflow-hidden relative group-hover:shadow-sm transition-all flex items-center justify-center">
                    {mediaMode === 'video' ? (
                      <video
                        src={`/assets/signs/videos/${fileSlug}.mp4`}
                        poster={`/assets/signs/${fileSlug}.png`}
                        autoPlay
                        loop
                        muted
                        playsInline
                        preload="metadata"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : mediaMode === 'gif' ? (
                      <img
                        src={`/assets/signs/${fileSlug}.gif`}
                        alt={`ASL sign gesture loop for ${word}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <img
                        src={`/assets/signs/${fileSlug}.png`}
                        alt={`ASL sign gesture still for ${word}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    )}

                    <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1.5 shadow-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      {mediaMode === 'video' ? 'ASL Loop' : mediaMode === 'gif' ? 'GIF' : 'Still'}
                    </div>

                    <div className="absolute bottom-2 right-2 bg-slate-900/80 backdrop-blur-xs text-slate-300 text-[9px] font-mono px-2 py-0.5 rounded shadow-xs">
                      PocketSign ASL
                    </div>
                  </div>

                  {/* Word title and description */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold text-slate-900 group-hover:text-[#1F3864] transition-colors capitalize">
                        {word}
                      </h3>
                      <span className="text-[11px] text-slate-400 group-hover:text-[#1F3864] font-medium flex items-center gap-1">
                        Inspect
                        <Play className="w-2.5 h-2.5 fill-current" />
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500 leading-relaxed line-clamp-2">
                      {meta.description}
                    </p>
                  </div>
                </div>

                {/* Card Footer: Metadata */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1 font-medium text-emerald-700">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" aria-hidden="true" />
                    Locked Vocab
                  </span>
                  <span className="font-mono">
                    WLASL-20
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Fallback if search returns empty */}
        {filteredWords.length === 0 && (
          <div className="py-16 text-center bg-white rounded-xl border border-slate-200 mt-8">
            <BookOpen className="w-8 h-8 text-slate-400 mx-auto mb-2" aria-hidden="true" />
            <h3 className="text-base font-semibold text-slate-800">No matching vocabulary found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              No words in the 20-word locked dictionary matched "{searchQuery}". Try selecting another category or resetting the search.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
              }}
              className="mt-4 px-3 py-1.5 text-xs font-semibold text-[#1F3864] bg-[#1F3864]/10 rounded-md hover:bg-[#1F3864]/20 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Informational Callout & Reference Documentation */}
        <div className="mt-12 p-6 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#1F3864]/10 text-[#1F3864] flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  Authentic ASL Educational & Medical Reference
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Sign gestures are sourced and verified against clinical and educational ASL standards including PocketSign, NTID (Rochester Institute of Technology), and Medical Emergency ASL Guidelines.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
              <span className="text-xs font-mono font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                Total Terms: {LOCKED_VOCABULARY.length}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-600">
            <span className="text-slate-400">Verified Sources:</span>
            <a
              href="https://www.pocketsign.org/asl"
              target="_blank"
              rel="noreferrer"
              className="text-[#1F3864] hover:underline flex items-center gap-1"
            >
              PocketSign ASL Dictionary
              <ExternalLink className="w-3 h-3" />
            </a>
            <span className="text-slate-300">•</span>
            <a
              href="https://www.rit.edu/ntid/dictionary/"
              target="_blank"
              rel="noreferrer"
              className="text-[#1F3864] hover:underline flex items-center gap-1"
            >
              NTID ASL Video Dictionary
              <ExternalLink className="w-3 h-3" />
            </a>
            <span className="text-slate-300">•</span>
            <a
              href="https://www.alabamapublichealth.gov/alphtn/assets/072023asl3handouts.pdf"
              target="_blank"
              rel="noreferrer"
              className="text-[#1F3864] hover:underline flex items-center gap-1"
            >
              Alabama Public Health Medical ASL
              <ExternalLink className="w-3 h-3" />
            </a>
            <span className="text-slate-300">•</span>
            <a
              href="https://www.ellismedlibrary.org/uploads/9/1/9/0/91901496/asl.pdf"
              target="_blank"
              rel="noreferrer"
              className="text-[#1F3864] hover:underline flex items-center gap-1"
            >
              Ellis Medicine Library ASL Guide
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* SIGN GESTURE INSPECTION & SLOW-MOTION MODAL                                */}
      {/* ========================================================================= */}
      {inspectingWord && activeMeta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#1F3864]/10 text-[#1F3864] border border-[#1F3864]/20">
                  {activeMeta.category}
                </span>
                <h3 className="text-2xl font-extrabold text-slate-900 capitalize">
                  "{inspectingWord}"
                </h3>
              </div>
              <button
                onClick={() => setInspectingWord(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Player Display with Speed Controls */}
            <div className="relative rounded-xl overflow-hidden bg-slate-950 aspect-video flex items-center justify-center border border-slate-200 shadow-inner">
              <video
                ref={modalVideoRef}
                src={`/assets/signs/videos/${activeSlug}.mp4`}
                poster={`/assets/signs/${activeSlug}.png`}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-contain"
              />

              {/* In-video floating overlay controls */}
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between px-3 py-2 bg-slate-900/80 backdrop-blur-sm rounded-lg border border-white/10 text-white text-xs">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRestartVideo}
                    className="p-1.5 rounded hover:bg-white/20 transition-colors flex items-center gap-1 text-[11px] font-medium"
                    title="Restart loop"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Restart
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[11px] text-slate-300 mr-1">Speed:</span>
                  {[0.5, 0.75, 1.0].map((rate) => (
                    <button
                      key={rate}
                      onClick={() => handleSpeedChange(rate)}
                      className={`px-2 py-0.5 rounded font-mono text-[11px] font-bold transition-colors ${
                        playbackSpeed === rate
                          ? 'bg-[#1F3864] text-white border border-blue-400/40'
                          : 'bg-white/10 hover:bg-white/20 text-slate-300'
                      }`}
                    >
                      {rate === 0.5 ? '0.5x Slow' : `${rate}x`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Signing Instructions */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Step-by-Step Signing Instruction:
              </div>
              <p className="text-sm font-semibold text-slate-800 leading-relaxed">
                {activeMeta.instructions}
              </p>
            </div>

            {/* Reference Links & Actions */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-slate-100">
              <a
                href={activePocketSignUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-[#1F3864] hover:underline flex items-center gap-1.5"
              >
                View full PocketSign video tutorial
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setInspectingWord(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Close
                </button>
                <Link
                  to="/dashboard"
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#1F3864] hover:bg-[#162846] rounded-lg shadow-xs transition-colors"
                >
                  Recognize on Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

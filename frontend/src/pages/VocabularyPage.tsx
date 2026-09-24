import React, { useState } from 'react';
import { LOCKED_VOCABULARY } from '../services/recognitionFeed';
import {
  BookOpen,
  Search,
  Layers,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

import { Link } from 'react-router-dom';

// Categories for intuitive civic service categorization
const WORD_CATEGORIES: Record<string, { category: string; description: string }> = {
  help: { category: 'Urgent Assistance', description: 'Request for immediate counter or emergency aid' },
  wait: { category: 'Queue & Timing', description: 'Indication to hold briefly or pause processing' },
  money: { category: 'Financial & Payments', description: 'Pertaining to cash, fees, or account balances' },
  form: { category: 'Documentation', description: 'Physical or digital paperwork requiring completion' },
  pain: { category: 'Medical & Triage', description: 'Expression of physical discomfort or pain symptom' },
  doctor: { category: 'Medical & Triage', description: 'Request for medical professional or clinical staff' },
  yes: { category: 'Affirmation', description: 'Affirmative response or agreement' },
  no: { category: 'Negation', description: 'Negative response or disagreement' },
  'thank you': { category: 'Courtesy & Dialogue', description: 'Polite expression of gratitude' },
  sign: { category: 'Documentation', description: 'Request or prompt to provide signature' },
  more: { category: 'Quantity & Modifiers', description: 'Request for additional items, time, or information' },
  problem: { category: 'Urgent Assistance', description: 'Alerting staff to an issue or complication' },
  emergency: { category: 'Urgent Assistance', description: 'Critical priority alert requiring fast intervention' },
  where: { category: 'Inquiry', description: 'Question regarding location, room, or counter direction' },
  name: { category: 'Identity & Intake', description: 'Inquiry or statement of personal identification' },
  appointment: { category: 'Queue & Timing', description: 'Scheduled service slot or reservation' },
  sick: { category: 'Medical & Triage', description: 'Health status indication or unwell condition' },
  please: { category: 'Courtesy & Dialogue', description: 'Polite request modifier' },
  here: { category: 'Location', description: 'Indicating current spot, counter, or arrival' },
  now: { category: 'Queue & Timing', description: 'Immediate timing or urgent present moment' },
};

export const VocabularyPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

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
              Approved Vocabulary Reference
            </h1>
            <p className="mt-2 text-base text-slate-600 max-w-2xl">
              Strictly locked to the 20 emergency and public intake vocabulary words benchmarked in our WLASL pipeline.
              No extraneous signs are recognized to ensure maximum reliability and sub-second classification speed.
            </p>
          </div>

          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#1F3864] hover:bg-[#162846] rounded-lg shadow-xs transition-colors self-start md:self-auto"
          >
            Test in Live Dashboard
            <ExternalLink className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>

        {/* Search & Category Filter Toolbar */}
        <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search words, meanings, or categories..."
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-300 rounded-lg shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#1F3864] focus:border-transparent text-slate-900 placeholder:text-slate-400"
              aria-label="Search approved vocabulary words"
            />
          </div>

          {/* Quick Counter */}
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 self-center">
            <span>Showing</span>
            <span className="font-bold text-slate-900 px-2 py-0.5 rounded bg-white border border-slate-200">
              {filteredWords.length} of {LOCKED_VOCABULARY.length}
            </span>
            <span>locked signs</span>
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

        {/* Vocabulary Grid (All 20 words with image/icon placeholders) */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filteredWords.map((word, index) => {
            const meta = WORD_CATEGORIES[word] || {
              category: 'General',
              description: 'Public service counter term',
            };

            return (
              <div
                key={word}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between group"
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

                  {/* Image/Icon Placeholder for Sign */}
                  <div className="w-full h-32 rounded-lg bg-slate-50 border border-dashed border-slate-200 flex flex-col items-center justify-center p-3 text-center group-hover:border-[#1F3864]/40 transition-colors relative overflow-hidden">
                    <div className="w-10 h-10 rounded-full bg-white shadow-2xs border border-slate-200 flex items-center justify-center mb-2">
                      <Layers className="w-5 h-5 text-[#1F3864]" aria-hidden="true" />
                    </div>
                    <span className="text-[11px] font-medium text-slate-700 capitalize">
                      Sign: "{word}"
                    </span>
                    <span className="text-[9px] font-mono text-slate-400 mt-0.5">
                      /assets/signs/{word.replace(/\s+/g, '_')}.png
                    </span>
                  </div>

                  {/* Word title and description */}
                  <div className="mt-4">
                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-[#1F3864] transition-colors capitalize">
                      {word}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500 leading-relaxed">
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

        {/* Informational Callout */}
        <div className="mt-12 p-5 rounded-xl bg-white border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#1F3864]/10 text-[#1F3864] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                Single Source of Truth
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                All 20 words and data events flow exclusively from <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">src/services/recognitionFeed.ts</code>. No UI component hardcodes alternative word sets.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
            <span className="text-xs font-mono font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
              Total Terms: {LOCKED_VOCABULARY.length}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};

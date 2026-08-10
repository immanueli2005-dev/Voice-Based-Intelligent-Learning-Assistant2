import React from 'react';
import { Globe } from 'lucide-react';

const LANGUAGES = [
  { code: 'bn', name: 'Bengali (বাংলা)' },
  { code: 'kn', name: 'Kannada (ಕನ್ನಡ)' },
  { code: 'en', name: 'English' },
  { code: 'mr', name: 'Marathi (मराठी)' },
  { code: 'hi', name: 'Hindi (हिन्दी)' },
  { code: 'te', name: 'Telugu (తెలుగు)' },
  { code: 'ta', name: 'Tamil (தமிழ்)' },
  { code: 'ml', name: 'Malayalam (മലയാളം)' }
];

export default function LanguageSelector({ selectedLanguage, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <Globe className="w-4 h-4 text-purple-400" />
      <select
        value={selectedLanguage}
        onChange={(e) => onChange(e.target.value)}
        className="bg-[#1c1c30] border border-slate-700/50 rounded-lg px-3 py-1.5 text-sm text-slate-100 outline-none focus:border-purple-500 transition-colors cursor-pointer"
      >
        {LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code} className="bg-[#121222]">
            {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
}

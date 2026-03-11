export function HeroCentered() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-950 via-stone-900 to-stone-950 flex flex-col items-center justify-center p-6 text-center font-sans">
      <div className="mb-2 text-amber-400/60 text-sm tracking-[0.3em] uppercase">Quran Memorization</div>
      <h1 className="text-4xl font-bold text-white mb-2 font-['Amiri']">Al-Hifz</h1>
      <p className="text-stone-400 text-sm mb-8 max-w-xs">Preview this app on your phone using Expo Go</p>

      <div className="bg-white rounded-2xl p-5 mb-8 shadow-2xl shadow-amber-500/10">
        <div className="w-44 h-44 bg-stone-100 rounded-lg flex items-center justify-center">
          <svg viewBox="0 0 100 100" className="w-32 h-32 text-stone-800">
            <rect x="10" y="10" width="25" height="25" rx="4" fill="currentColor" />
            <rect x="65" y="10" width="25" height="25" rx="4" fill="currentColor" />
            <rect x="10" y="65" width="25" height="25" rx="4" fill="currentColor" />
            <rect x="40" y="10" width="8" height="8" rx="1" fill="currentColor" opacity="0.6" />
            <rect x="52" y="10" width="8" height="8" rx="1" fill="currentColor" opacity="0.6" />
            <rect x="40" y="22" width="8" height="8" rx="1" fill="currentColor" opacity="0.6" />
            <rect x="10" y="40" width="8" height="8" rx="1" fill="currentColor" opacity="0.6" />
            <rect x="22" y="40" width="8" height="8" rx="1" fill="currentColor" opacity="0.6" />
            <rect x="40" y="40" width="8" height="8" rx="1" fill="currentColor" opacity="0.4" />
            <rect x="52" y="40" width="8" height="8" rx="1" fill="currentColor" opacity="0.6" />
            <rect x="65" y="40" width="8" height="8" rx="1" fill="currentColor" opacity="0.6" />
            <rect x="80" y="40" width="8" height="8" rx="1" fill="currentColor" opacity="0.4" />
            <rect x="40" y="52" width="8" height="8" rx="1" fill="currentColor" opacity="0.6" />
            <rect x="65" y="52" width="8" height="8" rx="1" fill="currentColor" opacity="0.4" />
            <rect x="80" y="52" width="8" height="8" rx="1" fill="currentColor" opacity="0.6" />
            <rect x="40" y="65" width="8" height="8" rx="1" fill="currentColor" opacity="0.6" />
            <rect x="52" y="65" width="8" height="8" rx="1" fill="currentColor" opacity="0.4" />
            <rect x="65" y="65" width="25" height="25" rx="4" fill="currentColor" opacity="0.3" />
            <rect x="40" y="80" width="8" height="8" rx="1" fill="currentColor" opacity="0.4" />
            <rect x="52" y="80" width="8" height="8" rx="1" fill="currentColor" opacity="0.6" />
          </svg>
        </div>
      </div>

      <a
        href="#"
        className="bg-amber-500 hover:bg-amber-400 text-stone-900 font-semibold px-8 py-3 rounded-xl text-sm transition-colors mb-4 inline-block"
      >
        Open in Expo Go
      </a>

      <div className="flex items-center gap-6 mt-4">
        <a href="#" className="flex items-center gap-2 text-stone-400 hover:text-stone-200 text-xs transition-colors">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
          App Store
        </a>
        <span className="text-stone-700">|</span>
        <a href="#" className="flex items-center gap-2 text-stone-400 hover:text-stone-200 text-xs transition-colors">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/></svg>
          Google Play
        </a>
      </div>
    </div>
  );
}

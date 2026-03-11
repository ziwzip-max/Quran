export function CompactCard() {
  return (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center p-6 font-sans">
      <div className="bg-white rounded-3xl shadow-xl shadow-stone-200/80 overflow-hidden max-w-sm w-full">
        <div className="bg-gradient-to-br from-stone-900 to-stone-800 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-amber-500/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 bg-amber-500/20 text-amber-300 text-[10px] font-medium uppercase tracking-widest px-3 py-1 rounded-full mb-4">
              <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
              Quran App
            </div>
            <h1 className="text-3xl font-bold text-white mb-1 font-['Amiri']">Al-Hifz</h1>
            <p className="text-stone-400 text-xs">Memorize, review, and listen</p>
          </div>
        </div>

        <div className="p-6">
          <div className="bg-stone-50 rounded-2xl p-4 flex items-center gap-4 mb-5">
            <div className="bg-white rounded-xl p-2.5 shadow-sm border border-stone-100 shrink-0">
              <svg viewBox="0 0 100 100" className="w-16 h-16 text-stone-800">
                <rect x="10" y="10" width="25" height="25" rx="4" fill="currentColor" />
                <rect x="65" y="10" width="25" height="25" rx="4" fill="currentColor" />
                <rect x="10" y="65" width="25" height="25" rx="4" fill="currentColor" />
                <rect x="40" y="10" width="8" height="8" rx="1" fill="currentColor" opacity="0.6" />
                <rect x="52" y="10" width="8" height="8" rx="1" fill="currentColor" opacity="0.6" />
                <rect x="40" y="40" width="8" height="8" rx="1" fill="currentColor" opacity="0.4" />
                <rect x="65" y="65" width="25" height="25" rx="4" fill="currentColor" opacity="0.3" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-stone-500 mb-1">Scan with camera</div>
              <div className="text-[10px] text-stone-400 leading-relaxed">Or open Expo Go and scan from the app</div>
            </div>
          </div>

          <a href="#" className="block w-full bg-stone-900 hover:bg-stone-800 text-white font-medium py-3 rounded-xl text-sm text-center transition-colors mb-3">
            Open in Expo Go
          </a>

          <div className="flex gap-2">
            <a href="#" className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-stone-200 rounded-xl hover:border-stone-300 transition-colors">
              <svg className="w-3.5 h-3.5 text-stone-500" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
              <span className="text-xs text-stone-600 font-medium">iOS</span>
            </a>
            <a href="#" className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-stone-200 rounded-xl hover:border-stone-300 transition-colors">
              <svg className="w-3.5 h-3.5 text-stone-500" viewBox="0 0 24 24" fill="currentColor"><path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/></svg>
              <span className="text-xs text-stone-600 font-medium">Android</span>
            </a>
          </div>
        </div>

        <div className="px-6 pb-5">
          <p className="text-[10px] text-stone-400 text-center">
            Expo Go is free. Available on iOS 13+ and Android 5+.
          </p>
        </div>
      </div>
    </div>
  );
}

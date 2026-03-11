export function SplitScreen() {
  return (
    <div className="min-h-screen flex flex-row font-sans">
      <div className="flex-1 bg-white flex flex-col items-center justify-center p-10">
        <div className="max-w-sm w-full">
          <div className="text-xs text-stone-400 uppercase tracking-widest mb-3">Step 1</div>
          <h1 className="text-3xl font-bold text-stone-900 mb-2 font-['Amiri']">Al-Hifz</h1>
          <p className="text-stone-500 text-sm mb-8 leading-relaxed">
            Download Expo Go to preview and test the Quran memorization app on your device.
          </p>

          <div className="space-y-3 mb-8">
            <a href="#" className="flex items-center gap-3 px-5 py-3.5 border border-stone-200 rounded-xl hover:border-stone-400 transition-colors group">
              <svg className="w-5 h-5 text-stone-600" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
              <div>
                <div className="text-sm font-medium text-stone-800 group-hover:text-stone-900">App Store</div>
                <div className="text-xs text-stone-400">iOS 13+</div>
              </div>
              <svg className="w-4 h-4 text-stone-300 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
            </a>
            <a href="#" className="flex items-center gap-3 px-5 py-3.5 border border-stone-200 rounded-xl hover:border-stone-400 transition-colors group">
              <svg className="w-5 h-5 text-stone-600" viewBox="0 0 24 24" fill="currentColor"><path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/></svg>
              <div>
                <div className="text-sm font-medium text-stone-800 group-hover:text-stone-900">Google Play</div>
                <div className="text-xs text-stone-400">Android 5+</div>
              </div>
              <svg className="w-4 h-4 text-stone-300 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
            </a>
          </div>

          <div className="text-xs text-stone-400">
            Expo Go is free and used by millions of developers to preview React Native apps.
          </div>
        </div>
      </div>

      <div className="flex-1 bg-stone-900 flex flex-col items-center justify-center p-10 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "32px 32px"}} />
        <div className="relative z-10 text-center">
          <div className="text-xs text-amber-400/70 uppercase tracking-widest mb-3">Step 2</div>
          <h2 className="text-xl font-semibold text-white mb-2">Scan QR Code</h2>
          <p className="text-stone-400 text-sm mb-6">Point your camera at this code</p>

          <div className="bg-white rounded-2xl p-4 inline-block mb-6 shadow-lg shadow-black/30">
            <div className="w-40 h-40 bg-stone-50 rounded-lg flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-28 h-28 text-stone-800">
                <rect x="10" y="10" width="25" height="25" rx="4" fill="currentColor" />
                <rect x="65" y="10" width="25" height="25" rx="4" fill="currentColor" />
                <rect x="10" y="65" width="25" height="25" rx="4" fill="currentColor" />
                <rect x="40" y="10" width="8" height="8" rx="1" fill="currentColor" opacity="0.6" />
                <rect x="52" y="10" width="8" height="8" rx="1" fill="currentColor" opacity="0.6" />
                <rect x="40" y="40" width="8" height="8" rx="1" fill="currentColor" opacity="0.4" />
                <rect x="52" y="40" width="8" height="8" rx="1" fill="currentColor" opacity="0.6" />
                <rect x="65" y="40" width="8" height="8" rx="1" fill="currentColor" opacity="0.6" />
                <rect x="40" y="65" width="8" height="8" rx="1" fill="currentColor" opacity="0.6" />
                <rect x="65" y="65" width="25" height="25" rx="4" fill="currentColor" opacity="0.3" />
              </svg>
            </div>
          </div>

          <div>
            <a href="#" className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-stone-900 font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
              Open in Expo Go
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

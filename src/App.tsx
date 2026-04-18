import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';
import { 
  Search, 
  Image as ImageIcon, 
  Folder, 
  Settings, 
  ChevronLeft, 
  MoreVertical, 
  Share2, 
  Trash2, 
  Info, 
  Maximize2,
  ScanText,
  X,
  Clock,
  Battery,
  Wifi,
  Moon,
  Sun
} from 'lucide-react';
import { createWorker } from 'tesseract.js';
import { MOCK_PHOTOS, Photo } from './data';
import { cn, formatDate, formatTime } from './lib/utils';

// --- Components ---

const StatusBar = ({ isHidden }: { isHidden: boolean }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div 
      animate={{ y: isHidden ? -40 : 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="fixed top-0 left-0 right-0 h-10 px-6 flex items-center justify-between z-[100] bg-transparent pointer-events-none select-none"
    >
      <div className="text-sm font-medium">{time.getHours()}:{time.getMinutes().toString().padStart(2, '0')}</div>
      <div className="flex items-center gap-2">
        <Wifi size={14} />
        <Battery size={14} className="rotate-90" />
      </div>
    </motion.div>
  );
};

const SearchBar = ({ onSearch, searchQuery }: { onSearch: (val: string) => void, searchQuery: string }) => {
  return (
    <div className="px-4 pt-12 pb-4 sticky top-0 z-[50] bg-m3-background">
      <div className="relative group">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Search size={20} className="text-m3-on-surface-variant" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search natural photos..."
          className="w-full h-14 pl-12 pr-12 rounded-full bg-m3-surface-variant text-m3-on-surface-variant focus:outline-none focus:ring-2 focus:ring-m3-primary transition-all shadow-sm"
        />
        <div className="absolute inset-y-0 right-4 flex items-center">
          <div className="w-8 h-8 rounded-full bg-m3-primary-container flex items-center justify-center overflow-hidden">
            <img 
              src="https://picsum.photos/seed/user/32/32" 
              alt="User" 
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const BottomNav = ({ activeTab, onTabChange }: { activeTab: string, onTabChange: (tab: string) => void }) => {
  const tabs = [
    { id: 'photos', label: 'Photos', icon: ImageIcon },
    { id: 'albums', label: 'Albums', icon: Folder },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-20 bg-m3-surface-variant/50 backdrop-blur-xl flex items-center justify-around px-2 pb-2 z-[100] border-t border-m3-outline/10">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className="flex flex-col items-center gap-1 group relative py-2 px-6"
          >
            <div className={cn(
              "p-1 rounded-2xl transition-all duration-300",
              isActive ? "bg-m3-primary-container text-m3-on-primary-container px-6" : "text-m3-on-surface-variant group-hover:bg-m3-primary/10"
            )}>
              <Icon size={24} fill={isActive ? "currentColor" : "none"} />
            </div>
            <span className={cn(
              "text-xs font-medium transition-all",
              isActive ? "text-m3-on-surface" : "text-m3-on-surface-variant"
            )}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

// --- Main App ---

export default function App() {
  const [activeTab, setActiveTab] = useState('photos');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [ocrResult, setOcrResult] = useState<string | null>(null);
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Scroll States
  const [isScrolling, setIsScrolling] = useState(false);
  const [isAtTop, setIsAtTop] = useState(true);
  const [canScroll, setCanScroll] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // OCR Worker
  const workerRef = useRef<any>(null);

  useEffect(() => {
    // Media query listener for system theme
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Scroll Handling
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const checkScrollable = () => {
      setCanScroll(el.scrollHeight > el.clientHeight);
    };

    const handleScroll = () => {
      setIsAtTop(el.scrollTop < 10);
      setIsScrolling(true);

      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, 150);
    };

    el.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', checkScrollable);
    
    // Initial checks
    checkScrollable();
    const observer = new MutationObserver(checkScrollable);
    observer.observe(el, { childList: true, subtree: true });

    return () => {
      el.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', checkScrollable);
      observer.disconnect();
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, []);

  // Derived visibilities
  const showSearchBar = !isScrolling || (!canScroll);
  const showStatusBar = (!isScrolling && isAtTop) || (!canScroll);

  const handleLongPress = async (photo: Photo) => {
    if (isOcrLoading) return;
    setIsOcrLoading(true);
    setOcrResult(null);

    try {
      if (!workerRef.current) {
        workerRef.current = await createWorker(['eng', 'tha', 'chi_sim']);
      }
      const { data: { text } } = await workerRef.current.recognize(photo.url);
      setOcrResult(text);
    } catch (err) {
      console.error(err);
      setOcrResult("OCR Failed. Please try again.");
    } finally {
      setIsOcrLoading(false);
    }
  };

  const filteredPhotos = useMemo(() => {
    if (!searchQuery) return MOCK_PHOTOS;
    // Simulate "Natural Search" by searching tags and OCR text
    const query = searchQuery.toLowerCase();
    return MOCK_PHOTOS.filter(photo => 
      photo.tags.some(t => t.toLowerCase().includes(query)) ||
      photo.album.toLowerCase().includes(query) ||
      (photo.ocrText && photo.ocrText.toLowerCase().includes(query))
    );
  }, [searchQuery]);

  const projectsByDate = useMemo(() => {
    const groups: { [key: string]: Photo[] } = {};
    filteredPhotos.forEach(photo => {
      const dateKey = formatDate(photo.date);
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(photo);
    });
    return Object.entries(groups).sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime());
  }, [filteredPhotos]);

  const albums = useMemo(() => {
    const albumMap: { [key: string]: Photo[] } = {};
    filteredPhotos.forEach(photo => {
      if (!albumMap[photo.album]) albumMap[photo.album] = [];
      albumMap[photo.album].push(photo);
    });
    return Object.entries(albumMap);
  }, [filteredPhotos]);

  return (
    <div className={cn(
      "min-h-screen transition-colors duration-500",
      isDarkMode ? "dark bg-[#1A1C1E] text-white" : "bg-m3-background"
    )}>
      <StatusBar isHidden={!showStatusBar} />
      
      <main 
        ref={scrollRef} 
        className="h-screen overflow-y-auto scroll-smooth pb-24"
      >
        <motion.div
          animate={{ y: showSearchBar ? 0 : -150, opacity: showSearchBar ? 1 : 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="sticky top-0 z-[50]"
        >
          <SearchBar searchQuery={searchQuery} onSearch={setSearchQuery} />
        </motion.div>

        <div className="px-4">
          <AnimatePresence mode="wait">
            {activeTab === 'photos' && (
              <motion.div
                key="photos"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                {projectsByDate.map(([date, photos]) => (
                  <div key={date}>
                    <h3 className="text-sm font-semibold mb-4 text-m3-on-surface-variant sticky top-[104px] py-2 bg-m3-background z-40">{date}</h3>
                    <div className="grid grid-cols-3 gap-1 md:grid-cols-4 lg:grid-cols-6">
                      {photos.map((photo) => (
                        <motion.div
                          key={photo.id}
                          layoutId={`photo-${photo.id}`}
                          onClick={() => setSelectedPhoto(photo)}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            handleLongPress(photo);
                          }}
                          className="aspect-square relative cursor-pointer overflow-hidden rounded-sm group"
                        >
                          <img 
                            src={photo.url} 
                            alt="" 
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover transition-transform group-hover:scale-105" 
                          />
                          {(isOcrLoading && selectedPhoto?.id === photo.id) && (
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                              <motion.div 
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                className="w-6 h-6 border-2 border-white border-t-transparent rounded-full"
                              />
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {activeTab === 'albums' && (
              <motion.div
                key="albums"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-2 gap-4"
              >
                {albums.map(([name, photos]) => (
                  <div key={name} className="space-y-2 cursor-pointer group" onClick={() => {
                    setSearchQuery(name);
                    setActiveTab('photos');
                  }}>
                    <div className="aspect-square rounded-3xl overflow-hidden bg-m3-surface-variant shadow-sm transition-shadow group-hover:shadow-md">
                      <div className="grid grid-cols-2 grid-rows-2 h-full gap-0.5">
                        {photos.slice(0, 4).map((p, i) => (
                          <img 
                            key={p.id} 
                            src={p.url} 
                            alt="" 
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover" 
                          />
                        ))}
                        {photos.length < 4 && Array.from({ length: 4 - photos.length }).map((_, i) => (
                          <div key={i} className="bg-m3-outline/10 w-full h-full" />
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-m3-on-surface">{name}</h4>
                      <p className="text-sm text-m3-on-surface-variant">{photos.length} photos</p>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {activeTab === 'search' && (
              <motion.div
                key="search"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8 pb-10"
              >
                <div className="p-6 bg-m3-primary-container/30 rounded-3xl border border-m3-primary/10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-m3-primary/20 flex items-center justify-center">
                        <ScanText size={20} className="text-m3-primary" />
                      </div>
                      <motion.div 
                        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="absolute inset-0 rounded-full border border-m3-primary"
                      />
                    </div>
                    <div>
                      <h4 className="font-semibold text-m3-on-primary-container">Vector Search Engine</h4>
                      <p className="text-xs text-m3-on-surface-variant italic">100% Offline • Natively Accelerated</p>
                    </div>
                  </div>
                  <p className="text-sm text-m3-on-surface-variant leading-relaxed">
                    Search for anything. "Beach at sunset", "Receipts from last month", or "Photos with buildings".
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-m3-on-surface-variant px-2">Suggested Categories</h3>
                  <div className="flex flex-wrap gap-2">
                    {['Mountain', 'City', 'Food', 'Travel', 'Architecture', 'Pets', 'Documents'].map(cat => (
                      <button
                        key={cat}
                        onClick={() => {
                          setSearchQuery(cat);
                          setActiveTab('photos');
                        }}
                        className="px-4 py-2 rounded-full bg-m3-surface-variant text-sm font-medium hover:bg-m3-primary hover:text-white transition-all shadow-sm"
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-m3-on-surface-variant px-2">Recent Discoveries</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {MOCK_PHOTOS.slice(0, 4).map(p => (
                      <div 
                        key={p.id} 
                        className="relative aspect-video rounded-2xl overflow-hidden cursor-pointer"
                        onClick={() => setSelectedPhoto(p)}
                      >
                        <img src={p.url} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-3">
                          <span className="text-white text-xs font-medium">{p.tags[0]}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="p-4 bg-m3-surface-variant rounded-3xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-m3-on-surface">
                      {isDarkMode ? <Moon size={20} /> : <Sun size={20} />}
                      <span>Dark Theme</span>
                    </div>
                    <button 
                      onClick={() => setIsDarkMode(!isDarkMode)}
                      className={cn(
                        "w-12 h-6 rounded-full transition-colors relative",
                        isDarkMode ? "bg-m3-primary" : "bg-m3-outline"
                      )}
                    >
                      <motion.div 
                        animate={{ x: isDarkMode ? 24 : 4 }}
                        className="w-4 h-4 rounded-full bg-white absolute top-1"
                      />
                    </button>
                  </div>
                </div>

                <div className="space-y-4 px-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-m3-on-surface-variant">System Information</h3>
                  <div className="space-y-2 text-m3-on-surface-variant text-sm">
                    <div className="flex justify-between"><span>Package Name</span><span className="text-m3-primary">com.android.gallery</span></div>
                    <div className="flex justify-between"><span>Target</span><span>Android 16 (ARM64)</span></div>
                    <div className="flex justify-between"><span>Performance</span><span className="text-green-500 font-medium">100% Native Optimized</span></div>
                    <p className="pt-2">Model: Galaxy Vector Engine 1.0</p>
                    <p>OCR Engines: English, Thai, Chinese</p>
                    <p>Storage: 4.2 GB used of 512 GB</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Fullscreen Photo Viewer */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] bg-black flex flex-col"
          >
            <div className="flex items-center justify-between p-4 text-white">
              <button 
                onClick={() => {
                  setSelectedPhoto(null);
                  setOcrResult(null);
                }}
                className="p-2 rounded-full hover:bg-white/10"
              >
                <ChevronLeft size={24} />
              </button>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => handleLongPress(selectedPhoto)}
                  className={cn("p-2 rounded-full hover:bg-white/10", isOcrLoading && "animate-pulse")}
                >
                  <ScanText size={22} className={ocrResult ? "text-m3-primary-container" : ""} />
                </button>
                <button className="p-2 rounded-full hover:bg-white/10"><Share2 size={22} /></button>
                <button className="p-2 rounded-full hover:bg-white/10"><Trash2 size={22} /></button>
                <button className="p-2 rounded-full hover:bg-white/10"><MoreVertical size={22} /></button>
              </div>
            </div>

            <div className="flex-1 flex items-center justify-center relative touch-none overflow-hidden">
              <motion.img 
                layoutId={`photo-${selectedPhoto.id}`}
                src={selectedPhoto.url} 
                alt="" 
                referrerPolicy="no-referrer"
                className="max-h-full max-w-full object-contain"
                onDoubleClick={() => handleLongPress(selectedPhoto)}
              />
              
              {isOcrLoading && (
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex flex-col items-center gap-4 bg-black/50 py-8">
                  <motion.div 
                    animate={{ x: [-100, 100] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                    className="w-48 h-0.5 bg-m3-primary shadow-[0_0_10px_rgba(0,97,164,0.8)]"
                  />
                  <p className="text-white text-sm font-medium">Scanning text (Eng, Thai, Chi)...</p>
                </div>
              )}

              {ocrResult && (
                <motion.div 
                  initial={{ y: 100, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="absolute bottom-10 left-4 right-4 bg-black/80 backdrop-blur-lg border border-white/20 p-6 rounded-3xl"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-m3-primary-container font-medium flex items-center gap-2">
                      <ScanText size={18} /> OCR Result
                    </h4>
                    <button onClick={() => setOcrResult(null)} className="text-white/60 hover:text-white">
                      <X size={18} />
                    </button>
                  </div>
                  <p className="text-white text-lg leading-relaxed">{ocrResult}</p>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(ocrResult);
                      // Feedback would go here
                    }}
                    className="mt-4 w-full py-3 bg-m3-primary text-white rounded-xl font-medium active:scale-95 transition-transform"
                  >
                    Copy Text
                  </button>
                </motion.div>
              )}
            </div>

            <div className="p-6 text-white/80 text-center">
              <p className="font-medium">{formatDate(selectedPhoto.date)}</p>
              <p className="text-sm opacity-60">{formatTime(selectedPhoto.date)} • {selectedPhoto.album}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


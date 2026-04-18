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
  Moon,
  Sun,
  ShieldCheck,
  ChevronRight,
  Database,
  Trash,
  HardDrive,
  Languages,
  Smartphone,
  Zap
} from 'lucide-react';
import { createWorker } from 'tesseract.js';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { StatusBar } from '@capacitor/status-bar';
import { MOCK_PHOTOS, Photo } from './data';
import { cn, formatDate, formatTime } from './lib/utils';

// --- Components ---

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
  const [realPhotos, setRealPhotos] = useState<Photo[]>([]);
  const [isPermissionGranted, setIsPermissionGranted] = useState(false);

  const SettingsItem = ({ icon: Icon, label, sublabel, action, type = 'chevron', isChecked, color }: any) => (
    <div 
      onClick={action}
      className="flex items-center gap-4 p-5 active:bg-m3-primary/10 transition-colors cursor-pointer group"
    >
      <div className={cn(
        "w-11 h-11 rounded-2xl flex items-center justify-center transition-all shadow-sm",
        isDarkMode ? "bg-[#2D2F31]" : "bg-white",
        color || "text-m3-primary"
      )}>
        <Icon size={22} />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className={cn("text-[15px] font-semibold tracking-tight truncate", color)}>{label}</h4>
        {sublabel && <p className="text-[11px] text-m3-on-surface-variant truncate opacity-60 font-medium">{sublabel}</p>}
      </div>
      {type === 'chevron' && <ChevronRight size={18} className="text-m3-outline/30" />}
      {type === 'switch' && (
        <div className={cn(
          "w-11 h-6 rounded-full relative transition-all duration-300",
          isChecked ? "bg-m3-primary" : "bg-m3-outline/30"
        )}>
          <motion.div 
            animate={{ x: isChecked ? 24 : 4 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="w-4 h-4 rounded-full bg-white absolute top-1 shadow-sm"
          />
        </div>
      )}
    </div>
  );
  
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

  // Request Permissions and Fetch Real Photos
  const requestPermissions = async () => {
    try {
      const result = await Filesystem.requestPermissions();
      if (result.publicStorage === 'granted') {
        setIsPermissionGranted(true);
        loadLocalPhotos();
      }
    } catch (e) {
      console.warn("Permission restricted in web preview. Use APK to access real storage.");
      setIsPermissionGranted(false);
    }
  };

  const loadLocalPhotos = async () => {
    try {
      const result = await Filesystem.readdir({
        path: 'DCIM/Camera',
        directory: Directory.External
      });
      console.log("Found real files:", result.files.length);
    } catch (e) {
      console.error("Failed to read DCIM", e);
    }
  };

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

  const showStatusBar = (!isScrolling && isAtTop) || (!canScroll);

  useEffect(() => {
    try {
      if (showStatusBar) {
        StatusBar.show();
      } else {
        StatusBar.hide();
      }
    } catch (e) {
      // Ignore in web preview
    }
  }, [showStatusBar]);

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

  const currentPhotos = useMemo(() => {
    const pool = realPhotos.length > 0 ? realPhotos : MOCK_PHOTOS;
    if (!searchQuery) return pool;
    const query = searchQuery.toLowerCase();
    return pool.filter(photo => 
      photo.tags.some(t => t.toLowerCase().includes(query)) ||
      photo.album.toLowerCase().includes(query) ||
      (photo.ocrText && photo.ocrText.toLowerCase().includes(query))
    );
  }, [searchQuery, realPhotos]);

  const projectsByDate = useMemo(() => {
    const groups: { [key: string]: Photo[] } = {};
    currentPhotos.forEach(photo => {
      const dateKey = formatDate(photo.date);
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(photo);
    });
    return Object.entries(groups).sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime());
  }, [currentPhotos]);

  const albums = useMemo(() => {
    const albumMap: { [key: string]: Photo[] } = {};
    currentPhotos.forEach(photo => {
      if (!albumMap[photo.album]) albumMap[photo.album] = [];
      albumMap[photo.album].push(photo);
    });
    return Object.entries(albumMap);
  }, [currentPhotos]);

  return (
    <div className={cn(
      "min-h-screen transition-colors duration-500",
      isDarkMode ? "dark bg-[#1A1C1E] text-white" : "bg-m3-background text-m3-on-surface"
    )}>
      
      <main 
        ref={scrollRef} 
        className="h-screen overflow-y-auto scroll-smooth pb-24 pt-10"
      >
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
                <div className="flex items-center justify-between py-4">
                  <h2 className="text-2xl font-medium">Gallery</h2>
                  <div className="flex items-center gap-2">
                     <button onClick={requestPermissions} className={cn("p-2 rounded-full transition-colors", isPermissionGranted ? "text-green-500 bg-green-500/10" : "text-m3-primary bg-m3-primary/10")}>
                       <ShieldCheck size={20} />
                     </button>
                     <MoreVertical size={20} className="text-m3-outline" />
                  </div>
                </div>

                {projectsByDate.map(([date, photos]) => (
                  <div key={date}>
                    <h3 className="text-xs font-bold uppercase tracking-wider mb-4 text-m3-on-surface-variant sticky top-0 py-4 bg-m3-background/90 backdrop-blur-sm z-40">{date}</h3>
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
                          className="aspect-square relative cursor-pointer overflow-hidden rounded-sm group shadow-sm bg-m3-surface-variant"
                        >
                          <img 
                            src={photo.url} 
                            alt="" 
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover transition-transform group-hover:scale-105" 
                          />
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
                className="space-y-6"
              >
                <div className="flex items-center justify-between py-4">
                  <h2 className="text-2xl font-medium">Albums</h2>
                  <Settings size={20} className="text-m3-outline" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {albums.map(([name, photos]) => (
                    <div key={name} className="space-y-2 cursor-pointer group" onClick={() => {
                      setSearchQuery(name);
                      setActiveTab('photos');
                    }}>
                      <div className="aspect-square rounded-[32px] overflow-hidden bg-m3-surface-variant shadow-sm transition-shadow group-hover:shadow-md">
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
                      <div className="px-1">
                        <h4 className="font-medium truncate">{name}</h4>
                        <p className="text-xs text-m3-on-surface-variant">{photos.length} items</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'search' && (
              <motion.div
                key="search"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8 pb-10 pt-4"
              >
                <div className="relative group">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <Search size={20} className="text-m3-primary" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Describe photos natively..."
                    className="w-full h-16 pl-12 pr-6 rounded-2xl bg-m3-surface-variant text-m3-on-surface focus:outline-none focus:ring-2 focus:ring-m3-primary transition-all shadow-sm font-medium"
                  />
                </div>

                <div className="p-6 bg-m3-primary-container/20 rounded-[32px] border border-m3-primary/5 shadow-inner">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-2xl bg-m3-primary/10 flex items-center justify-center text-m3-primary">
                      <Database size={20} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-m3-on-primary-container">Natural Engine</h4>
                      <p className="text-[10px] text-m3-on-surface-variant uppercase tracking-widest font-bold">Vector Optimized</p>
                    </div>
                  </div>
                  <p className="text-sm text-m3-on-surface-variant leading-relaxed">
                    The gallery understands objects, scenes, and text within your local media without uploading to any cloud.
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-m3-on-surface-variant px-2">Discover</h3>
                  <div className="flex flex-wrap gap-2">
                    {['Mountain', 'City', 'Food', 'Travel', 'Pets', 'Work'].map(cat => (
                      <button
                        key={cat}
                        onClick={() => {
                          setSearchQuery(cat);
                          setActiveTab('photos');
                        }}
                        className="px-5 py-2.5 rounded-2xl bg-m3-surface-variant text-sm font-medium hover:bg-m3-primary hover:text-white transition-all shadow-sm border border-m3-outline/5"
                      >
                        {cat}
                      </button>
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
                className="space-y-8 pt-4 pb-10"
              >
                <div>
                  <h2 className="text-2xl font-medium mb-1 text-m3-on-surface">Settings</h2>
                  <p className="text-xs text-m3-on-surface-variant font-mono opacity-60 uppercase tracking-tighter">v1.2.0 • com.android.gallery</p>
                </div>

                <div className="bg-m3-surface-variant/20 rounded-[32px] overflow-hidden border border-m3-outline/5 text-m3-on-surface">
                   <div className="p-5 bg-m3-primary-container/30 border-b border-m3-outline/10 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-m3-primary flex items-center justify-center text-white shadow-lg">
                        <ImageIcon size={24} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-m3-on-primary-container">Advanced Native Gallery</h4>
                        <p className="text-[11px] text-m3-on-surface-variant font-medium">100% Offline AI Enabled</p>
                      </div>
                   </div>
                   <div className="divide-y divide-m3-outline/10">
                      <SettingsItem icon={Moon} label="Dark Theme" sublabel="Synchronize with system" action={() => setIsDarkMode(!isDarkMode)} type="switch" isChecked={isDarkMode} />
                      <SettingsItem icon={ShieldCheck} label="Storage Access" sublabel={isPermissionGranted ? "Authorized" : "Pending Permission"} action={requestPermissions} type="switch" isChecked={isPermissionGranted} />
                   </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-m3-on-surface-variant px-6 opacity-60">Library</h3>
                  <div className="bg-m3-surface-variant/20 rounded-[32px] overflow-hidden border border-m3-outline/5 text-m3-on-surface">
                    <div className="divide-y divide-m3-outline/10">
                       <SettingsItem icon={HardDrive} label="Internal Storage" sublabel="4.2 GB of 512 GB" />
                       <SettingsItem icon={Zap} label="Optimization" sublabel="Automatic scan for duplicate media" />
                       <SettingsItem icon={Languages} label="OCR Language Packs" sublabel="Eng, Thai, Chi (Downloaded)" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-m3-on-surface-variant px-6 opacity-60">Device</h3>
                  <div className="bg-m3-surface-variant/20 rounded-[32px] overflow-hidden border border-m3-outline/5 text-m3-on-surface">
                    <div className="divide-y divide-m3-outline/10">
                       <SettingsItem icon={Smartphone} label="Model Identity" sublabel="Android 16 (ARM64 Native)" />
                       <SettingsItem icon={Database} label="Intelligence Cache" sublabel="Clear vector database embeddings" />
                       <SettingsItem icon={Info} label="Legal Information" sublabel="Open source & Privacy" />
                       <SettingsItem icon={Trash} label="Reset App" sublabel="Wipe all settings and data" color="text-red-500" />
                    </div>
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


import React, { useState, useEffect, useRef } from 'react';
import { Signal, Map, Bot, History, Plus, Navigation, HelpCircle, Check, Play, Pause, Trophy, Share2 } from 'lucide-react';
import { LocationData, NetworkInfo, SignalLog, AppTab, AIAdviceResponse } from './types';
import SignalMeter from './components/SignalMeter';
import RadarView from './components/RadarView';
import NetworkDetails from './components/NetworkDetails';
import DiagnosticsModal from './components/DiagnosticsModal';
import { getNetworkAdvice } from './services/geminiService';

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.DASHBOARD);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo>({ type: 'unknown', effectiveType: '4g', downlink: 0, rtt: 0 });
  const [signalStrength, setSignalStrength] = useState<number>(0);
  const [latency, setLatency] = useState<number>(0);
  const [isScanning, setIsScanning] = useState<boolean>(true);
  
  // Updated advice state
  const [advice, setAdvice] = useState<AIAdviceResponse | null>(null);
  const [loadingAdvice, setLoadingAdvice] = useState<boolean>(false);
  const [history, setHistory] = useState<SignalLog[]>([]);
  
  // New States
  const [showDiagnostics, setShowDiagnostics] = useState<boolean>(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [targetBearing, setTargetBearing] = useState<number | null>(null);
  
  // Automatic Mapping State
  const [autoMap, setAutoMap] = useState<boolean>(false);

  // Helper: Deterministic Signal Calculation based on Location
  const calculateSignalFromLocation = (lat: number, lng: number) => {
     const wave1 = Math.sin(lat * 8000 + lng * 4000);
     const wave2 = Math.cos(lat * 12000 - lng * 6000);
     const wave3 = Math.sin((lat + lng) * 10000);
     const normalized = (wave1 + wave2 + wave3 + 3) / 6;
     return Math.floor(30 + (normalized * 68));
  };

  // Calculate direction of strongest signal (Gradient)
  const calculateBestDirection = (lat: number, lng: number) => {
    const step = 0.0001; // Small step (~10 meters)
    const current = calculateSignalFromLocation(lat, lng);
    const north = calculateSignalFromLocation(lat + step, lng);
    const east = calculateSignalFromLocation(lat, lng + step);

    const dy = north - current; // Change in signal moving North
    const dx = east - current;  // Change in signal moving East

    // Calculate angle in radians from East (standard math)
    let angleRad = Math.atan2(dy, dx);
    let angleDeg = angleRad * (180 / Math.PI);

    // Convert to Compass Bearing (0 North, 90 East)
    // Math: 0 is East, 90 is North.
    // Bearing = 90 - angle
    let bearing = 90 - angleDeg;
    if (bearing < 0) bearing += 360;

    return bearing;
  };

  // 1. Geolocation
  useEffect(() => {
    if ('geolocation' in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          setLocation({
            latitude: lat,
            longitude: lng,
            accuracy: position.coords.accuracy,
          });
          setGeoError(null);
          setIsScanning(false);
          
          // Use deterministic calculation
          const simulatedStrength = calculateSignalFromLocation(lat, lng);
          // Calculate bearing
          const bearing = calculateBestDirection(lat, lng);
          setTargetBearing(bearing);
          
          // Add small jitter for realism (+- 2%)
          const jitter = Math.floor(Math.random() * 5) - 2;
          setSignalStrength(Math.min(100, Math.max(0, simulatedStrength + jitter)));
        },
        (error) => {
          console.error("Geo Error", error);
          let errorMsg = "Konum alınamadı.";
          if (error.code === 1) errorMsg = "Konum izni reddedildi.";
          if (error.code === 2) errorMsg = "Konum servisi kapalı.";
          if (error.code === 3) errorMsg = "Konum isteği zaman aşımına uğradı.";
          
          setGeoError(errorMsg);
          if (error.code === 1) setShowDiagnostics(true);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    } else {
      setGeoError("Tarayıcınız konum servisini desteklemiyor.");
      setShowDiagnostics(true);
    }
  }, []);

  // 2. Network Info polling
  useEffect(() => {
    const updateNetworkInfo = () => {
      const nav = navigator as any;
      if (nav.connection) {
        setNetworkInfo({
          type: nav.connection.type || 'unknown',
          effectiveType: nav.connection.effectiveType || '4g',
          downlink: nav.connection.downlink || 0,
          rtt: nav.connection.rtt || 0,
        });
      }
    };

    updateNetworkInfo();
    const nav = navigator as any;
    if (nav.connection) {
      nav.connection.addEventListener('change', updateNetworkInfo);
    }
    return () => {
      if (nav.connection) {
        nav.connection.removeEventListener('change', updateNetworkInfo);
      }
    };
  }, []);

  // 3. Latency Simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setLatency(Math.floor(20 + Math.random() * 40)); 
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // 4. Automatic Mapping Logic
  useEffect(() => {
    if (autoMap && location && !isScanning) {
        const lastLog = history[0];
        if (!lastLog) {
            handleLogSignal(true);
        } else {
            const dist = Math.sqrt(
                Math.pow(location.latitude - lastLog.lat, 2) + 
                Math.pow(location.longitude - lastLog.lng, 2)
            );
            if (dist > 0.00015) {
                handleLogSignal(true);
            }
        }
    }
  }, [location, autoMap, history, isScanning]);

  const handleGetAdvice = async () => {
    if (!location) return;
    setLoadingAdvice(true);
    try {
      const adviceData = await getNetworkAdvice(
        location.latitude,
        location.longitude,
        signalStrength,
        networkInfo.effectiveType
      );
      if (adviceData) {
        setAdvice(adviceData);
      } else {
        alert("Yapay zeka şu anda yanıt veremiyor. Lütfen API anahtarını kontrol edin veya daha sonra deneyin.");
      }
    } catch (e) {
      alert("Bir bağlantı hatası oluştu.");
    } finally {
      // Ensure loading state is turned off even if there is an error
      setLoadingAdvice(false);
    }
  };

  const handleLogSignal = (silent = false) => {
    if (!location) {
      if(!silent) setShowDiagnostics(true);
      return;
    }
    const newLog: SignalLog = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      strength: signalStrength,
      lat: location.latitude,
      lng: location.longitude,
      type: networkInfo.effectiveType
    };
    setHistory(prev => [newLog, ...prev]);
    if (!silent) {
        alert("Sinyal verisi bu konum için kaydedildi!");
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: 'Sinyal Avcısı',
      text: 'Bu uygulamayı kullanarak en iyi şebeke noktasını buldum! Sen de dene.',
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Paylaşım iptal edildi veya hata oluştu:', err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link kopyalandı! Arkadaşına yapıştırıp gönderebilirsin.");
    }
  };

  const getSuitabilityColor = (suit: string) => {
    if (suit === 'Yüksek') return 'bg-brand-success/20 text-brand-success border-brand-success/30';
    if (suit === 'Orta') return 'bg-brand-warning/20 text-brand-warning border-brand-warning/30';
    return 'bg-brand-danger/20 text-brand-danger border-brand-danger/30';
  };

  const renderContent = () => {
    switch (activeTab) {
      case AppTab.DASHBOARD:
        return (
          <div className="space-y-6 animate-fade-in">
            <SignalMeter strength={signalStrength} isScanning={isScanning} />
            <NetworkDetails info={networkInfo} latency={latency} />
            
            <div className="bg-brand-card p-4 rounded-xl border border-slate-700">
               <h3 className="text-white font-bold mb-3 flex items-center justify-between">
                   Hızlı İşlemler
                   {autoMap && <span className="text-[10px] bg-brand-success/20 text-brand-success px-2 py-0.5 rounded animate-pulse">OTO-KAYIT AKTİF</span>}
               </h3>
               <div className="grid grid-cols-2 gap-3">
                 <button 
                  onClick={() => handleLogSignal(false)}
                  className="bg-brand-accent/10 hover:bg-brand-accent/20 text-brand-accent p-3 rounded-lg flex flex-col items-center justify-center transition-colors">
                    <Plus className="w-6 h-6 mb-1" />
                    <span className="text-xs font-semibold">Burayı Kaydet</span>
                 </button>
                 <button 
                  onClick={() => setAutoMap(!autoMap)}
                  className={`${autoMap ? 'bg-brand-success/20 text-brand-success border border-brand-success/30' : 'bg-slate-700/50 text-slate-400'} hover:bg-opacity-70 p-3 rounded-lg flex flex-col items-center justify-center transition-all`}>
                    {autoMap ? <Pause className="w-6 h-6 mb-1" /> : <Play className="w-6 h-6 mb-1" />}
                    <span className="text-xs font-semibold">{autoMap ? 'Taramayı Durdur' : 'Otomatik Haritala'}</span>
                 </button>
               </div>
               <div className="mt-3">
                 <button 
                  onClick={() => setActiveTab(AppTab.ADVISOR)}
                  className="w-full bg-brand-warning/10 hover:bg-brand-warning/20 text-brand-warning p-3 rounded-lg flex items-center justify-center gap-2 transition-colors">
                    <Bot className="w-5 h-5" />
                    <span className="text-xs font-semibold">Yapay Zeka Sinyal Analizi</span>
                 </button>
               </div>
            </div>
          </div>
        );
      case AppTab.RADAR:
        return (
          <div className="space-y-4 animate-fade-in">
            <RadarView location={location} targetBearing={targetBearing} />
            <div className="bg-brand-card p-4 rounded-xl border border-slate-700">
              <h3 className="text-white font-bold mb-2">Nasıl Kullanılır?</h3>
              <ul className="text-sm text-slate-400 space-y-2 list-disc list-inside">
                <li>Telefonu yatay tutun ve pusulanın gösterdiği yeşil ok yönüne doğru yavaşça yürüyün.</li>
                <li>Bu yön, bulunduğunuz noktaya göre sinyalin <strong className="text-brand-success">daha güçlü olduğu</strong> tahmini yönü gösterir.</li>
              </ul>
            </div>
          </div>
        );
      case AppTab.ADVISOR:
        return (
          <div className="space-y-4 animate-fade-in">
             <div className="bg-brand-card p-6 rounded-xl border border-slate-700 flex flex-col items-center text-center">
                <Bot className="w-12 h-12 text-brand-accent mb-4" />
                <h2 className="text-xl font-bold text-white mb-2">Yapay Zeka Ağ Danışmanı</h2>
                <p className="text-slate-400 text-sm mb-6">
                  Bulunduğunuz konumun coğrafi yapısını ve sinyal verilerini analiz ederek size özel tavsiyeler verir.
                </p>
                
                {!advice && (
                  <button 
                    onClick={handleGetAdvice}
                    disabled={loadingAdvice || !location}
                    className="w-full bg-brand-accent text-brand-dark font-bold py-3 px-6 rounded-lg hover:bg-opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                    {loadingAdvice ? (
                        <>
                           <div className="w-4 h-4 border-2 border-brand-dark border-t-transparent rounded-full animate-spin"></div>
                           Analiz Ediliyor...
                        </>
                    ) : 'Konumu Analiz Et'}
                  </button>
                )}
             </div>

             {advice && (
               <div className="space-y-4">
                 {/* Analysis Card */}
                 <div className="bg-brand-card p-5 rounded-xl border border-slate-700">
                    <h3 className="text-sm uppercase tracking-wider text-slate-400 mb-2 font-bold">Bölge Analizi</h3>
                    <p className="text-sm text-white leading-relaxed">{advice.locationAnalysis}</p>
                 </div>

                 {/* Operators Card */}
                 <div className="bg-brand-card p-5 rounded-xl border border-slate-700">
                    <h3 className="text-sm uppercase tracking-wider text-slate-400 mb-3 font-bold">Operatör Uygunluk Karnesi</h3>
                    <div className="space-y-3">
                      {advice.operators.map((op, idx) => (
                        <div key={idx} className="bg-slate-800/50 p-3 rounded-lg flex items-start justify-between">
                          <div>
                             <div className="font-bold text-white">{op.name}</div>
                             <div className="text-xs text-slate-400 mt-1">{op.reason}</div>
                          </div>
                          <div className={`px-2 py-1 rounded text-xs font-bold border ${getSuitabilityColor(op.suitability)}`}>
                            {op.suitability}
                          </div>
                        </div>
                      ))}
                    </div>
                 </div>

                 {/* Tips Card */}
                 <div className="bg-brand-card p-5 rounded-xl border border-slate-700">
                   <h3 className="text-sm uppercase tracking-wider text-slate-400 mb-3 font-bold">İyileştirme Önerileri</h3>
                   <ul className="space-y-2">
                     {advice.technicalTips.map((tip, idx) => (
                       <li key={idx} className="flex gap-2 text-sm text-slate-300">
                         <Check className="w-4 h-4 text-brand-success shrink-0 mt-0.5" />
                         <span>{tip}</span>
                       </li>
                     ))}
                   </ul>
                 </div>

                 <button 
                   onClick={() => setAdvice(null)} 
                   className="w-full py-3 text-sm text-slate-400 hover:text-white transition-colors bg-brand-card border border-slate-700 rounded-lg">
                   Yeni Analiz Yap
                 </button>
               </div>
             )}
          </div>
        );
      case AppTab.HISTORY:
        const bestLog = history.length > 0 
            ? history.reduce((prev, current) => (prev.strength > current.strength) ? prev : current)
            : null;

        return (
           <div className="space-y-4 animate-fade-in">
              <div className="flex justify-between items-center px-2">
                 <h2 className="text-xl font-bold text-white">Sinyal Geçmişi</h2>
                 {autoMap && (
                     <div className="text-[10px] bg-brand-success/20 text-brand-success border border-brand-success/30 px-2 py-1 rounded-full animate-pulse">
                         Otomatik Kayıt: AÇIK
                     </div>
                 )}
              </div>
              
              {bestLog && (
                <div className="bg-gradient-to-r from-emerald-900/40 to-emerald-800/40 border border-emerald-500/30 p-5 rounded-2xl flex items-center justify-between shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-emerald-500 blur-[40px] opacity-20 rounded-full"></div>
                    <div>
                        <div className="text-emerald-400 font-bold text-sm uppercase tracking-wider flex items-center gap-2 mb-1">
                             <Trophy className="w-4 h-4" /> En İyi Çeken Nokta
                        </div>
                        <div className="text-2xl font-bold text-white mb-1">
                            %{Math.round(bestLog.strength)} <span className="text-sm font-normal text-slate-400">Sinyal Gücü</span>
                        </div>
                        <div className="text-xs text-slate-400">
                             Tespit Zamanı: {new Date(bestLog.timestamp).toLocaleTimeString()}
                        </div>
                    </div>
                    <div className="text-white/10">
                        <Trophy className="w-12 h-12" />
                    </div>
                </div>
              )}

              {history.length === 0 ? (
                <div className="text-center py-10 text-slate-500">
                  <History className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p>Henüz kayıt bulunmuyor.</p>
                  <p className="text-xs mt-1">"Otomatik Haritala"yı açıp yürüyüşe çıkın.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {history.map(log => (
                    <div key={log.id} className="bg-brand-card p-4 rounded-lg border border-slate-700 flex justify-between items-center">
                      <div>
                        <div className="text-white font-bold">{new Date(log.timestamp).toLocaleTimeString()}</div>
                        <div className="text-xs text-slate-400">{log.lat.toFixed(4)}, {log.lng.toFixed(4)}</div>
                      </div>
                      <div className="flex items-center gap-2">
                         <span className="text-xs uppercase bg-slate-800 px-2 py-1 rounded text-slate-300">{log.type}</span>
                         <span className={`font-bold ${log.strength > 70 ? 'text-brand-success' : (log.strength > 40 ? 'text-brand-warning' : 'text-brand-danger')}`}>
                             %{Math.round(log.strength)}
                         </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
           </div>
        );
    }
  };

  return (
    <div className="min-h-screen pb-24 bg-brand-dark text-white font-sans selection:bg-brand-accent selection:text-brand-dark">
      <DiagnosticsModal 
        isOpen={showDiagnostics} 
        onClose={() => setShowDiagnostics(false)} 
        geoError={geoError}
      />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-brand-dark/80 backdrop-blur-md border-b border-slate-800 p-4 pt-safe flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 to-cyan-400 rounded-lg flex items-center justify-center">
            <Signal className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-lg font-bold tracking-tight">Sinyal<span className="text-brand-accent">Avcısı</span></h1>
        </div>
        <div className="flex items-center gap-2">
            <button 
                onClick={handleShare}
                className="p-2 rounded-full bg-slate-800 text-brand-accent hover:bg-slate-700 transition-colors"
            >
                <Share2 className="w-5 h-5" />
            </button>
            
            {location && (
            <div className="text-[10px] bg-slate-800 px-2 py-1 rounded-full text-slate-400 flex items-center gap-1">
                <Navigation className="w-3 h-3" />
                GPS
            </div>
            )}
            <button 
                onClick={() => setShowDiagnostics(true)}
                className={`p-2 rounded-full transition-colors ${geoError ? 'bg-brand-danger/20 text-brand-danger animate-pulse' : 'bg-slate-800 text-slate-400'}`}>
                <HelpCircle className="w-5 h-5" />
            </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 max-w-md mx-auto w-full">
        {renderContent()}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 w-full bg-brand-card/90 backdrop-blur-lg border-t border-slate-800 pb-safe pt-2 px-6">
        <div className="flex justify-between items-center max-w-md mx-auto h-16">
          <button 
            onClick={() => setActiveTab(AppTab.DASHBOARD)}
            className={`flex flex-col items-center gap-1 w-16 transition-all ${activeTab === AppTab.DASHBOARD ? 'text-brand-accent transform scale-110' : 'text-slate-500'}`}>
            <Signal className="w-6 h-6" />
            <span className="text-[10px]">Durum</span>
          </button>
          <button 
            onClick={() => setActiveTab(AppTab.RADAR)}
            className={`flex flex-col items-center gap-1 w-16 transition-all ${activeTab === AppTab.RADAR ? 'text-brand-accent transform scale-110' : 'text-slate-500'}`}>
            <Map className="w-6 h-6" />
            <span className="text-[10px]">Radar</span>
          </button>
          <button 
            onClick={() => setActiveTab(AppTab.ADVISOR)}
            className={`flex flex-col items-center gap-1 w-16 transition-all ${activeTab === AppTab.ADVISOR ? 'text-brand-accent transform scale-110' : 'text-slate-500'}`}>
            <Bot className="w-6 h-6" />
            <span className="text-[10px]">Asistan</span>
          </button>
          <button 
            onClick={() => setActiveTab(AppTab.HISTORY)}
            className={`flex flex-col items-center gap-1 w-16 transition-all ${activeTab === AppTab.HISTORY ? 'text-brand-accent transform scale-110' : 'text-slate-500'}`}>
            <History className="w-6 h-6" />
            <span className="text-[10px]">Geçmiş</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

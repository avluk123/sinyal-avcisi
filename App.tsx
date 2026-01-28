import React, { useState, useEffect, useRef } from 'react';
import { Signal, Map, Bot, History, Plus, Navigation, HelpCircle, Check, AlertTriangle, X } from 'lucide-react';
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
  
  // Updated advice state to hold structured data or null
  const [advice, setAdvice] = useState<AIAdviceResponse | null>(null);
  const [loadingAdvice, setLoadingAdvice] = useState<boolean>(false);
  const [history, setHistory] = useState<SignalLog[]>([]);
  
  // New States for Diagnostics
  const [showDiagnostics, setShowDiagnostics] = useState<boolean>(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  // Initialize Geolocation & Network Monitoring
  useEffect(() => {
    // 1. Geolocation
    if ('geolocation' in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
          setGeoError(null);
          // Simulate signal variation based on movement (just for demo effect)
          const randomFluctuation = Math.random() * 10 - 5;
          setSignalStrength(prev => Math.min(100, Math.max(0, 75 + randomFluctuation)));
        },
        (error) => {
          console.error("Geo Error", error);
          let errorMsg = "Konum alınamadı.";
          if (error.code === 1) errorMsg = "Konum izni reddedildi.";
          if (error.code === 2) errorMsg = "Konum servisi kapalı.";
          if (error.code === 3) errorMsg = "Konum isteği zaman aşımına uğradı.";
          
          setGeoError(errorMsg);
          // Automatically show diagnostics on permission error so user knows what to do
          if (error.code === 1) {
             setShowDiagnostics(true);
          }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
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

  // 3. Simulation Loop for Real-time feel
  useEffect(() => {
    const interval = setInterval(() => {
      setIsScanning(false);
      // Simulate ping fluctuation
      setLatency(Math.floor(20 + Math.random() * 40)); 
      // Simulate slight signal strength movement
      setSignalStrength(prev => {
        const move = Math.random() > 0.5 ? 1 : -1;
        let next = prev + move;
        if(next > 100) next = 100;
        if(next < 10) next = 10;
        return next;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleGetAdvice = async () => {
    if (!location) return;
    setLoadingAdvice(true);
    const adviceData = await getNetworkAdvice(
      location.latitude,
      location.longitude,
      signalStrength,
      networkInfo.effectiveType
    );
    setAdvice(adviceData);
    setLoadingAdvice(false);
  };

  const handleLogSignal = () => {
    if (!location) {
      setShowDiagnostics(true);
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
    alert("Sinyal verisi bu konum için kaydedildi!");
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
               <h3 className="text-white font-bold mb-2">Hızlı İşlemler</h3>
               <div className="grid grid-cols-2 gap-3">
                 <button 
                  onClick={handleLogSignal}
                  className="bg-brand-accent/10 hover:bg-brand-accent/20 text-brand-accent p-3 rounded-lg flex flex-col items-center justify-center transition-colors">
                    <Plus className="w-6 h-6 mb-1" />
                    <span className="text-xs font-semibold">Burayı Kaydet</span>
                 </button>
                 <button 
                  onClick={() => setActiveTab(AppTab.ADVISOR)}
                  className="bg-brand-warning/10 hover:bg-brand-warning/20 text-brand-warning p-3 rounded-lg flex flex-col items-center justify-center transition-colors">
                    <Bot className="w-6 h-6 mb-1" />
                    <span className="text-xs font-semibold">AI Analizi</span>
                 </button>
               </div>
            </div>
          </div>
        );
      case AppTab.RADAR:
        return (
          <div className="space-y-4 animate-fade-in">
            <RadarView location={location} />
            <div className="bg-brand-card p-4 rounded-xl border border-slate-700">
              <h3 className="text-white font-bold mb-2">Kapsama İpuçları</h3>
              <ul className="text-sm text-slate-400 space-y-2 list-disc list-inside">
                <li>Yüksek binalar sinyali engelleyebilir.</li>
                <li>Pencere kenarları genellikle daha iyi çeker.</li>
                <li>Radarda görünen en yakın istasyon yönüne dönün.</li>
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
                    className="w-full bg-brand-accent text-brand-dark font-bold py-3 px-6 rounded-lg hover:bg-opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                    {loadingAdvice ? 'Analiz Ediliyor...' : 'Konumu Analiz Et'}
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
        return (
           <div className="space-y-4 animate-fade-in">
              <h2 className="text-xl font-bold text-white px-2">Sinyal Geçmişi</h2>
              {history.length === 0 ? (
                <div className="text-center py-10 text-slate-500">
                  <History className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p>Henüz kayıt bulunmuyor.</p>
                  <p className="text-xs">İyi çektiği yerleri kaydetmek için ana ekrandan ekleme yapın.</p>
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
                         <span className={`font-bold ${log.strength > 50 ? 'text-brand-success' : 'text-brand-danger'}`}>%{Math.round(log.strength)}</span>
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
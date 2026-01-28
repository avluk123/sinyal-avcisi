import React, { useEffect, useState } from 'react';
import { LocationData } from '../types';
import { Radio, MapPin } from 'lucide-react';

interface RadarViewProps {
  location: LocationData | null;
}

const RadarView: React.FC<RadarViewProps> = ({ location }) => {
  const [towers, setTowers] = useState<{id: number, x: number, y: number, dist: string}[]>([]);

  // Generate mock nearby towers relative to center
  useEffect(() => {
    const mockTowers = [
      { id: 1, x: 30, y: 20, dist: '240m' },
      { id: 2, x: 70, y: 60, dist: '550m' },
      { id: 3, x: 20, y: 80, dist: '890m' },
    ];
    setTowers(mockTowers);
  }, []);

  if (!location) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-brand-card rounded-xl border border-slate-700 p-4 text-center">
        <MapPin className="w-12 h-12 text-slate-500 mb-2" />
        <p className="text-slate-400">Konum verisi bekleniyor...</p>
        <p className="text-xs text-slate-600 mt-2">GPS izni verdiğinizden emin olun.</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-brand-dark rounded-xl overflow-hidden border border-slate-700 relative">
      <div className="p-4 bg-brand-card border-b border-slate-700 flex justify-between items-center">
        <h2 className="font-bold text-white flex items-center gap-2">
          <Radio className="w-5 h-5 text-brand-accent" />
          Baz İstasyonu Radarı
        </h2>
        <span className="text-xs bg-brand-accent/20 text-brand-accent px-2 py-1 rounded">Aktif</span>
      </div>

      <div className="relative w-full aspect-square max-h-[400px] mx-auto bg-slate-900 overflow-hidden">
        {/* Grid Lines */}
        <div className="absolute inset-0 grid grid-cols-4 grid-rows-4">
            <div className="border-r border-slate-800/50"></div>
            <div className="border-r border-slate-800/50"></div>
            <div className="border-r border-slate-800/50"></div>
            <div className="border-r border-slate-800/50"></div>
            <div className="col-span-4 border-b border-slate-800/50 h-full"></div>
            <div className="col-span-4 border-b border-slate-800/50 h-full"></div>
            <div className="col-span-4 border-b border-slate-800/50 h-full"></div>
        </div>

        {/* Concentric Circles */}
        <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-[75%] h-[75%] rounded-full border border-slate-700/50"></div>
            <div className="absolute w-[50%] h-[50%] rounded-full border border-slate-700/50"></div>
            <div className="absolute w-[25%] h-[25%] rounded-full border border-slate-700/50"></div>
        </div>

        {/* Radar Sweep Animation */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-brand-accent/10 to-transparent animate-radar-spin rounded-full origin-center" 
             style={{ clipPath: 'polygon(50% 50%, 100% 0, 100% 50%)' }}>
        </div>

        {/* User Dot */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.8)] z-20">
            <div className="absolute w-full h-full bg-blue-400 rounded-full animate-ping opacity-75"></div>
        </div>

        {/* Mock Towers */}
        {towers.map(tower => (
            <div 
                key={tower.id}
                className="absolute flex flex-col items-center group z-10"
                style={{ top: `${tower.y}%`, left: `${tower.x}%` }}
            >
                <div className="w-3 h-3 bg-brand-warning rounded-full shadow-[0_0_10px_rgba(234,179,8,0.5)]"></div>
                <div className="bg-slate-800 text-[10px] px-1 rounded text-slate-300 mt-1 opacity-100">
                    Baz #{tower.id}
                </div>
            </div>
        ))}
      </div>
      
      <div className="p-3 bg-brand-card/50 text-xs text-slate-400 text-center">
        Konumunuza göre en yakın istasyonlar taranıyor (Simülasyon).
        <br/>
        En iyi sinyal için: <span className="text-white font-bold">Kuzey-Doğu</span> yönüne hareket edin.
      </div>
    </div>
  );
};

export default RadarView;
import React, { useEffect, useState } from 'react';
import { LocationData } from '../types';
import { Radio, MapPin, Compass, ArrowUp } from 'lucide-react';

interface RadarViewProps {
  location: LocationData | null;
  targetBearing: number | null; // 0-360 degrees, 0 is North
}

const RadarView: React.FC<RadarViewProps> = ({ location, targetBearing }) => {
  const [rotation, setRotation] = useState(0);

  // Animate compass rotation
  useEffect(() => {
    if (targetBearing !== null) {
      setRotation(targetBearing);
    }
  }, [targetBearing]);

  const getDirectionText = (bearing: number) => {
    if (bearing >= 337.5 || bearing < 22.5) return "Kuzey";
    if (bearing >= 22.5 && bearing < 67.5) return "Kuzeydoğu";
    if (bearing >= 67.5 && bearing < 112.5) return "Doğu";
    if (bearing >= 112.5 && bearing < 157.5) return "Güneydoğu";
    if (bearing >= 157.5 && bearing < 202.5) return "Güney";
    if (bearing >= 202.5 && bearing < 247.5) return "Güneybatı";
    if (bearing >= 247.5 && bearing < 292.5) return "Batı";
    if (bearing >= 292.5 && bearing < 337.5) return "Kuzeybatı";
    return "Bilinmiyor";
  };

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
          <Compass className="w-5 h-5 text-brand-accent" />
          Sinyal Pusulası
        </h2>
        <span className="text-xs bg-brand-accent/20 text-brand-accent px-2 py-1 rounded">Canlı</span>
      </div>

      <div className="relative w-full aspect-square max-h-[400px] mx-auto bg-slate-900 overflow-hidden flex items-center justify-center">
        {/* Grid Lines */}
        <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 opacity-20 pointer-events-none">
            <div className="border-r border-slate-500"></div>
            <div className="border-r border-slate-500"></div>
            <div className="border-r border-slate-500"></div>
            <div className="border-r border-slate-500"></div>
            <div className="col-span-4 border-b border-slate-500 h-full"></div>
            <div className="col-span-4 border-b border-slate-500 h-full"></div>
            <div className="col-span-4 border-b border-slate-500 h-full"></div>
        </div>

        {/* Compass Dial */}
        <div className="relative w-[80%] h-[80%] rounded-full border-2 border-slate-700 flex items-center justify-center shadow-2xl bg-slate-800/50 backdrop-blur-sm">
           {/* Cardinal Directions */}
           <div className="absolute top-2 text-slate-400 font-bold text-xs">N</div>
           <div className="absolute bottom-2 text-slate-400 font-bold text-xs">S</div>
           <div className="absolute left-2 text-slate-400 font-bold text-xs">W</div>
           <div className="absolute right-2 text-slate-400 font-bold text-xs">E</div>

           {/* Signal Arrow */}
           {targetBearing !== null && (
             <div 
               className="absolute w-full h-full transition-transform duration-1000 ease-out flex justify-center"
               style={{ transform: `rotate(${rotation}deg)` }}
             >
                <div className="flex flex-col items-center mt-4">
                    <ArrowUp className="w-12 h-12 text-brand-success drop-shadow-[0_0_10px_rgba(34,197,94,0.8)] animate-pulse" />
                    <div className="w-1 h-16 bg-gradient-to-b from-brand-success/50 to-transparent rounded-full mt-1"></div>
                </div>
             </div>
           )}

           {/* Center Dot (User) */}
           <div className="w-16 h-16 bg-slate-900 rounded-full border-4 border-slate-700 z-10 flex items-center justify-center shadow-inner">
              <Radio className="w-8 h-8 text-white" />
           </div>
        </div>
      </div>
      
      <div className="p-4 bg-brand-card/80 border-t border-slate-700 text-center">
        {targetBearing !== null ? (
            <div>
                <div className="text-xs text-slate-400 mb-1">En Güçlü Sinyal Yönü</div>
                <div className="text-xl font-bold text-brand-success flex items-center justify-center gap-2">
                    {getDirectionText(rotation)}
                    <span className="text-sm text-slate-500 font-normal">({Math.round(rotation)}°)</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-2">Bu yöne doğru hareket ederseniz sinyal artabilir.</p>
            </div>
        ) : (
            <p className="text-sm text-slate-400">Yön hesaplanıyor...</p>
        )}
      </div>
    </div>
  );
};

export default RadarView;

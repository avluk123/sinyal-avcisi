import React, { useEffect, useState } from 'react';
import { LocationData, BaseStation } from '../types';
import { Radio, MapPin, Compass, ArrowUp, TowerControl as Tower } from 'lucide-react';

interface RadarViewProps {
  location: LocationData | null;
  targetBearing: number | null;
  baseStations: BaseStation[];
}

const RadarView: React.FC<RadarViewProps> = ({ location, targetBearing, baseStations }) => {
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

  const getOperatorColor = (op: string) => {
    switch(op) {
      case 'Turkcell': return 'text-yellow-400';
      case 'Vodafone': return 'text-red-500';
      case 'Türk Telekom': return 'text-teal-400';
      default: return 'text-slate-400';
    }
  };

  const getOperatorBg = (op: string) => {
    switch(op) {
      case 'Turkcell': return 'bg-yellow-400';
      case 'Vodafone': return 'bg-red-500';
      case 'Türk Telekom': return 'bg-teal-400';
      default: return 'bg-slate-400';
    }
  };

  // Helper to place stations on the radar relative to center (user)
  const renderStations = () => {
    if (!location) return null;
    
    // Radar radius in degrees (approx)
    const rangeDegrees = 0.005; // roughly 500m radius visible

    return baseStations.map(station => {
      // Calculate relative position
      const dy = (station.lat - location.latitude) / rangeDegrees; // -1 to 1 vertical (North is +)
      const dx = (station.lng - location.longitude) / (rangeDegrees * Math.cos(location.latitude * Math.PI / 180)); // -1 to 1 horizontal (East is +)

      // Clamp to circle edge if outside range
      const distance = Math.sqrt(dx*dx + dy*dy);
      let renderX = dx;
      let renderY = dy;
      
      const isVisible = distance <= 1.0;
      
      if (!isVisible) {
          // Optional: Don't render or clamp to edge
          const angle = Math.atan2(dy, dx);
          renderX = Math.cos(angle);
          renderY = Math.sin(angle);
      }

      // Convert to % (Center is 50%, 50%)
      // Coordinate system: y goes up (North), x goes right (East).
      // CSS top/left: top is 0 (North), left is 0 (West).
      // So y=+1 should be top=0%, y=-1 should be top=100%
      // x=-1 should be left=0%, x=+1 should be left=100%
      
      const leftP = 50 + (renderX * 40); // 40 is scaling factor to keep inside padding
      const topP = 50 - (renderY * 40);

      return (
        <div 
            key={station.id}
            className="absolute flex flex-col items-center justify-center group z-20 transition-all duration-500"
            style={{ left: `${leftP}%`, top: `${topP}%` }}
        >
            <div className={`relative p-1.5 rounded-full bg-slate-900 border ${getOperatorColor(station.operator).replace('text', 'border')} shadow-lg`}>
                 <Tower className={`w-4 h-4 ${getOperatorColor(station.operator)}`} />
                 {/* Blinking indicator for active status */}
                 <div className={`absolute top-0 right-0 w-2 h-2 rounded-full ${getOperatorBg(station.operator)} animate-pulse`}></div>
            </div>
            {/* Tooltip */}
            <div className="absolute top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/90 text-[10px] px-2 py-1 rounded border border-slate-700 whitespace-nowrap z-30 pointer-events-none">
                <span className={`font-bold ${getOperatorColor(station.operator)}`}>{station.operator}</span>
                <br/>
                <span className="text-slate-400">{Math.round(station.distance)}m</span>
            </div>
        </div>
      );
    });
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
          Baz İstasyonları & Radar
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

        {/* Range Circles */}
        <div className="absolute w-[60%] h-[60%] rounded-full border border-slate-700/50 pointer-events-none"></div>
        <div className="absolute w-[30%] h-[30%] rounded-full border border-slate-700/30 pointer-events-none"></div>

        {/* Base Stations Layer */}
        <div className="absolute inset-0 w-full h-full">
            {renderStations()}
        </div>

        {/* Compass Dial & User */}
        <div className="relative w-[80%] h-[80%] rounded-full border-2 border-slate-700 flex items-center justify-center shadow-2xl pointer-events-none">
           {/* Cardinal Directions */}
           <div className="absolute top-2 text-slate-400 font-bold text-xs">N</div>
           <div className="absolute bottom-2 text-slate-400 font-bold text-xs">S</div>
           <div className="absolute left-2 text-slate-400 font-bold text-xs">W</div>
           <div className="absolute right-2 text-slate-400 font-bold text-xs">E</div>

           {/* Signal Arrow */}
           {targetBearing !== null && (
             <div 
               className="absolute w-full h-full transition-transform duration-1000 ease-out flex justify-center opacity-80"
               style={{ transform: `rotate(${rotation}deg)` }}
             >
                <div className="flex flex-col items-center mt-4">
                    <ArrowUp className="w-8 h-8 text-brand-success drop-shadow-[0_0_10px_rgba(34,197,94,0.8)] animate-pulse" />
                </div>
             </div>
           )}

           {/* Center Dot (User) */}
           <div className="w-12 h-12 bg-slate-900 rounded-full border-4 border-slate-600 z-10 flex items-center justify-center shadow-inner">
              <Radio className="w-6 h-6 text-white" />
           </div>
        </div>
      </div>
      
      {/* Legend */}
      <div className="p-3 bg-brand-card/80 border-t border-slate-700 flex justify-center gap-4 text-[10px] sm:text-xs">
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-yellow-400"></div>Turkcell</div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div>Vodafone</div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-teal-400"></div>Türk Telekom</div>
      </div>
    </div>
  );
};

export default RadarView;

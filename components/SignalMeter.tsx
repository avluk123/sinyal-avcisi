import React, { useEffect, useState, useRef } from 'react';

interface SignalMeterProps {
  strength: number; // 0 - 100
  isScanning: boolean;
}

const SignalMeter: React.FC<SignalMeterProps> = ({ strength, isScanning }) => {
  const [animating, setAnimating] = useState(false);
  const prevStrengthRef = useRef(strength);

  // Trigger animation when signal strength changes significantly
  useEffect(() => {
    if (Math.abs(strength - prevStrengthRef.current) > 2) {
      setAnimating(true);
      const timer = setTimeout(() => setAnimating(false), 700); // Animation duration
      prevStrengthRef.current = strength;
      return () => clearTimeout(timer);
    }
  }, [strength]);

  // Determine color and border configuration based on strength
  let colorClass = 'text-brand-danger';
  let borderClass = 'border-brand-danger';
  let label = 'Zayıf';
  let shadowColor = 'shadow-brand-danger/20';
  
  if (strength > 40) {
    colorClass = 'text-brand-warning';
    borderClass = 'border-brand-warning';
    shadowColor = 'shadow-brand-warning/20';
    label = 'Orta';
  }
  if (strength > 70) {
    colorClass = 'text-brand-success';
    borderClass = 'border-brand-success';
    shadowColor = 'shadow-brand-success/20';
    label = 'Güçlü';
  }

  // Calculate stroke dash for circle progress
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (strength / 100) * circumference;

  return (
    <div className={`relative flex flex-col items-center justify-center p-6 bg-brand-card rounded-2xl border border-slate-700 transition-shadow duration-500 ${animating ? `shadow-[0_0_30px_rgba(0,0,0,0)] ${shadowColor.replace('/20', '/40')}` : 'shadow-lg'}`}>
      
      {/* Dynamic Ripple Effect Background */}
      <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-40 h-40 rounded-full pointer-events-none overflow-visible">
        {animating && !isScanning && (
          <div className={`absolute inset-0 rounded-full border-4 ${borderClass} opacity-75 animate-ping`}></div>
        )}
      </div>

      <div className="relative w-40 h-40 z-10">
        {/* Background Circle */}
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 140 140">
          <circle
            className="text-slate-800"
            strokeWidth="8"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx="70"
            cy="70"
          />
          {/* Progress Circle */}
          <circle
            className={`${colorClass} transition-all duration-700 ease-out`}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx="70"
            cy="70"
          />
        </svg>
        
        {/* Center Text */}
        <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center">
          <span 
            className={`text-4xl font-bold ${colorClass} transition-transform duration-300 ${animating ? 'scale-110' : 'scale-100'}`}
          >
            {isScanning ? <span className="animate-pulse">...</span> : `${Math.round(strength)}%`}
          </span>
          <span className="text-slate-500 text-xs uppercase mt-1 font-medium tracking-widest">Kalite</span>
        </div>
      </div>
      
      <div className="mt-4 text-center z-10">
        <h3 className={`text-xl font-bold ${colorClass} transition-colors duration-500`}>{label}</h3>
        <p className="text-sm text-slate-400 mt-1 flex items-center gap-2 justify-center">
          {isScanning ? (
            'Ağ taranıyor...'
          ) : (
            <>
              <span className={`w-2 h-2 rounded-full ${colorClass.replace('text-', 'bg-')} animate-pulse`}></span>
              Canlı Analiz
            </>
          )}
        </p>
      </div>
    </div>
  );
};

export default SignalMeter;
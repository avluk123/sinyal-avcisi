import React from 'react';
import { NetworkInfo } from '../types';
import { Wifi, Smartphone, Activity, Clock } from 'lucide-react';

interface NetworkDetailsProps {
  info: NetworkInfo;
  latency: number;
}

const NetworkDetails: React.FC<NetworkDetailsProps> = ({ info, latency }) => {
  return (
    <div className="grid grid-cols-2 gap-3 w-full">
      <div className="bg-brand-card p-4 rounded-xl border border-slate-700 flex flex-col items-start">
        <div className="flex items-center gap-2 mb-2 text-slate-400 text-xs uppercase tracking-wider">
          {info.type === 'wifi' ? <Wifi className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
          Bağlantı Türü
        </div>
        <div className="text-xl font-bold text-white uppercase">
          {info.effectiveType || 'Bilinmiyor'}
        </div>
        <div className="text-xs text-brand-accent mt-1 capitalize">
          {info.type === 'cellular' ? 'Hücresel Veri' : info.type}
        </div>
      </div>

      <div className="bg-brand-card p-4 rounded-xl border border-slate-700 flex flex-col items-start">
        <div className="flex items-center gap-2 mb-2 text-slate-400 text-xs uppercase tracking-wider">
            <Clock className="w-4 h-4" />
            Gecikme (Ping)
        </div>
        <div className={`text-xl font-bold ${latency < 100 ? 'text-brand-success' : 'text-brand-warning'}`}>
          {latency} ms
        </div>
        <div className="text-xs text-slate-500 mt-1">
          Tahmini Değer
        </div>
      </div>

      <div className="bg-brand-card p-4 rounded-xl border border-slate-700 flex flex-col items-start col-span-2">
        <div className="flex items-center gap-2 mb-2 text-slate-400 text-xs uppercase tracking-wider">
            <Activity className="w-4 h-4" />
            İndirme Hızı Kapasitesi
        </div>
        <div className="flex items-end gap-2">
            <span className="text-2xl font-bold text-white">
                {info.downlink ? info.downlink : '-'} 
            </span>
            <span className="text-sm text-slate-400 mb-1">Mb/s (Referans)</span>
        </div>
        <div className="w-full bg-slate-700 h-1.5 rounded-full mt-3 overflow-hidden">
            <div 
                className="bg-brand-accent h-full rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(((info.downlink || 0) / 20) * 100, 100)}%` }}
            ></div>
        </div>
      </div>
    </div>
  );
};

export default NetworkDetails;
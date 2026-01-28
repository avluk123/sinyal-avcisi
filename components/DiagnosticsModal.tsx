import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Settings, RefreshCw, X, Lock } from 'lucide-react';

interface DiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  geoError: string | null;
}

const DiagnosticsModal: React.FC<DiagnosticsModalProps> = ({ isOpen, onClose, geoError }) => {
  const [online, setOnline] = useState(navigator.onLine);
  const [permissionState, setPermissionState] = useState<PermissionState | 'unknown'>('unknown');
  const [isSecure, setIsSecure] = useState(true);

  useEffect(() => {
    // Check Secure Context (Required for Geolocation on mobile)
    setIsSecure(window.isSecureContext);

    // Check connection status
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check Permissions API (if supported)
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' })
        .then((result) => {
          setPermissionState(result.state);
          result.onchange = () => {
            setPermissionState(result.state);
          };
        })
        .catch(() => setPermissionState('unknown'));
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOpen) return null;

  const StatusRow = ({ label, status, detail }: { label: string, status: 'ok' | 'error' | 'warning', detail?: string }) => (
    <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700">
      <div className="flex items-center gap-3">
        {status === 'ok' && <CheckCircle2 className="w-5 h-5 text-brand-success" />}
        {status === 'error' && <XCircle className="w-5 h-5 text-brand-danger" />}
        {status === 'warning' && <AlertTriangle className="w-5 h-5 text-brand-warning" />}
        <span className="text-sm font-medium text-slate-200">{label}</span>
      </div>
      <div className="text-xs text-slate-400 max-w-[120px] text-right">{detail}</div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-brand-card w-full max-w-sm rounded-2xl border border-slate-600 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-brand-accent" />
            Sistem Kontrolü
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-700 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          <p className="text-sm text-slate-400 mb-2">
            Uygulamanın düzgün çalışması için aşağıdaki servislerin açık olması GEREKLİDİR.
          </p>

          <StatusRow 
            label="İnternet Bağlantısı" 
            status={online ? 'ok' : 'error'} 
            detail={online ? 'Bağlı' : 'Çevrimdışı'} 
          />

          <StatusRow 
            label="Güvenli Bağlantı (HTTPS)" 
            status={isSecure ? 'ok' : 'error'} 
            detail={isSecure ? 'Güvenli' : 'Güvenli Değil'} 
          />

          <StatusRow 
            label="GPS İzni" 
            status={permissionState === 'granted' ? 'ok' : (permissionState === 'denied' || geoError ? 'error' : 'warning')} 
            detail={permissionState === 'granted' ? 'İzin Verildi' : (permissionState === 'denied' ? 'Reddedildi' : 'Bekleniyor')} 
          />

          {!isSecure && (
             <div className="bg-brand-danger/10 border border-brand-danger/20 p-3 rounded-lg mt-4">
               <h4 className="text-brand-danger font-bold text-sm mb-1 flex items-center gap-1">
                 <Lock className="w-4 h-4" />
                 HTTPS Gerekli
               </h4>
               <p className="text-xs text-slate-300 leading-relaxed">
                 Mobil cihazlarda GPS, sadece <strong>HTTPS</strong> veya <strong>localhost</strong> üzerinden çalışır. Yerel IP (192.168.x.x) ile test ediyorsanız GPS çalışmaz.
                 <br/><br/>
                 <strong>Çözüm:</strong> Projeyi Vercel/Netlify'a yükleyin veya güvenli tünel (ngrok) kullanın.
               </p>
             </div>
          )}

          {(permissionState === 'denied' || geoError) && isSecure && (
            <div className="bg-brand-danger/10 border border-brand-danger/20 p-3 rounded-lg mt-4">
              <h4 className="text-brand-danger font-bold text-sm mb-1 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" />
                Dikkat: Konum Kapalı
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Bu uygulama sinyal analizi yapmak için konumunuza ihtiyaç duyar.
                <br/><br/>
                <strong>Düzeltmek için:</strong>
                <ol className="list-decimal list-inside mt-1 ml-1 space-y-1">
                  <li>Tarayıcı ayarlarına gidin.</li>
                  <li>Site Ayarları > Konum seçeneğini bulun.</li>
                  <li>Bu site için "İzin Ver"i seçin veya sıfırlayın.</li>
                  <li>Sayfayı yenileyin.</li>
                </ol>
              </p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-700 bg-slate-900/30">
          <button 
            onClick={() => window.location.reload()}
            className="w-full bg-slate-700 hover:bg-slate-600 text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2 transition-colors">
            <RefreshCw className="w-4 h-4" />
            Sayfayı Yenile
          </button>
        </div>
      </div>
    </div>
  );
};

export default DiagnosticsModal;
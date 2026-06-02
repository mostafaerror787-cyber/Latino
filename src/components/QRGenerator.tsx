import { QrCode, ExternalLink, RefreshCw, Copy, Check } from "lucide-react";
import { useState, useEffect } from "react";

interface QRGeneratorProps {
  onSelectTable: (tableId: string) => void;
}

export default function QRGenerator({ onSelectTable }: QRGeneratorProps) {
  const [currentUrl, setCurrentUrl] = useState("");
  const [copiedTable, setCopiedTable] = useState<string | null>(null);

  useEffect(() => {
    // Dynamically retrieve the exact correct URL of the live applet at runtime
    setCurrentUrl(window.location.origin);
  }, []);

  const tables = [
    { id: "1", name: "Table 1", arabic: "طاولة ١", color: "from-amber-600 to-amber-700" },
    { id: "2", name: "Table 2", arabic: "طاولة ٢", color: "from-amber-700 to-amber-800" },
    { id: "3", name: "Table 3", arabic: "طاولة ٣", color: "from-amber-800 to-stone-800" },
    { id: "4", name: "Table 4", arabic: "طاولة ٤", color: "from-stone-800 to-stone-900" },
    { id: "5", name: "Table 5", arabic: "طاولة ٥", color: "from-yellow-700 to-amber-800" },
  ];

  const getTableUrl = (tableId: string) => {
    return `${currentUrl || "http://localhost:3000"}?table=${tableId}`;
  };

  const copyToClipboard = (tableId: string) => {
    const url = getTableUrl(tableId);
    navigator.clipboard.writeText(url).then(() => {
      setCopiedTable(tableId);
      setTimeout(() => setCopiedTable(null), 2000);
    });
  };

  return (
    <div className="glass-panel rounded-3xl p-6 shadow-2xl flex flex-col h-full relative z-10 overflow-hidden">
      {/* Small background highlight inside panel */}
      <div className="absolute -top-12 -right-12 w-28 h-28 bg-amber-600/10 rounded-full blur-2xl pointer-events-none"></div>

      <div className="flex items-center gap-3 mb-4 relative z-10">
        <div className="p-2.5 bg-amber-600/20 border border-amber-600/30 rounded-xl text-amber-500">
          <QrCode className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-cairo font-bold text-lg text-white">طاولات الكافيه & رمز الـ QR</h2>
          <p className="text-xs text-zinc-400 font-sans mt-0.5">Scan from phone or launch virtual phone below</p>
        </div>
      </div>

      <div className="text-sm bg-amber-600/10 border border-amber-600/20 rounded-2xl p-4 text-amber-200 font-cairo mb-6 leading-relaxed relative z-10">
        💡 <strong className="font-bold text-amber-400">كيف تعمل الخدمة؟</strong> في الحقيقة، يوضع ملصق <span className="font-bold text-amber-300">QR</span> فريد على كل طاولة. عندما يقوم العميل بمسحه بكاميرا هاتفه، يتم نقله تلقائياً لصفحة الطلب الخاصة بطاولته، ويصل الطلب فوراً للمطبخ مع تحديد رقم الطاولة بشكل دقيق دون أي التباس!
      </div>

      <div className="space-y-4 overflow-y-auto max-h-[480px] pr-1 flex-1 relative z-10">
        {tables.map((table) => {
          const tableUrl = getTableUrl(table.id);
          const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(tableUrl)}&color=000000&bgcolor=ffffff&margin=10`;

          return (
            <div 
              key={table.id}
              className="bg-white/5 hover:bg-white/10 transition-all border border-white/10 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between"
            >
              {/* QR Code Graphic inside high-contrast white card sticker */}
              <div className="relative group flex-shrink-0 bg-white border border-white/10 p-2.5 rounded-2xl transition-all hover:border-amber-500 hover:scale-105 shadow-lg">
                <img 
                  src={qrImageUrl} 
                  alt={`QR for ${table.name}`}
                  className="w-24 h-24 rounded-lg object-contain bg-white"
                  referrerPolicy="no-referrer"
                  title="Scan with your phone!"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity rounded-2xl">
                  <span className="bg-amber-600 text-[10px] font-bold px-1.5 py-0.5 rounded shadow text-white">Scan Me!</span>
                </div>
              </div>

              {/* Table Info & Links */}
              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row items-center gap-1.5 justify-center md:justify-start">
                  <span className="font-cairo font-bold text-lg text-white">{table.arabic}</span>
                  <span className="text-zinc-600 hidden md:inline">•</span>
                  <span className="text-sm text-zinc-400 font-sans">{table.name}</span>
                </div>
                
                <p className="text-[11px] text-zinc-500 truncate max-w-[200px] mt-1 font-mono hover:text-zinc-300 cursor-help" title={tableUrl}>
                  {currentUrl ? `?table=${table.id}` : "detecting..."}
                </p>

                <div className="flex items-center gap-2 mt-3.5 justify-center md:justify-start">
                  {/* Simulate Ordering */}
                  <button
                    onClick={() => onSelectTable(table.id)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-cairo font-semibold cursor-pointer transition-all shadow-md hover:shadow-amber-900/40"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    اطلب من هذه الطاولة
                  </button>

                  {/* Copy Link */}
                  <button
                    onClick={() => copyToClipboard(table.id)}
                    className="p-2 bg-white/5 hover:bg-white/10 text-white rounded-lg border border-white/10 cursor-pointer transition-colors"
                    title="انسخ رابط الطاولة"
                  >
                    {copiedTable === table.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-zinc-400" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-white/10 mt-4 pt-4 text-center relative z-10">
        <span className="text-[11px] text-zinc-500 font-sans flex items-center justify-center gap-1">
          <RefreshCw className="w-3 h-3 animate-spin text-amber-500" /> QR automatically matches live preview domain.
        </span>
      </div>
    </div>
  );
}

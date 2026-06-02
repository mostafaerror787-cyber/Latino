import React, { useState, useEffect } from "react";
import { Order, MenuItem } from "../types";
import { 
  Bell, 
  BellRing, 
  Clock, 
  CheckCircle2, 
  Flame, 
  Utensils, 
  Trash2, 
  Coffee, 
  AlertTriangle,
  Volume2,
  VolumeX,
  RotateCcw,
  Plus,
  X,
  PlusCircle,
  FolderPlus,
  Eye,
  Settings
} from "lucide-react";

interface KitchenDashboardProps {
  orders: Order[];
  onUpdateStatus: (id: string, newStatus: Order["status"]) => void;
  onResetDemo: () => void;
  newOrderAlert: boolean;
  onClearAlert: () => void;
  menuItems?: MenuItem[];
  onAddMenuItem?: (itemData: any) => Promise<boolean>;
  onDeleteMenuItem?: (id: string) => Promise<boolean>;
}

export default function KitchenDashboard({ 
  orders, 
  onUpdateStatus, 
  onResetDemo, 
  newOrderAlert, 
  onClearAlert,
  menuItems = [],
  onAddMenuItem,
  onDeleteMenuItem
}: KitchenDashboardProps) {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [now, setNow] = useState(Date.now());
  
  // Tab controller
  const [activeTab, setActiveTab] = useState<"orders" | "menu">("orders");
  const [showAddForm, setShowAddForm] = useState(false);

  // Form states
  const [newItemName, setNewItemName] = useState("");
  const [newItemNameAr, setNewItemNameAr] = useState("");
  const [newItemCategory, setNewItemCategory] = useState<"coffee" | "tea_matcha" | "sweets" | "mojitos_cold">("coffee");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [newItemDesc, setNewItemDesc] = useState("");
  const [newItemDescAr, setNewItemDescAr] = useState("");
  const [newItemImage, setNewItemImage] = useState("https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=500");
  const [hasSizes, setHasSizes] = useState(true);
  const [hasSugar, setHasSugar] = useState(true);
  const [hasMilk, setHasMilk] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ status: "success" | "error"; text: string } | null>(null);

  // Tick elapsed timers every 10 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  // Use Web Audio API to play a sweet restaurant kitchen bell on new order
  useEffect(() => {
    if (newOrderAlert && soundEnabled) {
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        // Cozy bell sound chime
        const playTone = (freq: number, start: number, duration: number) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, start);
          
          gain.gain.setValueAtTime(0.3, start);
          gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
          
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          
          osc.start(start);
          osc.stop(start + duration);
        };

        // Arpeggio chime
        playTone(523.25, audioCtx.currentTime, 0.4); // C5
        playTone(659.25, audioCtx.currentTime + 0.12, 0.4); // E5
        playTone(783.99, audioCtx.currentTime + 0.24, 0.6); // G5

        onClearAlert();
      } catch (e) {
        console.warn("Audio context chime failed:", e);
      }
    }
  }, [newOrderAlert, soundEnabled, onClearAlert]);

  // Compute stats
  const activeOrders = orders.filter(o => o.status !== "completed" && o.status !== "cancelled");
  const pendingCount = orders.filter(o => o.status === "pending").length;
  const preparingCount = orders.filter(o => o.status === "preparing").length;
  const readyCount = orders.filter(o => o.status === "ready").length;

  // Render elapsed time string helper
  const getElapsedMinutesStr = (isoString: string) => {
    const created = new Date(isoString).getTime();
    const elapsedMs = now - created;
    const mins = Math.max(0, Math.floor(elapsedMs / (1000 * 60)));
    
    if (mins < 1) return "الآن / Just now";
    return `${mins} دقيقة مضت / ${mins}m ago`;
  };

  const getTimerSeverityColor = (isoString: string, status: string) => {
    if (status === "ready") return "text-emerald-400 bg-emerald-600/10 border border-emerald-500/20";
    const created = new Date(isoString).getTime();
    const mins = Math.floor((now - created) / (1000 * 60));
    if (mins > 10) return "text-red-400 bg-red-650/20 border border-red-500/35 animate-pulse pb-1";
    if (mins > 5) return "text-amber-400 bg-amber-655/15 border border-amber-500/25";
    return "text-zinc-400 bg-white/5 border border-white/5";
  };

  const handleAddNewItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName || !newItemNameAr || !newItemPrice) {
      setFeedbackMsg({ status: "error", text: "الرجاء كتابة اسم المنتج بالعربي والإنجليزي وتحديد السعر" });
      return;
    }
    
    setIsSubmitting(true);
    setFeedbackMsg(null);

    const options: MenuItem["options"] = {};
    if (hasSizes) {
      options.sizes = newItemCategory === "coffee" ? ["Medium", "Large"] : ["Regular", "Large"];
    }
    if (hasSugar) {
      options.sugarLevels = ["No Sugar", "Medium Sugar", "Extra Sugar"];
    }
    if (hasMilk) {
      options.milkTypes = ["Regular Milk", "Oat Milk (+10)", "Almond Milk (+10)"];
    }

    const payload = {
      name: newItemName,
      nameAr: newItemNameAr,
      category: newItemCategory,
      price: Number(newItemPrice),
      description: newItemDesc,
      descriptionAr: newItemDescAr,
      image: newItemImage,
      options
    };

    if (onAddMenuItem) {
      const success = await onAddMenuItem(payload);
      if (success) {
        setFeedbackMsg({ status: "success", text: "تم إضافة المنتج الجديد بنجاح للمنيو!" });
        // Reset form
        setNewItemName("");
        setNewItemNameAr("");
        setNewItemPrice("");
        setNewItemDesc("");
        setNewItemDescAr("");
        setTimeout(() => {
          setShowAddForm(false);
          setFeedbackMsg(null);
        }, 1500);
      } else {
        setFeedbackMsg({ status: "error", text: "عذراً فشل إضافة المنتج. يرجى المحاولة لاحقاً." });
      }
    }
    setIsSubmitting(false);
  };

  return (
    <div className="glass-panel rounded-3xl p-6 shadow-2xl flex flex-col h-full font-sans relative z-10 overflow-hidden">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-white/10 pb-5 mb-5 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-amber-600 text-white rounded-xl shadow-md">
              <Utensils className="w-5 h-5" />
            </span>
            <h2 className="font-cairo font-bold text-lg text-white">شاشة مراقبة المطبخ وبوردة التحضير (Barista Display)</h2>
          </div>
          <p className="text-xs text-zinc-400 font-sans mt-1">
            Real-time live kitchen terminal, auto-updates on client checkout.
          </p>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {/* Chime toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-cairo cursor-pointer font-semibold transition-all border ${
              soundEnabled 
                ? "bg-amber-600/20 border-amber-600/30 text-amber-300 shadow-sm" 
                : "bg-white/5 border-white/10 text-zinc-500"
            }`}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            {soundEnabled ? "جرس تنبيه طنين" : "مكتوم"}
          </button>

          {/* Reset button */}
          <button
            onClick={onResetDemo}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg text-xs font-cairo cursor-pointer font-semibold transition-all"
            title="إعادة ضبط البيانات التجريبية"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
            تصفير البورد والتجربة
          </button>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5 max-w-sm mb-6 relative z-10 font-cairo">
        <button
          onClick={() => setActiveTab("orders")}
          className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === "orders"
              ? "bg-amber-600 text-white shadow-lg"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          📋 الطلبات الواردة ({activeOrders.length})
        </button>
        <button
          onClick={() => setActiveTab("menu")}
          className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === "menu"
              ? "bg-amber-600 text-white shadow-lg"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          ☕ المنيو والمنتجات ({menuItems.length})
        </button>
      </div>

      {activeTab === "orders" ? (
        <>
          {/* Stats Board */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            <div className="bg-white/5 border border-white/5 rounded-xl p-3 text-center">
              <span className="text-[10px] text-zinc-400 font-cairo block">الطلبات النشطة</span>
              <span className="font-mono text-xl font-extrabold text-white">{activeOrders.length}</span>
            </div>
            <div className="bg-amber-600/10 border border-amber-500/25 rounded-xl p-3 text-center">
              <span className="text-[10px] text-amber-400 font-cairo block">قيد الانتظار</span>
              <span className="font-mono text-xl font-extrabold text-amber-300">{pendingCount}</span>
            </div>
            <div className="bg-blue-600/10 border border-blue-500/25 rounded-xl p-3 text-center">
              <span className="text-[10px] text-blue-400 font-cairo block">يتبخر بالنار</span>
              <span className="font-mono text-xl font-extrabold text-blue-300">{preparingCount}</span>
            </div>
            <div className="bg-emerald-600/10 border border-emerald-500/25 rounded-xl p-3 text-center">
              <span className="text-[10px] text-emerald-400 font-cairo block">تنتظر النداء</span>
              <span className="font-mono text-xl font-extrabold text-emerald-300">{readyCount}</span>
            </div>
          </div>

          {/* Orders Work Area (Scrollable Columns or unified list) */}
          <div className="flex-1 overflow-y-auto pr-1">
            {activeOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center h-[320px] bg-white/2 rounded-2xl border border-dashed border-white/10">
                <Coffee className="w-10 h-10 text-zinc-650 animate-bounce mb-3 text-amber-600/60" />
                <h3 className="font-cairo font-bold text-zinc-350 text-sm">البورد فارغ بالكامل (لا توجد طلبات معلقة)</h3>
                <p className="text-xs text-zinc-500 font-sans mt-1">Scan the QR code and submit an order on your phone to see it appear live.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeOrders.map((order) => (
                  <div 
                    key={order.id}
                    className={`glass-card rounded-2xl border shadow-md p-4 flex flex-col justify-between transition-all ${
                      order.status === "pending" 
                        ? "border-l-4 border-l-amber-500 border-white/10" 
                        : order.status === "preparing" 
                          ? "border-l-4 border-l-blue-500 border-white/10 animate-[pulse_3.s_infinite]" 
                          : "border-l-4 border-l-emerald-500 border-white/10"
                    }`}
                  >
                    {/* ID and Table indicators */}
                    <div>
                      <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-mono bg-amber-600/20 border border-amber-600/30 text-amber-400 font-extrabold px-2.5 py-1 rounded-lg">
                            #{order.id}
                          </span>
                          <span className="text-xs font-cairo font-extrabold bg-amber-600 text-white px-2 py-0.5 rounded-md">
                            طاولة {order.tableNumber}
                          </span>
                        </div>

                        {/* Timer */}
                        <span className={`text-[10px] font-mono px-2 py-1 rounded-md flex items-center gap-1 font-semibold ${getTimerSeverityColor(order.createdAt, order.status)}`}>
                          <Clock className="w-3 h-3" />
                          {getElapsedMinutesStr(order.createdAt)}
                        </span>
                      </div>

                      {/* Customer title */}
                      <div className="text-xs font-cairo mb-3 text-zinc-400 flex justify-between">
                        <span>العميل: <strong className="text-white font-bold">{order.customerName}</strong></span>
                      </div>

                      {/* Ordered drinks list */}
                      <div className="space-y-3 mb-5">
                        {order.items.map((item, index) => (
                          <div key={index} className="text-xs font-cairo text-zinc-350 bg-white/5 p-2.5 rounded-xl border border-white/5 flex flex-col justify-between">
                            <div className="flex justify-between font-bold items-start">
                              <span className="text-white flex items-center gap-1 text-[13px]">
                                ☕ {item.nameAr} <span className="font-mono text-amber-500 font-semibold">({item.quantity}x)</span>
                              </span>
                            </div>
                            <span className="text-[10px] text-zinc-500 font-sans mt-0.5">{item.name}</span>

                            {/* Modifiers blocks */}
                            {(item.size || item.sugar || item.milk) && (
                              <div className="flex flex-wrap gap-1 mt-2 border-t border-white/10 pt-1.5">
                                {item.size && (
                                  <span className="text-[9px] bg-white/10 text-zinc-200 px-1.5 rounded font-semibold">
                                    {item.size === "Medium" ? "وسط" : item.size === "Large" ? "كبير" : item.size === "Double" ? "دبل" : item.size}
                                  </span>
                                )}
                                {item.sugar && (
                                  <span className="text-[9px] bg-amber-600/20 text-amber-300 px-1.5 rounded font-semibold">
                                    {item.sugar === "No Sugar" ? "بدون سكر" : item.sugar === "Medium Sugar" ? "سكر مضبوط" : "سكر زيادة"}
                                  </span>
                                )}
                                {item.milk && (
                                  <span className="text-[9px] bg-blue-600/20 text-blue-300 px-1.5 rounded font-semibold">
                                    {item.milk.includes("Oat") ? "حليب شوفان" : item.milk.includes("Almond") ? "حليب لوز" : "حليب عادي"}
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Item Specific notes */}
                            {item.notes && (
                              <div className="mt-2 text-[10px] text-amber-200 font-semibold bg-amber-600/15 p-1.5 rounded border border-amber-600/30 flex items-start gap-1">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                                <span>طلب الباريستا: {item.notes}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* State action buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => onUpdateStatus(order.id, "cancelled")}
                        className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer border border-white/10 hover:border-red-500/30"
                        title="إلغاء الطلب / Cancel Order"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="flex-1">
                        {order.status === "pending" && (
                          <button
                            onClick={() => onUpdateStatus(order.id, "preparing")}
                            className="w-full bg-amber-600 hover:bg-amber-500 text-white font-cairo font-semibold text-xs py-2 px-3 rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-1 shadow-amber-900/40"
                          >
                            <Flame className="w-4 h-4" />
                            ابدأ التحضير / Cook Now
                          </button>
                        )}

                        {order.status === "preparing" && (
                          <button
                            onClick={() => onUpdateStatus(order.id, "ready")}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-cairo font-semibold text-xs py-2 px-3 rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-1 shadow-blue-900/45 animate-pulse"
                          >
                            <Bell className="w-4 h-4" />
                            جاهز للاستلام / Set Ready
                          </button>
                        )}

                        {order.status === "ready" && (
                          <button
                            onClick={() => onUpdateStatus(order.id, "completed")}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-cairo font-semibold text-xs py-2 px-3 rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-1 shadow-emerald-950/40"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            تسليم العميل / Finished
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        /* MENU & PRODUCTS ADMINISTRATION TAB */
        <div className="flex-1 overflow-y-auto pr-1 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/2 border border-white/10 p-5 rounded-2xl">
            <div>
              <h3 className="font-cairo font-bold text-base text-amber-400 flex items-center gap-2">
                ☕ قائمة منيو مشروبات Mostafa Coffee Shop
              </h3>
              <p className="text-xs text-zinc-400 font-sans mt-0.5 leading-relaxed">
                يمكن للباريستا إضافة منتجات باردة أو ساخنة جديدة، أو حذفها نهائياً. التعديلات تنعكس في المنيو الخاص بالزبائن فورا عبر الـ QR!
              </p>
            </div>
            <button
              onClick={() => {
                setShowAddForm(!showAddForm);
                setFeedbackMsg(null);
              }}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-cairo font-bold text-xs rounded-xl cursor-pointer transition-all shadow-md shrink-0 self-start sm:self-center"
            >
              {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {showAddForm ? "إغلاق النموذج" : "إضافة منتج جديد ➕"}
            </button>
          </div>

          {/* Form to Add New Product - Gorgeous Accordion Card */}
          {showAddForm && (
            <form onSubmit={handleAddNewItemSubmit} className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-4 animate-fade-in relative">
              <h4 className="font-cairo font-bold text-sm text-amber-400 border-b border-white/5 pb-2">
                ✍️ استمارة إضافة مشروب أو حلى جديد للمنيو:
              </h4>

              {feedbackMsg && (
                <div className={`p-3 rounded-xl font-cairo text-xs leading-relaxed border ${
                  feedbackMsg.status === "success" 
                    ? "bg-emerald-600/20 border-emerald-500/30 text-emerald-300"
                    : "bg-red-600/20 border-red-500/30 text-red-300"
                }`}>
                  {feedbackMsg.text}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Arabic details */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] text-zinc-400 font-cairo mb-1 font-bold">اسم المنتج باللغة العربية: *</label>
                    <input 
                      type="text" 
                      placeholder="مثال: سبانش لاتيه مثلج"
                      value={newItemNameAr}
                      onChange={(e) => setNewItemNameAr(e.target.value)}
                      className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs font-cairo text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-400 font-cairo mb-1">وصف المنتج (عربي):</label>
                    <textarea 
                      placeholder="مثال: حليب بليند مع الحليب المكثف المحلى والثلج وإسبريسو موكا الفاخر"
                      value={newItemDescAr}
                      onChange={(e) => setNewItemDescAr(e.target.value)}
                      rows={2}
                      className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs font-cairo text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* English details */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] text-zinc-400 font-cairo mb-1 font-bold">اسم المنتج بالإنجليزية (English Name): *</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Spanish Iced Latte"
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-400 font-cairo mb-1">وصف المنتج بالإنجليزية (English Desc):</label>
                    <textarea 
                      placeholder="e.g. Real condensed sweet milk whisked with rich espresso and cold milk layered."
                      value={newItemDesc}
                      onChange={(e) => setNewItemDesc(e.target.value)}
                      rows={2}
                      className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-white/5 pt-4">
                {/* Category selector */}
                <div>
                  <label className="block text-[11px] text-zinc-400 font-cairo mb-1 font-bold">تصنيف المنتج: *</label>
                  <select
                    value={newItemCategory}
                    onChange={(e: any) => setNewItemCategory(e.target.value)}
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs font-cairo text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="coffee">قهوة ساخنة (Hot Coffee)</option>
                    <option value="tea_matcha">شاي وماتشا (Tea & Matcha)</option>
                    <option value="sweets">حلويات ومخبوزات (Sweets & Bakery)</option>
                    <option value="mojitos_cold">موخيتو ومبردات (Mojitos & Cold)</option>
                  </select>
                </div>

                {/* Price */}
                <div>
                  <label className="block text-[11px] text-zinc-400 font-cairo mb-1 font-bold">السعر بالجنيه المصري (EGP): *</label>
                  <input 
                    type="number" 
                    placeholder="مثال: 60"
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(e.target.value)}
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Custom Image presets */}
                <div>
                  <label className="block text-[11px] text-zinc-400 font-cairo mb-1 font-bold">صورة المشروب جاهزة (Photo):</label>
                  <input 
                    type="text" 
                    placeholder="رابط الصورة الحرة"
                    value={newItemImage}
                    onChange={(e) => setNewItemImage(e.target.value)}
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 mb-2"
                  />
                  
                  {/* Presets labels strip */}
                  <div className="flex flex-wrap gap-1">
                    {[
                      { name: "☕ قهوة", url: "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=500" },
                      { name: "🍵 ماتشا", url: "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&q=80&w=500" },
                      { name: "🍰 حلويات", url: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&q=80&w=500" },
                      { name: "🍹 موخيتو", url: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=500" },
                    ].map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => setNewItemImage(preset.url)}
                        className={`px-1.5 py-0.5 rounded text-[9px] font-cairo transition-all border ${
                          newItemImage === preset.url 
                            ? "bg-amber-600 border-amber-500 text-white" 
                            : "bg-white/5 border-white/10 text-zinc-400 hover:text-white pointer-events-auto"
                        }`}
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Extras options modifiers checkboxes */}
              <div className="bg-white/2 border border-white/5 rounded-xl p-4 space-y-2.5">
                <span className="block text-[11px] text-zinc-400 font-cairo font-bold mb-1">الخيارات والإضافات المتاحة للزبون عند طلب هذا المنتج:</span>
                
                <div className="flex flex-wrap gap-6">
                  <label className="flex items-center gap-2 text-xs font-cairo text-zinc-300 cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={hasSizes} 
                      onChange={(e) => setHasSizes(e.target.checked)}
                      className="rounded border-zinc-700 bg-zinc-900 text-amber-600 focus:ring-amber-500/50"
                    />
                    <span>أحجام المشروب (وسط / كبير - Medium / Large)</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-cairo text-zinc-300 cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={hasSugar} 
                      onChange={(e) => setHasSugar(e.target.checked)}
                      className="rounded border-zinc-700 bg-zinc-900 text-amber-600 focus:ring-amber-500/50"
                    />
                    <span>اختيار السكر (سكر زيادة / مضبوط / بدون سكر)</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-cairo text-zinc-300 cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={hasMilk} 
                      onChange={(e) => setHasMilk(e.target.checked)}
                      className="rounded border-zinc-700 bg-zinc-900 text-amber-600 focus:ring-amber-500/50"
                    />
                    <span>بدائل الحليب للنكهة (شوفان / لوز / عادي)</span>
                  </label>
                </div>
              </div>

              {/* Submit Product Action Button */}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 active:scale-95 text-white font-cairo font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <PlusCircle className="w-4 h-4" />
                  {isSubmitting ? "جاري الإضافة..." : "حفظ المنتج وإضافته فوراً للمنيو"}
                </button>
              </div>
            </form>
          )}

          {/* Current menu items lists */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {menuItems.map((item) => (
              <div key={item.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex gap-3 relative hover:border-amber-500/20 transition-all group">
                
                {/* Product thumbnail */}
                <div className="w-16 h-16 bg-white/5 rounded-xl overflow-hidden shrink-0 border border-white/10">
                  <img 
                    src={item.image} 
                    alt={item.name} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                </div>

                {/* Product details */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                      <span className="text-[9px] bg-amber-600/20 text-amber-300 px-1.5 py-0.5 rounded font-cairo">
                        {item.category === "coffee" ? "☕ قهوة ساخنة" : item.category === "tea_matcha" ? "🍃 ماتشا وشاي" : item.category === "sweets" ? "🍰 حلويات" : "🍹 موخيتو وبارد"}
                      </span>
                      <span className="text-[10px] font-mono font-extrabold text-zinc-500">#{item.id.replace("item-", "")}</span>
                    </div>
                    <h5 className="font-cairo font-bold text-[13px] text-white truncate">{item.nameAr}</h5>
                    <p className="text-[10px] text-zinc-400 font-sans truncate">{item.name}</p>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-1 border-t border-white/5">
                    <span className="font-sans font-bold text-xs text-amber-500">
                      {item.price} EGP
                    </span>
                    
                    {/* Delete Item action */}
                    {onDeleteMenuItem && (
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`هل أنت متأكد من رغبتك في حذف "${item.nameAr}" بالكامل من المنيو؟`)) {
                            onDeleteMenuItem(item.id);
                          }
                        }}
                        className="p-1 px-2.5 text-[10px] font-cairo text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer border border-white/5 hover:border-red-500/25"
                        title="حذف المنتج من المنيو"
                      >
                        🗑️ حذف
                      </button>
                    )}
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { Order, MenuItem, ActivityLog } from "../types";
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
  Settings,
  ClipboardList,
  BarChart3,
  TrendingUp,
  DollarSign,
  ShoppingBag
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

interface KitchenDashboardProps {
  orders: Order[];
  onUpdateStatus: (id: string, newStatus: Order["status"]) => void;
  onResetDemo: () => void;
  newOrderAlert: boolean;
  onClearAlert: () => void;
  menuItems?: MenuItem[];
  onAddMenuItem?: (itemData: any) => Promise<boolean>;
  onDeleteMenuItem?: (id: string) => Promise<boolean>;
  activityLogs?: ActivityLog[];
  onClearLogs?: () => void;
}

export default function KitchenDashboard({ 
  orders, 
  onUpdateStatus, 
  onResetDemo, 
  newOrderAlert, 
  onClearAlert,
  menuItems = [],
  onAddMenuItem,
  onDeleteMenuItem,
  activityLogs = [],
  onClearLogs
}: KitchenDashboardProps) {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [now, setNow] = useState(Date.now());
  
  // Tab controller
  const [activeTab, setActiveTab] = useState<"orders" | "menu" | "analytics">("orders");
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
      <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5 max-w-md mb-6 relative z-10 font-cairo">
        <button
          onClick={() => setActiveTab("orders")}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer truncate ${
            activeTab === "orders"
              ? "bg-amber-600 text-white shadow-lg"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          📋 الطلبات الواردة ({activeOrders.length})
        </button>
        <button
          onClick={() => setActiveTab("menu")}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer truncate ${
            activeTab === "menu"
              ? "bg-amber-600 text-white shadow-lg"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          ☕ المنتجات ({menuItems.length})
        </button>
        <button
          onClick={() => setActiveTab("analytics")}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer truncate ${
            activeTab === "analytics"
              ? "bg-amber-600 text-white shadow-lg"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          📊 لوحة الإحصائيات الذكية
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
      ) : activeTab === "menu" ? (
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

           {/* Table of Menu items as requested */}
          <div className="overflow-x-auto border border-white/10 rounded-2xl bg-white/2 shadow-inner">
            <table className="w-full text-right border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-zinc-300 font-cairo text-[11px] font-bold">
                  <th className="p-3.5 pr-5">صورة المنتج</th>
                  <th className="p-3.5">اسم الصنف بالكامل</th>
                  <th className="p-3.5">الفئة</th>
                  <th className="p-3.5">السعر بالجنيه EGP</th>
                  <th className="p-3.5">خيارات الزبون المدعومة</th>
                  <th className="p-3.5 text-center">إجراءات الإيقاف / الحذف</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                {menuItems.map((item) => (
                  <tr key={item.id} className="hover:bg-white/5 transition-all group font-sans">
                    {/* Thumbnail */}
                    <td className="p-3 pr-5">
                      <div className="w-11 h-11 bg-white/5 rounded-xl overflow-hidden border border-white/10 shrink-0">
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    </td>

                    {/* Name */}
                    <td className="p-3">
                      <div>
                        <h5 className="font-cairo font-bold text-xs text-white">{item.nameAr}</h5>
                        <p className="text-[10px] text-zinc-400 font-sans mt-0.5">{item.name} • <span className="text-[9px] font-mono text-amber-500/80">#{item.id.replace("item-", "")}</span></p>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="p-3">
                      <span className="text-[10px] font-cairo bg-amber-600/10 text-amber-300 border border-amber-500/15 px-2 py-0.5 rounded">
                        {item.category === "coffee" ? "☕ قهوة ساخنة" : item.category === "tea_matcha" ? "🍃 ماتشا وشاي" : item.category === "sweets" ? "🍰 حلويات" : "🍹 موخيتو وبارد"}
                      </span>
                    </td>

                    {/* Price */}
                    <td className="p-3">
                      <span className="font-sans font-bold text-xs text-emerald-400">{item.price} EGP</span>
                    </td>

                    {/* Options checkboxes details */}
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {item.options?.sizes?.length ? (
                          <span className="text-[9px] font-cairo bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded border border-white/5">أحجام ({item.options.sizes.length})</span>
                        ) : null}
                        {item.options?.sugarLevels?.length ? (
                          <span className="text-[9px] font-cairo bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded border border-white/5">تحكم السكر</span>
                        ) : null}
                        {item.options?.milkTypes?.length ? (
                          <span className="text-[9px] font-cairo bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded border border-white/5">بدائل الحليب</span>
                        ) : null}
                        {!item.options?.sizes?.length && !item.options?.sugarLevels?.length && !item.options?.milkTypes?.length ? (
                          <span className="text-[9px] font-cairo bg-zinc-800/20 text-zinc-500 px-1.5 py-0.5 rounded border border-dashed border-white/5">بدون إضافات</span>
                        ) : null}
                      </div>
                    </td>

                    {/* Edit Delete action */}
                    <td className="p-3 text-center">
                      {onDeleteMenuItem && (
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`هل أنت متأكد من رغبتك في حذف الصنف "${item.nameAr}" من المنيو بالكامل؟`)) {
                              onDeleteMenuItem(item.id);
                            }
                          }}
                          className="px-2.5 py-1.5 text-[10px] font-cairo font-bold text-red-400 hover:text-white hover:bg-red-500/20 rounded-lg transition-colors cursor-pointer border border-red-500/10 hover:border-red-500/30"
                        >
                          🗑️ حذف نهائي
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Historical Activity log/operations changes list because client explicitly requested it */}
          <div className="mt-8 border-t border-white/10 pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4.5">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-amber-500 shrink-0" />
                <div>
                  <h3 className="font-cairo font-bold text-sm text-white">سجل العمليات والتغيرات التاريخي الذكي (Change History)</h3>
                  <p className="text-[10px] text-zinc-500 font-sans">Automatic live change tracking & state history logs</p>
                </div>
              </div>
              {onClearLogs && activityLogs.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm("هل ترغب فعلاً في حذف ومسح جميع تفاصيل السجل التاريخي كلياً؟")) {
                      onClearLogs();
                    }
                  }}
                  className="px-3 py-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-[10px] font-cairo font-bold rounded-lg transition-all"
                >
                  🧹 مسح سجل التغييرات التاريخي
                </button>
              )}
            </div>

            {activityLogs.length === 0 ? (
              <div className="text-center py-6 bg-white/1 border border-white/5 rounded-2xl">
                <p className="text-zinc-500 text-xs font-cairo leading-relaxed">لم تسجل أي عمليات تغيير تذكر حتى الآن. كل تعديل للأصناف أو حالات الطلبات والمطبخ يظهر هنا مباشرة لراحة الزبائن والملاّك.</p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-white/5 rounded-2xl bg-black/30">
                <table className="w-full text-right border-collapse min-w-[550px]">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/2 text-zinc-400 font-cairo text-[10px]">
                      <th className="p-2.5 pr-4 w-24">التوقيت</th>
                      <th className="p-2.5 w-32">العملية المجرية</th>
                      <th className="p-2.5">الحدث والتعديل المجرى بالكامل</th>
                      <th className="p-2.5 hidden md:table-cell">بيانات ثانوية</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-cairo text-[11px] text-zinc-300">
                    {activityLogs.map((log) => {
                      let typeBadge = "bg-white/5 text-zinc-400 border-white/5";
                      if (log.type === "add_item") typeBadge = "bg-emerald-500/10 text-emerald-300 border-emerald-500/20";
                      else if (log.type === "delete_item") typeBadge = "bg-red-500/10 text-red-300 border-red-500/20";
                      else if (log.type === "update_order") typeBadge = "bg-amber-500/10 text-amber-300 border-amber-500/20";
                      else if (log.type === "place_order") typeBadge = "bg-sky-500/10 text-sky-300 border-sky-500/20";

                      return (
                        <tr key={log.id} className="hover:bg-white/1 transition-colors">
                          <td className="p-2.5 pr-4 font-mono text-[9px] text-zinc-400 font-bold">{log.timestamp}</td>
                          <td className="p-2.5">
                            <span className={`inline-block border px-1.5 py-0.5 rounded-[5px] text-[9px] font-bold ${typeBadge}`}>
                              {log.typeNameAr}
                            </span>
                          </td>
                          <td className="p-2.5 text-zinc-100 font-bold leading-relaxed">{log.description}</td>
                          <td className="p-2.5 hidden md:table-cell text-[10px] text-zinc-400">{log.details || "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ANALYTICS, REVENUE & CHARTS DASHBOARD TAB */
        <div className="flex-1 overflow-y-auto pr-1 space-y-6">
          {/* Dashboard Header */}
          <div className="bg-gradient-to-r from-stone-900 to-amber-950/20 border border-white/10 p-5 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-cairo font-bold text-base text-amber-400 flex items-center gap-2">
                📊 لوحة التقارير والمبيعات اليومية الذكية
              </h3>
              <p className="text-xs text-zinc-400 font-sans mt-0.5 leading-relaxed">
                مراقبة أداء المبيعات لحظة بلحظة، إحصائيات الأرباح وقيمة الطلبات وحساب الأصناف الأكثر طلباً من الزبائن.
              </p>
            </div>
            
            <div className="text-[10px] font-mono text-amber-500/80 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl self-start sm:self-center">
              تحديث تلقائي مستمر • Live Automated Sync
            </div>
          </div>

          {/* KPI Analytics Cards Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
            {/* Card 1: Revenue completed */}
            <div className="bg-gradient-to-b from-stone-900/60 to-black/30 border border-emerald-500/20 rounded-2xl p-4 flex flex-col justify-between hover:border-emerald-500/45 transition-all relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/3 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all duration-500" />
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-cairo text-zinc-400 font-medium">المبيعات المحققة</span>
                <span className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-400">
                  <DollarSign className="w-3.5 h-3.5" />
                </span>
              </div>
              <div>
                <span className="font-mono text-lg font-black text-emerald-400">
                  {orders.reduce((acc, o) => o.status === "completed" ? acc + Number(o.total || 0) : acc, 0)}
                </span>
                <span className="text-[9px] text-zinc-500 font-sans mr-1">EGP</span>
                <p className="text-[9px] text-emerald-500/70 font-cairo mt-1">الطلبات المكتملة المدفوعة</p>
              </div>
            </div>

            {/* Card 2: Completed count */}
            <div className="bg-gradient-to-b from-stone-900/60 to-black/30 border border-amber-500/15 rounded-2xl p-4 flex flex-col justify-between hover:border-amber-500/30 transition-all relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/3 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-all duration-500" />
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-cairo text-zinc-400 font-medium">الطلبات المكتملة</span>
                <span className="p-1.5 bg-amber-500/10 rounded-lg text-amber-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </span>
              </div>
              <div>
                <span className="font-mono text-xl font-black text-white">
                  {orders.filter(o => o.status === "completed").length}
                </span>
                <span className="text-[9px] text-zinc-500 font-sans mr-1">طلبات</span>
                <p className="text-[9px] text-zinc-400/70 font-cairo mt-1">سلمت للزبائن بنجاح</p>
              </div>
            </div>

            {/* Card 3: Potential processing */}
            <div className="bg-gradient-to-b from-stone-900/60 to-black/30 border border-blue-500/20 rounded-2xl p-4 flex flex-col justify-between hover:border-blue-500/40 transition-all relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/3 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-all duration-500" />
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-cairo text-zinc-400 font-medium">مبيعات قيد التحضير</span>
                <span className="p-1.5 bg-blue-500/11 rounded-lg text-blue-400">
                  <Flame className="w-3.5 h-3.5 animate-pulse" />
                </span>
              </div>
              <div>
                <span className="font-mono text-lg font-black text-blue-400">
                  {orders.reduce((acc, o) => (o.status !== "completed" && o.status !== "cancelled") ? acc + Number(o.total || 0) : acc, 0)}
                </span>
                <span className="text-[9px] text-zinc-500 font-sans mr-1">EGP</span>
                <p className="text-[9px] text-blue-500/70 font-cairo mt-1">طلبات جاري العمل عليها</p>
              </div>
            </div>

            {/* Card 4: Average ticket */}
            <div className="bg-gradient-to-b from-stone-900/60 to-black/30 border border-purple-500/15 rounded-2xl p-4 flex flex-col justify-between hover:border-purple-500/30 transition-all relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/3 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-all duration-500" />
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-cairo text-zinc-400 font-medium">متوسط قيمة الطلب</span>
                <span className="p-1.5 bg-purple-500/10 rounded-lg text-purple-400">
                  <TrendingUp className="w-3.5 h-3.5" />
                </span>
              </div>
              <div>
                <span className="font-mono text-lg font-black text-purple-400">
                  {(() => {
                    const completed = orders.filter(o => o.status === "completed");
                    if (completed.length === 0) return 0;
                    const total = completed.reduce((acc, o) => acc + Number(o.total || 0), 0);
                    return Math.round(total / completed.length);
                  })()}
                </span>
                <span className="text-[9px] text-zinc-500 font-sans mr-1">EGP</span>
                <p className="text-[9px] text-zinc-400/70 font-cairo mt-1">معدل الفاتورة للعميل</p>
              </div>
            </div>

            {/* Card 5: Cancelled count */}
            <div className="bg-gradient-to-b from-stone-900/60 to-black/30 border border-red-500/10 rounded-2xl p-4 flex flex-col justify-between hover:border-red-500/25 transition-all relative overflow-hidden group col-span-2 lg:col-span-1">
              <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/3 rounded-full blur-2xl group-hover:bg-red-500/10 transition-all duration-500" />
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-cairo text-zinc-400 font-medium">الطلبات المرفوضة</span>
                <span className="p-1.5 bg-red-500/10 rounded-lg text-red-400">
                  <AlertTriangle className="w-3.5 h-3.5" />
                </span>
              </div>
              <div>
                <span className="font-mono text-xl font-black text-red-400">
                  {orders.filter(o => o.status === "cancelled").length}
                </span>
                <span className="text-[9px] text-zinc-500 font-sans mr-1">ألغيت</span>
                <p className="text-[9px] text-red-500/50 font-cairo mt-1">تراجع أو إيقاف الطلب</p>
              </div>
            </div>
          </div>

          {/* Charts Row - 2 Columns */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {/* Chart 1: Time Series / Sales Trend */}
            <div className="bg-white/3 border border-white/5 rounded-2xl p-5 flex flex-col justify-between">
              <div className="mb-4">
                <h4 className="font-cairo font-bold text-sm text-zinc-100 flex items-center gap-1.5">
                  📈 اتجاه المبيعات وحجم الفواتير اليومي
                </h4>
                <p className="text-[10px] text-zinc-400 font-sans">Hourly sales volume trends (EGP in last 24h)</p>
              </div>

              <div className="w-full h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={(() => {
                      const hourlySalesMap: Record<string, number> = {};
                      const completedOrders = orders.filter(o => o.status === "completed");
                      
                      completedOrders.forEach(o => {
                        try {
                          const date = new Date(o.createdAt);
                          const hourStr = `${date.getHours().toString().padStart(2, "0")}:00`;
                          hourlySalesMap[hourStr] = (hourlySalesMap[hourStr] || 0) + Number(o.total || 0);
                        } catch {
                          // Ignore formatting issue
                        }
                      });

                      const sortedHours = Object.keys(hourlySalesMap).sort();
                      const result = sortedHours.map(hour => ({
                        time: hour,
                        "المبيعات": hourlySalesMap[hour]
                      }));

                      return result.length > 0 ? result : [
                        { time: "08:00", "المبيعات": 120 },
                        { time: "10:00", "المبيعات": 280 },
                        { time: "12:00", "المبيعات": 510 },
                        { time: "14:00", "المبيعات": 390 },
                        { time: "16:00", "المبيعات": 640 },
                        { time: "18:00", "المبيعات": 890 },
                        { time: "20:00", "المبيعات": 420 },
                      ];
                    })()}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#d97706" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#d97706" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" />
                    <XAxis 
                      dataKey="time" 
                      stroke="#888888" 
                      fontSize={10}
                      tickLine={false} 
                    />
                    <YAxis 
                      stroke="#888888" 
                      fontSize={10}
                      tickLine={false} 
                      axisLine={false}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "#1c1917", 
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "12px",
                        fontFamily: "Cairo, sans-serif"
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="المبيعات" 
                      stroke="#d97706" 
                      strokeWidth={2.5}
                      fillOpacity={1} 
                      fill="url(#colorSales)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Category Distribution */}
            <div className="bg-white/3 border border-white/5 rounded-2xl p-5 flex flex-col justify-between">
              <div className="mb-4">
                <h4 className="font-cairo font-bold text-sm text-zinc-100 flex items-center gap-1.5">
                  🥧 توزيع الإيرادات حسب فئة الطلبات بالمنيو
                </h4>
                <p className="text-[10px] text-zinc-400 font-sans">Revenue proportion grouped by product categories</p>
              </div>

              <div className="w-full h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={(() => {
                      const categoryTotalsMap: Record<string, number> = {
                        coffee: 0,
                        tea_matcha: 0,
                        sweets: 0,
                        mojitos_cold: 0
                      };

                      orders.filter(o => o.status === "completed").forEach(o => {
                        o.items?.forEach(item => {
                          const matchingItem = menuItems.find(m => m.id === item.id);
                          const category = matchingItem?.category || "coffee";
                          categoryTotalsMap[category] += Number(item.price || 0) * Number(item.quantity || 1);
                        });
                      });

                      const labelMap: Record<string, string> = {
                        coffee: "☕ قهوة ساخنة",
                        tea_matcha: "🍃 ماتشا وشاي",
                        sweets: "🍰 حلويات ومخبوزات",
                        mojitos_cold: "🍹 موخيتو وبارد"
                      };

                      const result = Object.keys(categoryTotalsMap).map(key => ({
                        name: labelMap[key] || key,
                        "الإيرادات": categoryTotalsMap[key]
                      }));

                      // If zero-sales yet, fall back to stunning aesthetic data representing menu diversity
                      const totalVal = result.reduce((sum, item) => sum + item["الإيرادات"], 0);
                      return totalVal > 0 ? result : [
                        { name: "☕ قهوة ساخنة", "الإيرادات": 480 },
                        { name: "🍃 ماتشا وشاي", "الإيرادات": 260 },
                        { name: "🍰 حلويات ومخبوزات", "الإيرادات": 320 },
                        { name: "🍹 موخيتو وبارد", "الإيرادات": 190 }
                      ];
                    })()}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" />
                    <XAxis 
                      dataKey="name" 
                      stroke="#888888" 
                      fontSize={9}
                      tickLine={false} 
                    />
                    <YAxis 
                      stroke="#888888" 
                      fontSize={10}
                      tickLine={false} 
                      axisLine={false}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "#1c1917", 
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "12px",
                        fontFamily: "Cairo, sans-serif"
                      }}
                    />
                    <Bar 
                      dataKey="الإيرادات" 
                      fill="#eab308" 
                      radius={[6, 6, 0, 0]}
                      maxBarSize={32}
                    >
                      {/* Distinguish bars with gorgeous matching coffee & sweets colors */}
                      <Cell fill="#f59e0b" />
                      <Cell fill="#10b981" />
                      <Cell fill="#d946ef" />
                      <Cell fill="#06b6d4" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Third Row: Best Sellers progress stats */}
          <div className="bg-gradient-to-b from-stone-900/40 to-black/10 border border-white/5 rounded-3xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-4.5 h-4.5 text-amber-500" />
              <div>
                <h4 className="font-cairo font-bold text-sm text-white">الـ 5 معشوقات الأكثر طلباً ورواجاً بالقهوة (Top Sellers)</h4>
                <p className="text-[10px] text-zinc-500 font-sans">Most purchased items ranked by frequency and income contribution</p>
              </div>
            </div>

            {(() => {
              const occurrences: Record<string, { nameAr: string; qty: number; value: number }> = {};
              
              orders.filter(o => o.status === "completed").forEach(o => {
                o.items?.forEach(item => {
                  if (!occurrences[item.id]) {
                    occurrences[item.id] = { nameAr: item.nameAr || item.name, qty: 0, value: 0 };
                  }
                  occurrences[item.id].qty += Number(item.quantity || 1);
                  occurrences[item.id].value += Number(item.price || 0) * Number(item.quantity || 1);
                });
              });

              const list = Object.keys(occurrences).map(id => ({
                id,
                name: occurrences[id].nameAr,
                qty: occurrences[id].qty,
                revenue: occurrences[id].value
              })).sort((a, b) => b.qty - a.qty).slice(0, 5);

              // fallback list if empty
              const finalList = list.length > 0 ? list : [
                { id: "latte", name: "كافيه لاتيه ☕", qty: 14, revenue: 770 },
                { id: "spanish-latte", name: "سبانش لاتيه 🇪🇸", qty: 11, revenue: 660 },
                { id: "matcha", name: "ماتشا لاتيه 🍃", qty: 8, revenue: 520 },
                { id: "brownie", name: "براوني الشوكولاتة 🍫", qty: 7, revenue: 336 },
                { id: "croissant", name: "كرواسون زبدة 🥐", qty: 5, revenue: 200 }
              ];

              const maxQty = Math.max(...finalList.map(item => item.qty), 1);

              return (
                <div className="space-y-3.5">
                  {finalList.map((item, index) => {
                    const percentage = Math.round((item.qty / maxQty) * 100);
                    return (
                      <div key={item.id} className="group">
                        <div className="flex items-center justify-between text-xs font-cairo mb-1">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-amber-500/10 text-amber-500 text-[10px] flex items-center justify-center font-bold">
                              {index + 1}
                            </span>
                            <span className="text-zinc-200 font-bold group-hover:text-amber-400 transition-colors">
                              {item.name}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-4 text-[11px] font-mono text-zinc-400">
                            <span>{item.qty} أكواب/مبيعات</span>
                            <span className="text-emerald-400 font-bold">{item.revenue} EGP</span>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                          <div 
                            className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full transition-all duration-1000"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

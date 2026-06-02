import React, { useState, useEffect } from "react";
import { MenuItem, OrderItem, Order } from "../types";
import { 
  Coffee, 
  Leaf, 
  Flame, 
  IceCream, 
  Plus, 
  Minus, 
  ShoppingBag, 
  X, 
  ArrowLeft, 
  Sparkles, 
  ChefHat, 
  Gift, 
  Clock, 
  CheckCircle2, 
  AlertCircle 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface CustomerMenuProps {
  tableId: string;
  onBack?: () => void;
  orders: Order[];
  onOrderPlaced: (newOrder: Order) => void;
  menuItems?: MenuItem[];
}

export default function CustomerMenu({ tableId, onBack, orders, onOrderPlaced, menuItems: propMenuItems }: CustomerMenuProps) {
  // Menu items from server
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("all");

  // Selection Modal
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [customSize, setCustomSize] = useState<string>("");
  const [customSugar, setCustomSugar] = useState<string>("");
  const [customMilk, setCustomMilk] = useState<string>("");
  const [customNotes, setCustomNotes] = useState<string>("");
  const [customQty, setCustomQty] = useState<number>(1);

  // Cart
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [submittingOrder, setSubmittingOrder] = useState(false);

  // Active Order Tracking
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);

  // Fetch Menu from API fallback
  useEffect(() => {
    if (propMenuItems && propMenuItems.length > 0) {
      setMenuItems(propMenuItems);
      setLoading(false);
    } else {
      fetch("/api/menu")
        .then(res => res.json())
        .then(data => {
          setMenuItems(data);
          setLoading(false);
        })
        .catch(err => {
          console.error("Error fetching menu:", err);
          setLoading(false);
        });
    }
  }, [propMenuItems]);

  // Sync active order state if it gets updated in the kitchen
  useEffect(() => {
    if (activeOrder) {
      const match = orders.find(o => o.id === activeOrder.id);
      if (match && match.status !== activeOrder.status) {
        setActiveOrder(match);
      }
    }
  }, [orders, activeOrder]);

  // Categories definition
  const categories = [
    { id: "all", name: "الكل", nameEn: "All", icon: <Sparkles className="w-4 h-4" /> },
    { id: "coffee", name: "قهوة ساخنة", nameEn: "Hot Coffee", icon: <Coffee className="w-4 h-4" /> },
    { id: "tea_matcha", name: "شاي وماتشا", nameEn: "Tea & Matcha", icon: <Leaf className="w-4 h-4" /> },
    { id: "mojitos_cold", name: "موخيتو وبارد", nameEn: "Cold Drinks", icon: <IceCream className="w-4 h-4" /> },
    { id: "sweets", name: "حلا ومخبوزات", nameEn: "Sweets", icon: <Flame className="w-4 h-4" /> },
  ];

  // Handle open item customize modal
  const openCustomization = (item: MenuItem) => {
    setSelectedItem(item);
    setCustomSize(item.options.sizes?.[0] || "");
    setCustomSugar(item.options.sugarLevels?.[0] || "");
    setCustomMilk(item.options.milkTypes?.[0] || "");
    setCustomNotes("");
    setCustomQty(1);
  };

  // Get dynamic item price in modal (e.g. Oat Milk adds +10 EGP)
  const getCustomizedItemPrice = (): number => {
    if (!selectedItem) return 0;
    let basePrice = selectedItem.price;
    if (customMilk.includes("+10")) {
      basePrice += 10;
    }
    return basePrice;
  };

  const addToCart = () => {
    if (!selectedItem) return;

    const price = getCustomizedItemPrice();
    const cartItem: OrderItem = {
      id: `${selectedItem.id}-${customSize}-${customSugar}-${customMilk}`,
      name: selectedItem.name,
      nameAr: selectedItem.nameAr,
      price: price,
      quantity: customQty,
      size: customSize || undefined,
      sugar: customSugar || undefined,
      milk: customMilk || undefined,
      notes: customNotes.trim() || undefined
    };

    setCart(prev => {
      // If same options already exist, aggregate quantity
      const existingIdx = prev.findIndex(item => item.id === cartItem.id && item.notes === cartItem.notes);
      if (existingIdx > -1) {
        const updated = [...prev];
        updated[existingIdx].quantity += cartItem.quantity;
        return updated;
      }
      return [...prev, cartItem];
    });

    setSelectedItem(null); // Close modal
  };

  const updateCartQty = (id: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.id === id) {
          const newQty = item.quantity + delta;
          return { ...item, quantity: Math.max(1, newQty) };
        }
        return item;
      }).filter(item => item.quantity > 0);
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getCartItemCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  };

  // Submit actual order to server API
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    if (!customerName.trim()) {
      alert("الرجاء إدخال اسمك الكريم لتسجيل الطلب");
      return;
    }

    setSubmittingOrder(true);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableNumber: tableId,
          customerName: customerName,
          items: cart,
          total: getCartTotal()
        })
      });

      if (!response.ok) {
        throw new Error("Failed to post order");
      }

      const data = await response.json();
      if (data.success) {
        onOrderPlaced(data.order);
        setActiveOrder(data.order);
        setCart([]); // Clear cart
        setIsCartOpen(false);
      }
    } catch (err) {
      console.error("Order placing error:", err);
      alert("حدث خطأ في الإرسال، يمكنك تجربة الطلب مجدداً.");
    } finally {
      setSubmittingOrder(false);
    }
  };

  // Filter items
  const filteredMenuItems = activeCategory === "all" 
    ? menuItems 
    : menuItems.filter(item => item.category === activeCategory);

  // Status mapping
  const getStatusText = (status: Order["status"]) => {
    switch(status) {
      case "pending": return { text: "قيد الانتظار لموافقة الطاهي", color: "text-amber-300 bg-amber-600/20 border-amber-500/30", step: 1 };
      case "preparing": return { text: "يتم تجهيز طلبك الآن في المطبخ ☕", color: "text-blue-300 bg-blue-650/20 border-blue-500/30", step: 2 };
      case "ready": return { text: "طلبك جاهز ولذيذ! تفضل بالاستلام 🎉", color: "text-emerald-300 bg-emerald-600/25 border-emerald-500/30 animate-bounce", step: 3 };
      case "completed": return { text: "تم الاستلام! بالهناء والشفاء ❤️", color: "text-zinc-300 bg-white/10 border-white/5", step: 4 };
      case "cancelled": return { text: "تم إلغاء الطلب. يرجى مراجعة الكاشير", color: "text-red-300 bg-red-650/25 border-red-500/30", step: 0 };
    }
  };

  return (
    <div className="bg-[#0f0c0b] border-4 border-amber-600/25 rounded-[40px] shadow-3xl overflow-hidden max-w-md w-full mx-auto relative h-[780px] flex flex-col font-sans text-white">
      {/* Mobile Top Speaker and Notch accent */}
      <div className="bg-stone-950 h-6 flex justify-center items-center relative flex-shrink-0 z-30 border-b border-white/5">
        <div className="w-24 h-3.5 bg-stone-950 rounded-b-xl absolute top-0 flex justify-center items-center gap-1.5">
          <div className="w-8 h-1 bg-zinc-850 rounded-full"></div>
          <div className="w-1.5 h-1.5 bg-zinc-850 rounded-full"></div>
        </div>
      </div>

      {/* Header */}
      <header className="bg-[#120f0e]/60 border-b border-white/10 px-5 py-4 flex items-center justify-between flex-shrink-0 relative">
        <div className="flex items-center gap-3">
          {onBack && !activeOrder && (
            <button 
              onClick={onBack}
              className="p-1.5 hover:bg-white/15 rounded-xl text-zinc-350 transition-colors cursor-pointer border border-white/5"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <span className="text-[10px] bg-amber-600/20 text-amber-300 border border-amber-600/30 font-bold px-2 py-0.5 rounded-full inline-block">
              طاولة {tableId} • Table {tableId}
            </span>
            <h1 className="font-cairo font-bold text-lg text-white flex items-center gap-2 mt-0.5">
              <div className="w-6 h-6 rounded-md overflow-hidden bg-white inline-block border border-white/20">
                <img 
                  src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTxtjEXQRJnFgE95sjSHdu2TvEN7UZ4B0R9VQ&s" 
                  alt="Logo"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              كافيه لاتينو
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
          <span className="text-[11px] text-zinc-400 font-mono">Real-time Node</span>
        </div>
      </header>

      {/* VIEW 1: Active Order Status Tracker (If they ordered) */}
      {activeOrder ? (
        <div className="flex-1 overflow-y-auto p-5 space-y-6 flex flex-col">
          <div className="text-center py-4 bg-white/5 rounded-3xl border border-white/10 p-6 shadow-xl">
            <span className="font-mono text-zinc-400 text-xs text-center block">رقم الطلب Order ID</span>
            <span className="font-sans font-bold text-3xl text-amber-500 tracking-wider block mt-1">#{activeOrder.id}</span>
            
            <div className={`mt-4 px-4 py-2.5 rounded-2xl border font-cairo text-xs font-semibold ${getStatusText(activeOrder.status)?.color}`}>
              {getStatusText(activeOrder.status)?.text}
            </div>
          </div>

          {/* Stepper Progress */}
          {activeOrder.status !== "cancelled" && (
            <div className="bg-white/5 rounded-3xl p-5 border border-white/10 space-y-4">
              <h3 className="font-cairo font-bold text-white text-sm border-b border-white/10 pb-2 flex items-center gap-1.5">
                <ChefHat className="w-4 h-4 text-amber-500" /> تتبع مراحل طلبك
              </h3>
              
              <div className="space-y-4 pt-1">
                {/* Step 1: Pending */}
                <div className="flex items-start gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    (getStatusText(activeOrder.status)?.step ?? 0) >= 1 ? "bg-amber-600 text-white" : "bg-white/5 text-zinc-500"
                  }`}>
                    1
                  </div>
                  <div className="flex-1">
                    <p className={`font-cairo text-xs font-semibold ${
                      (getStatusText(activeOrder.status)?.step ?? 0) >= 1 ? "text-zinc-100" : "text-zinc-500"
                    }`}>
                      بانتظار تأكيد المطبخ / Request Received
                    </p>
                    <p className="text-[10px] text-zinc-400">Order sent to kitchen terminals</p>
                  </div>
                </div>

                {/* Step 2: Preparing */}
                <div className="flex items-start gap-3 relative">
                  <div className="w-0.5 bg-white/10 absolute left-3 -top-4 -bottom-4"></div>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold relative z-10 ${
                    (getStatusText(activeOrder.status)?.step ?? 0) >= 2 ? "bg-blue-600 text-white animate-pulse" : "bg-white/5 text-zinc-500"
                  }`}>
                    2
                  </div>
                  <div className="flex-1">
                    <p className={`font-cairo text-xs font-semibold ${
                      (getStatusText(activeOrder.status)?.step ?? 0) >= 2 ? "text-zinc-100" : "text-zinc-500"
                    }`}>
                      تحت التحضير والطهي / In Preparation
                    </p>
                    <p className="text-[10px] text-zinc-400">Barista is grinding beans & crafting espresso</p>
                  </div>
                </div>

                {/* Step 3: Ready */}
                <div className="flex items-start gap-3 relative">
                  <div className="w-0.5 bg-white/10 absolute left-3 -top-4 -bottom-4"></div>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold relative z-10 ${
                    (getStatusText(activeOrder.status)?.step ?? 0) >= 3 ? "bg-emerald-600 text-white" : "bg-white/5 text-zinc-500"
                  }`}>
                    3
                  </div>
                  <div className="flex-1">
                    <p className={`font-cairo text-xs font-semibold ${
                      (getStatusText(activeOrder.status)?.step ?? 0) >= 3 ? "text-zinc-100" : "text-zinc-500"
                    }`}>
                      جاهز للاستلام! / Ready at Pickup Counter
                    </p>
                    <p className="text-[10px] text-zinc-400">Fresh and warm, take yours immediately!</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Items Recap */}
          <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
            <h4 className="font-cairo font-bold text-xs text-zinc-300 mb-2">تفاصيل الفاتورة / Your Receipt</h4>
            <div className="space-y-2">
              {activeOrder.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start text-xs border-b border-white/5 pb-2">
                  <div>
                    <div className="font-cairo font-semibold text-zinc-200">
                      {item.nameAr} <span className="text-zinc-400 font-sans">({item.quantity}x)</span>
                    </div>
                    {item.size && <span className="text-[9px] bg-white/10 text-zinc-300 px-1 rounded mr-1">الحجم: {item.size}</span>}
                    {item.sugar && <span className="text-[9px] bg-amber-600/20 text-amber-300 px-1 rounded mr-1">السكر: {item.sugar}</span>}
                    {item.milk && <span className="text-[9px] bg-blue-600/20 text-blue-300 px-1 rounded">الحليب: {item.milk}</span>}
                  </div>
                  <span className="font-mono text-amber-400 font-semibold">{item.price * item.quantity} EGP</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center mt-3 pt-2 border-t border-white/10 text-white font-bold text-sm">
              <span className="font-cairo text-xs">الإجمالي الكلي</span>
              <span className="text-amber-400 font-mono">{activeOrder.total} EGP</span>
            </div>
          </div>

          <div className="flex-1"></div>

          {/* Reset / Order Again */}
          <button 
            onClick={() => setActiveOrder(null)}
            className="w-full bg-amber-600 hover:bg-amber-500 text-white font-cairo font-bold text-sm py-4 rounded-2xl cursor-pointer shadow-lg transition-colors"
          >
            طلب جديد / Order Something Else
          </button>
        </div>
      ) : (
        /* VIEW 2: Standard Menu Storefront */
        <>
          {/* Categories Tab Bar */}
          <div className="flex gap-2 overflow-x-auto px-4 py-3 bg-[#120f0e]/40 border-b border-white/10 flex-shrink-0">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-cairo font-semibold transition-all flex-shrink-0 cursor-pointer ${
                  activeCategory === cat.id 
                    ? "bg-amber-600 text-white shadow"
                    : "bg-white/5 text-zinc-300 hover:bg-white/10 border border-white/10"
                }`}
              >
                {cat.icon}
                <span>{cat.name}</span>
              </button>
            ))}
          </div>

          {/* Menu Items Grid */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-zinc-400">
                <Coffee className="w-8 h-8 animate-spin text-amber-500" />
                <span className="text-xs font-cairo">جاري تحميل قائمة المشروبات...</span>
              </div>
            ) : filteredMenuItems.length === 0 ? (
              <div className="text-center py-12 text-zinc-500 font-cairo text-xs">
                لا توجد مشروبات في هذا التصنيف حالياً.
              </div>
            ) : (
              filteredMenuItems.map((item) => (
                <div 
                  key={item.id}
                  className="bg-white/5 rounded-2xl p-3 border border-white/5 flex gap-4 hover:border-white/10 transition-all relative"
                >
                  {/* Photo with referrerPolicy */}
                  <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 relative bg-zinc-950">
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  {/* Body Info */}
                  <div className="flex-1 flex flex-col justify-between py-0.5">
                    <div>
                      <div className="flex items-start justify-between">
                        <h3 className="font-cairo font-bold text-[14px] text-white leading-tight">
                          {item.nameAr}
                        </h3>
                        {/* Price badge */}
                        <span className="font-mono text-amber-400 font-bold text-xs bg-white/5 border border-white/5 px-2 py-0.5 rounded-md">
                          {item.price} ج.م
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-500 font-sans mt-0.5">{item.name}</p>
                      <p className="text-[11px] text-zinc-400 font-cairo mt-1.5 leading-snug line-clamp-2" title={item.descriptionAr}>
                        {item.descriptionAr}
                      </p>
                    </div>

                    <div className="flex justify-end mt-1.5">
                      <button
                        onClick={() => openCustomization(item)}
                        className="flex items-center gap-1 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 font-cairo font-semibold text-xs px-2.5 py-1 rounded-lg cursor-pointer transition-colors border border-amber-600/30"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        تخصيص وطلب
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Checkout Float */}
          {cart.length > 0 && (
            <div className="bg-[#120f0e]/80 border-t border-white/10 p-4 shadow-2xl flex-shrink-0">
              <button 
                onClick={() => setIsCartOpen(true)}
                className="w-full bg-amber-600 hover:bg-amber-500 text-white font-cairo font-semibold py-3 px-4 rounded-xl flex items-center justify-between cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                <div className="flex items-center gap-2">
                  <div className="bg-black text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {getCartItemCount()}
                  </div>
                  <span>عرض السلة / Checkout</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-zinc-300 font-light text-xs">الإجمالي:</span>
                  <span className="font-mono font-bold text-base">{getCartTotal()} EGP</span>
                </div>
              </button>
            </div>
          )}
        </>
      )}

      {/* COMPONENT 3: Customization drawer (bottom sheet) */}
      <AnimatePresence>
        {selectedItem && (
          <div className="absolute inset-0 z-50 flex items-end">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedItem(null)}
              className="absolute inset-0 bg-black"
            />

            {/* Content Drawer */}
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="bg-[#12100f] border-t border-white/15 rounded-t-[32px] w-full max-h-[90%] overflow-y-auto relative z-10 flex flex-col"
            >
              {/* Top notch indicator */}
              <div className="flex justify-center py-2.5">
                <div className="w-12 h-1.5 bg-white/10 rounded-full"></div>
              </div>

              {/* Close button */}
              <button 
                onClick={() => setSelectedItem(null)}
                className="absolute top-4 right-4 p-1.5 bg-white/5 hover:bg-white/10 rounded-full text-zinc-400 cursor-pointer border border-white/5"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="p-5 space-y-6">
                <div>
                  <h3 className="font-cairo font-bold text-[18px] text-white">{selectedItem.nameAr}</h3>
                  <p className="text-xs text-zinc-500 font-sans mt-0.5">{selectedItem.name}</p>
                  <p className="text-xs text-zinc-300 font-cairo mt-2 bg-white/5 p-3 rounded-xl border border-white/5">
                    {selectedItem.descriptionAr}
                  </p>
                </div>

                {/* Option: Sizes */}
                {selectedItem.options.sizes && selectedItem.options.sizes.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-xs font-cairo font-bold text-zinc-300 flex justify-between">
                      <span>اختر الحجم</span>
                      <span className="text-zinc-500">Select Size</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedItem.options.sizes.map((size) => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => setCustomSize(size)}
                          className={`py-2 px-3 border rounded-xl text-xs font-cairo text-center transition-colors cursor-pointer font-semibold ${
                            customSize === size
                              ? "border-amber-600 bg-amber-600 text-white"
                              : "border-white/10 text-zinc-300 hover:bg-white/5"
                          }`}
                        >
                          {size === "Double" ? "دبل" : size === "Single" ? "سنجل" : size === "Large" ? "كبير (Large)" : "وسط (Medium)"}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Option: Sugar Level */}
                {selectedItem.options.sugarLevels && selectedItem.options.sugarLevels.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-xs font-cairo font-bold text-zinc-300 flex justify-between">
                      <span>درجة الحلاوة (السكر)</span>
                      <span className="text-zinc-500">Sugar level</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {selectedItem.options.sugarLevels.map((sugar) => (
                        <button
                          key={sugar}
                          type="button"
                          onClick={() => setCustomSugar(sugar)}
                          className={`py-2 px-1 border rounded-xl text-[10px] font-cairo text-center transition-all cursor-pointer font-semibold ${
                            customSugar === sugar
                              ? "border-amber-600 bg-amber-650/20 text-amber-300 ring-1 ring-amber-500"
                              : "border-white/10 text-zinc-300 hover:bg-white/5"
                          }`}
                        >
                          {sugar === "No Sugar" ? "بدون سكر" : sugar === "Medium Sugar" ? "سكر مضبوط" : "سكر زيادة"}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Option: Milk types */}
                {selectedItem.options.milkTypes && selectedItem.options.milkTypes.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-xs font-cairo font-bold text-zinc-300 flex justify-between">
                      <span>نوع الحليب الإضافي</span>
                      <span className="text-zinc-500">Milk upgrade</span>
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {selectedItem.options.milkTypes.map((milk) => (
                        <button
                          key={milk}
                          type="button"
                          onClick={() => setCustomMilk(milk)}
                          className={`py-2 px-0.5 border rounded-xl text-[10px] font-cairo text-center transition-colors cursor-pointer font-semibold leading-tight ${
                            customMilk === milk
                              ? "border-amber-600 bg-amber-600 text-white"
                              : "border-white/10 text-zinc-300 hover:bg-white/5"
                          }`}
                        >
                          {milk.includes("Oat") ? "حليب شوفان (+10)" : milk.includes("Almond") ? "حليب لوز (+10)" : "حليب طبيعي"}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes box */}
                <div className="space-y-2">
                  <label className="text-xs font-cairo font-bold text-zinc-300 flex justify-between">
                    <span>ملاحظات خاصة (مثل: بدون ثلج، تخمير خفيف)</span>
                    <span className="text-zinc-500">Special Notes</span>
                  </label>
                  <textarea
                    rows={2}
                    value={customNotes}
                    onChange={(e) => setCustomNotes(e.target.value)}
                    placeholder="اكتب طلبك الخاص هنا للباريستا..."
                    className="w-full text-xs font-cairo border border-white/10 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white/5 text-white placeholder-zinc-500"
                  />
                </div>

                {/* Quantity and Submit Action */}
                <div className="flex items-center justify-between border-t border-white/10 pt-5 mt-4">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      disabled={customQty <= 1}
                      onClick={() => setCustomQty(q => q - 1)}
                      className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-white disabled:opacity-30 cursor-pointer border border-white/5"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="font-mono font-bold text-white">{customQty}</span>
                    <button
                      type="button"
                      onClick={() => setCustomQty(q => q + 1)}
                      className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-white cursor-pointer border border-white/5"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    onClick={addToCart}
                    className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-cairo font-bold px-5 py-3 rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <span>إضافة إلى سلتك</span>
                    <span>•</span>
                    <span className="font-mono">{getCustomizedItemPrice() * customQty} EGP</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* COMPONENT 4: Full shopping bag checkout panel */}
      <AnimatePresence>
        {isCartOpen && (
          <div className="absolute inset-0 z-50 flex items-end">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="absolute inset-0 bg-black"
            />

            {/* Content Sheets */}
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="bg-[#12100f] border-t border-white/15 rounded-t-[32px] w-full max-h-[92%] relative z-10 flex flex-col h-[600px]"
            >
              {/* Top Handle */}
              <div className="flex justify-center py-2.5 flex-shrink-0">
                <div className="w-12 h-1.5 bg-white/10 rounded-full"></div>
              </div>

              {/* Close and Headers */}
              <div className="px-5 pb-3 border-b border-white/10 flex items-center justify-between flex-shrink-0">
                <h3 className="font-cairo font-bold text-lg text-white flex items-center gap-1.5">
                  <ShoppingBag className="w-5 h-5 text-amber-500" /> سلة مشروباتك
                </h3>
                <button 
                  onClick={() => setIsCartOpen(false)}
                  className="p-1 bg-white/5 hover:bg-white/10 rounded-full text-zinc-400 cursor-pointer border border-white/5"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Cart items list */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {cart.map((item) => (
                  <div key={item.id} className="relative bg-white/5 rounded-2xl p-4 border border-white/5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between">
                        <h4 className="font-cairo font-bold text-[14px] text-white">{item.nameAr}</h4>
                        <span className="font-mono text-amber-400 font-bold text-xs">{item.price * item.quantity} ج.م</span>
                      </div>
                      <p className="text-[10px] text-zinc-500 font-sans">{item.name}</p>
                      
                      {/* Configuration strings */}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {item.size && <span className="text-[9px] bg-white/10 text-zinc-250 px-1.5 py-0.5 rounded">الحجم: {item.size === "Medium" ? "وسط" : item.size === "Large" ? "كبير" : item.size}</span>}
                        {item.sugar && <span className="text-[9px] bg-amber-600/20 text-amber-300 px-1.5 py-0.5 rounded">السكر: {item.sugar === "No Sugar" ? "بدون سكر" : item.sugar === "Medium Sugar" ? "مضبوط" : "زيادة"}</span>}
                        {item.milk && <span className="text-[9px] bg-blue-600/20 text-blue-300 px-1.5 py-0.5 rounded">{item.milk.includes("Oat") ? "شوفان" : "لوز"}</span>}
                      </div>

                      {item.notes && (
                        <div className="bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/5 text-[10px] font-cairo text-zinc-300 mt-2.5">
                          💡 <span className="font-bold text-white">تنبيه المطبخ:</span> {item.notes}
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-center mt-3 border-t border-white/5 pt-2.5">
                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className="text-[10px] font-cairo font-semibold text-red-400 hover:text-red-500 cursor-pointer"
                      >
                        حذف / Remove
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateCartQty(item.id, -1)}
                          className="p-1 bg-white/5 hover:bg-white/10 text-white rounded cursor-pointer border border-white/5"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-mono text-xs font-bold px-1.5">{item.quantity}</span>
                        <button
                          onClick={() => updateCartQty(item.id, 1)}
                          className="p-1 bg-white/5 hover:bg-white/10 text-white rounded cursor-pointer border border-white/5"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Confirmation and Name Form */}
              <form onSubmit={handlePlaceOrder} className="border-t border-white/10 p-5 bg-[#12100f] flex-shrink-0 space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-cairo font-bold text-zinc-300 flex justify-between">
                    <span>الاسم الكريم للنداء بوضوح (مثال: أسامة)</span>
                    <span className="text-zinc-500">Your Name</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="اكتب اسمك من فضلك..."
                    className="w-full text-xs font-cairo bg-white/5 text-white border border-white/10 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-amber-500 placeholder-zinc-500"
                  />
                </div>

                <div className="flex justify-between items-center text-xs font-bold text-zinc-300 py-1 font-cairo">
                  <span>إجمالي الحساب / Grand Total</span>
                  <span className="font-mono text-lg text-amber-400">{getCartTotal()} EGP</span>
                </div>

                <button
                  type="submit"
                  disabled={submittingOrder}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-700/40 text-white font-cairo font-bold text-sm py-3.5 rounded-xl shadow cursor-pointer transition-colors text-center"
                >
                  {submittingOrder ? (
                    <div className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin inline-block"></span>
                      <span>جاري إرسال طلبك الآن...</span>
                    </div>
                  ) : (
                    "إرسال الطلب للمطبخ فوراً / Place Order"
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

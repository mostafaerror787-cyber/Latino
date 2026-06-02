import { useState, useEffect, useRef } from "react";
import { Order } from "./types";
import CustomerMenu from "./components/CustomerMenu";
import KitchenDashboard from "./components/KitchenDashboard";
import QRGenerator from "./components/QRGenerator";
import { Coffee, Columns, Monitor, Sparkles, MessageSquare, AlertCircle, QrCode, ArrowLeft } from "lucide-react";

export default function App() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [customerTable, setCustomerTable] = useState<string | null>(null);
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [wsStatus, setWsStatus] = useState<"connecting" | "connected" | "disconnected">("connecting");
  const [newOrderAlert, setNewOrderAlert] = useState(false);
  
  const wsRef = useRef<WebSocket | null>(null);

  // Synchronize state with both route paths AND URL query parameters
  useEffect(() => {
    const handleUrlChange = () => {
      setCurrentPath(window.location.pathname);
      const params = new URLSearchParams(window.location.search);
      const tableVal = params.get("table");
      if (tableVal) {
        setCustomerTable(tableVal);
      } else {
        const hashMatch = window.location.hash.match(/table=([A-Za-z0-9]+)/);
        if (hashMatch) {
          setCustomerTable(hashMatch[1]);
        } else {
          setCustomerTable(null);
        }
      }
    };
    handleUrlChange();
    window.addEventListener("popstate", handleUrlChange);
    return () => window.removeEventListener("popstate", handleUrlChange);
  }, []);

  // Simple custom router navigator
  const navigate = (path: string, search = "") => {
    window.history.pushState({}, "", path + search);
    setCurrentPath(path);
    const params = new URLSearchParams(search);
    const tableVal = params.get("table");
    setCustomerTable(tableVal);
  };

  // Fetch initial orders
  const fetchOrders = () => {
    fetch("/api/orders")
      .then(res => res.json())
      .then(data => {
        setOrders(data);
      })
      .catch(err => console.error("Error fetching orders:", err));
  };

  // Fetch initial menu items
  const fetchMenu = () => {
    fetch("/api/menu")
      .then(res => res.json())
      .then(data => {
        setMenuItems(data);
      })
      .catch(err => console.error("Error fetching menu:", err));
  };

  // Add menu item API handler
  const handleAddMenuItem = async (itemData: any) => {
    try {
      const response = await fetch("/api/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(itemData)
      });
      if (response.ok) {
        const data = await response.json();
        setMenuItems(prev => {
          // Prevent duplicates
          if (prev.some(item => item.id === data.item.id)) return prev;
          return [...prev, data.item];
        });
        return true;
      }
    } catch (err) {
      console.error("Error adding product:", err);
    }
    return false;
  };

  // Delete menu item API handler
  const handleDeleteMenuItem = async (id: string) => {
    try {
      const response = await fetch(`/api/menu/${id}`, {
        method: "DELETE"
      });
      if (response.ok) {
        setMenuItems(prev => prev.filter(item => item.id !== id));
        return true;
      }
    } catch (err) {
      console.error("Error deleting product:", err);
    }
    return false;
  };

  useEffect(() => {
    fetchOrders();
    fetchMenu();
  }, []);

  // Setup Real-time WebSockets with Auto-Reconnect and Polling Fallback
  useEffect(() => {
    let reconnectTimeout: NodeJS.Timeout;
    let fallbackInterval: NodeJS.Timeout;

    const connectWebSocket = () => {
      setWsStatus("connecting");
      
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}`;
      console.log(`Connecting to WebSocket: ${wsUrl}`);

      const socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        console.log("WebSocket connected successfully!");
        setWsStatus("connected");
        // Clear any polling fallback when socket is up
        if (fallbackInterval) clearInterval(fallbackInterval);
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("WebSocket message received:", data);

          if (data.type === "order_created") {
            // New order placed!
            setOrders(prev => {
              // Deduplicate
              if (prev.some(o => o.id === data.order.id)) return prev;
              return [data.order, ...prev];
            });
            setNewOrderAlert(true);
          } else if (data.type === "order_updated") {
            // Cooking status updated!
            setOrders(prev => {
              return prev.map(o => o.id === data.id ? { ...o, status: data.status, updatedAt: data.order.updatedAt } : o);
            });
          } else if (data.type === "menu_updated") {
            // Real-time menu items update
            setMenuItems(data.menu);
          } else if (data.type === "data_reset") {
            fetchOrders();
            fetchMenu();
          }
        } catch (e) {
          console.error("Error parsing socket JSON data:", e);
        }
      };

      socket.onclose = () => {
        console.log("WebSocket connection closed. Attempting reconnect...");
        setWsStatus("disconnected");
        // Setup simple polling every 5s as robust backup
        fallbackInterval = setInterval(fetchOrders, 4000);
        reconnectTimeout = setTimeout(connectWebSocket, 5000);
      };

      socket.onerror = (err) => {
        console.error("WebSocket connection error:", err);
        socket.close();
      };
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) wsRef.current.close();
      clearTimeout(reconnectTimeout);
      clearInterval(fallbackInterval);
    };
  }, []);

  // API Trigger: Update order status (Kitchen action)
  const updateOrderStatus = async (id: string, newStatus: Order["status"]) => {
    try {
      const response = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error("Failed to patch status");
      }

      const data = await response.json();
      if (data.success) {
        // Optimistically update locally
        setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
      }
    } catch (err) {
      console.error("Error updating order status:", err);
    }
  };

  // API Trigger: Reset system orders for demo
  const resetDemoOrders = async () => {
    try {
      const response = await fetch("/api/orders/reset", {
        method: "POST"
      });
      if (response.ok) {
        fetchOrders();
      }
    } catch (err) {
      console.error("Error resetting demo:", err);
    }
  };

  // Callback when a customer successfully checks out on their mobile client
  const handleCustomerOrderPlaced = (newOrder: Order) => {
    setOrders(prev => [newOrder, ...prev]);
  };

  // --- RENDER PAGE 1: KITCHEN DISPLAY ROUTE (/kitchen) ---
  if (currentPath === "/kitchen") {
    return (
      <div className="min-h-screen bg-[#070505] text-white flex flex-col relative overflow-hidden font-sans">
        {/* Dynamic ambient accents */}
        <div className="absolute top-[-100px] left-[-100px] w-[450px] h-[450px] bg-[#d97706] rounded-full blur-[140px] opacity-15 pointer-events-none z-0"></div>
        <div className="absolute bottom-[-100px] right-[-100px] w-[500px] h-[500px] bg-[#7c2d12] rounded-full blur-[140px] opacity-25 pointer-events-none z-0"></div>

        <header className="bg-black/40 border-b border-white/10 px-6 py-4 sticky top-0 z-50 backdrop-blur-md flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-700 rounded-xl flex items-center justify-center border border-amber-500/30 shadow-md text-white">
              <Coffee className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-cairo font-bold text-lg text-white">Mostafa Coffee Shop - شاشة المطبخ الذكية</h1>
              <p className="text-[11px] text-zinc-400 font-sans">Full Screen Real-time Barista Terminal • Mostafa Coffee Shop</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate("/")}
              className="text-xs bg-white/5 border border-white/10 px-4 py-2 rounded-xl hover:bg-white/10 text-zinc-200 cursor-pointer font-cairo transition-all"
            >
              العودة للرئيسية 🏠
            </button>
            <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl">
              <span className={`w-2 h-2 rounded-full ${wsStatus === "connected" ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
              <span className="text-xs font-mono font-semibold text-amber-500 uppercase">{wsStatus}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-6 py-6 flex flex-col relative z-10">
          <KitchenDashboard 
            orders={orders}
            onUpdateStatus={updateOrderStatus}
            onResetDemo={resetDemoOrders}
            newOrderAlert={newOrderAlert}
            onClearAlert={() => setNewOrderAlert(false)}
            menuItems={menuItems}
            onAddMenuItem={handleAddMenuItem}
            onDeleteMenuItem={handleDeleteMenuItem}
          />
        </main>
      </div>
    );
  }

  // --- RENDER PAGE 2: QR GENERATOR & TABLES DISPLAY ROUTE (/admin) ---
  if (currentPath === "/admin") {
    return (
      <div className="min-h-screen bg-[#070505] text-white flex flex-col relative overflow-hidden font-sans">
        {/* Dynamic ambient accents */}
        <div className="absolute top-[-100px] left-[-100px] w-[450px] h-[450px] bg-[#d97706] rounded-full blur-[140px] opacity-15 pointer-events-none z-0"></div>
        <div className="absolute bottom-[-100px] right-[-100px] w-[500px] h-[500px] bg-[#7c2d12] rounded-full blur-[140px] opacity-25 pointer-events-none z-0"></div>

        <header className="bg-black/40 border-b border-white/10 px-6 py-4 sticky top-0 z-50 backdrop-blur-md flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-700 rounded-xl flex items-center justify-center border border-amber-500/30 shadow-md text-white">
              <Coffee className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-cairo font-bold text-lg text-white font-sans">Mostafa Coffee Shop - لوحة طباعة الـ QR والإدارة</h1>
              <p className="text-[11px] text-zinc-400 font-sans">View & Print Table QR Codes for Mostafa Coffee Shop</p>
            </div>
          </div>
          <button 
            onClick={() => navigate("/")}
            className="text-xs bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-zinc-200 hover:bg-white/10 cursor-pointer font-cairo transition-all"
          >
            العودة للرئيسية 🏠
          </button>
        </header>

        <main className="flex-1 max-w-5xl w-full mx-auto px-4 md:px-6 py-6 flex flex-col relative z-10 animate-fade-in">
          <QRGenerator onSelectTable={(id) => navigate("/", `?table=${id}`)} />
        </main>
      </div>
    );
  }

  // --- RENDER PAGE 3: CUSTOMER / VISITOR LANDING ROUTE (/) ---
  if (customerTable) {
    return (
      <div className="min-h-screen bg-[#0f0c0b] flex items-center justify-center p-0 md:p-6 relative overflow-hidden font-sans">
        {/* Glow decorative background elements */}
        <div className="absolute top-[-100px] left-[-100px] w-[350px] h-[350px] bg-[#d97706] rounded-full blur-[120px] opacity-15 pointer-events-none z-0"></div>
        <div className="absolute bottom-[-100px] right-[-100px] w-[400px] h-[400px] bg-[#7c2d12] rounded-full blur-[120px] opacity-25 pointer-events-none z-0"></div>

        <div className="relative z-10 w-full flex items-center justify-center font-sans">
          <CustomerMenu 
            tableId={customerTable}
            orders={orders}
            onOrderPlaced={handleCustomerOrderPlaced}
            onBack={undefined}
            menuItems={menuItems}
          />
        </div>
      </div>
    );
  }

  // Default Home portal if customer is at "/" with no table selected
  return (
    <div className="min-h-screen bg-[#070505] text-white flex flex-col relative overflow-hidden font-sans">
      {/* Decorative background glow */}
      <div className="absolute top-[-120px] left-[-120px] w-[400px] h-[400px] bg-[#d97706] rounded-full blur-[130px] opacity-20 pointer-events-none z-0"></div>
      <div className="absolute bottom-[-120px] right-[-120px] w-[450px] h-[450px] bg-[#7c2d12] rounded-full blur-[130px] opacity-25 pointer-events-none z-0"></div>

      {/* Café Latino Welcome Hub */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10 max-w-2xl mx-auto w-full text-center py-12">
        
        {/* Logo / Icon */}
        <div className="w-24 h-24 bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-800 rounded-[28px] flex flex-col items-center justify-center shadow-2xl shadow-amber-500/20 mb-6 border-2 border-amber-400/50 animate-pulse" style={{ animationDuration: '4s' }}>
          <Coffee className="w-10 h-10 text-white stroke-[1.5]" />
          <span className="text-[10px] font-mono font-extrabold text-amber-200 mt-1 uppercase tracking-widest">MCS</span>
        </div>

        {/* Café Name */}
        <h1 className="font-cairo font-extrabold text-4xl text-white tracking-wide mb-2">
          Mostafa Coffee Shop • مصطفى كوفي شوب
        </h1>
        <div className="inline-block mt-1">
          <span className="text-[11px] bg-amber-600/20 text-amber-400 border border-amber-600/35 px-3 py-1 rounded-full font-bold font-cairo">
            نظام الخدمة الذاتية بالـ QR والمطبخ الذكي
          </span>
        </div>

        {/* Portal choice title */}
        <p className="mt-4 text-zinc-400 font-cairo text-sm max-w-md">
          أهلاً بك في لوحة تحكّم Mostafa Coffee Shop الذكية. يرجى اختيار القسم المطلوب لمباشرة العمل ومتابعة الطلبات:
        </p>

        {/* Administration portal cards */}
        <div className="w-full mt-10 grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-xl">
          {/* Card 1: Kitchen Screen */}
          <button
            onClick={() => navigate("/kitchen")}
            className="group relative bg-white/5 border border-white/10 hover:border-amber-500/40 rounded-3xl p-6 text-right transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] cursor-pointer shadow-xl overflow-hidden"
          >
            {/* Ambient hover glow */}
            <div className="absolute top-[-20px] left-[-20px] w-24 h-24 bg-amber-600/10 rounded-full blur-2xl group-hover:bg-amber-600/20 transition-all pointer-events-none"></div>
            
            <div className="flex items-center gap-4">
              <div className="p-4 bg-amber-600/20 border border-amber-600/30 rounded-2xl text-amber-500 group-hover:bg-amber-600/30 group-hover:scale-110 transition-all duration-300 shrink-0">
                <Coffee className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="font-cairo font-bold text-lg text-white group-hover:text-amber-400 transition-colors">
                  💻 شاشة باريستا المطبخ
                </h3>
                <p className="font-cairo text-xs text-zinc-400 leading-relaxed">
                  متابعة وتحديث الطلبات الواردة من الطاولات فورياً مع دعم الإشعارات الصوتية والتحكم اللحظي.
                </p>
              </div>
            </div>
          </button>

          {/* Card 2: Admin QR Board */}
          <button
            onClick={() => navigate("/admin")}
            className="group relative bg-white/5 border border-white/10 hover:border-amber-500/40 rounded-3xl p-6 text-right transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] cursor-pointer shadow-xl overflow-hidden"
          >
            {/* Ambient hover glow */}
            <div className="absolute top-[-20px] left-[-20px] w-24 h-24 bg-amber-600/10 rounded-full blur-2xl group-hover:bg-amber-600/20 transition-all pointer-events-none"></div>
            
            <div className="flex items-center gap-4">
              <div className="p-4 bg-amber-600/20 border border-amber-600/30 rounded-2xl text-amber-500 group-hover:bg-amber-600/30 group-hover:scale-110 transition-all duration-300 shrink-0">
                <QrCode className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="font-cairo font-bold text-lg text-white group-hover:text-amber-400 transition-colors">
                  🖨️ إدارة وطباعة الـ QR
                </h3>
                <p className="font-cairo text-xs text-zinc-400 leading-relaxed">
                  توليد وطباعة ملصقات الرموز الذكية (QR) لجميع طاولات الصالة وتسهيل وصول طلبات الزبائن.
                </p>
              </div>
            </div>
          </button>
        </div>

      </div>

      {/* Discrete footer for administrative operations */}
      <footer className="py-6 px-6 text-center border-t border-white/5 text-[11px] text-zinc-500 font-cairo mt-auto flex flex-col sm:flex-row items-center justify-between gap-4 max-w-4xl mx-auto w-full relative z-20">
        <span>منظومة Mostafa Coffee Shop لإدارة الطاولات الذكية QR • {new Date().getFullYear()}</span>
        <div className="flex items-center gap-3 text-[10px] text-zinc-600">
          <button 
            onClick={() => navigate("/kitchen")} 
            className="hover:text-amber-500 transition-colors cursor-pointer"
          >
            💼 شاشة باريستا المطبخ
          </button>
          <span>|</span>
          <button 
            onClick={() => navigate("/admin")} 
            className="hover:text-amber-500 transition-colors cursor-pointer"
          >
            🖨️ إدارة الطاولات وطباعة الـ QR
          </button>
        </div>
      </footer>
    </div>
  );
}

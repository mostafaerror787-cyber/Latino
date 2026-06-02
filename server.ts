import express from "express";
import http from "http";
import { WebSocketServer, WebSocket } from "ws";
import path from "path";
import { createServer as createViteServer } from "vite";

// Define Café interfaces
interface MenuItem {
  id: string;
  name: string;
  nameAr: string;
  category: "coffee" | "tea_matcha" | "sweets" | "mojitos_cold";
  price: number;
  description: string;
  descriptionAr: string;
  image: string;
  options: {
    sizes?: string[];
    sugarLevels?: string[];
    milkTypes?: string[];
  };
}

interface OrderItem {
  id: string; // MenuItem ID
  name: string;
  nameAr: string;
  price: number;
  quantity: number;
  size?: string;
  sugar?: string;
  milk?: string;
  notes?: string;
}

interface Order {
  id: string;
  tableNumber: string | number;
  customerName: string;
  items: OrderItem[];
  total: number;
  status: "pending" | "preparing" | "ready" | "completed" | "cancelled";
  createdAt: string;
  updatedAt: string;
}

// Initial Menu items
let MENU_ITEMS: MenuItem[] = [
  {
    id: "espresso",
    name: "Espresso",
    nameAr: "إسبريسو",
    category: "coffee",
    price: 35,
    description: "Rich and bold single shot of premium coffee beans.",
    descriptionAr: "جرعة غنية ومركزة من حبوب البن الفاخرة.",
    image: "https://images.unsplash.com/photo-151097252790b-af4f42df8e98?auto=format&fit=crop&q=80&w=500",
    options: { sizes: ["Single", "Double"] }
  },
  {
    id: "latte",
    name: "Caffè Latte",
    nameAr: "لاتيه كافيه",
    category: "coffee",
    price: 55,
    description: "Espresso milk coffee with a silky smooth layer of foam.",
    descriptionAr: "إسبريسو مع حليب ساخن وطبقة حريرية من رغوة الحليب.",
    image: "https://images.unsplash.com/photo-1570968915860-54d5c301fc9f?auto=format&fit=crop&q=80&w=500",
    options: { sizes: ["Medium", "Large"], sugarLevels: ["No Sugar", "Medium Sugar", "Extra Sugar"], milkTypes: ["Regular Milk", "Oat Milk (+10)", "Almond Milk (+10)"] }
  },
  {
    id: "cappuccino",
    name: "Cappuccino",
    nameAr: "كابتشينو",
    category: "coffee",
    price: 50,
    description: "Perfect harmony of espresso, steamed milk, and rich foam layer.",
    descriptionAr: "تناغم مثالي بين الإسبريسو، الحليب المبخر ورغوة غنية.",
    image: "https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&q=80&w=500",
    options: { sizes: ["Medium", "Large"], sugarLevels: ["No Sugar", "Medium Sugar", "Extra Sugar"], milkTypes: ["Regular Milk", "Oat Milk (+10)", "Almond Milk (+10)"] }
  },
  {
    id: "spanish-latte",
    name: "Spanish Latte",
    nameAr: "سبانش لاتيه",
    category: "coffee",
    price: 60,
    description: "Sweetened condensed milk combined with smooth espresso and cold milk.",
    descriptionAr: "حليب مكثف محلى مع إسبريسو رائع وحليب بارد ممتع.",
    image: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&q=80&w=500",
    options: { sizes: ["Medium", "Large"], sugarLevels: ["No Sugar", "Medium Sugar", "Extra Sugar"], milkTypes: ["Regular Milk", "Oat Milk (+10)"] }
  },
  {
    id: "matcha",
    name: "Matcha Latte",
    nameAr: "ماتشا لاتيه",
    category: "tea_matcha",
    price: 65,
    description: "Premium pure Japanese ceremonial matcha whisked with creamy steaming milk.",
    descriptionAr: "شاي الماتشا الياباني الاحتفالي الفاخر مخفوق مع حليب كريمي غني.",
    image: "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&q=80&w=500",
    options: { sizes: ["Medium", "Large"], sugarLevels: ["No Sugar", "Medium Sugar", "Extra Sugar"], milkTypes: ["Regular Milk", "Oat Milk (+10)", "Almond Milk (+10)"] }
  },
  {
    id: "peach-tea",
    name: "Peach Iced Tea",
    nameAr: "شاي مثلج بالخوخ",
    category: "tea_matcha",
    price: 45,
    description: "Crisp black tea base brewed fresh and infused with sweet peach juice & ice.",
    descriptionAr: "شاي أسود طازج مبرد بنكهة الخوخ اللذيذة والمنعشة مع الثلج.",
    image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=500",
    options: { sizes: ["Regular", "Large"] }
  },
  {
    id: "croissant",
    name: "Butter Croissant",
    nameAr: "كرواسون زبدة",
    category: "sweets",
    price: 40,
    description: "Flaky, buttery French pastry served warm.",
    descriptionAr: "مخبوزات فرنسية هشة ولذيذة غنية بالزبدة ويقدم ساخناً.",
    image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&q=80&w=500",
    options: {}
  },
  {
    id: "brownie",
    name: "Fudge Chocolate Brownie",
    nameAr: "براوني الشوكولاتة",
    category: "sweets",
    price: 48,
    description: "Warm fudgy chocolate brownie topped with chocolate chips.",
    descriptionAr: "قطعة براوني غنية بالشوكولاتة الساخنة وقطع الشوكولاتة الداكنة.",
    image: "https://images.unsplash.com/photo-1564355808539-22fda35bed7e?auto=format&fit=crop&q=80&w=500",
    options: {}
  },
  {
    id: "strawberry-mojito",
    name: "Strawberry Mojito",
    nameAr: "موخيتو الفراولة",
    category: "mojitos_cold",
    price: 50,
    description: "Invigorating blend of fresh mint, fresh strawberries, lime, and soda.",
    descriptionAr: "مزيج منعش من النعناع الطازج، الفراولة الحلوة، الليمون والصودا.",
    image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=500",
    options: { sizes: ["Regular", "Large"] }
  }
];

// Active server orders in-memory
let orders: Order[] = [];

// Helper to generate a cute Egyptian cafe Order ID (e.g. C-101)
let orderCounter = 101;
function generateOrderId() {
  const code = orderCounter++;
  return `C-${code}`;
}

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server });
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // Track connected WebSocket clients
  const activeSockets = new Set<WebSocket>();

  wss.on("connection", (ws) => {
    activeSockets.add(ws);
    console.log(`WebSocket client connected. Total: ${activeSockets.size}`);

    // Send initial ping or immediate data to establish connection
    ws.send(JSON.stringify({ type: "connection_established", message: "Ahlan! Connected to QR Café Server." }));

    ws.on("close", () => {
      activeSockets.delete(ws);
      console.log(`WebSocket client disconnected. Total: ${activeSockets.size}`);
    });

    ws.on("error", (err) => {
      console.error("WebSocket socket error:", err);
      activeSockets.delete(ws);
    });
  });

  // Broadcast helper
  function broadcastToAll(message: any) {
    const payload = JSON.stringify(message);
    for (const ws of activeSockets) {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(payload);
        } catch (e) {
          console.error("Failed to send ws message:", e);
        }
      }
    }
  }

  // --- API Routes ---

  // Get Cafe Menu
  app.get("/api/menu", (req, res) => {
    res.json(MENU_ITEMS);
  });

  // Add New Menu Item
  app.post("/api/menu", (req, res) => {
    const { name, nameAr, category, price, description, descriptionAr, image, options } = req.body;

    if (!name || !nameAr || !price || !category) {
      return res.status(400).json({ error: "Name (EN/AR), Category, and Price are required fields." });
    }

    const newItem: MenuItem = {
      id: `item-${Date.now()}`,
      name,
      nameAr,
      category,
      price: Number(price),
      description: description || "",
      descriptionAr: descriptionAr || "",
      image: image || "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=500",
      options: options || {}
    };

    MENU_ITEMS.push(newItem);

    // Broadcast menu change to all connected tabs
    broadcastToAll({
      type: "menu_updated",
      menu: MENU_ITEMS
    });

    res.status(201).json({ success: true, item: newItem });
  });

  // Delete Menu Item
  app.delete("/api/menu/:id", (req, res) => {
    const { id } = req.params;
    const initialLen = MENU_ITEMS.length;
    MENU_ITEMS = MENU_ITEMS.filter(item => item.id !== id);

    if (MENU_ITEMS.length === initialLen) {
      return res.status(404).json({ error: "Item not found" });
    }

    broadcastToAll({
      type: "menu_updated",
      menu: MENU_ITEMS
    });

    res.json({ success: true, message: "Item deleted successfully" });
  });

  // Get Active Orders
  app.get("/api/orders", (req, res) => {
    res.json(orders);
  });

  // Submit New Order
  app.post("/api/orders", (req, res) => {
    const { tableNumber, customerName, items, total } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ error: "Order items cannot be empty" });
    }

    const newOrder: Order = {
      id: generateOrderId(),
      tableNumber: tableNumber || "Takeaway",
      customerName: customerName || "زبون الكافيه",
      items,
      total: total || items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0),
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    orders.unshift(newOrder); // Add to the front so newest orders pop up first

    // Real-time broadast to Kitchen and other views
    broadcastToAll({
      type: "order_created",
      order: newOrder
    });

    res.status(201).json({ success: true, order: newOrder });
  });

  // Update Order Status (e.g. Cooking, Served, Completed)
  app.patch("/api/orders/:id", (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["pending", "preparing", "ready", "completed", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    const orderIndex = orders.findIndex(o => o.id === id);
    if (orderIndex === -1) {
      return res.status(404).json({ error: "Order not found" });
    }

    orders[orderIndex].status = status;
    orders[orderIndex].updatedAt = new Date().toISOString();

    const updatedOrder = orders[orderIndex];

    // Real-time broadcast notification of state changes
    broadcastToAll({
      type: "order_updated",
      id: updatedOrder.id,
      status: updatedOrder.status,
      order: updatedOrder
    });

    res.json({ success: true, order: updatedOrder });
  });

  // Clear all orders in active memory
  app.post("/api/orders/reset", (req, res) => {
    orders = [];
    orderCounter = 101;

    broadcastToAll({ type: "data_reset" });
    res.json({ success: true, message: "تم تصفير جميع الطلبات بنجاح." });
  });

  // --- Vite & Production Static Files ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`QR Café full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Fatal error starting QR Café server:", error);
});

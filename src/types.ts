export interface MenuItem {
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

export interface OrderItem {
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

export interface Order {
  id: string;
  tableNumber: string | number;
  customerName: string;
  items: OrderItem[];
  total: number;
  status: "pending" | "preparing" | "ready" | "completed" | "cancelled";
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  type: string;
  typeNameAr: string;
  description: string;
  details?: string;
}


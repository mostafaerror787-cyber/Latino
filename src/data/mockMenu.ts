import { MenuItem } from "../types";

export const DEFAULT_MENU_ITEMS: MenuItem[] = [
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

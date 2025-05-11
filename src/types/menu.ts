
export interface MenuItem {
  id: number;
  name: string;
  price: number;
  category: string;
  modifications?: string[];
  modificationPrices?: { [key: string]: number };
  ingredients?: string[];
}

// OrderItem in tables/[tableId]/page.tsx already has its own specific definition
// which includes orderItemId, quantity, basePrice, finalPrice, etc.
// We will keep that definition local to the file that uses it to avoid over-complicating this shared type.
// If OrderItem needs to be shared more broadly with its specific fields, it can be defined here too.

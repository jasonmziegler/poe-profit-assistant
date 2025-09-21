export interface Character {
  id: string;
  name: string;
  level: number;
  class: string;
  league: string;
  items: Item[];
  skills: Skill[];
  experience: number;
  depth?: number;
  fetchedAt: Date;
  accountName?: string;
}

export interface Item {
  id: string;
  name: string;
  baseType: string;
  itemLevel: number;
  rarity: 'Normal' | 'Magic' | 'Rare' | 'Unique';
  category: string;
  sockets?: {
    total: number;
    links: number;
    colors: string;
  };
  mods: string[];
  implicitMods?: string[];
  explicitMods?: string[];
  corrupted: boolean;
  influences?: string[];
  stackSize?: number;
  identified: boolean;
}

export interface Skill {
  name: string;
  level: number;
  support: boolean;
}

export const ItemRarity = {
  Normal: 0,
  Magic: 1,
  Rare: 2,
  Unique: 3
} as const;

export const ItemCategory = {
  WEAPON: 'weapon',
  ARMOUR: 'armour',
  ACCESSORY: 'accessory',
  GEM: 'gem',
  CURRENCY: 'currency',
  MAP: 'map',
  FLASK: 'flask'
} as const;
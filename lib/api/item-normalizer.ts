import { Item } from '@/lib/types/character'
import { CharacterDetailsResponse } from './poe-client'

export interface NormalizedItemData {
  name: string
  baseType: string
  category: string
  subcategory?: string
  tier?: string
}

export class ItemNormalizer {
  private static readonly WEAPON_TYPES = new Map([
    ['One Hand Sword', 'weapon'],
    ['Two Hand Sword', 'weapon'],
    ['Sword', 'weapon'], // Add generic sword matcher
    ['One Hand Axe', 'weapon'],
    ['Two Hand Axe', 'weapon'],
    ['Axe', 'weapon'], // Add generic axe matcher
    ['One Hand Mace', 'weapon'],
    ['Two Hand Mace', 'weapon'],
    ['Mace', 'weapon'], // Add generic mace matcher
    ['Bow', 'weapon'],
    ['Staff', 'weapon'],
    ['Wand', 'weapon'],
    ['Dagger', 'weapon'],
    ['Claw', 'weapon'],
    ['Sceptre', 'weapon'],
  ])

  private static readonly ARMOUR_TYPES = new Map([
    ['Helmet', 'armour'],
    ['Body Armour', 'armour'],
    ['Gloves', 'armour'],
    ['Boots', 'armour'],
    ['Shield', 'armour'],
  ])

  private static readonly ACCESSORY_TYPES = new Map([
    ['Ring', 'accessory'],
    ['Amulet', 'accessory'],
    ['Belt', 'accessory'],
  ])

  private static readonly FLASK_TYPES = new Map([
    ['Life Flask', 'flask'],
    ['Mana Flask', 'flask'],
    ['Hybrid Flask', 'flask'],
    ['Utility Flask', 'flask'],
  ])

  static normalizeItems(rawItems: CharacterDetailsResponse['items']): Item[] {
    return rawItems.map((rawItem) => this.normalizeItem(rawItem))
  }

  static normalizeItem(rawItem: CharacterDetailsResponse['items'][0]): Item {
    const normalizedData = this.getNormalizedData(rawItem.typeLine, rawItem.baseType)

    return {
      id: rawItem.id,
      name: this.normalizeName(rawItem.name),
      baseType: normalizedData.baseType,
      itemLevel: rawItem.ilvl,
      rarity: this.getRarityFromFrameType(rawItem.frameType),
      category: normalizedData.category,
      sockets: this.normalizeSocketData(rawItem.sockets),
      mods: this.combineMods(rawItem),
      implicitMods: rawItem.implicitMods,
      explicitMods: rawItem.explicitMods,
      corrupted: rawItem.corrupted || false,
      identified: rawItem.identified,
    }
  }

  private static getNormalizedData(typeLine: string, baseType: string): NormalizedItemData {
    // Check weapons first
    for (const [weaponType, category] of Array.from(this.WEAPON_TYPES)) {
      if (typeLine.includes(weaponType) || baseType.includes(weaponType)) {
        return {
          name: this.extractItemName(typeLine),
          baseType: baseType || typeLine,
          category,
          subcategory: weaponType,
        }
      }
    }

    // Check armour
    for (const [armourType, category] of Array.from(this.ARMOUR_TYPES)) {
      if (typeLine.includes(armourType) || baseType.includes(armourType)) {
        return {
          name: this.extractItemName(typeLine),
          baseType: baseType || typeLine,
          category,
          subcategory: armourType,
        }
      }
    }

    // Check accessories
    for (const [accessoryType, category] of Array.from(this.ACCESSORY_TYPES)) {
      if (typeLine.includes(accessoryType) || baseType.includes(accessoryType)) {
        return {
          name: this.extractItemName(typeLine),
          baseType: baseType || typeLine,
          category,
          subcategory: accessoryType,
        }
      }
    }

    // Check flasks
    for (const [flaskType, category] of Array.from(this.FLASK_TYPES)) {
      if (typeLine.includes(flaskType) || baseType.includes(flaskType)) {
        return {
          name: this.extractItemName(typeLine),
          baseType: baseType || typeLine,
          category,
          subcategory: flaskType,
        }
      }
    }

    // Check for gems
    if (typeLine.includes('Gem') || baseType.includes('Gem')) {
      return {
        name: this.extractItemName(typeLine),
        baseType: baseType || typeLine,
        category: 'gem',
      }
    }

    // Check for maps
    if (typeLine.includes('Map') || baseType.includes('Map')) {
      return {
        name: this.extractItemName(typeLine),
        baseType: baseType || typeLine,
        category: 'map',
      }
    }

    // Default to currency
    return {
      name: this.extractItemName(typeLine),
      baseType: baseType || typeLine,
      category: 'currency',
    }
  }

  private static extractItemName(typeLine: string): string {
    // Remove common prefixes and suffixes
    let name = typeLine.trim()

    // Remove quality indicators
    name = name.replace(/Superior\s+/i, '')

    // Clean up common formatting
    name = name.replace(/\s+/g, ' ').trim()

    return name
  }

  private static normalizeName(name: string): string {
    if (!name) return ''

    // Clean up name formatting
    return name.trim().replace(/\s+/g, ' ')
  }

  private static getRarityFromFrameType(frameType: number): 'Normal' | 'Magic' | 'Rare' | 'Unique' {
    switch (frameType) {
      case 0:
        return 'Normal'
      case 1:
        return 'Magic'
      case 2:
        return 'Rare'
      case 3:
        return 'Unique'
      default:
        return 'Normal'
    }
  }

  private static normalizeSocketData(
    sockets?: Array<{ group: number; attr: string; sColour: string }>
  ): Item['sockets'] {
    if (!sockets || sockets.length === 0) {
      return undefined
    }

    const groups = new Map<number, number>()
    const colors: string[] = []

    for (const socket of sockets) {
      groups.set(socket.group, (groups.get(socket.group) || 0) + 1)
      colors.push(socket.sColour)
    }

    const maxLinks = Math.max(...Array.from(groups.values()), 0)

    return {
      total: sockets.length,
      links: maxLinks,
      colors: colors.join(''),
    }
  }

  private static combineMods(rawItem: CharacterDetailsResponse['items'][0]): string[] {
    const allMods: string[] = []

    if (rawItem.implicitMods) {
      allMods.push(...rawItem.implicitMods)
    }

    if (rawItem.explicitMods) {
      allMods.push(...rawItem.explicitMods)
    }

    if (rawItem.craftedMods) {
      allMods.push(...rawItem.craftedMods)
    }

    if (rawItem.enchantMods) {
      allMods.push(...rawItem.enchantMods)
    }

    return allMods
  }
}

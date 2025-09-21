import { z } from 'zod'
import { TradeListing, TradeFetchResponse } from '../types/trade'
import { Item, ItemRarity } from '../types/character'
import { ApiLogger } from '../utils/logger'

// Zod schema for validating trade API responses
const TradeItemSchema = z.object({
  verified: z.boolean().optional(),
  w: z.number().optional(), // width
  h: z.number().optional(), // height
  icon: z.string().optional(),
  league: z.string(),
  id: z.string(),
  name: z.string(),
  typeLine: z.string(),
  baseType: z.string().optional(),
  identified: z.boolean(),
  ilvl: z.number(),
  corrupted: z.boolean().optional().default(false),
  properties: z
    .array(
      z.object({
        name: z.string(),
        values: z.array(z.array(z.union([z.string(), z.number()]))),
        displayMode: z.number().optional(),
        type: z.number().optional(),
      })
    )
    .optional()
    .default([]),
  requirements: z
    .array(
      z.object({
        name: z.string(),
        values: z.array(z.array(z.union([z.string(), z.number()]))),
      })
    )
    .optional()
    .default([]),
  implicitMods: z.array(z.string()).optional().default([]),
  explicitMods: z.array(z.string()).optional().default([]),
  craftedMods: z.array(z.string()).optional().default([]),
  enchantMods: z.array(z.string()).optional().default([]),
  frameType: z.number(), // 0=normal, 1=magic, 2=rare, 3=unique
  sockets: z
    .array(
      z.object({
        group: z.number(),
        attr: z.string(), // S, D, I (Str, Dex, Int)
        sColour: z.string(), // R, G, B, W (Red, Green, Blue, White)
      })
    )
    .optional()
    .default([]),
  stackSize: z.number().optional(),
  maxStackSize: z.number().optional(),
  influences: z.record(z.boolean()).optional(),
})

const TradeFetchItemSchema = z.object({
  id: z.string(),
  listing: z.object({
    method: z.string(),
    indexed: z.string(),
    stash: z
      .object({
        name: z.string(),
        x: z.number(),
        y: z.number(),
      })
      .optional(),
    whisper: z.string().optional(), // whisper can be undefined
    account: z.object({
      name: z.string(),
      online: z
        .union([
          z.object({
            league: z.string(),
          }),
          z.boolean(), // online can be a boolean instead of object
        ])
        .optional(),
      lastCharacterName: z.string().optional(),
    }),
    price: z
      .object({
        type: z.string(),
        amount: z.number(),
        currency: z.string(),
      })
      .optional(),
  }),
  item: TradeItemSchema,
})

const TradeFetchResponseSchema = z.object({
  result: z.array(TradeFetchItemSchema),
})

// Currency conversion rates (relative to chaos orbs)
// These should be updated regularly or fetched from currency API
const CURRENCY_RATES: Record<string, number> = {
  chaos: 1,
  divine: 180, // 1 divine = ~180 chaos (example rate)
  exalt: 120, // 1 exalt = ~120 chaos (example rate)
  mirror: 500000, // 1 mirror = ~500k chaos (example rate)
  alch: 0.25, // 4 alchs = 1 chaos
  fusing: 0.5, // 2 fusings = 1 chaos
  vaal: 1, // 1 vaal = 1 chaos
  ancient: 0.1, // 10 ancients = 1 chaos
  blessed: 0.5, // 2 blessed = 1 chaos
  chromatic: 0.1, // 10 chromatics = 1 chaos
  jewellers: 0.1, // 10 jewellers = 1 chaos
  chisel: 0.2, // 5 chisels = 1 chaos
}

export interface ParsedPriceData {
  listings: TradeListing[]
  totalFound: number
  averagePrice?: number
  medianPrice?: number
  priceRange: {
    min: number
    max: number
  }
  currency: 'chaos'
  lastUpdated: Date
}

export class PriceParser {
  /**
   * Parse trade API response into structured trade listings
   */
  public static parseTradeResponse(response: TradeFetchResponse, league: string): ParsedPriceData {
    try {
      const validatedResponse = TradeFetchResponseSchema.parse(response)

      const listings: TradeListing[] = []
      const prices: number[] = []

      for (const result of validatedResponse.result) {
        try {
          const tradeListing = this.parseTradeItem(result, league)
          if (tradeListing) {
            listings.push(tradeListing)

            // Convert price to chaos for calculations
            const chaosPrice = this.convertToChaos(
              tradeListing.price.amount,
              tradeListing.price.currency
            )
            prices.push(chaosPrice)
          }
        } catch (error) {
          ApiLogger.logValidationFailure(
            'PriceParser.parseTradeItem',
            (error as Error).message,
            result
          )
          continue // Skip invalid items
        }
      }

      const priceStats = this.calculatePriceStatistics(prices)

      return {
        listings,
        totalFound: listings.length,
        averagePrice: priceStats.average,
        medianPrice: priceStats.median,
        priceRange: {
          min: priceStats.min,
          max: priceStats.max,
        },
        currency: 'chaos',
        lastUpdated: new Date(),
      }
    } catch (error) {
      ApiLogger.logValidationFailure(
        'PriceParser.parseTradeResponse',
        (error as Error).message,
        response
      )
      throw new Error(`Failed to parse trade response: ${(error as Error).message}`)
    }
  }

  /**
   * Convert individual trade item to TradeListing interface
   */
  private static parseTradeItem(
    result: z.infer<typeof TradeFetchItemSchema>,
    league: string
  ): TradeListing | null {
    try {
      const { listing, item } = result

      // Skip items without prices
      if (!listing.price) {
        return null
      }

      const parsedItem = this.parseItemData(item)
      const normalizedCurrency = this.normalizeCurrency(listing.price.currency)

      const tradeListing: TradeListing = {
        id: result.id,
        item: parsedItem,
        price: {
          amount: listing.price.amount,
          currency: normalizedCurrency,
        },
        seller: listing.account.name,
        character: listing.account.lastCharacterName,
        listed: new Date(listing.indexed),
        whisper:
          listing.whisper ||
          `@${listing.account.name} Hi, I would like to buy your ${parsedItem.name || parsedItem.baseType}`,
        stashTab: listing.stash
          ? {
              name: listing.stash.name,
              x: listing.stash.x,
              y: listing.stash.y,
            }
          : undefined,
        indexed: new Date(listing.indexed),
        league,
      }

      return tradeListing
    } catch (error) {
      ApiLogger.logError('PriceParser.parseTradeItem', error as Error, { itemId: result.id })
      return null
    }
  }

  /**
   * Convert raw trade API item data to our Item interface
   */
  private static parseItemData(tradeItem: z.infer<typeof TradeItemSchema>): Item {
    const rarity = this.mapFrameTypeToRarity(tradeItem.frameType)

    // Combine all mods
    const allMods = [...tradeItem.explicitMods, ...tradeItem.craftedMods, ...tradeItem.enchantMods]

    // Calculate socket information
    const sockets =
      tradeItem.sockets.length > 0
        ? {
            total: tradeItem.sockets.length,
            links: this.calculateMaxLinks(tradeItem.sockets),
            colors: this.getSocketColors(tradeItem.sockets),
          }
        : undefined

    // Determine category based on item properties
    const category = this.determineItemCategory(tradeItem.baseType || tradeItem.typeLine)

    return {
      id: tradeItem.id,
      name: tradeItem.name,
      baseType: tradeItem.baseType || tradeItem.typeLine,
      itemLevel: tradeItem.ilvl,
      rarity,
      category,
      sockets,
      mods: allMods,
      implicitMods: tradeItem.implicitMods,
      explicitMods: tradeItem.explicitMods,
      corrupted: tradeItem.corrupted,
      stackSize: tradeItem.stackSize,
      identified: tradeItem.identified,
      influences: tradeItem.influences
        ? Object.keys(tradeItem.influences).filter((k) => tradeItem.influences![k])
        : undefined,
    }
  }

  /**
   * Convert trade API currency names to our standard currency format
   */
  private static normalizeCurrency(currency: string): 'chaos' | 'divine' | 'exalted' | 'mirror' {
    const currencyMap: Record<string, 'chaos' | 'divine' | 'exalted' | 'mirror'> = {
      chaos: 'chaos',
      divine: 'divine',
      exalt: 'exalted',
      exalted: 'exalted',
      mirror: 'mirror',
    }

    return currencyMap[currency.toLowerCase()] || 'chaos'
  }

  /**
   * Convert any currency amount to chaos orbs
   */
  public static convertToChaos(amount: number, currency: string): number {
    const rate = CURRENCY_RATES[currency.toLowerCase()] || 1
    return amount * rate
  }

  /**
   * Calculate price statistics from chaos prices
   */
  private static calculatePriceStatistics(prices: number[]): {
    average?: number
    median?: number
    min: number
    max: number
  } {
    if (prices.length === 0) {
      return { min: 0, max: 0 }
    }

    const sortedPrices = [...prices].sort((a, b) => a - b)
    const sum = prices.reduce((acc, price) => acc + price, 0)

    return {
      average: sum / prices.length,
      median: this.calculateMedian(sortedPrices),
      min: sortedPrices[0],
      max: sortedPrices[sortedPrices.length - 1],
    }
  }

  private static calculateMedian(sortedPrices: number[]): number {
    const mid = Math.floor(sortedPrices.length / 2)
    return sortedPrices.length % 2 === 0
      ? (sortedPrices[mid - 1] + sortedPrices[mid]) / 2
      : sortedPrices[mid]
  }

  private static mapFrameTypeToRarity(frameType: number): ItemRarity {
    const rarityMap: Record<number, ItemRarity> = {
      0: 'Normal',
      1: 'Magic',
      2: 'Rare',
      3: 'Unique',
    }
    return rarityMap[frameType] || 'Normal'
  }

  private static calculateMaxLinks(sockets: Array<{ group: number }>): number {
    const linkGroups = sockets.reduce(
      (groups, socket) => {
        groups[socket.group] = (groups[socket.group] || 0) + 1
        return groups
      },
      {} as Record<number, number>
    )

    return Math.max(...Object.values(linkGroups), 0)
  }

  private static getSocketColors(sockets: Array<{ sColour: string }>): string {
    return sockets.map((s) => s.sColour).join('')
  }

  private static determineItemCategory(itemType: string): string {
    const type = itemType.toLowerCase()

    // Weapons
    if (
      type.includes('bow') ||
      type.includes('sword') ||
      type.includes('axe') ||
      type.includes('mace') ||
      type.includes('dagger') ||
      type.includes('claw') ||
      type.includes('sceptre') ||
      type.includes('staff') ||
      type.includes('wand')
    ) {
      return 'weapon'
    }

    // Armour
    if (
      type.includes('helmet') ||
      type.includes('body') ||
      type.includes('gloves') ||
      type.includes('boots') ||
      type.includes('shield') ||
      type.includes('armour')
    ) {
      return 'armour'
    }

    // Accessories
    if (type.includes('ring') || type.includes('amulet') || type.includes('belt')) {
      return 'accessory'
    }

    // Gems
    if (type.includes('skill gem') || type.includes('support gem')) {
      return 'gem'
    }

    // Currency
    if (
      type.includes('orb') ||
      type.includes('essence') ||
      type.includes('catalyst') ||
      type.includes('shard') ||
      type.includes('scroll')
    ) {
      return 'currency'
    }

    // Maps
    if (type.includes('map')) {
      return 'map'
    }

    // Flask
    if (type.includes('flask')) {
      return 'flask'
    }

    return 'other'
  }

  /**
   * Update currency conversion rates (should be called periodically)
   */
  public static updateCurrencyRates(newRates: Partial<Record<string, number>>): void {
    Object.assign(CURRENCY_RATES, newRates)
    ApiLogger.logCacheOperation('write', {
      context: 'currency_rates_update',
      updated_currencies: Object.keys(newRates),
    })
  }

  /**
   * Get current currency conversion rates
   */
  public static getCurrencyRates(): Record<string, number> {
    return { ...CURRENCY_RATES }
  }
}

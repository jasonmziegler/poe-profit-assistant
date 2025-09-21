import { Character, Item } from '../types/character'
import { TradeSearchRequest } from '../types/trade'
import { ParsedPriceData, PriceParser } from '../api/price-parser'
import { TradeApiClient } from '../api/trade-client'
import { tradeCache } from '../cache/trade-cache'
import { ApiLogger } from './logger'
import fs from 'fs/promises'
import path from 'path'

export interface CharacterMarketAnalysis {
  character: Character
  itemAnalysis: ItemMarketData[]
  totalEstimatedValue: number
  analysisDate: Date
  league: string
}

export interface ItemMarketData {
  item: Item
  priceData?: ParsedPriceData
  estimatedValue: number
  marketAvailability: 'abundant' | 'moderate' | 'scarce' | 'unknown'
  priceConfidence: 'high' | 'medium' | 'low' | 'unknown'
  searchCriteria: TradeSearchRequest
  error?: string
}

export class TradeIntegration {
  private readonly league: string
  private readonly tradeClient: TradeApiClient

  constructor(league: string) {
    this.league = league
    this.tradeClient = new TradeApiClient({ league })
  }

  /**
   * Analyze market data for all valuable items in a character
   */
  async analyzeCharacterMarketValue(character: Character): Promise<CharacterMarketAnalysis> {
    const startTime = performance.now()

    try {
      const valuableItems = this.identifyValuableItems(character.items)
      const itemAnalysis: ItemMarketData[] = []
      let totalEstimatedValue = 0

      ApiLogger.logCacheOperation('info_request', {
        context: 'character_market_analysis_start',
        character_name: character.name,
        total_items: character.items.length,
        valuable_items: valuableItems.length,
      })

      // Analyze each valuable item
      for (const item of valuableItems) {
        try {
          const marketData = await this.analyzeItemMarketValue(item)
          itemAnalysis.push(marketData)
          totalEstimatedValue += marketData.estimatedValue
        } catch (error) {
          ApiLogger.logError('TradeIntegration.analyzeItemMarketValue', error as Error, {
            item_name: item.name,
            item_type: item.baseType,
          })

          // Add error entry for failed analysis
          itemAnalysis.push({
            item,
            estimatedValue: 0,
            marketAvailability: 'unknown',
            priceConfidence: 'unknown',
            searchCriteria: this.createSearchRequest(item),
            error: (error as Error).message,
          })
        }
      }

      const analysis: CharacterMarketAnalysis = {
        character,
        itemAnalysis,
        totalEstimatedValue,
        analysisDate: new Date(),
        league: this.league,
      }

      const duration = performance.now() - startTime
      ApiLogger.logCacheOperation('info_request', {
        context: 'character_market_analysis_complete',
        character_name: character.name,
        total_estimated_value: totalEstimatedValue,
        analysis_duration_ms: Math.round(duration),
        analyzed_items: itemAnalysis.length,
      })

      return analysis
    } catch (error) {
      ApiLogger.logError('TradeIntegration.analyzeCharacterMarketValue', error as Error, {
        character_name: character.name,
        league: this.league,
      })
      throw error
    }
  }

  /**
   * Analyze market data for a specific item
   */
  async analyzeItemMarketValue(item: Item): Promise<ItemMarketData> {
    const searchRequest = this.createSearchRequest(item)

    try {
      // Check cache first
      let priceData = await tradeCache.getPriceData(this.league, searchRequest)

      if (!priceData) {
        // Fetch fresh data if not cached
        const tradeResponse = await this.tradeClient.searchAndFetchItems(searchRequest, 20)
        priceData = PriceParser.parseTradeResponse(tradeResponse, this.league)

        // Store in cache
        await tradeCache.storePriceData(this.league, searchRequest, priceData)
      }

      const marketData: ItemMarketData = {
        item,
        priceData,
        estimatedValue: this.estimateItemValue(priceData),
        marketAvailability: this.assessMarketAvailability(priceData),
        priceConfidence: this.assessPriceConfidence(priceData),
        searchCriteria: searchRequest,
      }

      return marketData
    } catch (error) {
      ApiLogger.logError('TradeIntegration.analyzeItemMarketValue', error as Error, {
        item_name: item.name,
        item_type: item.baseType,
      })

      return {
        item,
        estimatedValue: 0,
        marketAvailability: 'unknown',
        priceConfidence: 'unknown',
        searchCriteria: searchRequest,
        error: (error as Error).message,
      }
    }
  }

  /**
   * Store combined character and market data
   */
  async storeCharacterMarketData(analysis: CharacterMarketAnalysis): Promise<void> {
    try {
      const dataDir = path.resolve('data/cache/market')

      // Ensure directory exists
      try {
        await fs.access(dataDir)
      } catch {
        await fs.mkdir(dataDir, { recursive: true })
      }

      const filename = `${analysis.character.name}_${analysis.league}_${Date.now()}.json`
      const filepath = path.join(dataDir, filename)

      await fs.writeFile(filepath, JSON.stringify(analysis, null, 2), 'utf-8')

      ApiLogger.logCacheOperation('write', {
        context: 'character_market_data_stored',
        character_name: analysis.character.name,
        league: analysis.league,
        total_value: analysis.totalEstimatedValue,
        filepath: filename,
      })
    } catch (error) {
      ApiLogger.logError('TradeIntegration.storeCharacterMarketData', error as Error, {
        character_name: analysis.character.name,
        league: analysis.league,
      })
      throw error
    }
  }

  /**
   * Identify potentially valuable items worth analyzing
   */
  private identifyValuableItems(items: Item[]): Item[] {
    return items.filter((item) => {
      // Skip low-level items
      if (item.itemLevel < 60) return false

      // Include unique items
      if (item.rarity === 'Unique') return true

      // Include rare items with many mods
      if (item.rarity === 'Rare' && item.explicitMods && item.explicitMods.length >= 4) return true

      // Include items with valuable base types
      if (this.isValuableBaseType(item.baseType)) return true

      // Include items with good sockets/links
      if (item.sockets && (item.sockets.total >= 5 || item.sockets.links >= 4)) return true

      // Include currency items
      if (item.category === 'currency') return true

      // Include gems of level 18+
      if (item.category === 'gem' && item.itemLevel >= 18) return true

      return false
    })
  }

  /**
   * Check if item has a valuable base type
   */
  private isValuableBaseType(baseType: string): boolean {
    const valuableBaseTypes = [
      // High-tier bases
      'Vaal Regalia',
      "Assassin's Garb",
      'Carnal Armour',
      'Titanium Spirit Shield',
      'Hubris Circlet',
      'Sorcerer Gloves',
      'Sorcerer Boots',
      'Bone Helmet',
      'Two-Toned Boots',
      'Fingerless Silk Gloves',

      // Weapon bases
      'Jewelled Foil',
      'Harpy Rapier',
      'Vaal Axe',
      'Fleshripper',
      'Imperial Maul',
      'Coronal Maul',
      'Prophecy Wand',
      'Void Sceptre',

      // Influenced bases
      'Shaper',
      'Elder',
      'Hunter',
      'Redeemer',
      'Crusader',
      'Warlord',
    ]

    return valuableBaseTypes.some((valuable) =>
      baseType.toLowerCase().includes(valuable.toLowerCase())
    )
  }

  /**
   * Create trade search request for an item
   */
  private createSearchRequest(item: Item): TradeSearchRequest {
    const searchRequest: TradeSearchRequest = {
      query: {
        type: item.baseType,
        stats: [],
        filters: {
          type_filters: {
            filters: {
              category: { option: item.category },
              rarity: { option: item.rarity.toLowerCase() },
            },
          },
        },
      },
      sort: {
        price: 'asc',
      },
    }

    // Add specific name for unique items
    if (item.rarity === 'Unique' && item.name) {
      searchRequest.query.name = item.name
    }

    return searchRequest
  }

  /**
   * Estimate item value from price data
   */
  private estimateItemValue(priceData: ParsedPriceData): number {
    if (!priceData.listings.length) return 0

    // Use median price if available, otherwise use average
    // Prefer median as it's less affected by outliers
    return priceData.medianPrice || priceData.averagePrice || 0
  }

  /**
   * Assess market availability based on listing count
   */
  private assessMarketAvailability(
    priceData: ParsedPriceData
  ): 'abundant' | 'moderate' | 'scarce' | 'unknown' {
    const listingCount = priceData.listings.length

    if (listingCount === 0) return 'unknown'
    if (listingCount >= 20) return 'abundant'
    if (listingCount >= 10) return 'moderate'
    return 'scarce'
  }

  /**
   * Assess price confidence based on data quality
   */
  private assessPriceConfidence(priceData: ParsedPriceData): 'high' | 'medium' | 'low' | 'unknown' {
    const listingCount = priceData.listings.length
    const priceRange = priceData.priceRange

    if (listingCount === 0) return 'unknown'
    if (listingCount >= 15 && priceRange.max / priceRange.min < 2) return 'high'
    if (listingCount >= 8 && priceRange.max / priceRange.min < 3) return 'medium'
    return 'low'
  }
}

/**
 * Manual trigger class for testing specific item lookups
 */
export class ManualTradeTrigger {
  private readonly league: string
  private readonly integration: TradeIntegration

  constructor(league: string = 'Standard') {
    this.league = league
    this.integration = new TradeIntegration(league)
  }

  /**
   * Manual test for specific item name
   */
  async testItemLookup(itemName: string, itemType?: string): Promise<ParsedPriceData> {
    const searchRequest: TradeSearchRequest = {
      query: {
        ...(itemName && { name: itemName }),
        ...(itemType && { type: itemType }),
      },
      sort: { price: 'asc' },
    }

    const tradeClient = new TradeApiClient({ league: this.league })
    const tradeResponse = await tradeClient.searchAndFetchItems(searchRequest, 10)
    const priceData = PriceParser.parseTradeResponse(tradeResponse, this.league)

    ApiLogger.logCacheOperation('info_request', {
      context: 'manual_item_test',
      item_name: itemName,
      item_type: itemType,
      league: this.league,
      results_found: priceData.totalFound,
    })

    return priceData
  }

  /**
   * Test multiple popular items at once
   */
  async testPopularItems(): Promise<Record<string, ParsedPriceData>> {
    const popularItems = ['Tabula Rasa', 'Goldrim', 'Wanderlust', 'Karui Ward', 'The Baron']

    const results: Record<string, ParsedPriceData> = {}

    for (const itemName of popularItems) {
      try {
        results[itemName] = await this.testItemLookup(itemName)
        // Add delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1000))
      } catch (error) {
        ApiLogger.logError('ManualTradeTrigger.testPopularItems', error as Error, {
          item_name: itemName,
        })
      }
    }

    return results
  }
}

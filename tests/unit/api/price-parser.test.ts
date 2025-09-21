import { describe, it, expect } from 'vitest'
import { PriceParser } from '@/lib/api/price-parser'
import { TradeFetchResponse } from '@/lib/types/trade'

describe('PriceParser', () => {
  const mockLeague = 'Standard'

  describe('parseTradeResponse', () => {
    it('should parse valid trade response with single item', () => {
      const mockResponse: TradeFetchResponse = {
        result: [
          {
            id: 'item1',
            listing: {
              method: 'psapi',
              indexed: '2024-01-01T10:00:00Z',
              whisper: '@seller Hi, I would like to buy your Test Item',
              account: {
                name: 'TestSeller',
                lastCharacterName: 'TestChar',
              },
              price: {
                type: 'fixed',
                amount: 10,
                currency: 'chaos',
              },
            },
            item: {
              verified: true,
              w: 2,
              h: 3,
              league: mockLeague,
              id: 'item1',
              name: 'Test Unique Item',
              typeLine: 'Simple Robe',
              baseType: 'Simple Robe',
              identified: true,
              ilvl: 75,
              corrupted: false,
              frameType: 3, // Unique
              properties: [],
              requirements: [],
              implicitMods: ['10% increased Light Radius'],
              explicitMods: ['+20 to maximum Life', '+10 to all Resistances'],
              sockets: [
                { group: 0, attr: 'S', sColour: 'R' },
                { group: 0, attr: 'D', sColour: 'G' },
                { group: 1, attr: 'I', sColour: 'B' },
              ],
            },
          },
        ],
      }

      const result = PriceParser.parseTradeResponse(mockResponse, mockLeague)

      expect(result).toMatchObject({
        totalFound: 1,
        currency: 'chaos',
        priceRange: {
          min: 10,
          max: 10,
        },
      })

      expect(result.listings).toHaveLength(1)
      expect(result.listings[0]).toMatchObject({
        id: 'item1',
        price: {
          amount: 10,
          currency: 'chaos',
        },
        seller: 'TestSeller',
        character: 'TestChar',
        league: mockLeague,
      })

      expect(result.listings[0].item).toMatchObject({
        id: 'item1',
        name: 'Test Unique Item',
        baseType: 'Simple Robe',
        itemLevel: 75,
        rarity: 'Unique',
        corrupted: false,
        identified: true,
      })

      expect(result.listings[0].item.sockets).toMatchObject({
        total: 3,
        links: 2, // Two groups: group 0 has 2 sockets, group 1 has 1 socket
        colors: 'RGB',
      })
    })

    it('should parse multiple items and calculate statistics', () => {
      const mockResponse: TradeFetchResponse = {
        result: [
          {
            id: 'item1',
            listing: {
              method: 'psapi',
              indexed: '2024-01-01T10:00:00Z',
              whisper: '@seller1 Hi',
              account: { name: 'Seller1' },
              price: { type: 'fixed', amount: 5, currency: 'chaos' },
            },
            item: {
              league: mockLeague,
              id: 'item1',
              name: 'Item 1',
              typeLine: 'Test Base',
              identified: true,
              ilvl: 70,
              frameType: 2,
              properties: [],
              requirements: [],
              implicitMods: [],
              explicitMods: [],
              sockets: [],
            },
          },
          {
            id: 'item2',
            listing: {
              method: 'psapi',
              indexed: '2024-01-01T11:00:00Z',
              whisper: '@seller2 Hi',
              account: { name: 'Seller2' },
              price: { type: 'fixed', amount: 15, currency: 'chaos' },
            },
            item: {
              league: mockLeague,
              id: 'item2',
              name: 'Item 2',
              typeLine: 'Test Base',
              identified: true,
              ilvl: 75,
              frameType: 2,
              properties: [],
              requirements: [],
              implicitMods: [],
              explicitMods: [],
              sockets: [],
            },
          },
          {
            id: 'item3',
            listing: {
              method: 'psapi',
              indexed: '2024-01-01T12:00:00Z',
              whisper: '@seller3 Hi',
              account: { name: 'Seller3' },
              price: { type: 'fixed', amount: 10, currency: 'chaos' },
            },
            item: {
              league: mockLeague,
              id: 'item3',
              name: 'Item 3',
              typeLine: 'Test Base',
              identified: true,
              ilvl: 80,
              frameType: 2,
              properties: [],
              requirements: [],
              implicitMods: [],
              explicitMods: [],
              sockets: [],
            },
          },
        ],
      }

      const result = PriceParser.parseTradeResponse(mockResponse, mockLeague)

      expect(result.totalFound).toBe(3)
      expect(result.averagePrice).toBe(10) // (5 + 15 + 10) / 3
      expect(result.medianPrice).toBe(10) // Middle value when sorted: [5, 10, 15]
      expect(result.priceRange).toEqual({
        min: 5,
        max: 15,
      })
    })

    it('should handle items without prices', () => {
      const mockResponse: TradeFetchResponse = {
        result: [
          {
            id: 'item1',
            listing: {
              method: 'psapi',
              indexed: '2024-01-01T10:00:00Z',
              whisper: '@seller Hi',
              account: { name: 'Seller' },
              // No price object
            },
            item: {
              league: mockLeague,
              id: 'item1',
              name: 'Item Without Price',
              typeLine: 'Test Base',
              identified: true,
              ilvl: 70,
              frameType: 2,
              properties: [],
              requirements: [],
              implicitMods: [],
              explicitMods: [],
              sockets: [],
            },
          },
        ],
      }

      const result = PriceParser.parseTradeResponse(mockResponse, mockLeague)

      expect(result.totalFound).toBe(0)
      expect(result.listings).toHaveLength(0)
    })

    it('should handle different currency types', () => {
      const mockResponse: TradeFetchResponse = {
        result: [
          {
            id: 'item1',
            listing: {
              method: 'psapi',
              indexed: '2024-01-01T10:00:00Z',
              whisper: '@seller Hi',
              account: { name: 'Seller' },
              price: { type: 'fixed', amount: 1, currency: 'divine' },
            },
            item: {
              league: mockLeague,
              id: 'item1',
              name: 'Expensive Item',
              typeLine: 'Test Base',
              identified: true,
              ilvl: 85,
              frameType: 3,
              properties: [],
              requirements: [],
              implicitMods: [],
              explicitMods: [],
              sockets: [],
            },
          },
        ],
      }

      const result = PriceParser.parseTradeResponse(mockResponse, mockLeague)

      expect(result.listings[0].price).toEqual({
        amount: 1,
        currency: 'divine',
      })
    })

    it('should handle invalid data gracefully', () => {
      const invalidResponse = {
        result: [
          {
            // Missing required fields
            id: 'invalid1',
          },
        ],
      } as TradeFetchResponse

      expect(() => {
        PriceParser.parseTradeResponse(invalidResponse, mockLeague)
      }).toThrow('Failed to parse trade response')
    })
  })

  describe('convertToChaos', () => {
    it('should convert chaos to chaos (1:1)', () => {
      const result = PriceParser.convertToChaos(10, 'chaos')
      expect(result).toBe(10)
    })

    it('should convert divine to chaos', () => {
      const result = PriceParser.convertToChaos(1, 'divine')
      expect(result).toBe(180) // Based on default rate
    })

    it('should convert exalt to chaos', () => {
      const result = PriceParser.convertToChaos(2, 'exalt')
      expect(result).toBe(240) // 2 * 120
    })

    it('should handle unknown currency as chaos', () => {
      const result = PriceParser.convertToChaos(5, 'unknown_currency')
      expect(result).toBe(5)
    })
  })

  describe('updateCurrencyRates', () => {
    it('should update currency rates', () => {
      const originalRates = PriceParser.getCurrencyRates()
      const newRates = { divine: 200, exalt: 140 }

      PriceParser.updateCurrencyRates(newRates)

      const updatedRates = PriceParser.getCurrencyRates()
      expect(updatedRates.divine).toBe(200)
      expect(updatedRates.exalt).toBe(140)
      expect(updatedRates.chaos).toBe(1) // Should remain unchanged

      // Restore original rates for other tests
      PriceParser.updateCurrencyRates(originalRates)
    })
  })

  describe('edge cases', () => {
    it('should handle empty trade response', () => {
      const emptyResponse: TradeFetchResponse = { result: [] }

      const result = PriceParser.parseTradeResponse(emptyResponse, mockLeague)

      expect(result).toMatchObject({
        listings: [],
        totalFound: 0,
        priceRange: { min: 0, max: 0 },
        currency: 'chaos',
      })

      expect(result.averagePrice).toBeUndefined()
      expect(result.medianPrice).toBeUndefined()
    })

    it('should handle item with complex socket configuration', () => {
      const mockResponse: TradeFetchResponse = {
        result: [
          {
            id: 'item1',
            listing: {
              method: 'psapi',
              indexed: '2024-01-01T10:00:00Z',
              whisper: '@seller Hi',
              account: { name: 'Seller' },
              price: { type: 'fixed', amount: 100, currency: 'chaos' },
            },
            item: {
              league: mockLeague,
              id: 'item1',
              name: '6-Link Item',
              typeLine: 'Body Armour',
              identified: true,
              ilvl: 85,
              frameType: 2,
              properties: [],
              requirements: [],
              implicitMods: [],
              explicitMods: [],
              sockets: [
                { group: 0, attr: 'S', sColour: 'R' },
                { group: 0, attr: 'D', sColour: 'G' },
                { group: 0, attr: 'I', sColour: 'B' },
                { group: 0, attr: 'S', sColour: 'R' },
                { group: 0, attr: 'D', sColour: 'G' },
                { group: 0, attr: 'I', sColour: 'B' },
              ],
            },
          },
        ],
      }

      const result = PriceParser.parseTradeResponse(mockResponse, mockLeague)

      expect(result.listings[0].item.sockets).toMatchObject({
        total: 6,
        links: 6, // All in same group
        colors: 'RGBRGB',
      })
    })

    it('should handle item with stash tab information', () => {
      const mockResponse: TradeFetchResponse = {
        result: [
          {
            id: 'item1',
            listing: {
              method: 'psapi',
              indexed: '2024-01-01T10:00:00Z',
              whisper: '@seller Hi',
              account: { name: 'Seller' },
              price: { type: 'fixed', amount: 50, currency: 'chaos' },
              stash: {
                name: 'Premium Stash Tab',
                x: 5,
                y: 3,
              },
            },
            item: {
              league: mockLeague,
              id: 'item1',
              name: 'Stash Item',
              typeLine: 'Test Base',
              identified: true,
              ilvl: 75,
              frameType: 2,
              properties: [],
              requirements: [],
              implicitMods: [],
              explicitMods: [],
              sockets: [],
            },
          },
        ],
      }

      const result = PriceParser.parseTradeResponse(mockResponse, mockLeague)

      expect(result.listings[0].stashTab).toEqual({
        name: 'Premium Stash Tab',
        x: 5,
        y: 3,
      })
    })
  })
})

import { Item } from './character'

export const CURRENCIES = {
  chaos: 'chaos',
  divine: 'divine',
  exalted: 'exalt',
  mirror: 'mirror',
} as const

export interface TradeListing {
  id: string
  item: Item
  price: {
    amount: number
    currency: 'chaos' | 'divine' | 'exalted' | 'mirror'
  }
  seller: string
  character?: string
  listed: Date
  whisper: string
  stashTab?: {
    name: string
    x: number
    y: number
  }
  indexed: Date
  league: string
}

export interface TradeSearchRequest {
  query: {
    name?: string
    type?: string
    stats?: TradeStatFilter[]
    filters?: TradeFilters
  }
  sort: {
    price: 'asc' | 'desc'
  }
}

export interface TradeStatFilter {
  id: string
  value: {
    min?: number
    max?: number
  }
  disabled?: boolean
}

export interface TradeFilters {
  type_filters?: {
    filters: {
      category?: { option: string }
      rarity?: { option: string }
    }
  }
  trade_filters?: {
    filters: {
      price?: {
        min?: number
        max?: number
      }
      indexed?: { option: string }
    }
  }
}

export interface TradeSearchResponse {
  id: string
  result: string[]
  total: number
  inexact?: boolean
}

export interface TradeFetchResponse {
  result: Array<{
    id: string
    listing: {
      method: string
      indexed: string
      stash: {
        name: string
        x: number
        y: number
      }
      whisper: string
      account: {
        name: string
        online?: {
          league: string
        }
        lastCharacterName?: string
      }
      price: {
        type: string
        amount: number
        currency: string
      }
    }
    item: any // Raw item data from trade API
  }>
}

export const TRADE_API_BASE_URL = 'https://www.pathofexile.com/api/trade'

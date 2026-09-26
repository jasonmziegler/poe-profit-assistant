import { Character, Item } from '../types/character';
import { logger } from '../utils/logger';

export interface DemandMetrics {
  id: string;
  itemName: string;
  itemCategory: string;
  usageCount: number;
  usagePercentage: number;
  averageLevel: number;
  levelDistribution: { [range: string]: number };
  classDistribution: { [className: string]: number };
  trendDirection: 'rising' | 'falling' | 'stable';
  trendPercentage?: number;
  popularBuilds: string[];
  lastUpdated: Date;
  sampleSize: number;
}

export interface DemandAnalysisOptions {
  minSampleSize?: number;
  levelRanges?: string[];
  excludeCategories?: string[];
}

const DEFAULT_LEVEL_RANGES = [
  '1-20', '21-40', '41-60', '61-80', '81-90', '91+'
];

const MIN_SAMPLE_SIZE = 50;

/**
 * Calculates demand score for items based on character usage frequency
 */
export function calculateDemandScore(
  characters: Character[],
  options: DemandAnalysisOptions = {}
): Map<string, DemandMetrics> {
  const {
    minSampleSize = MIN_SAMPLE_SIZE,
    levelRanges = DEFAULT_LEVEL_RANGES,
    excludeCategories = []
  } = options;

  logger.info(`Starting demand analysis for ${characters.length} characters`);

  if (characters.length < minSampleSize) {
    logger.warn(`Sample size ${characters.length} below minimum ${minSampleSize}`);
  }

  const itemUsage = new Map<string, {
    count: number;
    levels: number[];
    classes: string[];
    items: Item[];
  }>();

  // Analyze character items
  for (const character of characters) {
    for (const item of character.items) {
      if (excludeCategories.includes(item.category)) {
        continue;
      }

      const key = `${item.name}|${item.baseType}`;

      if (!itemUsage.has(key)) {
        itemUsage.set(key, {
          count: 0,
          levels: [],
          classes: [],
          items: []
        });
      }

      const usage = itemUsage.get(key)!;
      usage.count++;
      usage.levels.push(character.level);
      usage.classes.push(character.class);
      usage.items.push(item);
    }
  }

  // Calculate demand metrics
  const demandMetrics = new Map<string, DemandMetrics>();
  const totalCharacters = characters.length;

  for (const [itemKey, usage] of itemUsage.entries()) {
    const [itemName, baseType] = itemKey.split('|');
    const firstItem = usage.items[0];

    // Calculate level distribution
    const levelDistribution: { [range: string]: number } = {};
    levelRanges.forEach(range => levelDistribution[range] = 0);

    for (const level of usage.levels) {
      const range = getLevelRange(level, levelRanges);
      levelDistribution[range]++;
    }

    // Calculate class distribution
    const classDistribution: { [className: string]: number } = {};
    for (const className of usage.classes) {
      classDistribution[className] = (classDistribution[className] || 0) + 1;
    }

    // Calculate average level
    const averageLevel = usage.levels.reduce((sum, level) => sum + level, 0) / usage.levels.length;

    // Calculate usage percentage
    const usagePercentage = (usage.count / totalCharacters) * 100;

    const metrics: DemandMetrics = {
      id: generateMetricsId(itemName, baseType),
      itemName,
      itemCategory: firstItem.category,
      usageCount: usage.count,
      usagePercentage,
      averageLevel,
      levelDistribution,
      classDistribution,
      trendDirection: 'stable', // TODO: Implement trending analysis
      popularBuilds: [], // TODO: Implement build analysis
      lastUpdated: new Date(),
      sampleSize: totalCharacters
    };

    demandMetrics.set(itemKey, metrics);
  }

  logger.info(`Generated demand metrics for ${demandMetrics.size} unique items`);
  return demandMetrics;
}

/**
 * Normalizes demand scores across categories for fair comparison
 */
export function normalizeDemandByCategory(
  demandMetrics: Map<string, DemandMetrics>
): Map<string, DemandMetrics> {
  const categoryStats = new Map<string, { max: number; min: number; avg: number }>();

  // Calculate category statistics
  for (const [, metrics] of demandMetrics) {
    const category = metrics.itemCategory;
    if (!categoryStats.has(category)) {
      categoryStats.set(category, { max: 0, min: Infinity, avg: 0 });
    }

    const stats = categoryStats.get(category)!;
    stats.max = Math.max(stats.max, metrics.usagePercentage);
    stats.min = Math.min(stats.min, metrics.usagePercentage);
  }

  // Calculate averages
  const categoryCounts = new Map<string, number>();
  const categoryTotals = new Map<string, number>();

  for (const [, metrics] of demandMetrics) {
    const category = metrics.itemCategory;
    categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
    categoryTotals.set(category, (categoryTotals.get(category) || 0) + metrics.usagePercentage);
  }

  for (const [category, total] of categoryTotals) {
    const count = categoryCounts.get(category)!;
    const stats = categoryStats.get(category)!;
    stats.avg = total / count;
  }

  // Normalize scores (0-1 scale within category)
  const normalizedMetrics = new Map<string, DemandMetrics>();

  for (const [key, metrics] of demandMetrics) {
    const stats = categoryStats.get(metrics.itemCategory)!;
    const normalizedScore = stats.max === stats.min
      ? 1.0
      : (metrics.usagePercentage - stats.min) / (stats.max - stats.min);

    normalizedMetrics.set(key, {
      ...metrics,
      usagePercentage: Math.round(normalizedScore * 100 * 100) / 100 // Normalized to 0-100 scale
    });
  }

  return normalizedMetrics;
}

/**
 * Ranks items by popularity based on demand metrics
 */
export function rankItemsByPopularity(
  demandMetrics: Map<string, DemandMetrics>
): DemandMetrics[] {
  const ranked = Array.from(demandMetrics.values())
    .filter(metrics => metrics.usageCount >= 5) // Minimum usage threshold
    .sort((a, b) => {
      // Primary: usage percentage
      if (a.usagePercentage !== b.usagePercentage) {
        return b.usagePercentage - a.usagePercentage;
      }
      // Secondary: raw usage count
      return b.usageCount - a.usageCount;
    });

  logger.info(`Ranked ${ranked.length} items by popularity`);
  return ranked;
}

function getLevelRange(level: number, ranges: string[]): string {
  for (const range of ranges) {
    const [min, max] = range.split('-');
    const minLevel = parseInt(min);
    const maxLevel = max === '+' ? Infinity : parseInt(max);

    if (level >= minLevel && level <= maxLevel) {
      return range;
    }
  }
  return ranges[ranges.length - 1]; // Default to last range
}

function generateMetricsId(itemName: string, baseType: string): string {
  const combined = `${itemName}_${baseType}`;
  return combined.toLowerCase().replace(/[^a-z0-9]/g, '_');
}
import Database from 'better-sqlite3';
import path from 'path';
import { logger } from '../utils/logger';
import { ProfitOpportunity } from '../analysis/profit';
import { DemandMetrics } from '../analysis/demand';

// Database configuration
const DB_PATH = path.resolve('data/database.db');

export class OpportunitiesDB {
  private db: Database.Database;

  constructor(dbPath: string = DB_PATH) {
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    this.initializeTables();
  }

  private initializeTables(): void {
    // Create opportunities table
    const createOpportunitiesTable = `
      CREATE TABLE IF NOT EXISTS opportunities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        item_name TEXT NOT NULL,
        item_base_type TEXT NOT NULL,
        item_category TEXT NOT NULL,
        buy_price INTEGER NOT NULL,
        estimated_sell_price INTEGER NOT NULL,
        profit_margin INTEGER NOT NULL,
        profit_percentage REAL NOT NULL,
        confidence REAL NOT NULL,
        demand_score REAL NOT NULL,
        popularity_rank INTEGER,
        usage_count INTEGER NOT NULL,
        reasoning TEXT,
        listings_json TEXT,
        item_json TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME NOT NULL,
        UNIQUE(item_name, item_base_type, created_at)
      );
    `;

    // Create demand metrics table
    const createDemandMetricsTable = `
      CREATE TABLE IF NOT EXISTS demand_metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        item_name TEXT NOT NULL,
        item_base_type TEXT NOT NULL,
        item_category TEXT NOT NULL,
        usage_count INTEGER NOT NULL,
        usage_percentage REAL NOT NULL,
        average_level REAL NOT NULL,
        level_distribution_json TEXT,
        class_distribution_json TEXT,
        trend_direction TEXT CHECK(trend_direction IN ('rising', 'falling', 'stable')),
        trend_percentage REAL,
        popular_builds_json TEXT,
        sample_size INTEGER NOT NULL,
        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(item_name, item_base_type)
      );
    `;

    // Create indexes for performance
    const createIndexes = [
      'CREATE INDEX IF NOT EXISTS idx_opportunities_confidence ON opportunities(confidence)',
      'CREATE INDEX IF NOT EXISTS idx_opportunities_profit ON opportunities(profit_margin)',
      'CREATE INDEX IF NOT EXISTS idx_opportunities_category ON opportunities(item_category)',
      'CREATE INDEX IF NOT EXISTS idx_opportunities_expires ON opportunities(expires_at)',
      'CREATE INDEX IF NOT EXISTS idx_demand_usage ON demand_metrics(usage_percentage)',
      'CREATE INDEX IF NOT EXISTS idx_demand_category ON demand_metrics(item_category)',
      'CREATE INDEX IF NOT EXISTS idx_demand_updated ON demand_metrics(last_updated)'
    ];

    try {
      this.db.exec(createOpportunitiesTable);
      this.db.exec(createDemandMetricsTable);

      createIndexes.forEach(indexSQL => {
        this.db.exec(indexSQL);
      });

      logger.info('Database tables and indexes created successfully');
    } catch (error) {
      logger.error('Failed to initialize database tables', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  // Opportunity CRUD operations

  saveOpportunity(opportunity: ProfitOpportunity): number {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO opportunities (
        item_name, item_base_type, item_category,
        buy_price, estimated_sell_price, profit_margin, profit_percentage,
        confidence, demand_score, popularity_rank, usage_count,
        reasoning, listings_json, item_json, expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    try {
      const result = stmt.run(
        opportunity.item.name,
        opportunity.item.baseType,
        opportunity.item.category,
        Math.round(opportunity.buyPrice * 100), // Store as integer (chaos * 100)
        Math.round(opportunity.estimatedSellPrice * 100),
        Math.round(opportunity.profitMargin * 100),
        opportunity.profitPercentage,
        opportunity.confidence,
        opportunity.demandScore,
        opportunity.popularityRank,
        opportunity.usageCount,
        opportunity.reasoning,
        JSON.stringify(opportunity.listings),
        JSON.stringify(opportunity.item),
        opportunity.expiresAt.toISOString()
      );

      logger.debug(`Saved opportunity for ${opportunity.item.name}`, {
        id: result.lastInsertRowid,
        profitMargin: opportunity.profitMargin
      });

      return result.lastInsertRowid as number;

    } catch (error) {
      logger.error('Failed to save opportunity', {
        itemName: opportunity.item.name,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  saveOpportunities(opportunities: ProfitOpportunity[]): number[] {
    const transaction = this.db.transaction((opps: ProfitOpportunity[]) => {
      const results: number[] = [];
      for (const opportunity of opps) {
        const id = this.saveOpportunity(opportunity);
        results.push(id);
      }
      return results;
    });

    return transaction(opportunities);
  }

  getOpportunities(options: {
    minConfidence?: number;
    minProfitMargin?: number;
    categories?: string[];
    limit?: number;
    includeExpired?: boolean;
  } = {}): ProfitOpportunity[] {
    const {
      minConfidence = 0,
      minProfitMargin = 0,
      categories,
      limit = 100,
      includeExpired = false
    } = options;

    let query = `
      SELECT * FROM opportunities
      WHERE confidence >= ? AND profit_margin >= ?
    `;
    const params: any[] = [minConfidence, minProfitMargin * 100];

    if (!includeExpired) {
      query += ' AND expires_at > ?';
      params.push(new Date().toISOString());
    }

    if (categories && categories.length > 0) {
      query += ` AND item_category IN (${categories.map(() => '?').join(',')})`;
      params.push(...categories);
    }

    query += ' ORDER BY profit_margin DESC, confidence DESC LIMIT ?';
    params.push(limit);

    try {
      const stmt = this.db.prepare(query);
      const rows = stmt.all(...params) as any[];

      return rows.map(this.rowToOpportunity);

    } catch (error) {
      logger.error('Failed to fetch opportunities', {
        error: error instanceof Error ? error.message : 'Unknown error',
        query,
        params
      });
      throw error;
    }
  }

  getOpportunityById(id: number): ProfitOpportunity | null {
    const stmt = this.db.prepare('SELECT * FROM opportunities WHERE id = ?');

    try {
      const row = stmt.get(id) as any;
      return row ? this.rowToOpportunity(row) : null;

    } catch (error) {
      logger.error('Failed to fetch opportunity by ID', {
        id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  deleteExpiredOpportunities(): number {
    const stmt = this.db.prepare('DELETE FROM opportunities WHERE expires_at <= ?');

    try {
      const result = stmt.run(new Date().toISOString());
      const deletedCount = result.changes;

      logger.info(`Cleaned up ${deletedCount} expired opportunities`);
      return deletedCount;

    } catch (error) {
      logger.error('Failed to delete expired opportunities', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  // Demand metrics CRUD operations

  saveDemandMetrics(metrics: DemandMetrics): number {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO demand_metrics (
        item_name, item_base_type, item_category,
        usage_count, usage_percentage, average_level,
        level_distribution_json, class_distribution_json,
        trend_direction, trend_percentage, popular_builds_json,
        sample_size, last_updated
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    try {
      const [itemName, baseType] = metrics.itemName.includes('|')
        ? metrics.itemName.split('|', 2)
        : [metrics.itemName, ''];

      const result = stmt.run(
        itemName,
        baseType,
        metrics.itemCategory,
        metrics.usageCount,
        metrics.usagePercentage,
        metrics.averageLevel,
        JSON.stringify(metrics.levelDistribution),
        JSON.stringify(metrics.classDistribution),
        metrics.trendDirection,
        metrics.trendPercentage,
        JSON.stringify(metrics.popularBuilds),
        metrics.sampleSize,
        metrics.lastUpdated.toISOString()
      );

      logger.debug(`Saved demand metrics for ${itemName}`, {
        id: result.lastInsertRowid,
        usagePercentage: metrics.usagePercentage
      });

      return result.lastInsertRowid as number;

    } catch (error) {
      logger.error('Failed to save demand metrics', {
        itemName: metrics.itemName,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  saveDemandMetricsBatch(metricsMap: Map<string, DemandMetrics>): number[] {
    const transaction = this.db.transaction((metrics: DemandMetrics[]) => {
      const results: number[] = [];
      for (const metric of metrics) {
        const id = this.saveDemandMetrics(metric);
        results.push(id);
      }
      return results;
    });

    return transaction(Array.from(metricsMap.values()));
  }

  getDemandMetrics(options: {
    categories?: string[];
    minUsagePercentage?: number;
    limit?: number;
  } = {}): DemandMetrics[] {
    const {
      categories,
      minUsagePercentage = 0,
      limit = 100
    } = options;

    let query = `
      SELECT * FROM demand_metrics
      WHERE usage_percentage >= ?
    `;
    const params: any[] = [minUsagePercentage];

    if (categories && categories.length > 0) {
      query += ` AND item_category IN (${categories.map(() => '?').join(',')})`;
      params.push(...categories);
    }

    query += ' ORDER BY usage_percentage DESC LIMIT ?';
    params.push(limit);

    try {
      const stmt = this.db.prepare(query);
      const rows = stmt.all(...params) as any[];

      return rows.map(this.rowToDemandMetrics);

    } catch (error) {
      logger.error('Failed to fetch demand metrics', {
        error: error instanceof Error ? error.message : 'Unknown error',
        query,
        params
      });
      throw error;
    }
  }

  // Utility methods

  getStats(): {
    totalOpportunities: number;
    activeOpportunities: number;
    totalDemandMetrics: number;
    lastAnalysisTime?: string;
  } {
    try {
      const totalOpps = this.db.prepare('SELECT COUNT(*) as count FROM opportunities').get() as any;
      const activeOpps = this.db.prepare(
        'SELECT COUNT(*) as count FROM opportunities WHERE expires_at > ?'
      ).get(new Date().toISOString()) as any;
      const totalMetrics = this.db.prepare('SELECT COUNT(*) as count FROM demand_metrics').get() as any;
      const lastAnalysis = this.db.prepare(
        'SELECT MAX(created_at) as last_time FROM opportunities'
      ).get() as any;

      return {
        totalOpportunities: totalOpps.count,
        activeOpportunities: activeOpps.count,
        totalDemandMetrics: totalMetrics.count,
        lastAnalysisTime: lastAnalysis.last_time
      };

    } catch (error) {
      logger.error('Failed to fetch database stats', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  close(): void {
    this.db.close();
  }

  private rowToOpportunity(row: any): ProfitOpportunity {
    return {
      id: `db_${row.id}`,
      item: JSON.parse(row.item_json),
      buyPrice: row.buy_price / 100, // Convert back from integer
      estimatedSellPrice: row.estimated_sell_price / 100,
      profitMargin: row.profit_margin / 100,
      profitPercentage: row.profit_percentage,
      confidence: row.confidence,
      demandScore: row.demand_score,
      popularityRank: row.popularity_rank,
      usageCount: row.usage_count,
      reasoning: row.reasoning,
      listings: JSON.parse(row.listings_json),
      createdAt: new Date(row.created_at),
      expiresAt: new Date(row.expires_at)
    };
  }

  private rowToDemandMetrics(row: any): DemandMetrics {
    return {
      id: `db_${row.id}`,
      itemName: row.item_base_type ? `${row.item_name}|${row.item_base_type}` : row.item_name,
      itemCategory: row.item_category,
      usageCount: row.usage_count,
      usagePercentage: row.usage_percentage,
      averageLevel: row.average_level,
      levelDistribution: JSON.parse(row.level_distribution_json),
      classDistribution: JSON.parse(row.class_distribution_json),
      trendDirection: row.trend_direction,
      trendPercentage: row.trend_percentage,
      popularBuilds: JSON.parse(row.popular_builds_json),
      lastUpdated: new Date(row.last_updated),
      sampleSize: row.sample_size
    };
  }
}

// Singleton instance
let dbInstance: OpportunitiesDB | null = null;

export function getDB(): OpportunitiesDB {
  if (!dbInstance) {
    dbInstance = new OpportunitiesDB();
  }
  return dbInstance;
}

export function closeDB(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
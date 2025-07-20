/**
 * Shape factory for creating Electric SQL native parameter objects
 * User filtering is handled automatically by the auth proxy
 */
export class SpendroShapeFactory {
  /**
   * Create parameters for the statements table shape
   * User filtering is handled automatically by the proxy
   */
  createStatementShape(statementIds?: string[], columns?: string[]) {
    const params: {
      table: string;
      where?: string;
      params?: string[];
      columns?: string[];
    } = {
      table: "statements",
      ...(columns && { columns }),
    };

    if (statementIds && statementIds.length > 0) {
      // Use parameter placeholders for security
      const placeholders = statementIds
        .map((_, index) => `$${index + 1}`)
        .join(", ");
      params.where = `id IN (${placeholders})`;
      params.params = statementIds;
    }

    return params;
  }

  /**
   * Create parameters for statement status tracking during uploads
   * Optimized for real-time status updates with minimal data transfer
   */
  createStatementStatusShape(statementIds?: string[]) {
    return this.createStatementShape(statementIds, [
      "id",
      "status",
      "file_name",
      "created_at",
      "updated_at",
    ]);
  }

  /**
   * Create parameters for the expenses table shape
   */
  createExpenseShape(filters?: {
    statementIds?: string[];
    dateRange?: {
      start: string;
      end: string;
    };
    categories?: string[];
  }) {
    const params: {
      table: string;
      where?: string;
      params?: string[];
    } = {
      table: "expenses",
    };

    const conditions: string[] = [];
    const paramValues: string[] = [];
    let paramIndex = 1;

    if (filters?.statementIds && filters.statementIds.length > 0) {
      const placeholders = filters.statementIds
        .map(() => `$${paramIndex++}`)
        .join(", ");
      conditions.push(`statement_id IN (${placeholders})`);
      paramValues.push(...filters.statementIds);
    }

    if (filters?.dateRange) {
      conditions.push(`date >= $${paramIndex++} AND date <= $${paramIndex++}`);
      paramValues.push(filters.dateRange.start, filters.dateRange.end);
    }

    if (filters?.categories && filters.categories.length > 0) {
      const placeholders = filters.categories
        .map(() => `$${paramIndex++}`)
        .join(", ");
      conditions.push(`category IN (${placeholders})`);
      paramValues.push(...filters.categories);
    }

    if (conditions.length > 0) {
      params.where = conditions.join(" AND ");
      params.params = paramValues;
    }

    return params;
  }

  /**
   * Create parameters for tracking expenses during upload processing
   * Filtered by specific statement IDs for real-time tracking
   */
  createUploadExpenseShape(statementIds: string[]) {
    return this.createExpenseShape({ statementIds });
  }
}

// Singleton instance
export const shapeFactory = new SpendroShapeFactory();

// Shape registry for centralized shape management
export const SHAPE_REGISTRY = {
  statements: () => shapeFactory.createStatementShape(),

  statementStatus: (statementIds?: string[]) =>
    shapeFactory.createStatementStatusShape(statementIds),

  expenses: () => shapeFactory.createExpenseShape(),

  uploadExpenses: (statementIds: string[]) =>
    shapeFactory.createUploadExpenseShape(statementIds),
} as const;

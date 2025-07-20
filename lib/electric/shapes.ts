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
   * Create parameters for the expenses table shape with advanced filtering
   * Supports progressive loading, column filtering, and search
   */
  createExpenseShape(filters?: {
    statementIds?: string[];
    dateRange?: {
      start: string;
      end: string;
    };
    categories?: string[];
    merchants?: string[];
    amountRange?: {
      min: number;
      max: number;
    };
    searchText?: string;
    columns?: string[];
  }) {
    const params: {
      table: string;
      where?: string;
      params?: string[];
      columns?: string[];
    } = {
      table: "expenses",
      ...(filters?.columns && { columns: filters.columns }),
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

    if (filters?.merchants && filters.merchants.length > 0) {
      const placeholders = filters.merchants
        .map(() => `$${paramIndex++}`)
        .join(", ");
      conditions.push(`merchant IN (${placeholders})`);
      paramValues.push(...filters.merchants);
    }

    if (filters?.amountRange) {
      conditions.push(
        `amount_sgd >= $${paramIndex++} AND amount_sgd <= $${paramIndex++}`
      );
      paramValues.push(
        filters.amountRange.min.toString(),
        filters.amountRange.max.toString()
      );
    }

    if (filters?.searchText?.trim()) {
      conditions.push(`(
        description ILIKE $${paramIndex} OR 
        merchant ILIKE $${paramIndex + 1} OR 
        category ILIKE $${paramIndex + 2}
      )`);
      const searchPattern = `%${filters.searchText.trim()}%`;
      paramValues.push(searchPattern, searchPattern, searchPattern);
      paramIndex += 3;
    }

    if (conditions.length > 0) {
      params.where = conditions.join(" AND ");
      params.params = paramValues;
    }

    return params;
  }

  /**
   * Create parameters for recent expenses (primary shape for fast loading)
   * Loads last 6 months of expenses by default
   */
  createRecentExpensesShape(
    monthsBack = 6,
    additionalFilters?: {
      categories?: string[];
      searchText?: string;
    }
  ) {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - monthsBack);
    const dateStart = sixMonthsAgo.toISOString().split("T")[0];

    return this.createExpenseShape({
      dateRange: {
        start: dateStart,
        end: new Date().toISOString().split("T")[0],
      },
      ...additionalFilters,
    });
  }

  /**
   * Create parameters for historical expenses (archive data)
   * Loads expenses older than specified months
   */
  createHistoricalExpensesShape(
    monthsBack = 6,
    monthsToLoad = 12,
    additionalFilters?: {
      categories?: string[];
      searchText?: string;
    }
  ) {
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() - monthsBack);
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - (monthsBack + monthsToLoad));

    return this.createExpenseShape({
      dateRange: {
        start: startDate.toISOString().split("T")[0],
        end: endDate.toISOString().split("T")[0],
      },
      ...additionalFilters,
    });
  }

  /**
   * Create parameters for expense shape with column filtering
   * Optimized for table display with specific columns
   */
  createExpenseTableShape(filters?: {
    dateRange?: {
      start: string;
      end: string;
    };
    categories?: string[];
    merchants?: string[];
    searchText?: string;
    showColumns?: string[];
  }) {
    const defaultColumns = [
      "id",
      "date",
      "merchant",
      "category",
      "amount_sgd",
      "original_amount",
      "original_currency",
      "description",
      "created_at",
      "line_hash",
    ];

    return this.createExpenseShape({
      ...filters,
      columns: filters?.showColumns || defaultColumns,
    });
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

  recentExpenses: (
    monthsBack?: number,
    additionalFilters?: {
      categories?: string[];
      searchText?: string;
    }
  ) => shapeFactory.createRecentExpensesShape(monthsBack, additionalFilters),

  historicalExpenses: (
    monthsBack?: number,
    monthsToLoad?: number,
    additionalFilters?: {
      categories?: string[];
      searchText?: string;
    }
  ) =>
    shapeFactory.createHistoricalExpensesShape(
      monthsBack,
      monthsToLoad,
      additionalFilters
    ),

  expenseTable: (filters?: {
    dateRange?: {
      start: string;
      end: string;
    };
    categories?: string[];
    merchants?: string[];
    searchText?: string;
    showColumns?: string[];
  }) => shapeFactory.createExpenseTableShape(filters),

  uploadExpenses: (statementIds: string[]) =>
    shapeFactory.createUploadExpenseShape(statementIds),
} as const;

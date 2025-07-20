"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { electricClient } from "@/lib/electric/client";
import { SHAPE_REGISTRY } from "@/lib/electric/shapes";
import {
  electricStatementStatusSchema,
  type StatementStatusData,
  transformDatabaseToStatusDisplay,
} from "@/lib/types/statement";

interface UseStatementStatusOptions {
  statementIds?: string[];
  autoSubscribe?: boolean;
}

interface UseStatementStatusReturn {
  statements: StatementStatusData[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook for tracking statement status changes in real-time using Electric SQL
 * Optimized for upload status tracking with minimal data transfer
 */
export function useStatementStatus(
  options: UseStatementStatusOptions = {}
): UseStatementStatusReturn {
  const { statementIds, autoSubscribe = true } = options;
  const { user, loading: authLoading } = useAuth();

  const [statements, setStatements] = useState<StatementStatusData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(() => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      // Get native Electric SQL parameters
      // Note: user_id filtering is handled automatically by the proxy
      const shapeParams = SHAPE_REGISTRY.statementStatus(statementIds);

      // Create Electric SQL shape using native interface
      const shape = electricClient.createShape(shapeParams);

      // Subscribe to shape changes
      const unsubscribe = shape.subscribe(({ rows }) => {
        try {
          // Validate and transform the data
          const validatedStatements = rows
            .map((row: Record<string, unknown>) => {
              const validatedRow = electricStatementStatusSchema.parse(row);
              return transformDatabaseToStatusDisplay(validatedRow);
            })
            .filter(
              (statement): statement is StatementStatusData =>
                statement !== null
            );

          setStatements(validatedStatements);
          setError(null);
        } catch (err) {
          console.error("Error processing statement status data:", err);
          setError("Failed to process statement data");
        } finally {
          setLoading(false);
        }
      });

      return unsubscribe;
    } catch (err) {
      console.error("Error setting up statement status subscription:", err);
      setError("Failed to connect to statement status updates");
      setLoading(false);
      return () => {};
    }
  }, [user?.id, statementIds]);

  useEffect(() => {
    if (authLoading) return;

    if (!user?.id) {
      setStatements([]);
      setLoading(false);
      setError("User not authenticated");
      return;
    }

    if (!autoSubscribe) {
      setLoading(false);
      return;
    }

    const unsubscribe = refetch();

    return () => {
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, [user?.id, authLoading, autoSubscribe, refetch]);

  return {
    statements,
    loading: authLoading || loading,
    error,
    refetch,
  };
}

/**
 * Hook for tracking a specific statement's status
 */
export function useStatementStatusById(statementId: string): {
  statement: StatementStatusData | null;
  loading: boolean;
  error: string | null;
} {
  const { statements, loading, error } = useStatementStatus({
    statementIds: [statementId],
    autoSubscribe: true,
  });

  const statement = statements.find((s) => s.id === statementId) || null;

  return {
    statement,
    loading,
    error,
  };
}

/**
 * Hook for tracking multiple statements' status during batch uploads
 */
export function useBatchStatementStatus(
  statementIds: string[]
): UseStatementStatusReturn {
  return useStatementStatus({
    statementIds,
    autoSubscribe: true,
  });
}

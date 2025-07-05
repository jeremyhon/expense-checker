import {
  type RealtimeDeletePayload,
  type RealtimeInsertPayload,
  type RealtimeUpdatePayload,
  realtimeDeletePayloadSchema,
  realtimeInsertPayloadSchema,
  realtimeUpdatePayloadSchema,
} from "@/lib/types/expense";

/**
 * Safely validate and parse a realtime INSERT payload
 */
export function validateInsertPayload(
  payload: unknown
): RealtimeInsertPayload | null {
  try {
    return realtimeInsertPayloadSchema.parse(payload);
  } catch (error) {
    console.error("Failed to validate INSERT payload:", error);
    return null;
  }
}

/**
 * Safely validate and parse a realtime UPDATE payload
 */
export function validateUpdatePayload(
  payload: unknown
): RealtimeUpdatePayload | null {
  try {
    return realtimeUpdatePayloadSchema.parse(payload);
  } catch (error) {
    console.error("Failed to validate UPDATE payload:", error);
    return null;
  }
}

/**
 * Safely validate and parse a realtime DELETE payload
 */
export function validateDeletePayload(
  payload: unknown
): RealtimeDeletePayload | null {
  try {
    return realtimeDeletePayloadSchema.parse(payload);
  } catch (error) {
    console.error("Failed to validate DELETE payload:", error);
    return null;
  }
}

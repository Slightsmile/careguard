export interface ValidationResult {
  valid: boolean;
  recordsReturned: number | null;
}

/**
 * Deterministic structural validation of an external API response body.
 * Expected shape: { records: Array<unknown> }
 */
export function validateApiResponse(body: unknown): ValidationResult {
  if (typeof body !== "object" || body === null) {
    return { valid: false, recordsReturned: null };
  }

  const records = (body as Record<string, unknown>).records;

  if (!Array.isArray(records)) {
    return { valid: false, recordsReturned: null };
  }

  return { valid: true, recordsReturned: records.length };
}

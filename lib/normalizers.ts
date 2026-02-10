// Re-export all normalizers from the canonical implementations in api.ts
// to avoid duplication. API routes import from here; api.ts uses them internally.
export {
  unwrapArray,
  unwrapObject,
  computeRating,
  normalizePlayer,
  normalizeMatch,
  normalizeMapStat,
  normalizeServer,
} from "./api"

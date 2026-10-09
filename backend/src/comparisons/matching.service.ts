import { Injectable } from '@nestjs/common';
import { MatchConfidence } from '@foodcompare/shared-types';
import { normalizeName, tokenize } from '../common/utils/normalize';

export interface MatchCandidate {
  id: string;
  displayName: string;
  normalizedName: string;
  category?: string;
  portionSize?: string;
  restaurantId?: string;
}

export interface MatchOutcome<T extends MatchCandidate> {
  candidate: T | null;
  confidence: MatchConfidence;
  score: number;
  note: string;
}

const STOP_WORDS = new Set([
  'the',
  'a',
  'an',
  'with',
  'and',
  'of',
  'fresh',
  'special',
  'special',
  'plate',
  'bowl',
  'served',
]);

/**
 * Deterministic, explainable product matcher. It scores candidates by token
 * overlap and partial-prefix matches, and never claims equivalence on name
 * similarity alone: portion/category differences lower the confidence and are
 * surfaced as notes so the UI can warn the user to confirm.
 */
@Injectable()
export class MatchingService {
  match<T extends MatchCandidate>(query: string, candidates: T[]): MatchOutcome<T> {
    const queryTokens = tokenize(query).filter((t) => !STOP_WORDS.has(t));
    if (queryTokens.length === 0 || candidates.length === 0) {
      return {
        candidate: null,
        confidence: MatchConfidence.Uncertain,
        score: 0,
        note: 'No comparable item found.',
      };
    }

    let best: T | null = null;
    let bestScore = 0;

    for (const candidate of candidates) {
      const score = this.score(queryTokens, candidate);
      if (score > bestScore) {
        bestScore = score;
        best = candidate;
      }
    }

    if (!best) {
      return {
        candidate: null,
        confidence: MatchConfidence.Uncertain,
        score: 0,
        note: 'No comparable item found.',
      };
    }

    const normalizedQuery = normalizeName(query);
    const exact = normalizeName(best.normalizedName) === normalizedQuery;
    let confidence: MatchConfidence;
    let note: string;

    if (exact && bestScore >= 0.95) {
      confidence = MatchConfidence.Exact;
      note = 'Exact product name match.';
    } else if (bestScore >= 0.6) {
      confidence = MatchConfidence.Approximate;
      note = `Approximate match with "${best.displayName}". Confirm the item and portion before ordering.`;
    } else {
      confidence = MatchConfidence.Uncertain;
      note = `Low-confidence match with "${best.displayName}". Results may not be directly comparable.`;
    }

    if (best.portionSize) {
      note += ` Compared portion: ${best.portionSize}.`;
    }

    return { candidate: best, confidence, score: Number(bestScore.toFixed(3)), note };
  }

  private score(queryTokens: string[], candidate: MatchCandidate): number {
    const candidateTokens = new Set(
      tokenize(candidate.displayName).filter((t) => !STOP_WORDS.has(t)),
    );
    if (candidateTokens.size === 0) return 0;

    let matched = 0;
    let prefixMatched = 0;
    for (const token of queryTokens) {
      if (candidateTokens.has(token)) {
        matched += 1;
      } else if ([...candidateTokens].some((ct) => ct.startsWith(token) || token.startsWith(ct))) {
        prefixMatched += 1;
      }
    }

    const recall = matched / queryTokens.length;
    const precision = matched / candidateTokens.size;
    const prefixBoost = (prefixMatched / queryTokens.length) * 0.4;
    const score = recall * 0.6 + precision * 0.4 + prefixBoost;
    return Math.min(1, score);
  }
}

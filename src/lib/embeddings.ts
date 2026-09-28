export const EMBEDDING_DIMENSIONS = 384;

const TOKEN = /[a-z0-9_]{2,}/g;

function tokenize(text: string): string[] {
  return text.toLowerCase().match(TOKEN) ?? [];
}

function hashToken(token: string): number {
  let hash = 2166136261;
  for (let index = 0; index < token.length; index += 1) {
    hash ^= token.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** Local hashing embedding so semantic search works without an external model key. */
export function embedText(text: string): number[] {
  const vector = new Array<number>(EMBEDDING_DIMENSIONS).fill(0);
  const tokens = tokenize(text);
  const grams = [...tokens];
  for (let index = 0; index < tokens.length - 1; index += 1) {
    grams.push(`${tokens[index]}_${tokens[index + 1]}`);
  }

  for (const gram of grams) {
    const hash = hashToken(gram);
    const slot = hash % EMBEDDING_DIMENSIONS;
    const sign = (hash & 1) === 0 ? 1 : -1;
    const weight = gram.includes("_") ? 1.4 : 1;
    vector[slot] += sign * weight;
  }

  let norm = 0;
  for (const value of vector) norm += value * value;
  norm = Math.sqrt(norm) || 1;
  return vector.map((value) => value / norm);
}

export function cosineSimilarity(left: number[], right: number[]): number {
  const length = Math.min(left.length, right.length);
  let dot = 0;
  for (let index = 0; index < length; index += 1) {
    dot += left[index] * right[index];
  }
  return dot;
}

export function excerpt(text: string, max = 280): string {
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length <= max) return flat;
  return `${flat.slice(0, max - 1).trimEnd()}…`;
}

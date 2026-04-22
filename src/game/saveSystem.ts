export interface SaveSlot {
  slot: number;
  level: number;
  chapter: number;
  hero: 'zachery' | 'levi' | 'cj' | 'jesse';
  score: number;
  timestamp: number;
}

const KEY = 'szr2_saves_v1';

export function loadSlots(): (SaveSlot | null)[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [null, null, null];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [null, null, null];
    return [arr[0] ?? null, arr[1] ?? null, arr[2] ?? null];
  } catch {
    return [null, null, null];
  }
}

export function saveSlot(slot: number, data: Omit<SaveSlot, 'slot' | 'timestamp'>) {
  if (slot < 0 || slot > 2) return;
  const slots = loadSlots();
  slots[slot] = { ...data, slot, timestamp: Date.now() };
  localStorage.setItem(KEY, JSON.stringify(slots));
}

export function deleteSlot(slot: number) {
  const slots = loadSlots();
  slots[slot] = null;
  localStorage.setItem(KEY, JSON.stringify(slots));
}

export function chapterStartLevel(chapter: number): number {
  const map: Record<number, number> = {
    1: 1, 2: 3, 3: 5, 4: 7, 5: 9, 6: 11, 7: 13,
    8: 14, 9: 16, 10: 18, 11: 19,
  };
  return map[chapter] ?? 1;
}

export function levelToChapter(level: number): number {
  if (level <= 2) return 1;
  if (level <= 4) return 2;
  if (level <= 6) return 3;
  if (level <= 8) return 4;
  if (level <= 10) return 5;
  if (level <= 12) return 6;
  if (level === 13) return 7;
  if (level <= 15) return 8;
  if (level <= 17) return 9;
  if (level === 18) return 10;
  return 11;
}

export function heroForChapter(chapter: number, level?: number): 'zachery' | 'levi' | 'cj' | 'jesse' {
  if (chapter <= 7) return 'zachery';
  if (chapter === 8) return 'levi';
  if (chapter === 9 || chapter === 10) return 'cj';
  if (chapter === 11) {
    if (level !== undefined && level >= 21) return 'jesse';
    return 'cj';
  }
  return 'zachery';
}

export const CHAPTER_NAMES: Record<number, string> = {
  1: 'The Dark Forest',
  2: 'Whispering Woods',
  3: 'Thorned Vale',
  4: 'Iron Grove',
  5: 'Static Marsh',
  6: 'Rusted Hollow',
  7: 'The Iron Maw',
  8: 'Levi Awakens',
  9: 'Sgt. CJ Arrives',
  10: 'Steel Tide',
  11: 'The Iron Convergence',
};

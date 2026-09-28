import { supabase } from '../lib/supabase';
import { Item, Match, MatchBreakdown } from '../types';

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'and', 'or', 'is', 'it', 'my', 'i'
]);

function extractKeywords(text: string): string[] {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

function calculateJaccardSimilarity(wordsA: string[], wordsB: string[]): number {
  if (!wordsA.length || !wordsB.length) return 0;
  const setA = new Set(wordsA);
  const setB = new Set(wordsB);
  let intersection = 0;
  for (const w of setA) {
    if (setB.has(w)) intersection++;
  }
  const union = new Set([...wordsA, ...wordsB]).size;
  return union === 0 ? 0 : intersection / union;
}

export const matchService = {
  /**
   * Evaluates the match score between a Lost item and a Found item
   * Total points: 100
   * - Category: 20 pts
   * - Similar item name: 25 pts
   * - Same location: 25 pts
   * - Similar time / date: 15 pts
   * - Similar description: 15 pts
   */
  calculateMatchScore(lost: Item, found: Item): { score: number; breakdown: MatchBreakdown } {
    let categoryPts = 0;
    let namePts = 0;
    let locationPts = 0;
    let timePts = 0;
    let descPts = 0;

    // 1. Category (20 pts)
    if (lost.category === found.category) {
      categoryPts = 20;
    }

    // 2. Name similarity (25 pts)
    const nameA = lost.name.toLowerCase().trim();
    const nameB = found.name.toLowerCase().trim();
    if (nameA === nameB) {
      namePts = 25;
    } else if (nameA.includes(nameB) || nameB.includes(nameA)) {
      namePts = 20;
    } else {
      const jaccard = calculateJaccardSimilarity(extractKeywords(nameA), extractKeywords(nameB));
      namePts = Math.round(jaccard * 25);
    }

    // 3. Location proximity (25 pts)
    if (lost.location === found.location) {
      locationPts = 25;
    } else if (lost.location.includes('Block') && found.location.includes('Block')) {
      locationPts = 10;
    }

    // 4. Date & Time closeness (15 pts)
    try {
      const dateA = new Date(lost.date).getTime();
      const dateB = new Date(found.date).getTime();
      const dayDiff = Math.abs(dateA - dateB) / (1000 * 3600 * 24);

      if (dayDiff <= 1) {
        timePts += 10;
      } else if (dayDiff <= 3) {
        timePts += 6;
      } else if (dayDiff <= 7) {
        timePts += 3;
      }
    } catch {
      // Ignored
    }

    if (lost.approx_time && found.approx_time) {
      const tA = lost.approx_time.toLowerCase();
      const tB = found.approx_time.toLowerCase();
      if (tA === tB) {
        timePts += 5;
      } else if (
        (tA.includes('am') && tB.includes('am')) ||
        (tA.includes('pm') && tB.includes('pm'))
      ) {
        timePts += 2;
      }
    }
    if (timePts > 15) timePts = 15;

    // 5. Description keyword matching (15 pts)
    const descWordsA = extractKeywords(lost.description);
    const descWordsB = extractKeywords(found.description);
    const descSim = calculateJaccardSimilarity(descWordsA, descWordsB);
    descPts = Math.min(15, Math.round(descSim * 30));

    const totalScore = Math.min(100, categoryPts + namePts + locationPts + timePts + descPts);

    return {
      score: totalScore,
      breakdown: {
        category: categoryPts,
        name: namePts,
        location: locationPts,
        time: timePts,
        description: descPts,
      },
    };
  },

  /**
   * Fetch all active matches involving the current user's lost or found items
   */
  async getMatchesForUser(userId: string): Promise<Match[]> {
    if (!userId) return [];

    // Fetch IDs of items owned by this user
    const { data: userItems, error: itemsError } = await supabase
      .from('items')
      .select('id')
      .eq('user_id', userId);

    if (itemsError || !userItems || userItems.length === 0) {
      return [];
    }

    const itemIds = userItems.map((i) => i.id);

    // Query matches where lost_item_id OR found_item_id belongs to the user
    const { data: matchesData, error: matchesError } = await supabase
      .from('matches')
      .select('*')
      .or(
        `lost_item_id.in.(${itemIds.join(',')}),found_item_id.in.(${itemIds.join(',')})`
      )
      .neq('status', 'dismissed')
      .order('score', { ascending: false });

    if (matchesError || !matchesData) {
      console.warn('Error fetching matches from Supabase:', matchesError);
      return [];
    }

    return matchesData.map((row) => ({
      id: row.id,
      lost_item_id: row.lost_item_id,
      found_item_id: row.found_item_id,
      score: row.score,
      breakdown: row.breakdown || {},
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));
  },

  /**
   * Fetch a specific match record by ID
   */
  async getMatchById(matchId: string): Promise<Match | null> {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      lost_item_id: data.lost_item_id,
      found_item_id: data.found_item_id,
      score: data.score,
      breakdown: data.breakdown || {},
      status: data.status,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  },

  /**
   * Fetch active matches for a specific item
   */
  async getMatchesForItem(itemId: string): Promise<Match[]> {
    if (!itemId) return [];
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .or(`lost_item_id.eq.${itemId},found_item_id.eq.${itemId}`)
      .neq('status', 'dismissed')
      .order('score', { ascending: false });

    if (error || !data) return [];
    return data.map((row) => ({
      id: row.id,
      lost_item_id: row.lost_item_id,
      found_item_id: row.found_item_id,
      score: row.score,
      breakdown: row.breakdown || {},
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));
  },

  /**
   * Dismiss a match suggestion
   */
  async dismissMatch(matchId: string): Promise<void> {
    await supabase
      .from('matches')
      .update({ status: 'dismissed', updated_at: new Date().toISOString() })
      .eq('id', matchId);
  },

  /**
   * Subscribe to real-time matches
   */
  subscribeToMatches(onNewMatch: (match: Match) => void): () => void {
    const channel = supabase
      .channel('matches-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'matches',
        },
        (payload) => {
          if (payload.new) {
            onNewMatch(payload.new as Match);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};

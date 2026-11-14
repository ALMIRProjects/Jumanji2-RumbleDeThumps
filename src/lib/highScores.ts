import { supabase } from '@/lib/supabase';

export interface HighScore {
  id: string;
  playerName: string;
  score: number;
  createdAt: string;
}

interface HighScoreRow {
  id: unknown;
  player_name: unknown;
  score: unknown;
  created_at: unknown;
}

function toHighScore(row: HighScoreRow): HighScore | null {
  if (
    typeof row.id !== 'string' ||
    typeof row.player_name !== 'string' ||
    typeof row.score !== 'number' ||
    typeof row.created_at !== 'string'
  ) {
    return null;
  }
  return {
    id: row.id,
    playerName: row.player_name,
    score: row.score,
    createdAt: row.created_at,
  };
}

export async function fetchTopScores(limit = 10): Promise<HighScore[]> {
  const { data, error } = await supabase
    .from('high_scores')
    .select('id, player_name, score, created_at')
    .order('score', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) throw new Error(error.message);
  if (!Array.isArray(data)) throw new Error('Unexpected leaderboard response');

  return data
    .map((row) => toHighScore(row as HighScoreRow))
    .filter((row): row is HighScore => row !== null);
}

export async function submitHighScore(playerName: string, score: number): Promise<void> {
  const { error } = await supabase.from('high_scores').insert({ player_name: playerName, score });
  if (error) throw new Error(error.message);
}

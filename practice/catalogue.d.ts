export type Focus = 'Consistency' | 'Crosscourt' | 'Down the line' | 'Volleys' | 'Serve and return' | 'Movement' | 'Doubles teamwork';
export interface Diagram {
  description: string;
  players: [string, number, number][];
  targets: [number, number, number, number, string][];
  balls: [number, number, number, number][];
  moves: [number, number, number, number][];
  wall?: boolean;
}
export interface Video {
  status: 'draft' | 'ready'; source: string; title: string; language: string;
  duration: string; poster?: string; captions?: string; transcript?: string; credits?: string;
}
export interface Activity {
  id: string; slug: string; title: string; description: string; players: number[];
  level: 'Beginner' | 'Intermediate'; type: 'Cooperative drill' | 'Competitive game' | 'Match format';
  focus: Focus[]; facilities: string[]; equipment: string[];
  suggested: number; minimum: number; intro: boolean; objective: string; setup: string;
  instructions: string[]; scoring: string; rotation: string; easier: string; harder: string;
  mixed: string; safety?: string; diagram: Diagram; video?: Video; sources: string[]; review: string;
}

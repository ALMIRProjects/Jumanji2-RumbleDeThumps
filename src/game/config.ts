export const WORLD_WIDTH = 960;
export const WORLD_HEIGHT = 560;
export const HORIZON_Y = 144;
export const ROAD_BOTTOM_Y = 510;
export const ROAD_CENTER_X = WORLD_WIDTH / 2;

export const GRAVITY = 2600;
export const JUMP_SPEED = 880;
export const FAST_FALL_SPEED = 760;
export const JUMP_BUFFER_SECONDS = 0.12;

export const START_SPEED = 0.5;
export const MAX_SPEED = 1.28;
export const SCORE_RATE = 100;
export const RING_POINTS = 60;
export const POWERUP_LIFETIME = 8;

export type CharacterId = 'bravestone' | 'finbar' | 'oberon';

export interface CharacterProfile {
  id: CharacterId;
  name: string;
  title: string;
  description: string;
  perk: string;
  accent: string;
  control: number;
  magnet: number;
  lives: number;
  multiplier: number;
}

export const CHARACTERS: Record<CharacterId, CharacterProfile> = {
  bravestone: {
    id: 'bravestone',
    name: 'Smolder Bravestone',
    title: 'The Smoldering Hero',
    description: 'Commanding presence, vaults hazards with raw power.',
    perk: 'Extra life — cheats death once per run',
    accent: '#c9a05a',
    control: 1.02,
    magnet: 0,
    lives: 2,
    multiplier: 0,
  },
  finbar: {
    id: 'finbar',
    name: 'Mouse Finbar',
    title: 'Zoology Expert',
    description: 'Small, quick-footed, and knows where the relics hide.',
    perk: 'Relic magnet — pulls rings from nearby lanes',
    accent: '#7ea86b',
    control: 1.22,
    magnet: 0.16,
    lives: 1,
    multiplier: 0,
  },
  oberon: {
    id: 'oberon',
    name: 'Shelly Oberon',
    title: 'Cartographer',
    description: 'Reads the terrain and turns every relic into treasure.',
    perk: 'Golden touch — double score while active pickups last',
    accent: '#d8a06b',
    control: 0.94,
    magnet: 0,
    lives: 1,
    multiplier: 1,
  },
};

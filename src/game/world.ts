import {
  CHARACTERS,
  FAST_FALL_SPEED,
  GRAVITY,
  JUMP_BUFFER_SECONDS,
  JUMP_SPEED,
  MAX_SPEED,
  POWERUP_LIFETIME,
  RING_POINTS,
  ROAD_CENTER_X,
  SCORE_RATE,
  START_SPEED,
  type CharacterId,
} from '@/game/config';

export type ObstacleKind = 'rock' | 'vine' | 'idol' | 'log' | 'branch' | 'quicksand' | 'rhino';
export type PowerUpKind = 'magnet' | 'shield' | 'multiplier';
export type WorldEvent = 'ring' | 'powerup' | 'shield' | 'hit' | 'start' | 'life';

export interface Obstacle {
  id: number;
  lane: number;
  z: number;
  kind: ObstacleKind;
  phase: number;
}

export interface Collectible {
  id: number;
  lane: number;
  z: number;
  phase: number;
  collected: boolean;
}

export interface PowerUp {
  id: number;
  lane: number;
  z: number;
  kind: PowerUpKind;
  phase: number;
  collected: boolean;
}

export interface Runner {
  playerLane: number;
  targetLane: number;
  laneVelocity: number;
  lift: number;
  vy: number;
  grounded: boolean;
  ducking: boolean;
  runTime: number;
  lives: number;
  invulnTime: number;
  shieldTime: number;
  magnetTime: number;
  multiplierTime: number;
}

export interface WorldState {
  characterId: CharacterId;
  time: number;
  distance: number;
  curve: number;
  speed: number;
  score: number;
  ringCount: number;
  combo: number;
  comboTimer: number;
  dead: boolean;
  shake: number;
  flash: number;
  runner: Runner;
  obstacles: Obstacle[];
  collectibles: Collectible[];
  powerUps: PowerUp[];
  particles: Particle[];
  spawnIn: number;
  dustTimer: number;
  jumpBuffer: number;
  nextId: number;
  events: WorldEvent[];
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

export interface FrameInput {
  jumpPressed: boolean;
  duck: boolean;
  steering: number | null;
  steerDirection: number;
}

const LANES = [-1, 0, 1];
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function laneAwayFrom(lane: number): number {
  const options = LANES.filter((option) => option !== lane);
  return options[Math.floor(Math.random() * options.length)];
}

function addRingLine(world: WorldState, lane: number, startZ = 0.12) {
  for (let index = 0; index < 5; index += 1) {
    world.collectibles.push({
      id: world.nextId++,
      lane,
      z: startZ + index * 0.065,
      phase: Math.random() * Math.PI * 2,
      collected: false,
    });
  }
}

function pickObstacleKind(world: WorldState): ObstacleKind {
  const roll = Math.random();
  if (world.time > 12 && roll < 0.16) return 'rhino';
  if (world.time > 8 && roll < 0.34) return 'quicksand';
  if (world.time > 14 && roll < 0.5) return 'log';
  if (world.time > 7 && roll < 0.68) return 'vine';
  if (world.time > 20 && roll < 0.8) return 'branch';
  if (roll < 0.92) return 'rock';
  return 'idol';
}

function spawnWave(world: WorldState) {
  const lane = LANES[Math.floor(Math.random() * LANES.length)];
  const kind = pickObstacleKind(world);
  world.obstacles.push({ id: world.nextId++, lane, z: kind === 'rhino' ? 0.3 : 0.02, kind, phase: Math.random() * Math.PI * 2 });

  if (kind !== 'rhino' && kind !== 'quicksand') addRingLine(world, laneAwayFrom(lane), 0.11);
  if (Math.random() < 0.18 && world.time > 11) {
    world.obstacles.push({
      id: world.nextId++,
      lane: lane === 0 ? (Math.random() > 0.5 ? -1 : 1) : 0,
      z: 0.1,
      kind: 'rock',
      phase: Math.random() * Math.PI * 2,
    });
  }

  if (Math.random() < 0.15) {
    const powerKinds: PowerUpKind[] = ['magnet', 'shield', 'multiplier'];
    world.powerUps.push({
      id: world.nextId++,
      lane: laneAwayFrom(lane),
      z: 0.48,
      kind: powerKinds[Math.floor(Math.random() * powerKinds.length)],
      phase: Math.random() * Math.PI * 2,
      collected: false,
    });
  }
}

function spawnParticles(world: WorldState, color: string, count: number, burst = 1, x = ROAD_CENTER_X, y = 470) {
  for (let index = 0; index < count; index += 1) {
    const angle = Math.random() * Math.PI * 2;
    const force = randomBetween(25, 95) * burst;
    world.particles.push({
      x,
      y,
      vx: Math.cos(angle) * force,
      vy: Math.sin(angle) * force - 30,
      life: randomBetween(0.3, 0.7),
      maxLife: 0.7,
      size: randomBetween(2, 6),
      color,
    });
  }
}

export function createWorld(characterId: CharacterId = 'bravestone'): WorldState {
  const profile = CHARACTERS[characterId];
  return {
    characterId,
    time: 0,
    distance: 0,
    curve: 0,
    speed: START_SPEED,
    score: 0,
    ringCount: 0,
    combo: 0,
    comboTimer: 0,
    dead: false,
    shake: 0,
    flash: 0,
    runner: {
      playerLane: 0,
      targetLane: 0,
      laneVelocity: 0,
      lift: 0,
      vy: 0,
      grounded: true,
      ducking: false,
      runTime: 0,
      lives: profile.lives,
      invulnTime: 0,
      shieldTime: 0,
      magnetTime: 0,
      multiplierTime: profile.multiplier,
    },
    obstacles: [],
    collectibles: [],
    powerUps: [],
    particles: [],
    spawnIn: 0.7,
    dustTimer: 0,
    jumpBuffer: 0,
    nextId: 1,
    events: ['start'],
  };
}

function updateRunner(world: WorldState, dt: number, input: FrameInput) {
  const runner = world.runner;
  const profile = CHARACTERS[world.characterId];

  if (input.jumpPressed) world.jumpBuffer = JUMP_BUFFER_SECONDS;
  world.jumpBuffer = Math.max(0, world.jumpBuffer - dt);

  if (input.steering !== null) {
    runner.targetLane = clamp(input.steering, -1, 1);
  } else if (input.steerDirection !== 0) {
    runner.targetLane = clamp(runner.targetLane + input.steerDirection * dt * 2.8, -1, 1);
  }

  const laneDelta = runner.targetLane - runner.playerLane;
  runner.laneVelocity += laneDelta * 22 * profile.control * dt;
  runner.laneVelocity *= Math.exp(-9 * dt);
  runner.playerLane = clamp(runner.playerLane + runner.laneVelocity * dt, -1.05, 1.05);

  if (runner.grounded && world.jumpBuffer > 0) {
    runner.vy = JUMP_SPEED;
    runner.grounded = false;
    world.jumpBuffer = 0;
  }

  runner.vy -= GRAVITY * dt;
  if (!runner.grounded && input.duck) runner.vy = Math.min(runner.vy, -FAST_FALL_SPEED);
  runner.lift += runner.vy * dt;

  if (runner.lift <= 0) {
    runner.lift = 0;
    runner.vy = 0;
    runner.grounded = true;
  } else {
    runner.grounded = false;
  }

  runner.ducking = input.duck && runner.grounded;
  if (runner.grounded) runner.runTime += dt;
  runner.invulnTime = Math.max(0, runner.invulnTime - dt);
  runner.shieldTime = Math.max(0, runner.shieldTime - dt);
  runner.magnetTime = Math.max(0, runner.magnetTime - dt);
  runner.multiplierTime = Math.max(0, runner.multiplierTime - dt);
}

function overlapsLane(a: number, b: number, threshold: number) {
  return Math.abs(a - b) < threshold;
}

function playerX(runner: Runner): number {
  return ROAD_CENTER_X + runner.playerLane * 290;
}

function damageRunner(world: WorldState) {
  const runner = world.runner;
  if (runner.shieldTime > 0) {
    runner.shieldTime = 0;
    world.shake = 0.4;
    world.flash = 0.2;
    world.events.push('shield');
    spawnParticles(world, '#53d6c5', 22, 1.8);
    return 'shielded';
  }
  if (runner.lives > 1) {
    runner.lives -= 1;
    runner.invulnTime = 1.7;
    world.shake = 0.6;
    world.flash = 0.4;
    world.events.push('life');
    spawnParticles(world, '#ffd166', 26, 2);
    return 'life';
  }
  runner.lives = 0;
  world.dead = true;
  world.shake = 0.7;
  world.flash = 0.5;
  world.events.push('hit');
  spawnParticles(world, '#ff6b5f', 32, 2.2);
  return 'dead';
}

function collectRing(world: WorldState, collectible: Collectible) {
  collectible.collected = true;
  world.ringCount += 1;
  world.combo += 1;
  world.comboTimer = 2.4;
  const multiplier = world.runner.multiplierTime > 0 ? 2 : 1;
  world.score += RING_POINTS * multiplier + Math.min(world.combo, 10) * 2;
  world.events.push('ring');
  spawnParticles(world, '#ffd166', 7, 0.55, playerX(world.runner), 440);
}

function collectPowerUp(world: WorldState, powerUp: PowerUp) {
  powerUp.collected = true;
  const duration = POWERUP_LIFETIME + CHARACTERS[world.characterId].magnet * 10;
  if (powerUp.kind === 'magnet') world.runner.magnetTime = duration;
  if (powerUp.kind === 'shield') world.runner.shieldTime = duration;
  if (powerUp.kind === 'multiplier') world.runner.multiplierTime = duration;
  world.score += 125;
  world.events.push('powerup');
  spawnParticles(world, powerUp.kind === 'shield' ? '#53d6c5' : '#ff8c61', 14, 1.2, playerX(world.runner), 440);
}

export function stepWorld(world: WorldState, dt: number, input: FrameInput) {
  if (world.dead) return;

  world.time += dt;
  world.speed = Math.min(MAX_SPEED, START_SPEED + world.time * 0.02 + Math.min(world.time, 28) * 0.005);
  const move = world.speed * dt;
  world.distance += move * 100;
  world.curve = Math.sin(world.distance * 0.0032) * 0.6 + Math.sin(world.distance * 0.0011) * 0.3;
  world.score += move * SCORE_RATE * (world.runner.multiplierTime > 0 ? 2 : 1);
  world.comboTimer = Math.max(0, world.comboTimer - dt);
  if (world.comboTimer === 0) world.combo = 0;

  updateRunner(world, dt, input);

  for (const obstacle of world.obstacles) {
    obstacle.z += obstacle.kind === 'rhino' ? move * 1.85 : move;
  }
  for (const collectible of world.collectibles) collectible.z += move;
  for (const powerUp of world.powerUps) powerUp.z += move;

  const runner = world.runner;
  const hitWindow = runner.lift < 30 && !runner.ducking;
  for (const obstacle of world.obstacles) {
    const zMin = obstacle.kind === 'rhino' ? 0.5 : 0.8;
    if (obstacle.z < zMin || obstacle.z > 0.98 || !overlapsLane(runner.playerLane, obstacle.lane, 0.2)) continue;

    const jumpsOver = obstacle.kind === 'rock' || obstacle.kind === 'log' || obstacle.kind === 'quicksand';
    const ducksUnder = obstacle.kind === 'vine' || obstacle.kind === 'branch';
    const avoided = jumpsOver ? !hitWindow : ducksUnder ? runner.ducking : false;
    if (avoided) continue;
    if (runner.invulnTime > 0) continue;

    const result = damageRunner(world);
    if (result === 'shielded') obstacle.z = 1.2;
    if (result === 'dead') break;
  }

  for (const collectible of world.collectibles) {
    const magnetRange = runner.magnetTime > 0 ? 0.4 : 0.22;
    if (!collectible.collected && collectible.z > 0.78 && collectible.z < 1 && overlapsLane(runner.playerLane, collectible.lane, magnetRange)) {
      collectRing(world, collectible);
    }
  }
  for (const powerUp of world.powerUps) {
    if (!powerUp.collected && powerUp.z > 0.78 && powerUp.z < 1 && overlapsLane(runner.playerLane, powerUp.lane, 0.24)) {
      collectPowerUp(world, powerUp);
    }
  }

  world.collectibles = world.collectibles.filter((item) => !item.collected && item.z < 1.16);
  world.powerUps = world.powerUps.filter((item) => !item.collected && item.z < 1.16);
  world.obstacles = world.obstacles.filter((item) => item.z < 1.16);

  world.spawnIn -= dt;
  if (world.spawnIn <= 0) {
    spawnWave(world);
    world.spawnIn = Math.max(0.55, randomBetween(0.78, 1.08) - world.speed * 0.16);
  }

  world.dustTimer -= dt;
  if (runner.grounded && world.dustTimer <= 0) {
    world.dustTimer = 0.08;
    for (let index = 0; index < 2; index += 1) {
      world.particles.push({
        x: playerX(runner) + randomBetween(-14, 14),
        y: 500,
        vx: randomBetween(-30, 30),
        vy: randomBetween(-55, -20),
        life: randomBetween(0.25, 0.5),
        maxLife: 0.5,
        size: randomBetween(2, 5),
        color: runner.ducking ? '#e0cf9f' : '#cbb98d',
      });
    }
  }

  for (const particle of world.particles) {
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.vy += 145 * dt;
    particle.life -= dt;
  }
  world.particles = world.particles.filter((particle) => particle.life > 0);
  world.shake = Math.max(0, world.shake - dt * 1.8);
  world.flash = Math.max(0, world.flash - dt * 1.8);
}

import {
  HORIZON_Y,
  ROAD_BOTTOM_Y,
  ROAD_CENTER_X,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from '@/game/config';
import type { Obstacle, PowerUp, WorldState } from '@/game/world';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const lerp = (from: number, to: number, amount: number) => from + (to - from) * amount;

function hash(value: number): number {
  const result = Math.sin(value * 78.233) * 43758.5453;
  return result - Math.floor(result);
}

function project(lane: number, z: number, curve: number) {
  const depth = clamp(z, 0, 1.14);
  const t = Math.pow(depth, 1.62);
  const roadHalf = lerp(78, 470, t);
  const curveShift = curve * t * 260;
  return {
    x: ROAD_CENTER_X + lane * roadHalf * 0.62 + curveShift,
    y: HORIZON_Y + t * (ROAD_BOTTOM_Y - HORIZON_Y),
    scale: lerp(0.22, 1.2, t),
    roadHalf,
  };
}

function drawSky(ctx: CanvasRenderingContext2D, world: WorldState) {
  const gradient = ctx.createLinearGradient(0, 0, 0, WORLD_HEIGHT);
  gradient.addColorStop(0, '#061a12');
  gradient.addColorStop(0.4, '#0d3b24');
  gradient.addColorStop(0.75, '#1c5c36');
  gradient.addColorStop(1, '#2f7a43');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

  ctx.save();
  ctx.globalAlpha = 0.85;
  for (let index = 0; index < 5; index += 1) {
    const rayX = 120 + index * 190 + Math.sin(world.time * 0.35 + index) * 14;
    const beam = ctx.createLinearGradient(rayX, 0, rayX + 60, HORIZON_Y + 120);
    beam.addColorStop(0, 'rgba(198, 244, 174, 0.24)');
    beam.addColorStop(1, 'rgba(198, 244, 174, 0)');
    ctx.fillStyle = beam;
    ctx.beginPath();
    ctx.moveTo(rayX, -20);
    ctx.lineTo(rayX + 64, -20);
    ctx.lineTo(rayX + 190, HORIZON_Y + 140);
    ctx.lineTo(rayX + 60, HORIZON_Y + 140);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  const farShift = (world.distance * 0.05) % 520;
  ctx.fillStyle = '#0a2f1f';
  for (let index = -1; index < 5; index += 1) {
    const x = index * 260 - farShift;
    ctx.beginPath();
    ctx.moveTo(x, HORIZON_Y + 34);
    ctx.lineTo(x + 130, HORIZON_Y - 74 - hash(index + 2) * 50);
    ctx.lineTo(x + 280, HORIZON_Y + 34);
    ctx.closePath();
    ctx.fill();
  }

  const nearShift = (world.distance * 0.14) % 220;
  for (let index = -1; index < 8; index += 1) {
    const x = index * 150 - nearShift;
    const trunkHeight = 95 + hash(index + 18) * 100;
    ctx.fillStyle = '#123826';
    ctx.fillRect(x + 66, HORIZON_Y - trunkHeight + 34, 12, trunkHeight);
    ctx.fillStyle = '#17573a';
    ctx.beginPath();
    ctx.arc(x + 72, HORIZON_Y - trunkHeight + 25, 46, 0, Math.PI * 2);
    ctx.arc(x + 36, HORIZON_Y - trunkHeight + 48, 30, 0, Math.PI * 2);
    ctx.arc(x + 110, HORIZON_Y - trunkHeight + 50, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1f6b47';
    ctx.beginPath();
    ctx.arc(x + 58, HORIZON_Y - trunkHeight + 14, 26, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = '#0d2d1e';
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  const canopyShift = (world.distance * 0.22) % 300;
  for (let index = -1; index < 5; index += 1) {
    const x = index * 300 - canopyShift;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.quadraticCurveTo(x + 70, 52, x + 150, 20);
    ctx.moveTo(x + 150, 20);
    ctx.quadraticCurveTo(x + 230, 60, x + 300, 14);
    ctx.stroke();
  }
}

function drawRoad(ctx: CanvasRenderingContext2D, world: WorldState) {
  const curve = world.curve;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(ROAD_CENTER_X - 74 + curve * 40, HORIZON_Y);
  for (let t = 0; t <= 1.001; t += 0.05) {
    const pt = project(-1.35, t, curve);
    ctx.lineTo(pt.x, pt.y);
  }
  for (let t = 1; t >= 0; t -= 0.05) {
    const pt = project(1.35, t, curve);
    ctx.lineTo(pt.x, pt.y);
  }
  ctx.closePath();
  ctx.clip();

  const roadGradient = ctx.createLinearGradient(0, HORIZON_Y, 0, ROAD_BOTTOM_Y);
  roadGradient.addColorStop(0, '#4a3a24');
  roadGradient.addColorStop(1, '#2c2015');
  ctx.fillStyle = roadGradient;
  ctx.fillRect(0, HORIZON_Y - 10, WORLD_WIDTH, ROAD_BOTTOM_Y - HORIZON_Y + 60);

  ctx.fillStyle = 'rgba(94, 143, 78, 0.55)';
  for (let index = 0; index < 16; index += 1) {
    const t = (index / 16 + (world.distance * 0.004) % (1 / 16)) % 1;
    const y = HORIZON_Y + Math.pow(t, 1.6) * (ROAD_BOTTOM_Y - HORIZON_Y);
    const left = project(-1.35, t, curve);
    const right = project(1.35, t, curve);
    const edge = index % 2 ? right.x : left.x;
    ctx.beginPath();
    ctx.ellipse(edge, y, lerp(6, 26, t), lerp(2, 7, t), 0, 0, Math.PI * 2);
    ctx.fill();
  }

  for (const divider of [-0.5, 0.5]) {
    for (let index = 0; index < 10; index += 1) {
      const z1 = ((index * 0.14 + world.distance * 0.004) % 1.05) + 0.02;
      const z2 = z1 + 0.06;
      const first = project(divider, z1, curve);
      const second = project(divider, z2, curve);
      ctx.strokeStyle = `rgba(226, 217, 179, ${0.1 + z1 * 0.4})`;
      ctx.lineWidth = 2 + z1 * 4;
      ctx.beginPath();
      ctx.moveTo(first.x, first.y);
      ctx.lineTo(second.x, second.y);
      ctx.stroke();
    }
  }
  ctx.restore();

  const glow = ctx.createLinearGradient(0, HORIZON_Y, 0, ROAD_BOTTOM_Y);
  glow.addColorStop(0, 'rgba(164, 224, 158, 0.18)');
  glow.addColorStop(1, 'rgba(164, 224, 158, 0)');
  ctx.fillStyle = glow;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(project(-0.35, 0, curve).x, HORIZON_Y);
  for (let t = 0; t <= 1.001; t += 0.05) ctx.lineTo(project(-0.35, t, curve).x, HORIZON_Y + t * (ROAD_BOTTOM_Y - HORIZON_Y));
  for (let t = 1; t >= 0; t -= 0.05) ctx.lineTo(project(0.35, t, curve).x, HORIZON_Y + t * (ROAD_BOTTOM_Y - HORIZON_Y));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawMist(ctx: CanvasRenderingContext2D, world: WorldState) {
  ctx.save();
  ctx.globalAlpha = 0.16;
  for (let index = 0; index < 8; index += 1) {
    const x = ((hash(index + 40) * WORLD_WIDTH - world.distance * 0.1) % (WORLD_WIDTH + 140) + WORLD_WIDTH + 140) % (WORLD_WIDTH + 140) - 70;
    const y = 170 + hash(index + 90) * 210;
    ctx.fillStyle = index % 2 ? '#c9e8c0' : '#e6f4d7';
    ctx.beginPath();
    ctx.ellipse(x, y, 70 + hash(index) * 50, 10, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawRock(ctx: CanvasRenderingContext2D, obstacle: Obstacle, x: number, y: number, scale: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = 'rgba(8, 22, 14, 0.55)';
  ctx.beginPath();
  ctx.ellipse(0, 6, 34, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  const body = ctx.createLinearGradient(0, -44, 0, 8);
  body.addColorStop(0, '#9aa7a0');
  body.addColorStop(1, '#5a6b64');
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(-30, 4);
  ctx.lineTo(-24, -26);
  ctx.lineTo(-4, -44);
  ctx.lineTo(24, -30);
  ctx.lineTo(32, 4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
  ctx.beginPath();
  ctx.moveTo(-18, -24);
  ctx.lineTo(-2, -38);
  ctx.lineTo(10, -22);
  ctx.lineTo(-6, -14);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(30, 60, 40, 0.5)';
  ctx.beginPath();
  ctx.ellipse(14, -2, 11, 7, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#3f7a4a';
  ctx.beginPath();
  ctx.arc(-14, -32, 7, 0, Math.PI * 2);
  ctx.arc(-4, -38, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawVine(ctx: CanvasRenderingContext2D, obstacle: Obstacle, x: number, y: number, scale: number, time: number) {
  ctx.save();
  ctx.translate(x, y - 62 * scale);
  ctx.scale(scale, scale);
  const sway = Math.sin(time * 3 + obstacle.phase) * 8;
  const gradient = ctx.createLinearGradient(0, -40, 0, 16);
  gradient.addColorStop(0, '#2f7a4d');
  gradient.addColorStop(1, '#14503a');
  ctx.strokeStyle = gradient;
  ctx.lineWidth = 9;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-48, -34);
  ctx.quadraticCurveTo(-20, 12 + sway, 0, -6);
  ctx.quadraticCurveTo(24, -27, 46, 6);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-46, -33);
  ctx.quadraticCurveTo(-20, 10 + sway, 0, -8);
  ctx.stroke();
  for (const [leafX, leafY, rot] of [[-32, -20, -0.6], [-12, 4, 0.4], [16, -18, -0.3], [36, -2, 0.5]] as const) {
    ctx.save();
    ctx.translate(leafX, leafY);
    ctx.rotate(rot + sway * 0.02);
    ctx.fillStyle = '#5ca85f';
    ctx.beginPath();
    ctx.ellipse(0, 0, 15, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(20, 60, 35, 0.7)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-13, 0);
    ctx.lineTo(13, 0);
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

function drawIdol(ctx: CanvasRenderingContext2D, obstacle: Obstacle, x: number, y: number, scale: number, time: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  const bob = Math.sin(time * 3.4) * 3;
  ctx.translate(0, bob);
  ctx.fillStyle = 'rgba(8, 22, 14, 0.4)';
  ctx.beginPath();
  ctx.ellipse(0, 40 - bob, 26, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowColor = '#ffcf5e';
  ctx.shadowBlur = 26;
  const gold = ctx.createLinearGradient(0, -48, 0, 36);
  gold.addColorStop(0, '#ffe08a');
  gold.addColorStop(1, '#e08b2d');
  ctx.fillStyle = gold;
  ctx.beginPath();
  ctx.moveTo(0, -48);
  ctx.lineTo(34, 0);
  ctx.lineTo(0, 36);
  ctx.lineTo(-34, 0);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#fff3c4';
  ctx.beginPath();
  ctx.moveTo(-7, -27);
  ctx.lineTo(10, -2);
  ctx.lineTo(-4, -3);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawLog(ctx: CanvasRenderingContext2D, obstacle: Obstacle, x: number, y: number, scale: number, time: number) {
  ctx.save();
  ctx.translate(x, y - 18 * scale);
  ctx.scale(scale, scale);
  const shake = Math.sin(time * 6 + obstacle.phase) * 1.5;
  ctx.rotate(shake * 0.01);
  ctx.fillStyle = 'rgba(8, 22, 14, 0.5)';
  ctx.beginPath();
  ctx.ellipse(0, 20, 52, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  const bark = ctx.createLinearGradient(0, -22, 0, 18);
  bark.addColorStop(0, '#8a5a33');
  bark.addColorStop(1, '#54371e');
  ctx.fillStyle = bark;
  ctx.beginPath();
  ctx.roundRect(-50, -20, 100, 38, 18);
  ctx.fill();
  ctx.strokeStyle = 'rgba(40, 24, 12, 0.55)';
  ctx.lineWidth = 2.5;
  for (let index = -30; index <= 30; index += 15) {
    ctx.beginPath();
    ctx.moveTo(index, -18);
    ctx.lineTo(index + 4, 16);
    ctx.stroke();
  }
  ctx.fillStyle = '#b98a56';
  ctx.beginPath();
  ctx.ellipse(-50, -1, 9, 19, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#7a5230';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(-50, -1, 4, 9, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#3f7a4a';
  ctx.beginPath();
  ctx.ellipse(-8, -20, 13, 5, -0.2, 0, Math.PI * 2);
  ctx.ellipse(22, -19, 10, 4, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawBranch(ctx: CanvasRenderingContext2D, obstacle: Obstacle, x: number, y: number, scale: number, time: number) {
  ctx.save();
  ctx.translate(x, y - 78 * scale);
  ctx.scale(scale, scale);
  const sway = Math.sin(time * 2.6 + obstacle.phase) * 5;
  ctx.rotate(sway * 0.012);
  const wood = ctx.createLinearGradient(-60, 0, 60, 0);
  wood.addColorStop(0, '#7a4a28');
  wood.addColorStop(1, '#4d2d16');
  ctx.strokeStyle = wood;
  ctx.lineWidth = 11;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-62, -26);
  ctx.quadraticCurveTo(0, -8, 62, -30);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255, 235, 200, 0.16)';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(-58, -28);
  ctx.quadraticCurveTo(0, -11, 58, -32);
  ctx.stroke();
  ctx.fillStyle = '#3f8a52';
  for (const [leafX, leafY] of [[-44, -34], [-10, -20], [18, -26], [46, -38]] as const) {
    ctx.beginPath();
    ctx.ellipse(leafX, leafY, 17, 8, leafX > 0 ? -0.35 : 0.35, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#54b06a';
  ctx.beginPath();
  ctx.ellipse(0, -32, 20, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawQuicksand(ctx: CanvasRenderingContext2D, obstacle: Obstacle, x: number, y: number, scale: number, time: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  const pulse = 1 + Math.sin(time * 3 + obstacle.phase) * 0.04;
  const pit = ctx.createRadialGradient(0, -4, 6, 0, -4, 42);
  pit.addColorStop(0, '#6e552e');
  pit.addColorStop(0.7, '#4d3a1e');
  pit.addColorStop(1, '#3a2c15');
  ctx.fillStyle = pit;
  ctx.beginPath();
  ctx.ellipse(0, -4, 40 * pulse, 15 * pulse, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(224, 202, 150, 0.4)';
  ctx.lineWidth = 2;
  for (let index = 0; index < 3; index += 1) {
    const ringPhase = ((time * 0.8 + index / 3) % 1);
    ctx.globalAlpha = 1 - ringPhase;
    ctx.beginPath();
    ctx.ellipse(0, -4, 8 + ringPhase * 30, 3 + ringPhase * 11, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawRhino(ctx: CanvasRenderingContext2D, obstacle: Obstacle, x: number, y: number, scale: number, time: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  const gallop = Math.sin(time * 14 + obstacle.phase);
  ctx.fillStyle = 'rgba(8, 22, 14, 0.5)';
  ctx.beginPath();
  ctx.ellipse(0, 6, 52, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  const body = ctx.createLinearGradient(0, -70, 0, 0);
  body.addColorStop(0, '#9a9a94');
  body.addColorStop(1, '#5e5e58');
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.ellipse(0, -38, 48, 34, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(-40, -46, 22, 20, 0.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#4a4a44';
  for (const [legX, legPhase] of [[-34, 0], [-14, 1], [14, 0], [34, 1]] as const) {
    ctx.save();
    ctx.translate(legX, -18);
    ctx.rotate(gallop * 0.35 * (legPhase ? 1 : -1));
    ctx.fillRect(-6, 0, 12, 24);
    ctx.restore();
  }

  ctx.fillStyle = '#d8d8d0';
  ctx.beginPath();
  ctx.moveTo(-56, -52);
  ctx.quadraticCurveTo(-70, -60, -64, -42);
  ctx.quadraticCurveTo(-58, -38, -52, -46);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#5e5e58';
  ctx.beginPath();
  ctx.ellipse(-52, -62, 12, 10, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ff5f4d';
  ctx.beginPath();
  ctx.arc(-58, -64, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.beginPath();
  ctx.ellipse(8, -52, 26, 10, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawObstacle(ctx: CanvasRenderingContext2D, obstacle: Obstacle, world: WorldState) {
  const point = project(obstacle.lane, obstacle.z, world.curve);
  if (obstacle.kind === 'rock') drawRock(ctx, obstacle, point.x, point.y, point.scale);
  if (obstacle.kind === 'vine') drawVine(ctx, obstacle, point.x, point.y, point.scale, world.time);
  if (obstacle.kind === 'idol') drawIdol(ctx, obstacle, point.x, point.y, point.scale, world.time);
  if (obstacle.kind === 'log') drawLog(ctx, obstacle, point.x, point.y, point.scale, world.time);
  if (obstacle.kind === 'branch') drawBranch(ctx, obstacle, point.x, point.y, point.scale, world.time);
  if (obstacle.kind === 'quicksand') drawQuicksand(ctx, obstacle, point.x, point.y, point.scale, world.time);
  if (obstacle.kind === 'rhino') drawRhino(ctx, obstacle, point.x, point.y, point.scale, world.time);
}

function drawRing(ctx: CanvasRenderingContext2D, lane: number, z: number, phase: number, time: number, curve: number) {
  const point = project(lane, z, curve);
  const radius = 12 * point.scale;
  const wobble = Math.sin(time * 5 + phase) * 0.18;
  ctx.save();
  ctx.translate(point.x, point.y - 44 * point.scale + wobble * 14);
  ctx.rotate(time * 2 + phase);
  ctx.shadowColor = '#ffd166';
  ctx.shadowBlur = 18 * point.scale;
  ctx.strokeStyle = '#ffd166';
  ctx.lineWidth = Math.max(2, 7 * point.scale);
  ctx.beginPath();
  ctx.ellipse(0, 0, radius, radius * 0.62, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = '#fff1b0';
  ctx.lineWidth = Math.max(1, 2 * point.scale);
  ctx.beginPath();
  ctx.ellipse(-2 * point.scale, -2 * point.scale, radius * 0.52, radius * 0.3, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function powerColor(kind: PowerUp['kind']) {
  if (kind === 'shield') return '#53d6c5';
  if (kind === 'magnet') return '#ffcc66';
  return '#ff7d68';
}

function drawPowerUp(ctx: CanvasRenderingContext2D, powerUp: PowerUp, time: number, curve: number) {
  const point = project(powerUp.lane, powerUp.z, curve);
  const color = powerColor(powerUp.kind);
  const radius = 16 * point.scale;
  ctx.save();
  ctx.translate(point.x, point.y - 46 * point.scale + Math.sin(time * 4 + powerUp.phase) * 5 * point.scale);
  ctx.shadowColor = color;
  ctx.shadowBlur = 24 * point.scale;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#12232d';
  ctx.lineWidth = Math.max(2, 3 * point.scale);
  if (powerUp.kind === 'shield') {
    ctx.beginPath();
    ctx.moveTo(0, -9 * point.scale);
    ctx.lineTo(9 * point.scale, -4 * point.scale);
    ctx.lineTo(7 * point.scale, 7 * point.scale);
    ctx.lineTo(0, 12 * point.scale);
    ctx.lineTo(-7 * point.scale, 7 * point.scale);
    ctx.lineTo(-9 * point.scale, -4 * point.scale);
    ctx.closePath();
    ctx.stroke();
  } else if (powerUp.kind === 'magnet') {
    ctx.beginPath();
    ctx.arc(0, 0, 8 * point.scale, 0.2, Math.PI - 0.2);
    ctx.stroke();
  } else {
    ctx.font = `800 ${15 * point.scale}px system-ui`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('2\u00d7', 0, 1 * point.scale);
  }
  ctx.restore();
}

interface HeroStyle {
  skin: string;
  skinShade: string;
  shirt: string;
  shirtShade: string;
  vest: string;
  pants: string;
  boot: string;
  hair: string;
  bandolier: string;
}

const HERO_STYLES: Record<string, HeroStyle> = {
  bravestone: {
    skin: '#c68d59',
    skinShade: '#a06a3c',
    shirt: '#4a6b52',
    shirtShade: '#37523f',
    vest: '#8a6a3c',
    pants: '#3d4a3a',
    boot: '#2a1d14',
    hair: '#1d1410',
    bandolier: '#6b4a26',
  },
  finbar: {
    skin: '#d8a878',
    skinShade: '#b5854f',
    shirt: '#7ea86b',
    shirtShade: '#5f8a50',
    vest: '#55663f',
    pants: '#5c5a3c',
    boot: '#33271c',
    hair: '#8a5a2e',
    bandolier: '#8a6a3c',
  },
  oberon: {
    skin: '#e0b088',
    skinShade: '#bd8a5e',
    shirt: '#d8b86a',
    shirtShade: '#b5934a',
    vest: '#7a5a8a',
    pants: '#4a4458',
    boot: '#2e2620',
    hair: '#a8542e',
    bandolier: '#5e4a7a',
  },
};

function drawHeroLeg(ctx: CanvasRenderingContext2D, hipX: number, hipY: number, length: number, angle: number, style: HeroStyle, width: number) {
  ctx.save();
  ctx.translate(hipX, hipY);
  ctx.rotate(angle);
  ctx.fillStyle = style.pants;
  ctx.beginPath();
  ctx.roundRect(-width / 2, 0, width, length - 6, width / 2);
  ctx.fill();
  ctx.fillStyle = style.boot;
  ctx.beginPath();
  ctx.roundRect(-width / 2 - 2, length - 8, width + 6, 10, 3);
  ctx.fill();
  ctx.restore();
}

function drawHeroArm(ctx: CanvasRenderingContext2D, shoulderX: number, shoulderY: number, handX: number, handY: number, style: HeroStyle, width: number) {
  ctx.strokeStyle = style.skin;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(shoulderX, shoulderY);
  ctx.quadraticCurveTo((shoulderX + handX) / 2, (shoulderY + handY) / 2 + 6, handX, handY);
  ctx.stroke();
}

function drawHeroHead(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number, style: HeroStyle, kind: string) {
  ctx.fillStyle = style.skin;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = style.hair;
  ctx.beginPath();
  ctx.arc(cx, cy - radius * 0.34, radius * 0.98, Math.PI, Math.PI * 2);
  ctx.fill();

  if (kind === 'bravestone') {
    ctx.fillStyle = style.hair;
    ctx.beginPath();
    ctx.ellipse(cx, cy - radius * 0.55, radius * 0.85, radius * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(20, 12, 8, 0.85)';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(cx - radius * 0.65, cy - radius * 0.28);
    ctx.lineTo(cx - radius * 0.18, cy - radius * 0.2);
    ctx.moveTo(cx + radius * 0.18, cy - radius * 0.2);
    ctx.lineTo(cx + radius * 0.65, cy - radius * 0.28);
    ctx.stroke();
    ctx.fillStyle = '#f5e6c8';
    ctx.beginPath();
    ctx.moveTo(cx - radius * 0.5, cy + radius * 0.45);
    ctx.lineTo(cx + radius * 0.5, cy + radius * 0.45);
    ctx.lineTo(cx + radius * 0.3, cy + radius * 0.75);
    ctx.lineTo(cx - radius * 0.3, cy + radius * 0.75);
    ctx.closePath();
    ctx.fill();
  } else if (kind === 'finbar') {
    ctx.fillStyle = style.hair;
    ctx.beginPath();
    ctx.ellipse(cx, cy - radius * 0.72, radius * 0.95, radius * 0.42, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#5e7a4a';
    ctx.beginPath();
    ctx.ellipse(cx, cy - radius * 0.95, radius * 1.1, radius * 0.32, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(cx - radius * 0.7, cy - radius * 1.05, radius * 1.4, radius * 0.3);
  } else {
    ctx.fillStyle = style.hair;
    ctx.beginPath();
    ctx.ellipse(cx, cy - radius * 0.4, radius * 1.02, radius * 0.72, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + radius * 0.95, cy + radius * 0.3, radius * 0.3, radius * 0.85, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#3a3026';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx - radius * 0.38, cy + radius * 0.05, radius * 0.34, 0, Math.PI * 2);
    ctx.arc(cx + radius * 0.38, cy + radius * 0.05, radius * 0.34, 0, Math.PI * 2);
    ctx.moveTo(cx - radius * 0.06, cy + radius * 0.05);
    ctx.lineTo(cx + radius * 0.06, cy + radius * 0.05);
    ctx.stroke();
  }

  ctx.fillStyle = '#161f24';
  ctx.beginPath();
  ctx.arc(cx - radius * 0.32, cy + radius * 0.02, radius * 0.09, 0, Math.PI * 2);
  ctx.arc(cx + radius * 0.32, cy + radius * 0.02, radius * 0.09, 0, Math.PI * 2);
  ctx.fill();
}

function drawPlayer(ctx: CanvasRenderingContext2D, world: WorldState) {
  const runner = world.runner;
  const point = project(runner.playerLane, 1, world.curve);
  const x = point.x;
  const feet = ROAD_BOTTOM_Y - runner.lift * 0.55;
  const kind = world.characterId;
  const isFinbar = kind === 'finbar';
  const isOberon = kind === 'oberon';
  const style = HERO_STYLES[kind];
  const scale = isFinbar ? 0.94 : isOberon ? 1.06 : 1.2;
  const swing = runner.grounded ? Math.sin(runner.runTime * 17) : 0.4;
  const lean = clamp(runner.laneVelocity * 0.04, -0.3, 0.3);
  const blink = runner.invulnTime > 0 && Math.floor(world.time * 12) % 2 === 0;

  ctx.save();
  ctx.translate(x, feet);
  ctx.rotate(lean);
  ctx.scale(scale, scale);
  ctx.globalAlpha = 0.34;
  ctx.fillStyle = '#08151c';
  ctx.beginPath();
  ctx.ellipse(0, 4, isFinbar ? 34 : 46, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = blink ? 0.4 : 1;

  if (runner.shieldTime > 0) {
    ctx.strokeStyle = 'rgba(83, 214, 197, 0.78)';
    ctx.shadowColor = '#53d6c5';
    ctx.shadowBlur = 20;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, -55, 50 + Math.sin(world.time * 5) * 3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  const width = isFinbar ? 0.82 : 1;
  const hipY = feetYSupport(runner.ducking);
  const bodyW = 52 * width;
  const bodyH = 50;
  const legW = 13 * width;

  drawHeroLeg(ctx, -12 * width, hipY, 32, -0.28 + swing * 0.35, style, legW);
  drawHeroLeg(ctx, 12 * width, hipY, 32, 0.28 - swing * 0.35, style, legW);

  ctx.fillStyle = style.shirt;
  ctx.beginPath();
  ctx.roundRect(-bodyW / 2, hipY - bodyH, bodyW, bodyH + 4, 12);
  ctx.fill();
  ctx.fillStyle = style.shirtShade;
  ctx.beginPath();
  ctx.roundRect(bodyW / 2 - bodyW * 0.3, hipY - bodyH, bodyW * 0.3, bodyH + 4, 10);
  ctx.fill();

  if (kind === 'bravestone') {
    ctx.fillStyle = style.bandolier;
    ctx.save();
    ctx.translate(0, hipY - bodyH / 2);
    ctx.rotate(0.5);
    ctx.fillRect(-bodyW / 2 - 2, -7, bodyW + 4, 14);
    ctx.restore();
    ctx.fillStyle = '#f5e6c8';
    ctx.beginPath();
    ctx.roundRect(-bodyW / 2 + 6, hipY - bodyH + 6, bodyW - 12, 16, 5);
    ctx.fill();
    ctx.fillStyle = '#c9a05a';
    ctx.fillRect(-8, hipY - bodyH + 9, 16, 10);
  } else if (kind === 'finbar') {
    ctx.fillStyle = style.vest;
    ctx.beginPath();
    ctx.roundRect(-bodyW / 2, hipY - bodyH, bodyW * 0.34, bodyH + 4, 8);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(bodyW / 2 - bodyW * 0.34, hipY - bodyH, bodyW * 0.34, bodyH + 4, 8);
    ctx.fill();
    ctx.fillStyle = '#e0cfa0';
    ctx.beginPath();
    ctx.roundRect(-10, hipY - bodyH + 10, 20, 22, 4);
    ctx.fill();
    ctx.fillStyle = '#7a5230';
    ctx.fillRect(-7, hipY - bodyH + 14, 14, 3);
    ctx.fillRect(-7, hipY - bodyH + 20, 14, 3);
  } else {
    ctx.fillStyle = style.vest;
    ctx.beginPath();
    ctx.roundRect(-bodyW / 2 - 3, hipY - bodyH - 2, bodyW + 6, 26, 10);
    ctx.fill();
    ctx.fillStyle = '#e8d8a8';
    ctx.beginPath();
    ctx.roundRect(-bodyW / 2 + 8, hipY - bodyH + 8, bodyW - 16, 20, 6);
    ctx.fill();
    ctx.strokeStyle = '#8a6a3c';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-12, hipY - bodyH + 12);
    ctx.lineTo(12, hipY - bodyH + 24);
    ctx.moveTo(-12, hipY - bodyH + 18);
    ctx.lineTo(12, hipY - bodyH + 30);
    ctx.stroke();
  }

  drawHeroArm(ctx, -bodyW / 2 + 3, hipY - bodyH + 10, -30 - swing * 12, hipY - 6, style, 10 * width);
  drawHeroArm(ctx, bodyW / 2 - 3, hipY - bodyH + 10, 30 + swing * 12, hipY - 20, style, 10 * width);

  drawHeroHead(ctx, 0, hipY - bodyH - 16, 19, style, kind);

  if (isOberon) {
    ctx.fillStyle = '#8a5a3c';
    ctx.beginPath();
    ctx.ellipse(-bodyW / 2 + 2, hipY - bodyH - 4, 7, 12, 0.2, 0, Math.PI * 2);
    ctx.fill();
  }
  if (kind === 'bravestone') {
    ctx.strokeStyle = '#b03a2e';
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-10, hipY - bodyH - 2);
    ctx.quadraticCurveTo(-20 - swing * 4, hipY - bodyH + 10, -26 - swing * 6, hipY - bodyH + 26);
    ctx.stroke();
  }
  ctx.restore();
}

function feetYSupport(ducking: boolean) {
  return ducking ? -20 : -30;
}

function drawParticles(ctx: CanvasRenderingContext2D, world: WorldState) {
  for (const particle of world.particles) {
    ctx.save();
    ctx.globalAlpha = clamp(particle.life / particle.maxLife, 0, 1);
    ctx.fillStyle = particle.color;
    ctx.shadowColor = particle.color;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawHud(ctx: CanvasRenderingContext2D, world: WorldState) {
  const runner = world.runner;
  ctx.save();
  ctx.fillStyle = 'rgba(24, 16, 6, 0.72)';
  ctx.beginPath();
  ctx.roundRect(22, 20, 268, 76, 18);
  ctx.fill();
  ctx.strokeStyle = 'rgba(213, 171, 90, 0.5)';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#e8c877';
  ctx.font = '700 11px Georgia, serif';
  ctx.fillText('SCORE', 42, 44);
  ctx.fillText('RINGS', 168, 44);
  ctx.fillStyle = '#fff3d6';
  ctx.font = '900 29px Georgia, serif';
  ctx.fillText(String(Math.floor(world.score)).padStart(5, '0'), 42, 76);
  ctx.fillStyle = '#ffd166';
  ctx.fillText(String(world.ringCount).padStart(2, '0'), 168, 76);

  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(24, 16, 6, 0.72)';
  ctx.beginPath();
  ctx.roundRect(WORLD_WIDTH - 226, 20, 204, 76, 18);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#e8c877';
  ctx.font = '700 11px Georgia, serif';
  ctx.fillText(`PACE ${Math.round((world.speed / 0.5) * 100)}%`, WORLD_WIDTH - 42, 44);
  ctx.fillStyle = '#fff3d6';
  ctx.font = '900 23px Georgia, serif';
  ctx.fillText(`${Math.floor(world.distance)} m`, WORLD_WIDTH - 42, 73);

  if (runner.lives > 1) {
    ctx.textAlign = 'left';
    ctx.font = '700 12px Georgia, serif';
    ctx.fillStyle = '#ff8c61';
    ctx.fillText('\u2665'.repeat(Math.min(runner.lives - 1, 3)), 30, 118);
  }
  ctx.restore();

  const buffs: Array<{ label: string; value: number; color: string }> = [];
  if (runner.shieldTime > 0) buffs.push({ label: 'SHIELD', value: runner.shieldTime, color: '#53d6c5' });
  if (runner.magnetTime > 0) buffs.push({ label: 'MAGNET', value: runner.magnetTime, color: '#ffd166' });
  if (runner.multiplierTime > 0) buffs.push({ label: '2\u00d7 SCORE', value: runner.multiplierTime, color: '#ff806d' });
  if (buffs.length > 0) {
    ctx.save();
    buffs.forEach((buff, index) => {
      const x = 28 + index * 118;
      ctx.fillStyle = 'rgba(24, 16, 6, 0.76)';
      ctx.beginPath();
      ctx.roundRect(x, WORLD_HEIGHT - 46, 104, 26, 13);
      ctx.fill();
      ctx.fillStyle = buff.color;
      ctx.font = '800 10px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${buff.label} ${Math.ceil(buff.value)}s`, x + 52, WORLD_HEIGHT - 29);
    });
    ctx.restore();
  }
}

export function drawWorld(ctx: CanvasRenderingContext2D, world: WorldState) {
  ctx.clearRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  ctx.save();
  const shakeX = (Math.random() - 0.5) * world.shake * 16;
  const shakeY = (Math.random() - 0.5) * world.shake * 10;
  ctx.translate(shakeX, shakeY);

  drawSky(ctx, world);
  drawMist(ctx, world);
  drawRoad(ctx, world);

  const renderables = [
    ...world.collectibles.filter((item) => !item.collected).map((item) => ({ z: item.z, type: 'ring' as const, item })),
    ...world.powerUps.filter((item) => !item.collected).map((item) => ({ z: item.z, type: 'power' as const, item })),
    ...world.obstacles.map((item) => ({ z: item.z, type: 'obstacle' as const, item })),
  ].sort((first, second) => first.z - second.z);

  for (const renderable of renderables) {
    if (renderable.type === 'ring') drawRing(ctx, renderable.item.lane, renderable.item.z, renderable.item.phase, world.time, world.curve);
    if (renderable.type === 'power') drawPowerUp(ctx, renderable.item, world.time, world.curve);
    if (renderable.type === 'obstacle') drawObstacle(ctx, renderable.item, world);
  }
  drawPlayer(ctx, world);
  drawParticles(ctx, world);
  ctx.restore();

  drawHud(ctx, world);
  if (world.flash > 0) {
    ctx.fillStyle = `rgba(255, 98, 77, ${world.flash * 0.42})`;
    ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  }
}

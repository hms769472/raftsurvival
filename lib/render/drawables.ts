import type { SkinDefinition } from '@/types/game-globals';
import type {
  Fish,
  Frog,
  Harpoon,
  Island,
  Item,
  Jellyfish,
  Kraken,
  PirateRaft,
  Seagull,
  Shark,
  TreasureChest,
} from '@/lib/engine/entities';

export type Cloud = {
  x: number;
  y: number;
  size: number;
  alpha: number;
  vx?: number;
  vy?: number;
  speed: number;
};

type SkinMap = Record<string, SkinDefinition>;
type PlayerBox = { x: number; y: number; width: number; height: number };

export function drawChest(
  ctx: CanvasRenderingContext2D,
  ch: TreasureChest,
  time: number,
  skinMap: SkinMap,
  activeSkin: string,
) {
  const cx = ch.x;
  const cy = ch.y;
  const s = ch.size;

  // Underwater shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + s + 4, s * 0.9, s * 0.2, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(ch.rotation * 0.3); // slight tilt only

  // === Glow aura (pulsing) ===
  const glowGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, s * 1.8);
  glowGrad.addColorStop(0, 'rgba(255, 215, 0, ' + 0.5 * ch.glow + ')');
  glowGrad.addColorStop(0.5, 'rgba(255, 200, 50, ' + 0.2 * ch.glow + ')');
  glowGrad.addColorStop(1, 'rgba(255, 180, 0, 0)');
  ctx.fillStyle = glowGrad;
  ctx.beginPath();
  ctx.arc(0, 0, s * 1.8, 0, Math.PI * 2);
  ctx.fill();

  // === Chest body (bottom half) ===
  ctx.fillStyle =
    typeof skinMap !== 'undefined' && activeSkin && skinMap[activeSkin]
      ? skinMap[activeSkin].c
      : '#8B4513';
  ctx.fillRect(-s * 0.85, -s * 0.1, s * 1.7, s * 0.9);

  // Wood plank lines
  ctx.strokeStyle = '#5D3A0F';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-s * 0.85, s * 0.2);
  ctx.lineTo(s * 0.85, s * 0.2);
  ctx.moveTo(-s * 0.85, s * 0.5);
  ctx.lineTo(s * 0.85, s * 0.5);
  ctx.stroke();

  // === Chest lid (top half — arched) ===
  ctx.fillStyle =
    typeof skinMap !== 'undefined' && activeSkin && skinMap[activeSkin]
      ? skinMap[activeSkin].a
      : '#A0522D';
  ctx.beginPath();
  ctx.moveTo(-s * 0.85, -s * 0.1);
  ctx.quadraticCurveTo(0, -s * 0.9, s * 0.85, -s * 0.1);
  ctx.closePath();
  ctx.fill();

  // Lid highlight
  ctx.fillStyle = '#C67B4A';
  ctx.beginPath();
  ctx.moveTo(-s * 0.7, -s * 0.15);
  ctx.quadraticCurveTo(0, -s * 0.7, s * 0.5, -s * 0.2);
  ctx.quadraticCurveTo(0, -s * 0.4, -s * 0.7, -s * 0.15);
  ctx.closePath();
  ctx.fill();

  // === Gold straps ===
  ctx.fillStyle = '#FFD700';
  ctx.fillRect(-s * 0.9, -s * 0.1, s * 0.15, s * 0.9);
  ctx.fillRect(s * 0.75, -s * 0.1, s * 0.15, s * 0.9);
  // Top strap on lid
  ctx.beginPath();
  ctx.moveTo(-s * 0.08, -s * 0.85);
  ctx.lineTo(s * 0.08, -s * 0.85);
  ctx.lineTo(s * 0.08, -s * 0.1);
  ctx.lineTo(-s * 0.08, -s * 0.1);
  ctx.closePath();
  ctx.fill();

  // === Lock (gold) ===
  ctx.fillStyle = '#B8860B';
  ctx.beginPath();
  ctx.arc(0, -s * 0.05, s * 0.22, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FFD700';
  ctx.beginPath();
  ctx.arc(0, -s * 0.05, s * 0.15, 0, Math.PI * 2);
  ctx.fill();
  // Keyhole
  ctx.fillStyle = '#5D3A0F';
  ctx.beginPath();
  ctx.arc(0, -s * 0.1, s * 0.06, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(-s * 0.03, -s * 0.08, s * 0.06, s * 0.15);

  // === Sparkles around chest ===
  for (let sp = 0; sp < 4; sp++) {
    const ang = time * 0.03 + sp * (Math.PI / 2);
    const dist = s * 1.5;
    const sx = Math.cos(ang) * dist;
    const sy = Math.sin(ang) * dist * 0.6;
    const alpha = (Math.sin(time * 0.1 + sp) + 1) * 0.5;
    ctx.fillStyle = 'rgba(255, 255, 200, ' + alpha + ')';
    ctx.beginPath();
    ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();

  // Floating "?" hint above chest
  if (!ch.opened) {
    ctx.font = 'bold 14px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.strokeText('★', cx, cy - s * 1.5);
    ctx.fillStyle = '#FFD700';
    ctx.fillText('★', cx, cy - s * 1.5);
    ctx.textAlign = 'start';
  }
}

export function drawCloud(ctx: CanvasRenderingContext2D, c: Cloud) {
  const cx = c.x;
  const cy = c.y;
  const s = c.size;
  const a = c.alpha;
  if (a <= 0.02) return;

  // Soft dark base (shadow)
  ctx.fillStyle = 'rgba(90, 105, 125, ' + a * 0.85 + ')';
  ctx.beginPath();
  ctx.ellipse(cx, cy + s * 0.15, s * 0.95, s * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();

  // Mid gray (main body)
  ctx.fillStyle = 'rgba(150, 160, 175, ' + a + ')';
  ctx.beginPath();
  ctx.ellipse(cx - s * 0.35, cy + s * 0.05, s * 0.5, s * 0.4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + s * 0.3, cy + s * 0.05, s * 0.55, s * 0.42, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx, cy - s * 0.05, s * 0.65, s * 0.45, 0, 0, Math.PI * 2);
  ctx.fill();

  // Lighter top bumps (higher)
  ctx.fillStyle = 'rgba(200, 210, 225, ' + a + ')';
  ctx.beginPath();
  ctx.ellipse(cx - s * 0.3, cy - s * 0.2, s * 0.35, s * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + s * 0.05, cy - s * 0.28, s * 0.45, s * 0.32, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + s * 0.4, cy - s * 0.15, s * 0.3, s * 0.25, 0, 0, Math.PI * 2);
  ctx.fill();

  // Bright highlight top
  ctx.fillStyle = 'rgba(245, 250, 255, ' + a * 0.9 + ')';
  ctx.beginPath();
  ctx.ellipse(cx + s * 0.05, cy - s * 0.35, s * 0.28, s * 0.14, 0, 0, Math.PI * 2);
  ctx.fill();

  // Soft bottom drips
  ctx.fillStyle = 'rgba(120, 135, 155, ' + a * 0.4 + ')';
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.ellipse(cx + i * s * 0.35, cy + s * 0.3, s * 0.18, s * 0.1, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawIsland(
  ctx: CanvasRenderingContext2D,
  isl: Island,
  skinMap: SkinMap,
  activeSkin: string,
) {
  const ix = isl.x;
  const iy = isl.y;
  const iw = isl.width;
  const ih = isl.height;

  // === Water shadow / reflection below island ===
  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.beginPath();
  ctx.ellipse(ix + iw / 2, iy + ih + 6, iw / 2, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // === Island base (rocky/earthy) ===
  // Bottom (darker)
  ctx.fillStyle = '#6B4423';
  ctx.beginPath();
  ctx.moveTo(ix + 8, iy + ih);
  ctx.lineTo(ix + iw - 8, iy + ih);
  ctx.lineTo(ix + iw - 15, iy + ih - 12);
  ctx.lineTo(ix + 15, iy + ih - 12);
  ctx.closePath();
  ctx.fill();

  // Middle (light dirt)
  ctx.fillStyle =
    typeof skinMap !== 'undefined' && activeSkin && skinMap[activeSkin]
      ? skinMap[activeSkin].a
      : '#A0522D';
  ctx.beginPath();
  ctx.moveTo(ix + 15, iy + ih - 12);
  ctx.lineTo(ix + iw - 15, iy + ih - 12);
  ctx.lineTo(ix + iw - 20, iy + ih - 20);
  ctx.lineTo(ix + 20, iy + ih - 20);
  ctx.closePath();
  ctx.fill();

  // Top grass layer
  ctx.fillStyle = '#4CAF50';
  ctx.beginPath();
  ctx.moveTo(ix + 20, iy + ih - 20);
  ctx.lineTo(ix + iw - 20, iy + ih - 20);
  ctx.lineTo(ix + iw - 30, iy + ih - 28);
  ctx.lineTo(ix + 30, iy + ih - 28);
  ctx.closePath();
  ctx.fill();

  // Top grass highlight
  ctx.fillStyle = '#66BB6A';
  ctx.beginPath();
  ctx.moveTo(ix + 30, iy + ih - 28);
  ctx.lineTo(ix + iw - 30, iy + ih - 28);
  ctx.lineTo(ix + iw - 35, iy + ih - 32);
  ctx.lineTo(ix + 35, iy + ih - 32);
  ctx.closePath();
  ctx.fill();

  // Grass tufts (small bumps)
  ctx.fillStyle = '#388E3C';
  for (let i = 0; i < 8; i++) {
    const gx = ix + 30 + (iw - 60) * (i / 7);
    ctx.beginPath();
    ctx.moveTo(gx, iy + ih - 32);
    ctx.lineTo(gx + 3, iy + ih - 36);
    ctx.lineTo(gx + 6, iy + ih - 32);
    ctx.closePath();
    ctx.fill();
  }

  // === Trees ===
  isl.trees.forEach((tree) => {
    const tx = ix + tree.x;
    const ty = iy + ih - 32 + tree.y;
    // Trunk
    ctx.fillStyle = '#5D4037';
    ctx.fillRect(tx - 2, ty, 4, tree.size);
    // Foliage (triangle pine)
    ctx.fillStyle = '#2E7D32';
    ctx.beginPath();
    ctx.moveTo(tx, ty - tree.size * 0.8);
    ctx.lineTo(tx + tree.size * 0.7, ty);
    ctx.lineTo(tx - tree.size * 0.7, ty);
    ctx.closePath();
    ctx.fill();
    // Foliage highlight
    ctx.fillStyle = '#4CAF50';
    ctx.beginPath();
    ctx.moveTo(tx, ty - tree.size * 0.8);
    ctx.lineTo(tx + tree.size * 0.3, ty - tree.size * 0.2);
    ctx.lineTo(tx - tree.size * 0.3, ty - tree.size * 0.2);
    ctx.closePath();
    ctx.fill();
  });

  // === Rocks ===
  isl.rocks.forEach((rock) => {
    const rx = ix + rock.x;
    const ry = iy + ih - 22 + rock.y;
    ctx.fillStyle = '#607D8B';
    ctx.beginPath();
    ctx.arc(rx, ry, rock.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#90A4AE';
    ctx.beginPath();
    ctx.arc(rx - rock.size * 0.3, ry - rock.size * 0.3, rock.size * 0.4, 0, Math.PI * 2);
    ctx.fill();
  });

  // === If collected, show a +5W +3P floating text ===
  if (isl.collected && isl.life > 2300) {
    const age = 2400 - isl.life;
    ctx.font = 'bold 12px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    const txt = '+5W +3P';
    ctx.strokeText(txt, ix + iw / 2, iy - 10 - age * 0.15);
    ctx.fillStyle = '#FFD700';
    ctx.fillText(txt, ix + iw / 2, iy - 10 - age * 0.15);
    ctx.textAlign = 'start';
  }
}

export function drawFish(ctx: CanvasRenderingContext2D, fish: Fish, time: number) {
  const cx = fish.x + fish.width / 2;
  const cy = fish.y + fish.height / 2;
  const tailWag = Math.sin(fish.tailPhase) * (fish.height * 0.35);

  // Water ripple
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + fish.height * 0.6, fish.width / 2, fish.height * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Glow for attached/onRaft fish (only if still has bites left)
  if ((fish.state === 'attached' || fish.state === 'onRaft') && fish.bitesLeft > 0) {
    const glowPulse = 0.3 + Math.sin(time * 0.1) * 0.15;
    ctx.fillStyle = `rgba(255, 220, 100, ${glowPulse * 0.4})`;
    ctx.beginPath();
    ctx.arc(cx, cy, fish.width * 0.9, 0, Math.PI * 2);
    ctx.fill();
  }

  // === ROTATION based on velocity ===
  let rotation = 0;
  if (fish.state === 'attached' || fish.state === 'onRaft') {
    // Face the direction the fish came from (attachFacing: 1 = right, -1 = left)
    rotation = fish.attachFacing >= 0 ? 0 : Math.PI;
  } else {
    const spd = Math.sqrt(fish.vx * fish.vx + fish.vy * fish.vy);
    if (spd > 0.1) rotation = Math.atan2(fish.vy, fish.vx);
    else rotation = fish.facingRight ? 0 : Math.PI;
  }

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotation);

  const hw = fish.width / 2;
  const hh = fish.height / 2;

  // === TAIL FIN (scaled to fish size) ===
  const tailSpread = hh * 1.1;
  const tailLen = hw * 0.35;
  ctx.fillStyle = fish.color;
  ctx.beginPath();
  ctx.moveTo(-hw + 2, 0);
  ctx.lineTo(-hw - tailLen, -tailSpread + tailWag);
  ctx.lineTo(-hw - tailLen * 1.3, tailWag);
  ctx.lineTo(-hw - tailLen, tailSpread + tailWag);
  ctx.closePath();
  ctx.fill();
  // Tail darker edge
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // === BODY (scaled ellipse) ===
  if (fish.isGolden) {
    const gGrad = ctx.createRadialGradient(0, -hh * 0.3, 0, 0, 0, hw * 1.2);
    gGrad.addColorStop(0, '#FFF8DC');
    gGrad.addColorStop(0.4, '#FFD700');
    gGrad.addColorStop(1, '#B8860B');
    ctx.fillStyle = gGrad;
  } else {
    ctx.fillStyle = fish.color;
  }
  ctx.beginPath();
  ctx.ellipse(0, 0, hw, hh, 0, 0, Math.PI * 2);
  ctx.fill();
  if (fish.isGolden) {
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(0, 0, hw, hh, 0, 0, Math.PI * 2);
    ctx.stroke();
    for (let gsp = 0; gsp < 3; gsp++) {
      const gAng = time * 0.05 + gsp * 2.09;
      ctx.fillStyle = 'rgba(255, 240, 150, ' + (0.7 + Math.sin(time * 0.1 + gsp) * 0.3) + ')';
      ctx.beginPath();
      ctx.arc(Math.cos(gAng) * hw * 1.3, Math.sin(gAng) * hh * 1.3, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // === BELLY (lighter bottom half) ===
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.beginPath();
  ctx.ellipse(hw * 0.05, hh * 0.3, hw * 0.75, hh * 0.45, 0, 0, Math.PI * 2);
  ctx.fill();

  // === BACK STRIPE (darker top) ===
  ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
  ctx.beginPath();
  ctx.ellipse(0, -hh * 0.5, hw * 0.85, hh * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();

  // === SCALE TEXTURE (for medium & large fish only) ===
  if (fish.sizeCategory !== 'small') {
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)';
    ctx.lineWidth = 0.8;
    const scaleCount = fish.sizeCategory === 'large' ? 5 : 3;
    for (let row = 0; row < scaleCount; row++) {
      const sy = -hh * 0.4 + ((hh * 0.8) / scaleCount) * row;
      const arcCount = Math.floor((hw * 0.9) / (hh * 0.3));
      for (let col = 0; col < arcCount; col++) {
        const sx = -hw * 0.6 + ((hw * 1.2) / arcCount) * col + (row % 2) * (hw * 0.1);
        ctx.beginPath();
        ctx.arc(sx, sy, hh * 0.18, 0, Math.PI);
        ctx.stroke();
      }
    }
  }

  // === DORSAL FIN (scaled) ===
  const dorsalH = hh * 0.7;
  const dorsalW = hw * 0.55;
  ctx.fillStyle = fish.color;
  ctx.beginPath();
  ctx.moveTo(-dorsalW * 0.5, -hh + 1);
  ctx.quadraticCurveTo(-dorsalW * 0.1, -hh - dorsalH, dorsalW * 0.6, -hh + 1);
  ctx.closePath();
  ctx.fill();
  // Dorsal fin darker edge
  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  ctx.lineWidth = 0.8;
  ctx.stroke();

  // === SIDE PECTORAL FIN (scaled) ===
  const pectW = hw * 0.35;
  ctx.fillStyle = fish.color;
  ctx.beginPath();
  ctx.moveTo(-hw * 0.05, hh * 0.1);
  ctx.quadraticCurveTo(-hw * 0.05 - pectW, hh * 0.5, hw * 0.15, hh * 0.6);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 0.8;
  ctx.stroke();

  // === REALISTIC EYE (scaled, positioned properly) ===
  // Eye position: forward-top area of head
  const eyeX = hw * 0.48;
  const eyeY = -hh * 0.25;
  // Eye size scales but with caps (not too small/big)
  const eyeR = Math.max(1.6, Math.min(hh * 0.22, 3.5));

  // Socket shadow
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.arc(eyeX, eyeY, eyeR + 0.8, 0, Math.PI * 2);
  ctx.fill();

  // Eye white (thin ring visible)
  ctx.fillStyle = '#F5F5F5';
  ctx.beginPath();
  ctx.arc(eyeX, eyeY, eyeR, 0, Math.PI * 2);
  ctx.fill();

  // Iris (dark, most of visible area)
  ctx.fillStyle = '#0D0D0D';
  ctx.beginPath();
  ctx.arc(eyeX + eyeR * 0.15, eyeY, eyeR * 0.85, 0, Math.PI * 2);
  ctx.fill();

  // Shine (top-left highlight)
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.beginPath();
  ctx.arc(eyeX - eyeR * 0.35, eyeY - eyeR * 0.4, eyeR * 0.3, 0, Math.PI * 2);
  ctx.fill();

  // === GILL LINE (curved line behind eye) ===
  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  ctx.lineWidth = Math.max(0.8, hh * 0.08);
  ctx.beginPath();
  ctx.moveTo(hw * 0.2, -hh * 0.5);
  ctx.quadraticCurveTo(hw * 0.15, 0, hw * 0.2, hh * 0.5);
  ctx.stroke();

  // === MOUTH (soft curve at the front) ===
  ctx.strokeStyle = 'rgba(0,0,0,0.55)';
  ctx.lineWidth = Math.max(0.9, hh * 0.08);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(hw * 0.92, -hh * 0.05);
  ctx.quadraticCurveTo(hw * 0.82, hh * 0.25, hw * 0.6, hh * 0.15);
  ctx.stroke();
  ctx.lineCap = 'butt';

  ctx.restore();

  // Outline
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.ellipse(cx, cy, hw, hh, rotation, 0, Math.PI * 2);
  ctx.stroke();

  // Bites counter for attached fish
  if (fish.state === 'attached' || fish.state === 'onRaft') {
    ctx.fillStyle = 'rgba(255, 240, 100, 0.95)';
    ctx.font = 'bold ' + Math.max(10, fish.height * 0.7) + 'px Arial';
    ctx.textAlign = 'center';
    ctx.strokeStyle = 'rgba(0,0,0,0.7)';
    ctx.lineWidth = 2;
    ctx.strokeText('×' + fish.bitesLeft, cx, cy - fish.height * 1.1);
    ctx.fillText('×' + fish.bitesLeft, cx, cy - fish.height * 1.1);
  }
}

export function drawFrog(ctx: CanvasRenderingContext2D, frog: Frog, player: PlayerBox) {
  const cx = frog.x + frog.width / 2;
  const cy = frog.y + frog.height / 2;
  const hopY = Math.sin(frog.hopPhase) * 2;

  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 18, 18, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#1E8449';
  ctx.beginPath();
  ctx.ellipse(cx - 16, cy + 10 + hopY, 8, 6, -0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + 16, cy + 10 + hopY, 8, 6, 0.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#2C7A3D';
  ctx.beginPath();
  ctx.ellipse(cx, cy + hopY, 18, 14, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#5BA86C';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 3 + hopY, 11, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#1A5E2A';
  ctx.beginPath();
  ctx.arc(cx - 9, cy - 3 + hopY, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + 5, cy - 6 + hopY, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + 11, cy + 1 + hopY, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx - 4, cy + 8 + hopY, 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#2C7A3D';
  ctx.beginPath();
  ctx.arc(cx - 8, cy - 12 + hopY, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + 8, cy - 12 + hopY, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#F5F5DC';
  ctx.beginPath();
  ctx.ellipse(cx - 8, cy - 12 + hopY, 4, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + 8, cy - 12 + hopY, 4, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  const lookX = player.x > cx ? 1.5 : -1.5;
  ctx.fillStyle = '#8B0000';
  ctx.beginPath();
  ctx.arc(cx - 8 + lookX, cy - 12 + hopY, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + 8 + lookX, cy - 12 + hopY, 2.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(255, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.arc(cx - 8 + lookX, cy - 12 + hopY, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + 8 + lookX, cy - 12 + hopY, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#0A2810';
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - 13, cy - 19 + hopY);
  ctx.lineTo(cx - 4, cy - 16 + hopY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + 13, cy - 19 + hopY);
  ctx.lineTo(cx + 4, cy - 16 + hopY);
  ctx.stroke();
  ctx.lineCap = 'butt';

  // === FROG MOUTH: closed by default, open when charging/firing ===
  const isFiring = frog.shootTimer < 25;
  if (isFiring) {
    // Mouth WIDE OPEN (charging poison)
    const openAmount = Math.min(1, (25 - frog.shootTimer) / 15);
    const mouthRadius = 5 + openAmount * 5;
    // Dark mouth interior
    ctx.fillStyle = '#2A0A0A';
    ctx.beginPath();
    ctx.arc(cx, cy + 8 + hopY, mouthRadius, 0, Math.PI * 2);
    ctx.fill();
    // Mouth rim
    ctx.strokeStyle = '#0A2810';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy + 8 + hopY, mouthRadius, 0, Math.PI * 2);
    ctx.stroke();
    // Tongue (small pink)
    ctx.fillStyle = '#E74C3C';
    ctx.beginPath();
    ctx.arc(cx, cy + 8 + hopY + 2, mouthRadius * 0.5, 0, Math.PI * 2);
    ctx.fill();
    // Sharp teeth around the mouth
    ctx.fillStyle = '#FFFFFF';
    for (let t = 0; t < 5; t++) {
      const angle = Math.PI * 0.15 + ((Math.PI * 0.7) / 4) * t;
      const tx = cx + Math.cos(angle) * mouthRadius;
      const ty = cy + 8 + hopY + Math.sin(angle) * mouthRadius;
      const nx = Math.cos(angle + Math.PI);
      const ny = Math.sin(angle + Math.PI);
      ctx.beginPath();
      ctx.moveTo(tx + Math.cos(angle + 1.4) * 2, ty + Math.sin(angle + 1.4) * 2);
      ctx.lineTo(tx + nx * 3, ty + ny * 3);
      ctx.lineTo(tx + Math.cos(angle - 1.4) * 2, ty + Math.sin(angle - 1.4) * 2);
      ctx.closePath();
      ctx.fill();
    }
  } else {
    // Mouth CLOSED (small frown)
    ctx.strokeStyle = '#0A2810';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy + 9 + hopY, 6, Math.PI + 0.4, -0.4);
    ctx.stroke();
    // Small fangs poking out (subtle)
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(cx - 3, cy + 6 + hopY);
    ctx.lineTo(cx - 2, cy + 8 + hopY);
    ctx.lineTo(cx - 1, cy + 6 + hopY);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx + 1, cy + 6 + hopY);
    ctx.lineTo(cx + 2, cy + 8 + hopY);
    ctx.lineTo(cx + 3, cy + 6 + hopY);
    ctx.closePath();
    ctx.fill();
  }

  ctx.fillStyle = '#1E8449';
  ctx.beginPath();
  ctx.arc(cx - 12, cy + 6 + hopY, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + 12, cy + 6 + hopY, 3, 0, Math.PI * 2);
  ctx.fill();

  if (frog.shootTimer < 20) {
    ctx.fillStyle = 'rgba(142, 68, 173, 0.8)';
    ctx.beginPath();
    ctx.arc(cx, cy + hopY, 3 + (20 - frog.shootTimer) * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawShark(ctx: CanvasRenderingContext2D, shark: Shark) {
  const cx = shark.x + shark.width / 2;
  const cy = shark.y + shark.height / 2;
  const tailWave = Math.sin(shark.tailPhase) * 8;

  // Determine facing direction from velocity
  const facingRight = shark.vx >= 0;
  // Water disturbance
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 20, 60, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(cx, cy);
  // Rotate only slightly based on vertical component (max ±30 degrees)
  const tilt = Math.max(-0.5, Math.min(0.5, shark.vy * 0.15));
  ctx.rotate(tilt);
  ctx.scale(facingRight ? 1 : -1, 1);

  // Now draw shark centered at (0, 0), head pointing right
  // Tail fin (left side)
  ctx.fillStyle = '#4A4A4A';
  ctx.beginPath();
  ctx.moveTo(-80, 0);
  ctx.lineTo(-100, tailWave - 15);
  ctx.lineTo(-100, tailWave + 15);
  ctx.closePath();
  ctx.fill();

  // Body
  ctx.fillStyle = '#5D6D7E';
  ctx.beginPath();
  ctx.moveTo(-80, 0);
  ctx.quadraticCurveTo(-40, -22, 50, -12);
  ctx.quadraticCurveTo(85, 0, 50, 12);
  ctx.quadraticCurveTo(-40, 22, -80, 0);
  ctx.closePath();
  ctx.fill();

  // Belly
  ctx.fillStyle = '#85929E';
  ctx.beginPath();
  ctx.moveTo(-60, 2);
  ctx.quadraticCurveTo(10, 12, 50, 8);
  ctx.quadraticCurveTo(10, 8, -60, 2);
  ctx.closePath();
  ctx.fill();

  // Dorsal fin (top)
  ctx.fillStyle = '#3D4A57';
  ctx.beginPath();
  ctx.moveTo(-10, -18);
  ctx.lineTo(10, -42);
  ctx.lineTo(30, -18);
  ctx.closePath();
  ctx.fill();

  // Pectoral fin (side)
  ctx.beginPath();
  ctx.moveTo(-20, 5);
  ctx.lineTo(-30, 25);
  ctx.lineTo(0, 12);
  ctx.closePath();
  ctx.fill();

  // Eye
  ctx.fillStyle = '#FFF';
  ctx.beginPath();
  ctx.arc(50, -4, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(51, -4, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // === SHARK MOUTH — closed by default, opens during bite/fire ===
  if (shark.mouthOpen > 0) {
    // Mouth WIDE OPEN
    const openAmt = Math.min(1, shark.mouthOpen / 40);
    const gape = 6 + openAmt * 14;

    // Dark mouth interior (big triangular void)
    ctx.fillStyle = '#1A0505';
    ctx.beginPath();
    ctx.moveTo(78, 0);
    ctx.lineTo(50, -gape * 0.6);
    ctx.lineTo(48, 0);
    ctx.lineTo(50, gape * 0.6);
    ctx.closePath();
    ctx.fill();

    // Tongue (pink inside)
    ctx.fillStyle = '#C0392B';
    ctx.beginPath();
    ctx.ellipse(58, gape * 0.15, 8, gape * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Upper teeth row
    ctx.fillStyle = '#FFF';
    for (let i = 0; i < 4; i++) {
      const tx = 52 + i * 8;
      const ty = -gape * 0.55 + i * 0.8;
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(tx + 3, ty + 6);
      ctx.lineTo(tx + 6, ty);
      ctx.closePath();
      ctx.fill();
    }
    // Lower teeth row
    for (let i = 0; i < 4; i++) {
      const tx = 52 + i * 8;
      const ty = gape * 0.55 - i * 0.8;
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(tx + 3, ty - 6);
      ctx.lineTo(tx + 6, ty);
      ctx.closePath();
      ctx.fill();
    }

    // Mouth rim (dark line around it)
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(78, 0);
    ctx.lineTo(50, -gape * 0.6);
    ctx.moveTo(78, 0);
    ctx.lineTo(50, gape * 0.6);
    ctx.stroke();

    // Blood particles when biting
    if (shark.mouthOpen > 30) {
      ctx.fillStyle = 'rgba(200, 0, 0, 0.7)';
      for (let i = 0; i < 5; i++) {
        const bx = 55 + Math.random() * 20;
        const by = -10 + Math.random() * 20;
        ctx.beginPath();
        ctx.arc(bx, by, 1.5 + Math.random() * 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else {
    // Mouth CLOSED (subtle line)
    ctx.strokeStyle = '#2C3E50';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(75, 3);
    ctx.quadraticCurveTo(60, 8, 40, 5);
    ctx.stroke();

    // Small fangs peeking out
    ctx.fillStyle = '#FFF';
    for (let i = 0; i < 3; i++) {
      const tx = 46 + i * 8;
      ctx.beginPath();
      ctx.moveTo(tx, 4);
      ctx.lineTo(tx + 2, 7);
      ctx.lineTo(tx + 4, 4);
      ctx.closePath();
      ctx.fill();
    }
  }

  ctx.restore();
}

export function drawWood(
  ctx: CanvasRenderingContext2D,
  item: Item,
  skinMap: SkinMap,
  activeSkin: string,
) {
  ctx.save();
  ctx.translate(item.x + item.width / 2, item.y + item.height / 2);
  ctx.rotate(item.rotation);
  const w = item.width;
  const h = item.height;
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(2, 2, w / 2, h / 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle =
    typeof skinMap !== 'undefined' && activeSkin && skinMap[activeSkin]
      ? skinMap[activeSkin].c
      : '#8B4513';
  ctx.fillRect(-w / 2, -h / 3, w, (h * 2) / 3);
  ctx.fillStyle =
    typeof skinMap !== 'undefined' && activeSkin && skinMap[activeSkin]
      ? skinMap[activeSkin].a
      : '#A0522D';
  ctx.fillRect(-w / 2, -h / 3, w, h / 6);
  ctx.fillStyle = '#5D3A0F';
  ctx.fillRect(-w / 2, h / 6, w, h / 6);
  ctx.strokeStyle = '#5D3A0F';
  ctx.lineWidth = 1;
  for (let i = -w / 2 + 4; i < w / 2; i += 6) {
    ctx.beginPath();
    ctx.moveTo(i, -h / 3 + 2);
    ctx.lineTo(i + 2, h / 3 - 2);
    ctx.stroke();
  }
  ctx.fillStyle = '#D2B48C';
  ctx.beginPath();
  ctx.ellipse(-w / 2 + 1, 0, 3, h / 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#8B4513';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = '#C4A57B';
  ctx.beginPath();
  ctx.ellipse(w / 2 - 1, 0, 2, h / 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawPlastic(ctx: CanvasRenderingContext2D, item: Item) {
  ctx.save();
  ctx.translate(item.x + item.width / 2, item.y + item.height / 2);
  ctx.rotate(item.rotation);
  const w = item.width;
  const h = item.height;
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(2, 2, w / 2.5, h / 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#D6EAF8';
  ctx.fillRect(-w / 4, -h / 3, w / 2, (h * 5) / 6);
  ctx.fillStyle = '#EBF5FB';
  ctx.fillRect(-w / 4 + 2, -h / 3 + 2, 4, (h * 5) / 6 - 4);
  ctx.fillStyle = '#A9CCE3';
  ctx.fillRect(w / 4 - 4, -h / 3, 4, (h * 5) / 6);
  ctx.fillStyle = '#D6EAF8';
  ctx.fillRect(-w / 8, -h / 2, w / 4, h / 6);
  ctx.fillStyle = '#3498DB';
  ctx.fillRect(-w / 8 - 1, -h / 2 - 2, w / 4 + 2, 4);
  ctx.fillStyle = '#F39C12';
  ctx.fillRect(-w / 4, -h / 8, w / 2, h / 5);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(-w / 4 + 3, -h / 8 + 3, w / 2 - 6, 2);
  ctx.fillRect(-w / 4 + 3, -h / 8 + 7, w / 2 - 10, 2);
  ctx.strokeStyle = '#5D6D7E';
  ctx.lineWidth = 1;
  ctx.strokeRect(-w / 4, -h / 3, w / 2, (h * 5) / 6);
  ctx.strokeRect(-w / 8, -h / 2, w / 4, h / 6);
  ctx.restore();
}

export function drawVerticalRaft(
  ctx: CanvasRenderingContext2D,
  raftTilt: number,
  floors: number,
  hasCampfire: boolean,
  time: number,
  skinMap: SkinMap,
  activeSkin: string,
  rx: number,
  ry: number,
  rw: number,
  rh: number,
) {
  const raftLevel = Math.max(1, Math.floor((rh - 150) / 40) + 1);
  // RAFT LEVEL BADGE
  if (raftLevel >= 2) {
    const _lvX = rx + rw / 2;
    const _lvY = ry - 12;
    ctx.font = 'bold 9px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.strokeText('LV ' + raftLevel, _lvX, _lvY);
    const _lvColor =
      raftLevel >= 5
        ? '#FFD700'
        : raftLevel >= 4
          ? '#E74C3C'
          : raftLevel >= 3
            ? '#3498DB'
            : '#2ECC71';
    ctx.fillStyle = _lvColor;
    ctx.fillText('LV ' + raftLevel, _lvX, _lvY);
    ctx.textAlign = 'start';
  }
  ctx.save();
  ctx.translate(rx + rw / 2, ry + rh / 2);
  ctx.rotate(raftTilt);
  ctx.translate(-(rx + rw / 2), -(ry + rh / 2));

  // ============ WAKE SYSTEM AROUND RAFT ============

  // 1. BOW WAVE (at TOP, in front of raft) — water pushed forward
  const bowY = ry - 8;
  // Layered V shape growing outward
  for (let layer = 0; layer < 3; layer++) {
    const size = 30 + layer * 20;
    const alpha = 0.75 - layer * 0.2;
    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.lineWidth = 3 - layer * 0.5;
    ctx.beginPath();
    ctx.moveTo(rx + rw / 2 - size, bowY - layer * 8);
    ctx.quadraticCurveTo(
      rx + rw / 2,
      bowY - 18 - layer * 6,
      rx + rw / 2 + size,
      bowY - layer * 8,
    );
    ctx.stroke();
  }

  // Bow foam splash (bright white water pushed up at front)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.beginPath();
  ctx.ellipse(rx + rw / 2, ry - 2, rw / 2 + 4, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // 2. MAIN RAFT BODY
  // Shadow under raft (below it)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.ellipse(rx + rw / 2 + 5, ry + rh + 3, rw / 2 + 6, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  // === FLOOR EXTENSIONS (widens the raft) ===
  const _floors = floors;

  if (_floors > 0) {
    ctx.fillStyle = '#7A3B10';
    ctx.fillRect(rx - 10 * _floors, ry + 5, 10 * _floors, rh - 10);
    ctx.fillRect(rx + rw, ry + 5, 10 * _floors, rh - 10);
    ctx.strokeStyle = '#5D3A0F';
    ctx.lineWidth = 1;
    for (let f = 0; f < _floors; f++) {
      ctx.beginPath();
      ctx.moveTo(rx - 10 * (f + 1), ry + 5);
      ctx.lineTo(rx - 10 * (f + 1), ry + rh - 5);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(rx + rw + 10 * (f + 1), ry + 5);
      ctx.lineTo(rx + rw + 10 * (f + 1), ry + rh - 5);
      ctx.stroke();
    }
  }

  // Main raft body
  const sk = skinMap[activeSkin] || skinMap['default'];
  ctx.fillStyle = sk.c;
  ctx.fillRect(rx, ry, rw, rh);
  ctx.fillStyle = sk.a;
  ctx.fillRect(rx + 5, ry + 5, rw - 10, rh - 10);

  ctx.strokeStyle = '#6B3410';
  ctx.lineWidth = 2;
  for (let i = 15; i < rh - 10; i += 18) {
    ctx.beginPath();
    ctx.moveTo(rx + 5, ry + i);
    ctx.lineTo(rx + rw - 5, ry + i);
    ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(93, 58, 15, 0.4)';
  ctx.lineWidth = 1;
  for (let i = 12; i < rw - 10; i += 14) {
    ctx.beginPath();
    ctx.moveTo(rx + i, ry + 5);
    ctx.lineTo(rx + i, ry + rh - 5);
    ctx.stroke();
  }

  ctx.strokeStyle = '#C4A57B';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(rx - 2, ry + rh * 0.25);
  ctx.lineTo(rx + rw + 2, ry + rh * 0.25);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(rx - 2, ry + rh * 0.75);
  ctx.lineTo(rx + rw + 2, ry + rh * 0.75);
  ctx.stroke();

  // CAMPFIRE ON RAFT
  const _hasCampfireDraw = hasCampfire;
  if (_hasCampfireDraw) {
    const _fx = rx + 15;
    const _fy = ry + rh - 15;
    const _flicker = 0.85 + Math.sin(time * 0.3) * 0.15;
    const _flicker2 = 0.9 + Math.sin(time * 0.47) * 0.1;
    const _glow = ctx.createRadialGradient(_fx, _fy, 2, _fx, _fy, 55);
    _glow.addColorStop(0, 'rgba(255, 220, 120, ' + 0.6 * _flicker + ')');
    _glow.addColorStop(1, 'rgba(255, 140, 30, 0)');
    ctx.fillStyle = _glow;
    ctx.beginPath();
    ctx.arc(_fx, _fy, 55, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#5D3A0F';
    ctx.save();
    ctx.translate(_fx, _fy);
    ctx.rotate(0.5);
    ctx.fillRect(-9, -2, 18, 4);
    ctx.rotate(-1.0);
    ctx.fillRect(-9, -2, 18, 4);
    ctx.restore();
    ctx.fillStyle = 'rgba(255, 90, 20, ' + 0.9 * _flicker + ')';
    ctx.beginPath();
    ctx.moveTo(_fx - 6, _fy - 2);
    ctx.quadraticCurveTo(_fx - 4, _fy - 14 * _flicker2, _fx, _fy - 18 * _flicker);
    ctx.quadraticCurveTo(_fx + 4, _fy - 14 * _flicker2, _fx + 6, _fy - 2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 170, 40, ' + 0.9 * _flicker2 + ')';
    ctx.beginPath();
    ctx.moveTo(_fx - 4, _fy - 2);
    ctx.quadraticCurveTo(_fx - 2, _fy - 10 * _flicker, _fx, _fy - 13 * _flicker2);
    ctx.quadraticCurveTo(_fx + 2, _fy - 10 * _flicker, _fx + 4, _fy - 2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 240, 180, ' + _flicker + ')';
    ctx.beginPath();
    ctx.moveTo(_fx - 2, _fy - 2);
    ctx.quadraticCurveTo(_fx - 1, _fy - 6 * _flicker2, _fx, _fy - 8 * _flicker);
    ctx.quadraticCurveTo(_fx + 1, _fy - 6 * _flicker2, _fx + 2, _fy - 2);
    ctx.closePath();
    ctx.fill();
    for (let _sp = 0; _sp < 3; _sp++) {
      const _spAge = (time * 2 + _sp * 30) % 60;
      const _spY = _fy - 10 - _spAge * 0.4;
      const _spA = 1 - _spAge / 60;
      ctx.fillStyle = 'rgba(255, 200, 80, ' + _spA + ')';
      ctx.beginPath();
      ctx.arc(_fx + Math.sin(time * 0.1 + _sp) * 3, _spY, 1, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.strokeStyle = '#5D3A0F';
  ctx.lineWidth = 2;
  ctx.strokeRect(rx, ry, rw, rh);

  // 3. SIDE FOAM STREAMS — water rushing past left and right sides
  // Two parallel vertical streams on each side, animated to slide downward
  const streamSlide = (time * 1.8) % 40;
  for (let side = -1; side <= 1; side += 2) {
    for (let s = 0; s < 2; s++) {
      const streamX = rx + rw / 2 + side * (rw / 2 + 6 + s * 8);
      // Draw 5 segments that slide down
      for (let seg = 0; seg < 5; seg++) {
        const segY = ry + ((seg * 40 + streamSlide) % (rh + 40)) - 20;
        if (segY < ry - 10 || segY > ry + rh + 10) continue;
        const alpha = 0.55 - s * 0.15 - seg * 0.05;
        if (alpha < 0.05) continue;
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.lineWidth = 3 - s * 0.8;
        ctx.beginPath();
        ctx.moveTo(streamX, segY);
        ctx.quadraticCurveTo(streamX + side * 4, segY + 8, streamX, segY + 16);
        ctx.stroke();
      }
    }
  }

  // 4. TURBULENCE — small white bubbles around the raft edges
  for (let b = 0; b < 8; b++) {
    const bubbleSide = b % 2 === 0 ? -1 : 1;
    const bubbleY = ry + 8 + ((b * 25 + time * 1.5) % (rh - 16));
    const bubbleX = rx + rw / 2 + bubbleSide * (rw / 2 + 10 + Math.sin(time * 0.1 + b) * 3);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.beginPath();
    ctx.arc(bubbleX, bubbleY, 2 + Math.sin(time * 0.15 + b) * 1, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();

  // 5. TRAILING V-WAKE (behind raft, extends DOWNWARD) — multiple layered V's
  const wakeX = rx + rw / 2;
  for (let layer = 0; layer < 5; layer++) {
    const layerY = ry + rh + 10 + layer * 18;
    const spread = 20 + layer * 15;
    const alpha = 0.65 - layer * 0.11;
    if (alpha < 0.05) continue;
    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.lineWidth = 3 - layer * 0.4;
    ctx.beginPath();
    ctx.moveTo(wakeX - spread, layerY);
    ctx.quadraticCurveTo(wakeX, layerY + 10, wakeX + spread, layerY);
    ctx.stroke();
  }

  // 6. Central vertical foam trail behind raft (extends straight down)
  const trailLen = 40 + ((time * 0.5) % 30);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 8]);
  ctx.beginPath();
  ctx.moveTo(wakeX, ry + rh + 8);
  ctx.lineTo(wakeX, ry + rh + 8 + trailLen);
  ctx.stroke();
  ctx.setLineDash([]);
}

export function drawPlayer(
  ctx: CanvasRenderingContext2D,
  playerWidth: number,
  invulnerabilityTimer: number,
  isWalking: boolean,
  walkCycle: number,
  px: number,
  py: number,
  state: string,
) {
  if (invulnerabilityTimer > 0 && invulnerabilityTimer % 10 < 5) return;
  const skin = '#FAD7A1';
  const skinShadow = '#E5C088';
  const hair = '#5D4037';
  const shirt = '#3498DB';
  const shirtShadow = '#2471A3';
  const pants = '#2C3E50';
  const shoe = '#1A1A1A';
  const outline = '#1A1A1A';
  const armSwing = isWalking ? Math.sin(walkCycle) * 4 : 0;

  if (state === 'standing') {
    ctx.fillStyle = outline;
    ctx.fillRect(px + 4, py + 50, 14, 30);
    ctx.fillRect(px + 22, py + 50, 14, 30);
    ctx.fillStyle = pants;
    ctx.fillRect(px + 6, py + 52, 10, 26);
    ctx.fillRect(px + 24, py + 52, 10, 26);
    ctx.fillStyle = outline;
    ctx.fillRect(px + 2, py + 76, 18, 6);
    ctx.fillRect(px + 20, py + 76, 18, 6);
    ctx.fillStyle = shoe;
    ctx.fillRect(px + 4, py + 78, 16, 4);
    ctx.fillRect(px + 22, py + 78, 16, 4);
    ctx.fillStyle = outline;
    ctx.fillRect(px + 4, py + 24, 32, 30);
    ctx.fillStyle = shirt;
    ctx.fillRect(px + 6, py + 26, 28, 26);
    ctx.fillStyle = shirtShadow;
    ctx.fillRect(px + 6, py + 26, 28, 4);
    ctx.fillStyle = outline;
    ctx.fillRect(px - 4, py + 26 + armSwing, 12, 24);
    ctx.fillStyle = skin;
    ctx.fillRect(px - 2, py + 28 + armSwing, 8, 20);
    ctx.fillStyle = skinShadow;
    ctx.fillRect(px - 2, py + 46 + armSwing, 8, 6);
    ctx.fillStyle = outline;
    ctx.fillRect(px + 32, py + 26 - armSwing, 12, 24);
    ctx.fillStyle = skin;
    ctx.fillRect(px + 34, py + 28 - armSwing, 8, 20);
    ctx.fillStyle = skinShadow;
    ctx.fillRect(px + 34, py + 46 - armSwing, 8, 6);
    ctx.fillStyle = skinShadow;
    ctx.fillRect(px + 16, py + 22, 8, 4);
    ctx.fillStyle = outline;
    ctx.fillRect(px + 8, py + 4, 24, 22);
    ctx.fillStyle = skin;
    ctx.fillRect(px + 10, py + 6, 20, 18);
    ctx.fillStyle = hair;
    ctx.fillRect(px + 6, py, 28, 12);
    ctx.fillRect(px + 6, py + 6, 6, 10);
    ctx.fillRect(px + 28, py + 6, 6, 10);
    ctx.fillStyle = '#FFF';
    ctx.fillRect(px + 14, py + 12, 6, 6);
    ctx.fillRect(px + 22, py + 12, 6, 6);
    ctx.fillStyle = '#000';
    ctx.fillRect(px + 16, py + 14, 3, 4);
    ctx.fillRect(px + 23, py + 14, 3, 4);
    ctx.fillStyle = skinShadow;
    ctx.fillRect(px + 17, py + 21, 8, 2);
  } else if (state === 'sitting') {
    ctx.fillStyle = outline;
    ctx.fillRect(px + 6, py + 54, 14, 14);
    ctx.fillStyle = pants;
    ctx.fillRect(px + 8, py + 56, 10, 10);
    ctx.fillStyle = outline;
    ctx.fillRect(px + 4, py + 66, 14, 14);
    ctx.fillStyle = pants;
    ctx.fillRect(px + 6, py + 68, 10, 10);
    ctx.fillStyle = outline;
    ctx.fillRect(px + 2, py + 78, 18, 6);
    ctx.fillStyle = shoe;
    ctx.fillRect(px + 4, py + 80, 14, 4);
    ctx.fillStyle = outline;
    ctx.fillRect(px + 22, py + 54, 14, 14);
    ctx.fillStyle = pants;
    ctx.fillRect(px + 24, py + 56, 10, 10);
    ctx.fillStyle = outline;
    ctx.fillRect(px + 24, py + 66, 14, 14);
    ctx.fillStyle = pants;
    ctx.fillRect(px + 26, py + 68, 10, 10);
    ctx.fillStyle = outline;
    ctx.fillRect(px + 22, py + 78, 18, 6);
    ctx.fillStyle = shoe;
    ctx.fillRect(px + 24, py + 80, 14, 4);
    ctx.fillStyle = outline;
    ctx.fillRect(px + 4, py + 28, 32, 28);
    ctx.fillStyle = shirt;
    ctx.fillRect(px + 6, py + 30, 28, 24);
    ctx.fillStyle = shirtShadow;
    ctx.fillRect(px + 6, py + 30, 28, 4);
    ctx.fillStyle = outline;
    ctx.fillRect(px - 4, py + 30, 12, 22);
    ctx.fillRect(px + 32, py + 30, 12, 22);
    ctx.fillStyle = skin;
    ctx.fillRect(px - 2, py + 32, 8, 18);
    ctx.fillRect(px + 34, py + 32, 8, 18);
    ctx.fillStyle = skinShadow;
    ctx.fillRect(px - 2, py + 48, 8, 6);
    ctx.fillRect(px + 34, py + 48, 8, 6);
    ctx.fillStyle = skinShadow;
    ctx.fillRect(px + 16, py + 26, 8, 4);
    ctx.fillStyle = outline;
    ctx.fillRect(px + 8, py + 8, 24, 22);
    ctx.fillStyle = skin;
    ctx.fillRect(px + 10, py + 10, 20, 18);
    ctx.fillStyle = hair;
    ctx.fillRect(px + 6, py + 4, 28, 12);
    ctx.fillRect(px + 6, py + 10, 6, 10);
    ctx.fillRect(px + 28, py + 10, 6, 10);
    ctx.fillStyle = '#FFF';
    ctx.fillRect(px + 14, py + 16, 6, 6);
    ctx.fillRect(px + 22, py + 16, 6, 6);
    ctx.fillStyle = '#000';
    ctx.fillRect(px + 16, py + 18, 3, 4);
    ctx.fillRect(px + 23, py + 18, 3, 4);
    ctx.fillStyle = skinShadow;
    ctx.fillRect(px + 17, py + 25, 8, 2);
  } else if (state === 'laying') {
    const cx = px + playerWidth / 2;
    ctx.fillStyle = outline;
    ctx.fillRect(cx - 18, py + 90, 14, 40);
    ctx.fillRect(cx + 4, py + 90, 14, 40);
    ctx.fillStyle = pants;
    ctx.fillRect(cx - 16, py + 92, 10, 36);
    ctx.fillRect(cx + 6, py + 92, 10, 36);
    ctx.fillStyle = outline;
    ctx.fillRect(cx - 20, py + 126, 18, 8);
    ctx.fillRect(cx + 2, py + 126, 18, 8);
    ctx.fillStyle = shoe;
    ctx.fillRect(cx - 18, py + 128, 14, 4);
    ctx.fillRect(cx + 4, py + 128, 14, 4);
    ctx.fillStyle = outline;
    ctx.fillRect(cx - 18, py + 50, 36, 42);
    ctx.fillStyle = shirt;
    ctx.fillRect(cx - 16, py + 52, 32, 38);
    ctx.fillStyle = shirtShadow;
    ctx.fillRect(cx - 16, py + 52, 32, 4);
    ctx.fillStyle = outline;
    ctx.fillRect(cx - 30, py + 56, 14, 36);
    ctx.fillRect(cx + 16, py + 56, 14, 36);
    ctx.fillStyle = skin;
    ctx.fillRect(cx - 28, py + 58, 10, 32);
    ctx.fillRect(cx + 18, py + 58, 10, 32);
    ctx.fillStyle = skinShadow;
    ctx.fillRect(cx - 28, py + 88, 10, 6);
    ctx.fillRect(cx + 18, py + 88, 10, 6);
    ctx.fillStyle = skinShadow;
    ctx.fillRect(cx - 6, py + 44, 12, 8);
    ctx.fillStyle = outline;
    ctx.fillRect(cx - 16, py + 14, 32, 30);
    ctx.fillStyle = skin;
    ctx.fillRect(cx - 14, py + 16, 28, 26);
    ctx.fillStyle = hair;
    ctx.fillRect(cx - 18, py + 6, 36, 14);
    ctx.fillRect(cx - 18, py + 14, 6, 20);
    ctx.fillRect(cx + 12, py + 14, 6, 20);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - 10, py + 28);
    ctx.lineTo(cx - 3, py + 28);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + 3, py + 28);
    ctx.lineTo(cx + 10, py + 28);
    ctx.stroke();
    ctx.fillStyle = skinShadow;
    ctx.fillRect(cx - 5, py + 36, 10, 2);
  }
}

export function drawKraken(ctx: CanvasRenderingContext2D, kr: Kraken, time: number) {
  const kx = kr.x;
  const ky = kr.y;
  const wobble = Math.sin(time * 0.08) * 8;
  const isHit = kr.hitFlash > 0;
  const bodyColor = isHit ? '#FF6B6B' : '#5D3A9C';
  const darkColor = isHit ? '#B71C1C' : '#3A2258';
  ctx.fillStyle = 'rgba(200, 230, 255, 0.5)';
  ctx.beginPath();
  ctx.ellipse(kx, ky + 40, 100, 20, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.ellipse(kx, ky, 55, 70, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = darkColor;
  ctx.beginPath();
  ctx.ellipse(kx, ky + 15, 45, 50, 0, 0, Math.PI * 2);
  ctx.fill();
  for (let ti = 0; ti < 4; ti++) {
    const side = ti < 2 ? -1 : 1;
    const ti2 = ti % 2;
    const baseY = ky + 10 + ti2 * 25;
    ctx.strokeStyle = bodyColor;
    ctx.lineWidth = 10 - ti2 * 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(kx + side * 40, baseY);
    ctx.bezierCurveTo(
      kx + side * (70 + ti2 * 10),
      baseY + 10 + wobble,
      kx + side * (55 + ti2 * 5),
      baseY + 40 + wobble,
      kx + side * (80 + ti2 * 10),
      baseY + 60 + wobble * 0.5,
    );
    ctx.stroke();
  }
  ctx.strokeStyle = bodyColor;
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.moveTo(kx - 8, ky + 40);
  ctx.bezierCurveTo(kx - 15, ky + 70, kx - 5 + wobble * 0.3, ky + 90, kx + 5, ky + 110);
  ctx.stroke();
  ctx.fillStyle = '#FFF';
  ctx.beginPath();
  ctx.ellipse(kx - 20, ky - 10, 12, 15, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(kx + 20, ky - 10, 12, 15, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#E74C3C';
  ctx.beginPath();
  ctx.arc(kx - 22, ky - 6, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(kx + 18, ky - 6, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(kx - 22, ky - 6, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(kx + 18, ky - 6, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(kx - 32, ky - 28);
  ctx.lineTo(kx - 10, ky - 22);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(kx + 32, ky - 28);
  ctx.lineTo(kx + 10, ky - 22);
  ctx.stroke();
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.moveTo(kx - 8, ky + 25);
  ctx.lineTo(kx, ky + 40);
  ctx.lineTo(kx + 8, ky + 25);
  ctx.closePath();
  ctx.fill();
  const barW = 120;
  const barH = 10;
  const barX = kx - barW / 2;
  const barY = ky - 100;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(barX - 2, barY - 2, barW + 4, barH + 4);
  ctx.fillStyle = '#333';
  ctx.fillRect(barX, barY, barW, barH);
  const hpW = (kr.hp / kr.maxHp) * barW;
  const hpColor = kr.hp > 3 ? '#2ECC71' : kr.hp > 1 ? '#F39C12' : '#E74C3C';
  ctx.fillStyle = hpColor;
  ctx.fillRect(barX, barY, hpW, barH);
  ctx.font = 'bold 12px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 4;
  ctx.strokeText('KRAKEN', kx, barY - 8);
  ctx.fillStyle = '#9C27B0';
  ctx.fillText('KRAKEN', kx, barY - 8);
  ctx.textAlign = 'start';
}

// RAFT-108: compact health bar shown above enemies while damaged.
export function drawEnemyHealthBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  hp: number,
  maxHp: number,
  color: string,
) {
  const w = Math.max(24, width * 0.6);
  const bx = x + (width - w) / 2;
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(bx - 1, y - 1, w + 2, 6);
  ctx.fillStyle = '#333';
  ctx.fillRect(bx, y, w, 4);
  ctx.fillStyle = color;
  ctx.fillRect(bx, y, w * Math.max(0, Math.min(1, hp / maxHp)), 4);
}

// ===== RAFT-109 / RAFT-107 draw helpers =====

/** A pulsing jellyfish: translucent bell + trailing tentacles. */
export function drawJellyfish(ctx: CanvasRenderingContext2D, j: Jellyfish, time: number) {
  const cx = j.x + j.width / 2;
  const cy = j.y + j.height / 2;
  const pulse = 1 + Math.sin(time * 0.08 + j.bobPhase) * 0.08;
  const bellW = (j.width / 2) * pulse;
  const bellH = (j.height / 2) * pulse;

  ctx.save();
  // Soft glow so it reads against the water.
  ctx.fillStyle = 'rgba(255, 143, 214, 0.18)';
  ctx.beginPath();
  ctx.ellipse(cx, cy, bellW + 10, bellH + 10, 0, 0, Math.PI * 2);
  ctx.fill();

  // Tentacles
  ctx.strokeStyle = 'rgba(255, 143, 214, 0.75)';
  ctx.lineWidth = 2;
  for (let t = -2; t <= 2; t++) {
    const tx = cx + t * (bellW / 3);
    const sway = Math.sin(time * 0.12 + t + j.bobPhase) * 4;
    ctx.beginPath();
    ctx.moveTo(tx, cy + bellH * 0.6);
    ctx.quadraticCurveTo(tx + sway, cy + bellH * 1.4, tx + sway * 1.5, cy + bellH * 2.1);
    ctx.stroke();
  }

  // Bell
  const grad = ctx.createLinearGradient(cx, cy - bellH, cx, cy + bellH);
  grad.addColorStop(0, '#FFB3E6');
  grad.addColorStop(1, '#C77DFF');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(cx, cy, bellW, bellH, 0, Math.PI, Math.PI * 2);
  ctx.quadraticCurveTo(cx, cy + bellH * 0.5, cx - bellW, cy);
  ctx.closePath();
  ctx.fill();

  // Highlight + eyes
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.beginPath();
  ctx.ellipse(cx - bellW * 0.35, cy - bellH * 0.35, bellW * 0.22, bellH * 0.18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#3A1A4D';
  ctx.beginPath();
  ctx.arc(cx - 4, cy - 2, 1.8, 0, Math.PI * 2);
  ctx.arc(cx + 4, cy - 2, 1.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** A white seagull with flapping wings; dives beak-first when attacking. */
export function drawSeagull(ctx: CanvasRenderingContext2D, s: Seagull) {
  const cx = s.x + s.width / 2;
  const cy = s.y + s.height / 2;
  const facingRight = s.vx >= 0;
  const flap = Math.sin(s.flapPhase) * (s.state === 'diving' ? 0.35 : 1);

  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(facingRight ? 1 : -1, 1);
  if (s.state === 'diving') ctx.rotate(0.5);

  // Body
  ctx.fillStyle = s.hitFlash > 0 ? '#FFB3B3' : '#F4F6F7';
  ctx.beginPath();
  ctx.ellipse(0, 0, s.width / 2, s.height / 2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Wings (flap up/down)
  ctx.fillStyle = '#D5DBDB';
  ctx.beginPath();
  ctx.moveTo(-2, -2);
  ctx.quadraticCurveTo(-4, -18 * flap - 4, 16, -12 * flap - 2);
  ctx.quadraticCurveTo(4, -2, -2, -2);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(2, 0);
  ctx.quadraticCurveTo(0, 16 * flap + 4, -12, 12 * flap + 2);
  ctx.quadraticCurveTo(0, 4, 2, 0);
  ctx.closePath();
  ctx.fill();

  // Head + beak + eye
  ctx.fillStyle = '#F4F6F7';
  ctx.beginPath();
  ctx.arc(s.width / 2 - 4, -2, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#F39C12';
  ctx.beginPath();
  ctx.moveTo(s.width / 2 + 1, -3);
  ctx.lineTo(s.width / 2 + 12, 0);
  ctx.lineTo(s.width / 2 + 1, 3);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#222';
  ctx.beginPath();
  ctx.arc(s.width / 2 - 4, -4, 1.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** A distant pirate raft: dark hull, tattered sail, skull flag. */
export function drawPirateRaft(ctx: CanvasRenderingContext2D, p: PirateRaft) {
  const x = p.x;
  const y = p.y;
  const w = p.width;
  const h = p.height;

  ctx.save();

  // Hull
  ctx.fillStyle = p.hitFlash > 0 ? '#B03A2E' : '#4A3728';
  ctx.beginPath();
  ctx.moveTo(x, y + h * 0.55);
  ctx.lineTo(x + w, y + h * 0.55);
  ctx.lineTo(x + w - 18, y + h);
  ctx.lineTo(x + 18, y + h);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#2E2118';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Mast
  ctx.fillStyle = '#3A2A1C';
  ctx.fillRect(x + w / 2 - 3, y - 26, 6, h * 0.8 + 26);

  // Sail
  ctx.fillStyle = '#7F8C8D';
  ctx.beginPath();
  ctx.moveTo(x + w / 2 + 3, y - 22);
  ctx.lineTo(x + w / 2 + 46, y + 12);
  ctx.lineTo(x + w / 2 + 3, y + 30);
  ctx.closePath();
  ctx.fill();

  // Skull flag
  ctx.fillStyle = '#111';
  ctx.fillRect(x + w / 2 - 3, y - 44, 34, 18);
  ctx.fillStyle = '#F4F6F7';
  ctx.beginPath();
  ctx.arc(x + w / 2 + 14, y - 37, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(x + w / 2 + 10, y - 33, 8, 3);

  ctx.restore();
}

/** RAFT-107: the player's harpoon in flight. */
export function drawHarpoon(ctx: CanvasRenderingContext2D, h: Harpoon) {
  ctx.save();
  ctx.translate(h.x, h.y);
  ctx.rotate(h.angle);

  // Shaft
  ctx.strokeStyle = '#8B5A2B';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-16, 0);
  ctx.lineTo(12, 0);
  ctx.stroke();

  // Barbed tip
  ctx.fillStyle = '#BDC3C7';
  ctx.beginPath();
  ctx.moveTo(12, -5);
  ctx.lineTo(24, 0);
  ctx.lineTo(12, 5);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#ECF0F1';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(12, -5);
  ctx.lineTo(24, 0);
  ctx.lineTo(12, 5);
  ctx.stroke();

  ctx.restore();
}


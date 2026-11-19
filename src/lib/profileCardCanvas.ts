import type { RecommendationResult } from '@/src/types/skincare';

function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): number {
  const words = text.split(' ');
  let line = '';
  let currentY = y;

  for (let i = 0; i < words.length; i += 1) {
    const testLine = line + words[i] + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && i > 0) {
      ctx.fillText(line.trim(), x, currentY);
      line = words[i] + ' ';
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  if (line.trim()) {
    ctx.fillText(line.trim(), x, currentY);
    currentY += lineHeight;
  }
  return currentY;
}

export function generateSkinProfileImageDataUrl(result: RecommendationResult): string {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1350;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background
  ctx.fillStyle = '#FAF9F5';
  ctx.fillRect(0, 0, 1080, 1350);

  // Subtle botanical sage band at top
  ctx.fillStyle = '#E4E8DF';
  ctx.fillRect(0, 0, 1080, 220);

  // Brand Wordmark
  ctx.fillStyle = '#1C241E';
  ctx.font = '600 44px Georgia, serif';
  ctx.fillText('Face Check Bite', 84, 105);

  ctx.fillStyle = '#525C54';
  ctx.font = '500 26px system-ui, -apple-system, sans-serif';
  ctx.fillText('Know your skin. Pick what fits.', 84, 152);

  // Outer card frame
  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = '#DDE3D7';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(72, 260, 936, 920, 28);
  ctx.fill();
  ctx.stroke();

  // Swatch & Skin Type header
  ctx.fillStyle = result.profile.swatchHex;
  ctx.beginPath();
  ctx.arc(166, 370, 52, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#1C241E22';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = '#525C54';
  ctx.font = '600 24px system-ui, sans-serif';
  ctx.fillText('MY SKIN FIT PROFILE', 246, 344);

  ctx.fillStyle = '#1C241E';
  ctx.font = '700 50px Georgia, serif';
  ctx.fillText(result.profile.skinTypeLabel, 246, 404);

  ctx.fillStyle = '#525C54';
  ctx.font = '500 28px system-ui, sans-serif';
  ctx.fillText(
    `${result.profile.toneLabel} · ${result.profile.undertoneLabel}`,
    114,
    476
  );

  // Divider
  ctx.strokeStyle = '#E8ECE3';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(114, 512);
  ctx.lineTo(966, 512);
  ctx.stroke();

  // Top Concerns
  ctx.fillStyle = '#525C54';
  ctx.font = '600 22px system-ui, sans-serif';
  ctx.fillText('TOP CONCERNS', 114, 566);

  ctx.fillStyle = '#1C241E';
  ctx.font = '600 32px system-ui, sans-serif';
  ctx.fillText(result.profile.topConcerns.join('  ·  '), 114, 616);

  // Plain language explanation
  ctx.fillStyle = '#525C54';
  ctx.font = '400 28px system-ui, sans-serif';
  let nextY = drawWrappedText(
    ctx,
    result.profile.plainLanguageExplanation,
    114,
    680,
    840,
    42
  );

  // Routine Match Summary
  nextY += 28;
  ctx.fillStyle = '#F1F3EE';
  ctx.beginPath();
  ctx.roundRect(114, nextY, 852, 236, 20);
  ctx.fill();

  ctx.fillStyle = '#3F624D';
  ctx.font = '600 22px system-ui, sans-serif';
  ctx.fillText('MATCHED 3-STEP STARTER KIT · ₹799', 148, nextY + 48);

  ctx.fillStyle = '#1C241E';
  ctx.font = '500 26px system-ui, sans-serif';
  result.starterKit.includedItems.forEach((item, idx) => {
    ctx.fillText(`${idx + 1}. ${item.name}`, 148, nextY + 102 + idx * 46);
  });

  // Referral callout
  ctx.fillStyle = '#DF5A47';
  ctx.font = '600 26px monospace';
  ctx.fillText(
    `Share code ${result.profile.referralCode} for ₹50 off your first kit`,
    114,
    1134
  );

  // Footer disclaimer
  ctx.fillStyle = '#525C54';
  ctx.font = '400 21px system-ui, sans-serif';
  drawWrappedText(
    ctx,
    'Self-reported informational profile · Not a substitute for professional dermatological advice.',
    84,
    1244,
    912,
    30
  );

  return canvas.toDataURL('image/png');
}

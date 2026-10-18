"use client";

export function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function downloadText(filename: string, text: string) {
  downloadBlob(filename, new Blob([text], { type: "text/plain;charset=utf-8" }));
}

export function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "muse-export"
  );
}

function colorsFromGradient(gradient: string) {
  const matches = gradient.match(/#[0-9a-f]{3,8}/gi);
  return matches && matches.length >= 2 ? [matches[0], matches[matches.length - 1]] : ["#8b5cf6", "#ec4899"];
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
    if (lines.length === maxLines) break;
  }
  if (current && lines.length < maxLines) lines.push(current);
  return lines;
}

export function renderThumbnail(options: {
  title: string;
  subtitle: string;
  gradient: string;
  emoji: string;
}) {
  const canvas = document.createElement("canvas");
  canvas.width = 1280;
  canvas.height = 720;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const [from, to] = colorsFromGradient(options.gradient);
  const bg = ctx.createLinearGradient(0, 0, 1280, 720);
  bg.addColorStop(0, from);
  bg.addColorStop(1, to);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 1280, 720);

  // glow + grain
  const glow = ctx.createRadialGradient(980, 120, 20, 980, 120, 640);
  glow.addColorStop(0, "rgba(255,255,255,0.42)");
  glow.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 1280, 720);
  ctx.fillStyle = "rgba(0,0,0,0.28)";
  ctx.fillRect(0, 380, 1280, 340);

  for (let i = 0; i < 2600; i += 1) {
    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.05})`;
    ctx.fillRect(Math.random() * 1280, Math.random() * 720, 2, 2);
  }

  ctx.fillStyle = "#fff";
  ctx.font = "700 108px 'Space Grotesk', system-ui, sans-serif";
  ctx.textBaseline = "alphabetic";
  const lines = wrapText(ctx, options.title, 900, 3);
  const startY = 720 - 150 - (lines.length - 1) * 116;
  lines.forEach((line, index) => {
    ctx.fillStyle = index === lines.length - 1 ? "rgba(255,255,255,0.92)" : "#ffffff";
    ctx.fillText(line, 72, startY + index * 116);
  });

  ctx.font = "600 34px 'Instrument Sans', system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.82)";
  ctx.fillText(options.subtitle.toUpperCase(), 76, startY + 58);

  ctx.font = "86px system-ui, 'Apple Color Emoji', 'Segoe UI Emoji', sans-serif";
  ctx.fillText(options.emoji, 1100, 140);

  ctx.font = "700 28px 'Space Grotesk', system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.fillText("muse.", 1128, 668);

  return canvas;
}

export function downloadThumbnail(options: { title: string; subtitle: string; gradient: string; emoji: string }) {
  const canvas = renderThumbnail(options);
  if (!canvas) return false;
  canvas.toBlob((blob) => {
    if (blob) downloadBlob(`${slugify(options.title)}-cover.png`, blob);
  }, "image/png");
  return true;
}

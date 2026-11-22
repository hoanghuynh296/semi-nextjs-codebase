// Colour-vision-deficiency simulation (Machado, Oliveira & Fernandes 2009, severity 1.0) for the chart palette checks.
import { parseColor, rgbToOklch } from "../../brand/color.mjs";

const MATRICES = {
  normal: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
  protan: [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
  deutan: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.01182, 0.04294, 0.968881]],
  tritan: [[1.255528, -0.076749, -0.178779], [-0.078411, 0.930809, 0.147602], [0.004733, 0.691367, 0.3039]],
};
export const VISIONS = Object.keys(MATRICES);

const lin = (v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
const gam = (v) => (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055);
const clamp = (v) => Math.min(1, Math.max(0, v));

/** Hex as seen with `vision` (normal | protan | deutan | tritan): OKLab { l, a, b }. */
export function seen(hex, vision) {
  const c = parseColor(hex);
  const rgb = [c.r, c.g, c.b].map(lin);
  const m = MATRICES[vision];
  const [r, g, b] = m.map((row) => gam(clamp(row[0] * rgb[0] + row[1] * rgb[1] + row[2] * rgb[2])));
  const { l, c: ch, h } = rgbToOklch({ r, g, b });
  return { l, a: ch * Math.cos((h * Math.PI) / 180), b: ch * Math.sin((h * Math.PI) / 180) };
}

/** OKLab distance of two hex colours as seen with `vision`. */
export function distance(x, y, vision) {
  const p = seen(x, vision);
  const q = seen(y, vision);
  return Math.hypot(p.l - q.l, p.a - q.a, p.b - q.b);
}

/** Smallest pairwise distance over a list of hex colours and the visions: { min, pair, vision }. */
export function worstPair(hexes) {
  let worst = { min: Infinity };
  for (const vision of VISIONS)
    for (let i = 0; i < hexes.length; i++)
      for (let j = i + 1; j < hexes.length; j++) {
        const d = distance(hexes[i], hexes[j], vision);
        if (d < worst.min) worst = { min: d, pair: [i + 1, j + 1], vision };
      }
  return worst;
}

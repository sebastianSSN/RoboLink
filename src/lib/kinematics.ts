export const L1 = 25, L2 = 65, L3 = 85;

export const toRad = (d: number) => d * Math.PI / 180;
export const toDeg = (r: number) => r * 180 / Math.PI;

export function computeJointPositions(q1: number, q2: number, q3: number) {
  const r1 = toRad(q1), r2 = toRad(q2), r3 = toRad(q3);
  const r23 = r2 + r3;

  const p0: [number, number, number] = [0, 0, 0];
  const p1: [number, number, number] = [0, 0, L1];
  const p2: [number, number, number] = [
    p1[0] + L2 * Math.cos(r2) * Math.cos(r1),
    p1[1] + L2 * Math.cos(r2) * Math.sin(r1),
    p1[2] + L2 * Math.sin(r2),
  ];
  const p3: [number, number, number] = [
    p2[0] + L3 * Math.cos(r23) * Math.cos(r1),
    p2[1] + L3 * Math.cos(r23) * Math.sin(r1),
    p2[2] + L3 * Math.sin(r23),
  ];
  return { p0, p1, p2, p3 };
}

export function computeMGD(q1: number, q2: number, q3: number) {
  const { p0, p1, p2, p3 } = computeJointPositions(q1, q2, q3);
  return {
    X: p3[0], Y: p3[1], Z: p3[2],
    phi: q1, theta: q2, psi: q3,
    p0, p1, p2, p3,
  };
}

export function computeIK(px: number, py: number, pz: number) {
  const q1 = Math.atan2(py, px);
  const r = Math.sqrt(px * px + py * py);
  const z = pz - L1;
  const dist = Math.sqrt(r * r + z * z);

  if (dist > L2 + L3 || dist < Math.abs(L2 - L3)) return null;

  const D = (r * r + z * z - L2 * L2 - L3 * L3) / (2 * L2 * L3);
  if (Math.abs(D) > 1) return null;

  const q3 = Math.atan2(-Math.sqrt(1 - D * D), D);
  const q2 = Math.atan2(z, r) - Math.atan2(L3 * Math.sin(q3), L2 + L3 * Math.cos(q3));

  return { j1: toDeg(q1), j2: toDeg(q2), j3: toDeg(q3) };
}
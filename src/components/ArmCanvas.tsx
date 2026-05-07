// src/components/ArmCanvas.tsx
import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import Svg, {
  Line, Circle, Path, Text as SvgText, G,
} from 'react-native-svg';
import { computeJointPositions, computeMGD } from '../lib/kinematics';
import { useArmStore } from '../state/useArmStore';

function iso(x: number, y: number, z: number, W: number, H: number, scale: number) {
  const ix = (x - y) * Math.cos(Math.PI / 6);
  const iy = (x + y) * Math.sin(Math.PI / 6) - z;
  return { x: W / 2 + ix * scale, y: H / 2 + 60 + iy * scale };
}

// Colores sólidos por segmento (sin gradientes — incompatibles con RN SVG en stroke)
const SEG_COLORS  = ['#00b4ff', '#00e5a0', '#ffaa00'];
const SEG_WIDTHS  = [9, 7, 5];
const JOINT_COLORS = ['rgba(180,200,220,0.8)', '#00b4ff', '#00e5a0', '#ff6680'];
const JOINT_RADII  = [11, 9, 9, 6];

export default function ArmCanvas() {
  const { width } = useWindowDimensions();
  const angles = useArmStore(s => s.angles);

  const W     = Math.min(width - 48, 520);
  const H     = Math.round(W * 0.85);
  const scale = Math.min(W, H) / 380;

  const { j1, j2, j3 } = angles;
  const { p0, p1, p2, p3 } = computeJointPositions(j1, j2, j3);
  const mgd    = computeMGD(j1, j2, j3);
  const joints: [number, number, number][] = [p0, p1, p2, p3];

  // ── Grid ────────────────────────────────────────────────────────────────────
  const gridLines = [];
  for (let i = -160; i <= 160; i += 40) {
    const a = iso(i, -160, 0, W, H, scale);
    const b = iso(i,  160, 0, W, H, scale);
    const c = iso(-160, i, 0, W, H, scale);
    const d = iso( 160, i, 0, W, H, scale);
    gridLines.push(
      <Line key={`gx${i}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
        stroke="rgba(0,180,255,0.07)" strokeWidth={0.5} />,
      <Line key={`gy${i}`} x1={c.x} y1={c.y} x2={d.x} y2={d.y}
        stroke="rgba(0,180,255,0.07)" strokeWidth={0.5} />,
    );
  }

  // ── Ejes ────────────────────────────────────────────────────────────────────
  const axes = [
    { to: [80, 0, 0] as [number,number,number], color: 'rgba(255,100,100,0.5)', label: 'X' },
    { to: [0, 80, 0] as [number,number,number], color: 'rgba(100,255,100,0.5)', label: 'Y' },
    { to: [0, 0, 80] as [number,number,number], color: 'rgba(100,180,255,0.5)', label: 'Z' },
  ];

  return (
    <View style={[s.wrap, { height: H }]}>
      <Svg width={W} height={H}>

        {/* Grid */}
        {gridLines}

        {/* Ejes */}
        {axes.map(({ to, color, label }) => {
          const from = iso(0, 0, 0, W, H, scale);
          const t    = iso(...to, W, H, scale);
          return (
            <G key={label}>
              <Line x1={from.x} y1={from.y} x2={t.x} y2={t.y}
                stroke={color} strokeWidth={1} strokeDasharray="3 3" />
              <SvgText x={t.x + 4} y={t.y - 4} fill={color}
                fontSize={10 * scale} fontFamily="monospace">{label}</SvgText>
            </G>
          );
        })}

        {/* Sombra en el suelo */}
        {joints.slice(0, -1).map((p, i) => {
          const a = iso(p[0], p[1], 0, W, H, scale);
          const b = iso(joints[i+1][0], joints[i+1][1], 0, W, H, scale);
          return (
            <Line key={`sh${i}`}
              x1={a.x} y1={a.y} x2={b.x} y2={b.y}
              stroke="#00b4ff" strokeWidth={2}
              strokeDasharray="2 4" opacity={0.15} />
          );
        })}

        {/* Círculos de sombra */}
        {joints.map((p, i) => {
          const sp = iso(p[0], p[1], 0, W, H, scale);
          return (
            <Circle key={`sc${i}`} cx={sp.x} cy={sp.y} r={3}
              fill="rgba(0,180,255,0.15)" />
          );
        })}

        {/* ── Segmentos del brazo (color sólido, strokeLinecap round) ── */}
        {joints.slice(0, -1).map((p, i) => {
          const a = iso(...p,           W, H, scale);
          const b = iso(...joints[i+1], W, H, scale);
          return (
            <Line key={`seg${i}`}
              x1={a.x} y1={a.y} x2={b.x} y2={b.y}
              stroke={SEG_COLORS[i]}
              strokeWidth={SEG_WIDTHS[i] * scale}
              strokeLinecap="round" />
          );
        })}

        {/* ── Articulaciones ── */}
        {joints.map((p, i) => {
          const pt = iso(...p, W, H, scale);
          const r  = JOINT_RADII[i] * scale;
          return (
            <G key={`jt${i}`}>
              {/* Halo exterior */}
              <Circle cx={pt.x} cy={pt.y} r={r * 1.8}
                fill={i === 3 ? 'rgba(255,102,128,0.12)' : 'rgba(0,180,255,0.08)'} />
              {/* Círculo principal */}
              <Circle cx={pt.x} cy={pt.y} r={r}
                fill={JOINT_COLORS[i]}
                stroke="rgba(0,0,0,0.5)" strokeWidth={1} />
              {/* Punto interior (excepto base) */}
              {i > 0 && (
                <Circle cx={pt.x} cy={pt.y} r={3 * scale}
                  fill="rgba(0,0,0,0.6)" />
              )}
            </G>
          );
        })}

        {/* Etiqueta EEF */}
        {(() => {
          const ef = iso(...p3, W, H, scale);
          return (
            <SvgText x={ef.x + 8} y={ef.y - 4}
              fill="rgba(255,102,128,0.9)"
              fontSize={9 * scale} fontFamily="sans-serif">EEF</SvgText>
          );
        })()}

        {/* Coordenadas en mm */}
        <SvgText x={8} y={H - 8}
          fill="rgba(0,180,255,0.5)"
          fontSize={8 * scale} fontFamily="monospace">
          ({mgd.X.toFixed(0)}, {mgd.Y.toFixed(0)}, {mgd.Z.toFixed(0)}) mm
        </SvgText>

      </Svg>

      {/* Overlay inferior derecho */}
      <View style={s.overlay}>
        <SvgText fill="#4a7899" fontSize={10} fontFamily="sans-serif">Vista 3D isométrica</SvgText>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    backgroundColor: '#081525', borderRadius: 12,
    overflow: 'hidden', alignItems: 'center',
    justifyContent: 'center', width: '100%',
  },
  overlay: {
    position: 'absolute', bottom: 12, right: 12,
  },
});
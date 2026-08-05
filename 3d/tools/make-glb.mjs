import { writeFileSync } from 'node:fs';

const positions = [];
const normals = [];
const indices = [];
const materials = [];
const ranges = [];

function box(name, size, center, material) {
  const indexStart = indices.length;
  const [sx, sy, sz] = size.map((value) => value / 2);
  const [cx, cy, cz] = center;
  const base = positions.length / 3;
  const corners = [
    [-sx, -sy, -sz], [sx, -sy, -sz], [sx, sy, -sz], [-sx, sy, -sz],
    [-sx, -sy, sz], [sx, -sy, sz], [sx, sy, sz], [-sx, sy, sz],
  ];
  corners.forEach(([x, y, z]) => positions.push(x + cx, y + cy, z + cz));
  const faces = [
    [0, 1, 2, 3, 0, 0, -1], [4, 7, 6, 5, 0, 0, 1],
    [0, 4, 5, 1, 0, -1, 0], [3, 2, 6, 7, 0, 1, 0],
    [0, 3, 7, 4, -1, 0, 0], [1, 5, 6, 2, 1, 0, 0],
  ];
  faces.forEach(([a, b, c, d, nx, ny, nz]) => {
    normals.push(nx, ny, nz, nx, ny, nz, nx, ny, nz, nx, ny, nz);
    indices.push(base + a, base + b, base + c, base + a, base + c, base + d);
  });
  materials.push({ name, baseColorFactor: material });
  ranges.push({ start: indexStart, count: indices.length - indexStart });
}

box('warm white enclosure', [0.92, 1.34, 0.24], [0, 0, 0], [0.89, 0.88, 0.82, 1]);
box('recessed e-paper bezel', [0.66, 0.73, 0.055], [0, 0.12, 0.145], [0.78, 0.78, 0.70, 1]);
box('e-paper display', [0.58, 0.65, 0.018], [0, 0.12, 0.178], [0.34, 0.37, 0.30, 1]);
box('bottom status ridge', [0.38, 0.035, 0.028], [0, -0.58, 0.14], [0.25, 0.27, 0.23, 1]);

const pos = new Uint8Array(new Float32Array(positions).buffer);
const nor = new Uint8Array(new Float32Array(normals).buffer);
const ind = new Uint8Array(new Uint16Array(indices).buffer);
const align = (n) => (n + 3) & ~3;
const posOffset = 0;
const norOffset = align(pos.byteLength);
const indOffset = align(norOffset + nor.byteLength);
const bin = new Uint8Array(indOffset + ind.byteLength);
bin.set(pos, posOffset); bin.set(nor, norOffset); bin.set(ind, indOffset);

const json = {
  asset: { version: '2.0', generator: 'Intent Computer Mini local reference mesh' },
  scene: 0,
  scenes: [{ nodes: [0, 1, 2, 3] }],
  nodes: [{ mesh: 0 }, { mesh: 1 }, { mesh: 2 }, { mesh: 3 }],
  meshes: materials.map((_, i) => ({ primitives: [{ attributes: { POSITION: 0, NORMAL: 1 }, indices: 2 + i, material: i }] })),
  materials: materials.map(({ name, baseColorFactor }) => ({ name, pbrMetallicRoughness: { baseColorFactor, roughnessFactor: 0.72, metallicFactor: 0.04 } })),
  buffers: [{ byteLength: bin.byteLength }],
  bufferViews: [
    { buffer: 0, byteOffset: posOffset, byteLength: pos.byteLength, target: 34962 },
    { buffer: 0, byteOffset: norOffset, byteLength: nor.byteLength, target: 34962 },
    { buffer: 0, byteOffset: indOffset, byteLength: ranges[0].count * 2, target: 34963 },
    ...ranges.slice(1).map((range) => ({ buffer: 0, byteOffset: indOffset + range.start * 2, byteLength: range.count * 2, target: 34963 })),
  ],
  accessors: [
    { bufferView: 0, componentType: 5126, count: positions.length / 3, type: 'VEC3', min: [-0.46, -0.67, -0.18], max: [0.46, 0.67, 0.18] },
    { bufferView: 1, componentType: 5126, count: normals.length / 3, type: 'VEC3' },
    ...ranges.map((range, i) => ({ bufferView: 2 + i, componentType: 5123, count: range.count, byteOffset: 0, type: 'SCALAR' })),
  ],
};

const jsonBytes = new TextEncoder().encode(JSON.stringify(json));
const jsonPadded = new Uint8Array(align(jsonBytes.byteLength));
jsonPadded.fill(0x20); jsonPadded.set(jsonBytes);
const total = 12 + 8 + jsonPadded.byteLength + 8 + bin.byteLength;
const out = new ArrayBuffer(total);
const view = new DataView(out);
const bytes = new Uint8Array(out);
view.setUint32(0, 0x46546c67, true); view.setUint32(4, 2, true); view.setUint32(8, total, true);
let offset = 12;
view.setUint32(offset, jsonPadded.byteLength, true); view.setUint32(offset + 4, 0x4e4f534a, true); offset += 8;
bytes.set(jsonPadded, offset); offset += jsonPadded.byteLength;
view.setUint32(offset, bin.byteLength, true); view.setUint32(offset + 4, 0x004e4942, true); offset += 8;
bytes.set(bin, offset);
writeFileSync(new URL('../assets/models/intent-computer-mini.glb', import.meta.url), bytes);

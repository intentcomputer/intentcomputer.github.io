import * as THREE from 'three';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/loaders/GLTFLoader.js';

const canvas = document.querySelector('#scene');
const scene = new THREE.Scene();
scene.fog = new THREE.Fog('#dfe4de', 8, 19);
const camera = new THREE.PerspectiveCamera(30, 1, .1, 40);
camera.position.set(0, .4, 8.8);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const clock = new THREE.Clock();

scene.add(new THREE.HemisphereLight('#f8f7ef', '#87968c', 2.4));
const key = new THREE.DirectionalLight('#fff6df', 3.2);
key.position.set(-4, 6, 7); key.castShadow = true; scene.add(key);
const fill = new THREE.DirectionalLight('#a3e9db', 1.5); fill.position.set(5, 1, 2); scene.add(fill);

const floor = new THREE.Mesh(new THREE.CircleGeometry(6, 64), new THREE.MeshBasicMaterial({ color: '#cdd7cf', transparent: true, opacity: .55 }));
floor.rotation.x = -Math.PI / 2; floor.position.y = -1.5; scene.add(floor);
const stage = new THREE.Group(); stage.position.set(1.25, .15, 0); scene.add(stage);
const miniHolder = new THREE.Group(); stage.add(miniHolder);
const devices = new THREE.Group(); stage.add(devices);
const sparks = new THREE.Group(); scene.add(sparks);

function roundedPanel(w, h, d, color, x, y, z) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color, roughness: .62, metalness: .04 }));
  mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true; return mesh;
}
function deviceScreen(width, height, x, y, z, accent) {
  const group = new THREE.Group();
  group.add(roundedPanel(width, height, .16, '#212721', x, y, z));
  group.add(roundedPanel(width - .18, height - .2, .02, accent, x, y, z + .1));
  return group;
}

const laptop = deviceScreen(2.7, 1.7, 1.95, -.35, .35, '#b9dfe1');
const laptopBase = roundedPanel(3.15, .12, 1.25, '#aab1aa', 1.95, -1.28, .36); laptopBase.rotation.x = -.12; devices.add(laptop, laptopBase);
const tv = deviceScreen(3.6, 2.15, -2.05, .35, -.25, '#d9ef72'); tv.rotation.y = .06; devices.add(tv);
const stand = roundedPanel(1.1, .08, .32, '#4d534e', -2.05, -1.02, -.25); devices.add(stand);
const tvFoot = roundedPanel(2.1, .08, .62, '#555d56', -2.05, -1.2, -.25); devices.add(tvFoot);

function createPixelTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 64; const ctx = c.getContext('2d');
  ctx.fillStyle = '#29302a'; ctx.fillRect(0, 0, 64, 64); ctx.fillStyle = '#c9fa4d';
  [[8,10,12,4],[8,20,34,3],[8,29,25,3],[8,41,44,3],[8,51,18,3]].forEach(([x,y,w,h]) => ctx.fillRect(x,y,w,h));
  const texture = new THREE.CanvasTexture(c); texture.magFilter = THREE.NearestFilter; texture.minFilter = THREE.NearestFilter; return texture;
}

function addMini(root) {
  const body = roundedPanel(.82, 1.2, .2, '#eeeae0', 0, 0, 0);
  const screen = new THREE.Mesh(new THREE.BoxGeometry(.57, .62, .025), new THREE.MeshStandardMaterial({ map: createPixelTexture(), color: '#d3dfba', roughness: 1 }));
  screen.position.set(0, .12, .115); root.add(body, screen);
  const ridge = roundedPanel(.32, .035, .02, '#c8c7bb', 0, -.5, .11); root.add(ridge);
  root.traverse((item) => { if (item.isMesh) { item.castShadow = true; item.receiveShadow = true; } });
}

let miniModel = null;
const loader = new GLTFLoader();
loader.load('./assets/models/intent-computer-mini.glb', (gltf) => {
  miniModel = gltf.scene; miniModel.scale.setScalar(1.02); miniModel.rotation.y = -.15; miniHolder.add(miniModel);
}, undefined, () => { addMini(miniHolder); });

function addSpark() {
  const geometry = new THREE.BoxGeometry(.06, .06, .06);
  const colors = ['#c9fa4d', '#9fe9df', '#eb7656', '#f2efe8'];
  const spark = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: colors[Math.floor(Math.random() * colors.length)] }));
  spark.userData = { seed: Math.random() * 10, speed: .28 + Math.random() * .38, target: Math.random() > .5 ? 1 : -1 };
  sparks.add(spark);
}
for (let i = 0; i < 38; i++) addSpark();

function resize() { const w = canvas.clientWidth, h = canvas.clientHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
new ResizeObserver(resize).observe(canvas); resize();
let scroll = 0;
addEventListener('scroll', () => { scroll = Math.min(1, Math.max(0, scrollY / Math.max(1, innerHeight * .9))); }, { passive: true });

function animate() {
  requestAnimationFrame(animate); const t = clock.getElapsedTime();
  stage.rotation.y = Math.sin(t * .22) * .06 - scroll * .2;
  stage.position.y = .15 + Math.sin(t * .75) * .06 - scroll * .25;
  miniHolder.position.set(-.1 + Math.sin(t * .55) * .04, .18, .25 + Math.cos(t * .4) * .1);
  miniHolder.rotation.y = Math.sin(t * .46) * .3 + .25;
  devices.position.x = scroll * -.55;
  devices.children.forEach((item, i) => { item.rotation.y += Math.sin(t * .3 + i) * .0007; });
  sparks.children.forEach((spark, i) => {
    const phase = (t * spark.userData.speed + spark.userData.seed) % 2;
    const p = phase < 1 ? phase : 2 - phase;
    const targetX = spark.userData.target > 0 ? 2.1 : -2.05;
    spark.position.set(-.25 + (targetX + .25) * p, .25 + Math.sin(p * Math.PI) * (i % 4) * .35 + Math.sin(t * 1.7 + i) * .08, .1 + Math.cos(p * 7 + i) * .12);
    spark.rotation.z = (t * 2 + i) % 6.28;
  });
  camera.position.x += ((innerWidth < 720 ? .2 : .25) - camera.position.x) * .02;
  camera.lookAt(.25, -.15, 0);
  renderer.render(scene, camera);
}
animate();

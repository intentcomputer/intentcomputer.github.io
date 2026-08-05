import * as THREE from "three";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/loaders/GLTFLoader.js";

const section = document.querySelector(".computer-section");
const canvas = document.querySelector("#computer-scene");

if (section && canvas) {
  let renderer;

  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "low-power",
    });
  } catch {
    renderer = null;
  }

  if (renderer) {
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog("#ffffff", 8, 17);
    const camera = new THREE.PerspectiveCamera(27, 1, 0.1, 40);
    camera.position.set(0, 0.25, 9.5);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    scene.add(new THREE.HemisphereLight("#ffffff", "#b7c9c0", 2.3));
    const key = new THREE.DirectionalLight("#fff7e8", 3.1);
    key.position.set(-4, 6, 7);
    scene.add(key);
    const edge = new THREE.DirectionalLight("#b3eee4", 1.4);
    edge.position.set(5, 1, 3);
    scene.add(edge);

    const stage = new THREE.Group();
    stage.position.set(0.6, 0.1, 0);
    scene.add(stage);
    const mini = new THREE.Group();
    mini.position.set(-2.25, 0.45, 0.25);
    stage.add(mini);
    const devices = new THREE.Group();
    devices.position.set(1.15, 0, -0.1);
    stage.add(devices);
    const pixels = new THREE.Group();
    scene.add(pixels);

    const panel = (width, height, depth, color, x, y, z) => {
      const item = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, depth),
        new THREE.MeshStandardMaterial({ color, roughness: 0.68, metalness: 0.03 }),
      );
      item.position.set(x, y, z);
      return item;
    };

    const screen = (width, height, x, y, z, color) => {
      const group = new THREE.Group();
      group.add(panel(width, height, 0.15, "#28312b", x, y, z));
      group.add(panel(width - 0.18, height - 0.2, 0.025, color, x, y, z + 0.1));
      return group;
    };

    devices.add(screen(2.9, 1.7, 1.25, 0.25, 0.2, "#cce57e"));
    devices.add(panel(3.25, 0.12, 1.15, "#a7b2aa", 1.25, -0.72, 0.2));
    devices.add(screen(2.25, 1.4, -1.9, 0.2, -0.2, "#b6e0df"));
    devices.add(panel(0.88, 0.08, 0.28, "#59625a", -1.9, -0.62, -0.2));

    const fallbackMini = () => {
      mini.add(panel(0.78, 1.14, 0.2, "#eeeae0", 0, 0, 0));
      mini.add(panel(0.57, 0.63, 0.025, "#384138", 0, 0.1, 0.115));
      mini.add(panel(0.32, 0.035, 0.02, "#c5c6b8", 0, -0.48, 0.11));
    };

    const loader = new GLTFLoader();
    loader.load(
      "3d/assets/models/intent-computer-mini.glb",
      (asset) => {
        asset.scene.scale.setScalar(0.96);
        asset.scene.rotation.y = -0.18;
        mini.add(asset.scene);
      },
      undefined,
      fallbackMini,
    );

    const pixelColors = ["#1684c7", "#f28461", "#2d9b72", "#d9a431"];
    for (let index = 0; index < 28; index += 1) {
      const pixel = new THREE.Mesh(
        new THREE.BoxGeometry(0.055, 0.055, 0.055),
        new THREE.MeshBasicMaterial({ color: pixelColors[index % pixelColors.length] }),
      );
      pixel.userData = { offset: Math.random() * 10, direction: index % 2 ? 1 : -1 };
      pixels.add(pixel);
    }

    const clock = new THREE.Clock();
    const resize = () => {
      const width = canvas.clientWidth || section.clientWidth;
      const height = canvas.clientHeight || section.clientHeight;
      renderer.setSize(width, height, false);
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
    };
    new ResizeObserver(resize).observe(section);
    resize();
    section.classList.add("webgl-ready");

    const animate = () => {
      const time = clock.getElapsedTime();
      stage.rotation.y = Math.sin(time * 0.22) * 0.05;
      stage.position.y = 0.1 + Math.sin(time * 0.7) * 0.045;
      mini.rotation.y = Math.sin(time * 0.48) * 0.28 + 0.25;
      pixels.children.forEach((pixel, index) => {
        const progress = (time * 0.25 + pixel.userData.offset) % 2;
        const travel = progress < 1 ? progress : 2 - progress;
        const destination = pixel.userData.direction > 0 ? 1.25 : -1.9;
        pixel.position.set(
          -1.1 + (destination + 1.1) * travel,
          0.32 + Math.sin(travel * Math.PI) * (index % 4) * 0.2,
          0.15 + Math.cos(time * 2 + index) * 0.08,
        );
      });
      camera.lookAt(0.1, -0.1, 0);
      renderer.render(scene, camera);
      window.requestAnimationFrame(animate);
    };
    animate();
  }
}

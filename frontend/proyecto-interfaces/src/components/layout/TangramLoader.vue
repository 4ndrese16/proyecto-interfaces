<template>
  <div class="tangram-loader" ref="container">
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue';
import * as THREE from 'three';
import gsap from 'gsap';

const emit = defineEmits(['loaded']);
const container = ref(null);
let renderer = null;
let scene = null;
let camera = null;
let animationFrameId = null;
let transitionTimeout = null;
let activeTimeline = null;
let pieces = [];
let currentIndex = 0;
let animating = false;
let hasEmittedLoaded = false;
let mainBgColor = '#0a1030';
let accentColor = '#03cafc';
let secondaryColor = '#252525';
let textColor = '#ffffff';
let alternateTextColor = '#000000';

const PIXEL_TO_UNIT = 85;

function getCssVar(name, fallback) {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

function updateThemeColors() {
  mainBgColor = getCssVar('--main-bg-color', '#0a1030');
  accentColor = getCssVar('--accent-color', '#03cafc');
  secondaryColor = getCssVar('--secondary-color', '#252525');
  textColor = getCssVar('--text-color', '#000000');
  alternateTextColor = getCssVar('--alternate-text-color', '#ffffff');
}

function getThemeColors() {
  return [
    accentColor,
    secondaryColor,
    mainBgColor,
    textColor,
    alternateTextColor,
    accentColor,
    secondaryColor
  ];
}

const largeTri = [new THREE.Vector2(0, 0), new THREE.Vector2(2.0, 0), new THREE.Vector2(0, 2.0)];
const cLarge = { x: (0 + 2 + 0) / 3, y: (0 + 0 + 2) / 3 };
const largeCentered = largeTri.map(p => new THREE.Vector2(p.x - cLarge.x, p.y - cLarge.y));

const medTri = [new THREE.Vector2(0, 0), new THREE.Vector2(1.414, 0), new THREE.Vector2(0, 1.414)];
const cMed = { x: (0 + 1.414 + 0) / 3, y: (0 + 0 + 1.414) / 3 };
const medCentered = medTri.map(p => new THREE.Vector2(p.x - cMed.x, p.y - cMed.y));

const smallTri = [new THREE.Vector2(0, 0), new THREE.Vector2(1.0, 0), new THREE.Vector2(0, 1.0)];
const cSmall = { x: (0 + 1 + 0) / 3, y: (0 + 0 + 1) / 3 };
const smallCentered = smallTri.map(p => new THREE.Vector2(p.x - cSmall.x, p.y - cSmall.y));

const square = [
  new THREE.Vector2(-0.5, -0.5),
  new THREE.Vector2(0.5, -0.5),
  new THREE.Vector2(0.5, 0.5),
  new THREE.Vector2(-0.5, 0.5)
];

const factor = 1.15;
const paraleloInvertidoGrande = [
  new THREE.Vector2(0.85 * factor, -0.3 * factor),
  new THREE.Vector2(-0.30 * factor, -0.3 * factor),
  new THREE.Vector2(-0.85 * factor, 0.3 * factor),
  new THREE.Vector2(0.30 * factor, 0.3 * factor)
];

const form1Raw = {
  piezas: [
    { centerX: 268, centerY: 465, angleDeg: 135 },
    { centerX: 396, centerY: 590, angleDeg: 45 },
    { centerX: 481, centerY: 405, angleDeg: 90 },
    { centerX: 341, centerY: 340, angleDeg: 225 },
    { centerX: 479, centerY: 471, angleDeg: 315 },
    { centerX: 411, centerY: 407, angleDeg: 45 },
    { centerX: 514, centerY: 514, angleDeg: 90 }
  ]
};

const form2Raw = {
  piezas: [
    { centerX: 124, centerY: 388, angleDeg: 180 },
    { centerX: 686, centerY: 392, angleDeg: 270 },
    { centerX: 404, centerY: 395, angleDeg: 45 },
    { centerX: 547, centerY: 356, angleDeg: 90 },
    { centerX: 355, centerY: 354, angleDeg: 0 },
    { centerX: 260, centerY: 354, angleDeg: 0 },
    { centerX: 492, centerY: 348, angleDeg: 45 }
  ]
};

const form3Raw = {
  piezas: [
    { centerX: 474, centerY: 449, angleDeg: 315 },
    { centerX: 407, centerY: 636, angleDeg: 45 },
    { centerX: 409, centerY: 383, angleDeg: 0 },
    { centerX: 343, centerY: 508, angleDeg: 135 },
    { centerX: 340, centerY: 258, angleDeg: 225 },
    { centerX: 404, centerY: 205, angleDeg: 0 },
    { centerX: 440, centerY: 288, angleDeg: 180 }
  ]
};

const form4Raw = {
  piezas: [
    { centerX: 377, centerY: 461, angleDeg: 0 },
    { centerX: 415, centerY: 372, angleDeg: 45 },
    { centerX: 380, centerY: 557, angleDeg: 45 },
    { centerX: 466, centerY: 439, angleDeg: 45 },
    { centerX: 228, centerY: 548, angleDeg: 225 },
    { centerX: 509, centerY: 274, angleDeg: 45 },
    { centerX: 581, centerY: 233, angleDeg: 45 }
  ]
};

function createTangramPiece(points2D, color, thickness = 0.22) {
  const shape = new THREE.Shape();
  shape.moveTo(points2D[0].x, points2D[0].y);
  for (let i = 1; i < points2D.length; i += 1) {
    shape.lineTo(points2D[i].x, points2D[i].y);
  }
  shape.closePath();

  const extrudeSettings = {
    steps: 1,
    depth: thickness,
    bevelEnabled: true,
    bevelThickness: 0.06,
    bevelSize: 0.05,
    bevelSegments: 3
  };

  const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  geometry.computeVertexNormals();
  geometry.rotateX(-Math.PI / 2);
  geometry.computeBoundingBox();
  const box = geometry.boundingBox;
  const centerX = (box.min.x + box.max.x) / 2;
  const centerY = (box.min.y + box.max.y) / 2;
  const centerZ = (box.min.z + box.max.z) / 2;
  geometry.translate(-centerX, -centerY, -centerZ);

  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.9,
    metalness: 0.05,
    emissive: 0x000000
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function mapTo3D(centerX, centerY) {
  return {
    x: (centerX - 400) / PIXEL_TO_UNIT,
    z: (400 - centerY) / PIXEL_TO_UNIT
  };
}

function convertForm(formRaw) {
  return formRaw.piezas.map(p => {
    const { x, z } = mapTo3D(p.centerX, p.centerY);
    return {
      pos: new THREE.Vector3(x, 0.1, z),
      rotY: (p.angleDeg * Math.PI) / 180
    };
  });
}

const states = [
  convertForm(form1Raw),
  convertForm(form2Raw),
  convertForm(form3Raw),
  convertForm(form4Raw)
];

function setInitialState() {
  states[0].forEach((state, idx) => {
    const mesh = pieces[idx];
    if (!mesh) return;
    mesh.position.copy(state.pos);
    mesh.rotation.y = state.rotY;
  });
}

function startNextTransition() {
  if (animating) return;
  const nextIndex = (currentIndex + 1) % states.length;
  const targetState = states[nextIndex];
  animating = true;

  activeTimeline = gsap.timeline({
    onComplete: () => {
      animating = false;
      currentIndex = nextIndex;

      if (nextIndex === 0 && !hasEmittedLoaded) {
        hasEmittedLoaded = true;
        emit('loaded');
        return;
      }

      transitionTimeout = window.setTimeout(() => startNextTransition(), 300);
    }
  });

  pieces.forEach((piece, idx) => {
    const target = targetState[idx];
    if (!target) return;

    activeTimeline.to(piece.position, {
      x: target.pos.x,
      y: target.pos.y,
      z: target.pos.z,
      duration: 0.7,
      ease: 'back.out(1.0)',
      overwrite: true
    }, 0);

    activeTimeline.to(piece.rotation, {
      y: target.rotY,
      duration: 0.7,
      ease: 'power2.out',
      overwrite: true
    }, 0);
  });
}

function createScene() {
  updateThemeColors();
  scene = new THREE.Scene();
  scene.background = new THREE.Color(mainBgColor);

  const width = container.value.clientWidth;
  const height = container.value.clientHeight;
  camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
  camera.position.set(-5, 7, -5);
  camera.lookAt(0, 0, 0);
  camera.up.set(0, 1, 0);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width, height);
  renderer.setClearColor(mainBgColor, 1);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.value.appendChild(renderer.domElement);

  const ambientLight = new THREE.AmbientLight(0x404060, 0.5);
  scene.add(ambientLight);

  const mainLight = new THREE.DirectionalLight(0xffffff, 0.9);
  mainLight.position.set(3, 8, 2);
  mainLight.castShadow = true;
  mainLight.shadow.mapSize.width = 1024;
  mainLight.shadow.mapSize.height = 1024;
  mainLight.shadow.camera.near = 0.5;
  mainLight.shadow.camera.far = 12;
  mainLight.shadow.camera.left = -5;
  mainLight.shadow.camera.right = 5;
  mainLight.shadow.camera.top = 5;
  mainLight.shadow.camera.bottom = -5;
  scene.add(mainLight);

  const fillLight = new THREE.PointLight(0x88aacc, 0.3);
  fillLight.position.set(0, -1, 0);
  scene.add(fillLight);

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(2.2, 3.0, 32),
    new THREE.MeshStandardMaterial({
      color: accentColor,
      roughness: 1,
      metalness: 0,
      transparent: true,
      opacity: 0.2,
      side: THREE.DoubleSide
    })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = -0.32;
  scene.add(ring);

  const palette = getThemeColors();
  pieces = [
    createTangramPiece(largeCentered, palette[0], 0.22),
    createTangramPiece(largeCentered, palette[1], 0.22),
    createTangramPiece(medCentered, palette[2], 0.2),
    createTangramPiece(smallCentered, palette[3], 0.18),
    createTangramPiece(smallCentered, palette[4], 0.18),
    createTangramPiece(square, palette[5], 0.2),
    createTangramPiece(paraleloInvertidoGrande, palette[6], 0.2)
  ];

  pieces.forEach(p => scene.add(p));

  const starGeo = new THREE.BufferGeometry();
  const starCount = 1200;
  const starPositions = [];
  for (let i = 0; i < starCount; i += 1) {
    starPositions.push((Math.random() - 0.5) * 200);
    starPositions.push((Math.random() - 0.5) * 100);
    starPositions.push((Math.random() - 0.5) * 80 - 40);
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(starPositions), 3));
  const starMat = new THREE.PointsMaterial({ color: accentColor, size: 0.07, transparent: true, opacity: 0.4 });
  const stars = new THREE.Points(starGeo, starMat);
  scene.add(stars);

  function animateStars() {
    stars.rotation.y += 0.0002;
    stars.rotation.x += 0.0001;
  }

  function renderLoop() {
    animationFrameId = requestAnimationFrame(renderLoop);
    animateStars();
    renderer.render(scene, camera);
  }

  setInitialState();
  setTimeout(() => startNextTransition(), 200);
  renderLoop();
}

function onResize() {
  if (!container.value || !camera || !renderer) return;
  const width = container.value.clientWidth;
  const height = container.value.clientHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}

function cleanup() {
  window.removeEventListener('resize', onResize);
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  if (transitionTimeout) clearTimeout(transitionTimeout);
  if (activeTimeline) activeTimeline.kill();
  if (renderer) {
    if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
    renderer.dispose();
  }
  pieces.forEach(mesh => {
    if (mesh.geometry) mesh.geometry.dispose();
    if (Array.isArray(mesh.material)) {
      mesh.material.forEach(mat => mat.dispose());
    } else if (mesh.material) {
      mesh.material.dispose();
    }
  });
  pieces = [];
}

onMounted(() => {
  if (!container.value) return;
  createScene();
  window.addEventListener('resize', onResize);
});

onBeforeUnmount(() => {
  cleanup();
});
</script>

<style scoped>
.tangram-loader {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: var(--main-bg-color);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tangram-loader::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at center, rgba(255, 255, 255, 0.12), rgba(0, 0, 0, 0.16) 70%);
}

.info-silent {
  position: absolute;
  bottom: 14px;
  left: 14px;
  background: rgba(0, 0, 0, 0.25);
  color: var(--text-color);
  font-size: 11px;
  padding: 6px 12px;
  border-radius: 20px;
  pointer-events: none;
  z-index: 1;
  backdrop-filter: blur(4px);
  font-family: monospace;
}

:global(canvas) {
  display: block;
  width: 100%;
  height: 100%;
}
</style>

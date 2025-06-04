import * as THREE from "three";

let mouse = { x: 0, y: 0 };

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  10000 // Increased far plane
);

const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector("#bg"),
});

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
camera.position.setZ(30);

renderer.render(scene, camera);
let clickedSphere = null;

scene.background = new THREE.Color(0x9cc2ff);
scene.fog = new THREE.FogExp2(0x000000, 0.001);

//create background
const bgGeometry = new THREE.SphereGeometry(100, 32, 32);
const bgMaterial = new THREE.MeshStandardMaterial({
  color: 0x000000,
  metalness: 1,
  roughness: 1,
});
const bgSphere = new THREE.Mesh(bgGeometry, bgMaterial);
scene.add(bgSphere);

let spheres = [];
let sphereSpeeds = [];

function createSphers() {
  let radius = random(0.8, 3.5);

  const material = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.5,
  });

  const geometry = new THREE.CircleGeometry(radius, 64);

  const bubble = new THREE.Mesh(geometry, material);

  // Always spawn in front of the camera, at a random offset
  const cameraDirection = new THREE.Vector3();
  camera.getWorldDirection(cameraDirection);

  // Place bubble a fixed distance in front of camera, with some random spread
  const distanceFromCamera = 40;
  const spread = 20;
  const offset = new THREE.Vector3(
    random(-spread, spread),
    random(-spread, spread),
    0
  );
  const spawnPos = camera.position
    .clone()
    .add(cameraDirection.clone().normalize().multiplyScalar(distanceFromCamera))
    .add(offset);

  bubble.position.copy(spawnPos);

  spheres.push(bubble);
  sphereSpeeds.push(random(0.05, 0.2));
  scene.add(bubble);
}

let lightColor = 0xffffff;

const light1 = new THREE.PointLight(lightColor, 1, 100);
//set light1 on the up left corner of the screen
light1.position.set(20, 30, 0);
const light2 = new THREE.PointLight(lightColor, 1, 100);
//set light2 on the up right corner of the screen
light2.position.set(-20, 30, 0);
const light3 = new THREE.PointLight(lightColor, 1, 100);
//set light3 on the down left corner of the screen
light3.position.set(20, -30, 0);
const light4 = new THREE.PointLight(lightColor, 1, 100);
//set light4 on the down right corner of the screen
light4.position.set(-20, -30, 0);
const light5 = new THREE.PointLight(0x00000f, 3, 100);
light5.position.set(0, 0, 0);

scene.add(light1, light2, light3, light4, light5);

function renderLightColor(params) {
  light1.color.setHex(params);
  light2.color.setHex(params);
  light3.color.setHex(params);
  light4.color.setHex(params);
}

//make lightColor change on scroll
window.addEventListener("scroll", function () {
  lightColor = lightColor - window.screenY * 0.5;
  renderLightColor(lightColor);
});

let maxBubbles = 15; // Increased initial number of bubbles
let maxHeight = 30;

// Initial bubbles
Array(maxBubbles).fill().forEach(createSphers);

// Update bubbles on scroll
let lastScrollY = window.scrollY;

window.addEventListener("scroll", function () {
  // Infinite zoom: camera Z decreases with scroll (reversed direction)
  const baseZ = 30;
  const zoomAmount = window.scrollY * 0.05; // Smooth, infinite zoom
  camera.position.setZ(baseZ - zoomAmount);
  camera.position.y = maxHeight / 2;

  // move the spheres spawn point based on scroll
  const pos = new THREE.Vector3(
    THREE.MathUtils.randFloatSpread(100),
    THREE.MathUtils.randFloatSpread(100),
    THREE.MathUtils.randFloatSpread(100)
  );
  // Update sphere positions based on scroll
  spheres.forEach((bubble, index) => {
    bubble.position.x += random(-0.1, 0.1);
    bubble.position.y += random(-0.1, 0.1);
    bubble.position.z += random(-0.1, 0.1);
    // Reset to bottom if it goes too high
    if (bubble.position.y > maxHeight) {
      bubble.position.y = -maxHeight;
      bubble.position.x = THREE.MathUtils.randFloatSpread(100);
      bubble.position.z = THREE.MathUtils.randFloatSpread(100);
    }
  });

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.render(scene, camera);

  // Detect scroll direction
  const scrollingDown = window.scrollY > lastScrollY;
  lastScrollY = window.scrollY;

  // Add bubbles when scrolling down
  if (scrollingDown && spheres.length < maxBubbles * 3) {
    // Always create bubble in front of camera, regardless of zoom
    createSphers();
  }
  // Remove bubbles when scrolling up
  if (!scrollingDown && spheres.length > 1) {
    const bubble = spheres.pop();
    scene.remove(bubble);
    sphereSpeeds.pop();
  }

  // Update sphere speeds based on scroll
  sphereSpeeds = spheres.map(() => random(0.05, 0.2));
  // Update sphere positions based on scroll
  spheres.forEach((bubble, index) => {
    bubble.position.y += sphereSpeeds[index];
  });
});

function onSphereClick(collisionPos) {
  const threshold = 10;
  for (let i = 0; i < spheres.length; i++) {
    const sphere = spheres[i];
    const distance = sphere.position.distanceTo(collisionPos);
    if (distance < threshold) {
      const direction = sphere.position.clone().sub(collisionPos).normalize();
      sphere.position.add(direction.multiplyScalar(random(1, 100)));
    }
  }
}

document.addEventListener(
  "click",
  function (event) {
    event.preventDefault();
    onSphereClick(pos);
  },
  false
);

function checkCollisions() {
  for (let i = 0; i < spheres.length; i++) {
    for (let j = i + 1; j < spheres.length; j++) {
      const sphere1 = spheres[i];
      const sphere2 = spheres[j];

      // Calcul de la distance entre les deux sphères
      const distance = sphere1.position.distanceTo(sphere2.position);

      // Si les sphères se chevauchent
      if (
        distance <
        sphere1.geometry.parameters.radius + sphere2.geometry.parameters.radius
      ) {
        // Calcul de la direction de rebond
        const direction = sphere1.position
          .clone()
          .sub(sphere2.position)
          .normalize();

        // Appliquez une force aux sphères dans la direction de rebond
        sphere1.position.add(direction.multiplyScalar(random(0.1, 0.5)));
        sphere2.position.add(direction.multiplyScalar(random(0.1, 0.5)));

        // Call the click logic at the collision position (midpoint)
        const collisionPos = sphere1.position
          .clone()
          .add(sphere2.position)
          .multiplyScalar(0.5);
        onSphereClick(collisionPos);
      }
    }
  }
}

function animate() {
  requestAnimationFrame(animate);

  checkCollisions();

  spheres.forEach((bubble, index) => {
    // Move bubble upward
    bubble.position.y += sphereSpeeds[index];

    // Make the flat bubble always face the camera
    bubble.lookAt(camera.position);

    // Reset to bottom if it goes too high
    if (bubble.position.y > maxHeight) {
      bubble.position.y = -maxHeight;
    }
  });

  renderer.render(scene, camera);
}
function random(min, max) {
  return Math.random() * (max - min) + min;
}

animate();


// add a random margin on elements with class "margin"
const margins = document.querySelectorAll(".margin");
margins.forEach((margin) => {
  const randomMarginTop = random(0, 200);
    const randomMarginBottom = random(0, 200);
    const randomMarginLeft = random(0, 200);
    const randomMarginRight = random(0, 200);
  margin.style.margin = `${randomMarginTop}px ${randomMarginRight}px ${randomMarginBottom}px ${randomMarginLeft}px`;
});
import './style.css'


import * as THREE from 'three';

let mouse = {x: 0, y: 0};

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('#bg'),
});

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
camera.position.setZ(30);

renderer.render(scene, camera);
let clickedSphere = null;

scene.background = new THREE.Color(0x00000F);
scene.fog = new THREE.FogExp2(0x000000, 0.001);


//create background
const geometry = new THREE.SphereGeometry(100, 32, 32);
const material = new THREE.MeshStandardMaterial({color: 0x000000, metalness: 1, roughness: 1});
const sphere = new THREE.Mesh(geometry, material);
scene.add(sphere);




let spheres = [];

function createSphers() {
    let radius = random(0.1, 5);
    const geometry = new THREE.SphereGeometry(radius, 32, 32);
    const material = new THREE.MeshStandardMaterial({color: 0xFFFFFF, metalness: 1, roughness: 1});
    const sphere = new THREE.Mesh(geometry, material);

    const [x, y, z] = Array(3).fill().map(() => THREE.MathUtils.randFloatSpread(100));
    sphere.position.set(x, y, z);
    const speed = random(0.01, 0.05);
    spheres.push(sphere);
    scene.add(sphere);
}



let lightColor = 0xffffff;

const light1 = new THREE.PointLight(lightColor, 1, 100);
//set light1 on the up left corner of the screen
light1.position.set(20, 30 , 0);
const light2 = new THREE.PointLight(lightColor, 1, 100);
//set light2 on the up right corner of the screen
light2.position.set(-20, 30, 0);
const light3 = new THREE.PointLight(lightColor, 1, 100);
//set light3 on the down left corner of the screen
light3.position.set(20, -30, 0);
const light4 = new THREE.PointLight(lightColor, 1, 100);
//set light4 on the down right corner of the screen
light4.position.set(-20, -30, 0);
const light5 = new THREE.PointLight(0x00000F, 3, 100);
light5.position.set(0, 0, 0);

scene.add(light1, light2, light3, light4, light5);


function renderLightColor(params) {
    light1.color.setHex(params);
    light2.color.setHex(params);
    light3.color.setHex(params);
    light4.color.setHex(params);

}

//make lightColor change on scroll
window.addEventListener('scroll', function () {

    lightColor = lightColor - (window.screenY) * 0.5;
    renderLightColor(lightColor);
});



Array(30).fill().forEach(createSphers);



let pos = new THREE.Vector3(0, 0, 0);

function onMouseMove(event) {


    event.preventDefault();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;


    let vector = new THREE.Vector3(mouse.x, mouse.y, 0.5);
    vector.unproject(camera);


    let dir = vector.sub(camera.position).normalize();
    let distance = -camera.position.z / dir.z;
    pos = camera.position.clone().add(dir.multiplyScalar(distance));


}

document.addEventListener('mousemove', onMouseMove, false);




function checkCollisions() {
    for (let i = 0; i < spheres.length; i++) {
        for (let j = i + 1; j < spheres.length; j++) {
            const sphere1 = spheres[i];
            const sphere2 = spheres[j];

            // Calcul de la distance entre les deux sphères
            const distance = sphere1.position.distanceTo(sphere2.position);

            // Si les sphères se chevauchent
            if (distance < sphere1.geometry.parameters.radius + sphere2.geometry.parameters.radius) {

                // Calcul de la direction de rebond
                const direction = sphere1.position.clone().sub(sphere2.position).normalize();

                // Appliquez une force aux sphères dans la direction de rebond
                sphere1.position.add(direction.multiplyScalar(random(0.1, 0.5)));
                sphere2.position.add(direction.multiplyScalar(random(0.1, 0.5)));
            }
        }
    }
}

function animate() {
    requestAnimationFrame(animate);

    if (spheres.length === 30) {

        // Vérifiez les collisions entre les sphères
        checkCollisions();

        spheres.forEach((sphere, index) => {
            sphere.position.x += (pos.x - sphere.position.x) * 0.03;
            sphere.position.y += (pos.y - sphere.position.y) * 0.03;
            sphere.position.z += (pos.z - sphere.position.z) * 0.03;


        });
    }

    renderer.render(scene, camera);
}
function random(min, max) {
    return Math.random() * (max - min) + min;
}

document.addEventListener('click', function (event) {
    event.preventDefault();
    const threshold = 10;
    for (let i = 0; i < spheres.length; i++) {
        const sphere = spheres[i];
        const distance = sphere.position.distanceTo(pos);
        if (distance < threshold) {
            const direction = sphere.position.clone().sub(pos).normalize();
            sphere.position.add(direction.multiplyScalar(random(1, 100)));
        }
    }
}, false);

animate();





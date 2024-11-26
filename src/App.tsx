import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

function DoThreeJs() {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer();
  const etiquetasRenderer = new CSS2DRenderer();
  const rayCaster = new THREE.Raycaster();
  const mousePosition = new THREE.Vector2();
  const targetObjectNames: string[] = [];
  let foundObjects = 0;
  let sound, currentTimeout: number | undefined;

  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.85;
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  etiquetasRenderer.setSize(window.innerWidth, window.innerHeight);
  etiquetasRenderer.domElement.style.position = 'absolute';
  etiquetasRenderer.domElement.style.top = '0px';
  etiquetasRenderer.domElement.style.pointerEvents = 'none';
  document.body.appendChild(etiquetasRenderer.domElement);

  scene.background = new THREE.Color('skyblue');
  const ambientLight = new THREE.AmbientLight(0x99aaff, 1);
  scene.add(ambientLight);

  const controls = new OrbitControls(camera, renderer.domElement);
  camera.position.z = 5;
  controls.update();

  const listener = new THREE.AudioListener();
  camera.add(listener);
  sound = new THREE.Audio(listener);
  const audioLoader = new THREE.AudioLoader();
  audioLoader.load('audio/wineGlassClink.wav', buffer => {
    sound.setBuffer(buffer);
    sound.setLoop(false);
    sound.setVolume(0.5);
  });

  const loader = new RGBELoader();
  loader.load('environments/rogland_clear_night_2k.hdr', texture => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = texture;
  });

  const jpgloader = new THREE.TextureLoader();
  jpgloader.load('environments/rogland_clear_night.jpg', texturajpg => {
    texturajpg.mapping = THREE.EquirectangularReflectionMapping;
    scene.background = texturajpg;
  });

  let modeloCasa;
  const gltfLoader = new GLTFLoader();
  gltfLoader.load('HouseModel/coolHouse.gltf', gltfCompleto => {
    modeloCasa = gltfCompleto.scene;
    scene.add(modeloCasa);

    modeloCasa.traverse(child => {
      if (child instanceof THREE.Mesh) {  // Verifica si el child es una instancia de THREE.Mesh
        targetObjectNames.push(child.name);
      }
    });

    startNewGame();
  });

  const objectListContainer = document.createElement('div');
  objectListContainer.style.position = 'absolute';
  objectListContainer.style.left = '10px';
  objectListContainer.style.top = '10px';
  objectListContainer.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
  objectListContainer.style.padding = '10px';
  objectListContainer.style.borderRadius = '8px';
  document.body.appendChild(objectListContainer);

  let currentObjectList: any[] = [];

  function startNewGame() {
    currentObjectList = [];
    foundObjects = 0;

    const availableObjects = [...targetObjectNames];
    while (currentObjectList.length < 5 && availableObjects.length > 0) {
      const randomIndex = Math.floor(Math.random() * availableObjects.length);
      currentObjectList.push(availableObjects.splice(randomIndex, 1)[0]);
    }

    renderObjectList();
  }

  function renderObjectList() {
    objectListContainer.innerHTML = '<h3>Find the objects:</h3>';
    currentObjectList.forEach(objectName => {
      const item = document.createElement('p');
      item.textContent = objectName;
      objectListContainer.appendChild(item);
    });
  }

  // Añadir etiqueta para mostrar el nombre del objeto al hacer clic
  const tooltip = document.createElement('div');
  tooltip.className = 'tooltip hide';
  document.body.appendChild(tooltip);
  const tooltipCSS = new CSS2DObject(tooltip);
  tooltip.style.color = 'white';
  tooltip.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
  tooltip.style.padding = '5px';
  tooltip.style.borderRadius = '5px';
  scene.add(tooltipCSS);

  window.addEventListener('click', e => {
    mousePosition.x = (e.clientX / window.innerWidth) * 2 - 1;
    mousePosition.y = -(e.clientY / window.innerHeight) * 2 + 1;

    rayCaster.setFromCamera(mousePosition, camera);
    const intersects = rayCaster.intersectObjects(scene.children, true);

    if (intersects.length > 0) {
      const clickedObject = intersects[0].object;
      const objectName = clickedObject.name;

      if (currentObjectList.includes(objectName)) {
        sound.play();
        currentObjectList = currentObjectList.filter(name => name !== objectName);
        foundObjects++;
        renderObjectList();

        if (foundObjects === 5) {
          alert('You found all objects! Starting a new game...');
          startNewGame();
        }
      }

      // Muestra el nombre del objeto en la etiqueta de tooltip
      tooltip.textContent = objectName;
      tooltip.className = 'tooltip show';
      tooltipCSS.position.copy(clickedObject.position);

      if (currentTimeout != undefined) {
        clearTimeout(currentTimeout);
      }
      currentTimeout = setTimeout(() => {
        tooltip.className = 'tooltip hide';
      }, 2000);
    }
  });

  function animate() {
    requestAnimationFrame(animate);
    etiquetasRenderer.render(scene, camera);
    renderer.render(scene, camera);
  }

  window.addEventListener('resize', onWindowResize, false);
  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    etiquetasRenderer.setSize(window.innerWidth, window.innerHeight);
  }

  animate();
}

function App() {
  return <>{DoThreeJs()}</>;
}

export default App;

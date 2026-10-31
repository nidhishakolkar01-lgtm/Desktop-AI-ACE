// ACE AI: Masterpiece Humanoid Companion (UE5 MetaHuman Android Standard)
// - Sculpted Lunar Titanium & Ceramic Armor Chassis (Tesla Optimus / Figure 02 / MetaHuman Quality)
// - Anatomical Facial Architecture: Brow Plate, Zygomatic Cheekbones, Mandible, Chin Cap, & Obsidian Visor
// - Razor-Sharp Cybernetic Eyes: Concentric Cyan Reticles, Amber Telemetry Arcs, Real-Time Gaze-Tracking
// - Audio-Reactive Acoustic Speech Resonator & Mandible Voice Chamber
// - Full-Body Balanced Armor (Deltoid Pauldrons, Clavicle Struts, Rib Flanks, Sternum Nexus, Pelvic Carapace)
// - Poised Command Stance with Sinusoidal Kinematics (Zero Jitter)
// - Top-Left Tactical Earth Globe & Right-Side Holographic Telemetry HUD

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

class AvatarRenderer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.composer = null;

    // Armature & Models
    this.characterGroup = null;
    this.xbotModel = null;
    this.headArmorGroup = null;
    this.chestArmorGroup = null;

    // Sculpted Ocular & Facial Elements
    this.leftEyePupil = null;
    this.rightEyePupil = null;
    this.leftEyeIris = null;
    this.rightEyeIris = null;
    this.mouthResonator = null;
    this.mouthResonatorB = null;
    this.jawGroup = null;

    // Flush Quantum Sternum Core
    this.quantumNexus = null;
    this.nexusRingA = null;
    this.nexusRingB = null;
    this.nexusCore = null;

    // Skeletal Bones
    this.bones = {
      hips: null,
      spine: null,
      spine1: null,
      spine2: null,
      neck: null,
      head: null,
      leftShoulder: null,
      leftArm: null,
      leftForeArm: null,
      leftHand: null,
      rightShoulder: null,
      rightArm: null,
      rightForeArm: null,
      rightHand: null,
      rightFingers: [],
      leftFingers: []
    };

    // Tactical Globe & HUD
    this.holoGlobeGroup = null;
    this.globeMesh = null;
    this.globeOrbitRing = null;
    this.holoDisplay = null;
    this.holoCanvas = null;
    this.holoTexture = null;

    // Ambient Particles
    this.particles = null;

    // Gaze & Motion
    this.targetGaze = { x: 0, y: 0 };
    this.currentGaze = { x: 0, y: 0 };
    this.agentState = 'idle'; // 'idle', 'listening', 'speaking'
    this.animTime = 0;
    this.clock = new THREE.Clock();
    this.realAudioEnergy = 0;
    this.spectralLow = 0;
    this.spectralMid = 0;
    this.spectralHigh = 0;
    this.orbitRotation = { x: 0, y: 0 };
    this.targetOrbitRotation = { x: 0, y: 0 };
    this.isOrbiting = false;
    this.orbitStart = { x: 0, y: 0 };

    this.initScene();
    this.buildLighting();
    this.loadHyperAdvancedHumanoid();
    this.createTopLeftTacticalGlobe();
    this.createHolographicHUD();
    this.startTracking();
    this.animate();
  }

  setSpectralFrequencies(low, mid, high) {
    this.spectralLow = Math.max(0, Math.min(1.0, low));
    this.spectralMid = Math.max(0, Math.min(1.0, mid));
    this.spectralHigh = Math.max(0, Math.min(1.0, high));
  }

  setRealAudioEnergy(energy) {
    this.realAudioEnergy = Math.max(0, Math.min(1.0, energy));
  }

  setAgentState(state) {
    this.agentState = state;
  }

  initScene() {
    const width = window.innerWidth || 1920;
    const height = window.innerHeight || 1080;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x04080e);

    // Camera framed on half-body (waist to head)
    this.camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 100);
    this.camera.position.set(0, 0.04, 3.10);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: "high-performance"
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.92;

    // Studio Environment Reflections
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    pmremGenerator.compileEquirectangularShader();
    const roomEnv = new RoomEnvironment();
    this.scene.environment = pmremGenerator.fromScene(roomEnv).texture;

    // Controlled UnrealBloomPass - Neon glow on lasers ONLY, zero armor blowout
    const renderScene = new RenderPass(this.scene, this.camera);
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      0.24,  // Crisp laser bloom
      0.12,  // Tight laser radius
      1.05   // High threshold: ONLY laser emissives bloom
    );
    const outputPass = new OutputPass();

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(renderScene);
    this.composer.addPass(bloomPass);
    this.composer.addPass(outputPass);

    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.composer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  buildLighting() {
    // Ambient fill
    const ambientLight = new THREE.AmbientLight(0x142032, 0.65);
    this.scene.add(ambientLight);

    // Key Light (Daylight coolness from upper right)
    const keyLight = new THREE.DirectionalLight(0xeef6ff, 1.15);
    keyLight.position.set(2.8, 3.4, 3.2);
    this.scene.add(keyLight);

    // Warm Solar Gold Rim Light (Sharp edge definition from rear-left)
    const rimLight = new THREE.DirectionalLight(0xf59e0b, 1.3);
    rimLight.position.set(-3.2, 2.6, -2.4);
    this.scene.add(rimLight);

    // Soft Cyan Fill Light (Front-left)
    const fillLight = new THREE.DirectionalLight(0x06b6d4, 0.55);
    fillLight.position.set(-2.5, 1.2, 2.2);
    this.scene.add(fillLight);

    // Atmospheric cyber particles
    const pCount = 80;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount * 3; i += 3) {
      pPos[i] = (Math.random() - 0.5) * 8.0;
      pPos[i + 1] = (Math.random() - 0.5) * 4.5;
      pPos[i + 2] = (Math.random() - 0.5) * 3.5;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({
      color: 0x00e5ff,
      size: 0.016,
      transparent: true,
      opacity: 0.35
    });
    this.particles = new THREE.Points(pGeo, pMat);
    this.scene.add(this.particles);
  }

  async loadHyperAdvancedHumanoid() {
    this.characterGroup = new THREE.Group();
    this.characterGroup.position.set(0, 0, 0);
    this.scene.add(this.characterGroup);

    const loader = new GLTFLoader();

    try {
      const gltf = await loader.loadAsync('Xbot.glb');
      this.xbotModel = gltf.scene;
      this.xbotModel.scale.setScalar(1.05);
      this.xbotModel.position.set(0, -1.40, 0);

      // UE5 MASTER MATERIALS: Satin Lunar Silver Titanium Armor & Dark Carbon Undersuit
      const lunarTitaniumMat = new THREE.MeshPhysicalMaterial({
        color: 0xbac9d8,
        metalness: 0.78,
        roughness: 0.32,
        clearcoat: 0.35,
        clearcoatRoughness: 0.20,
        envMapIntensity: 1.15
      });

      const darkCarbonJointMat = new THREE.MeshPhysicalMaterial({
        color: 0x121822,
        metalness: 0.85,
        roughness: 0.32,
        clearcoat: 0.5,
        envMapIntensity: 1.15
      });

      this.xbotModel.traverse((child) => {
        if (child.isMesh) {
          child.frustumCulled = false;
          if (child.name.includes('Joints')) {
            child.material = darkCarbonJointMat;
          } else {
            child.material = lunarTitaniumMat;
          }
        }
        if (child.isBone) {
          const name = child.name;
          if (name.endsWith('Hips')) this.bones.hips = child;
          else if (name.endsWith('Spine')) this.bones.spine = child;
          else if (name.endsWith('Spine1')) this.bones.spine1 = child;
          else if (name.endsWith('Spine2')) this.bones.spine2 = child;
          else if (name.endsWith('Neck')) this.bones.neck = child;
          else if (name.endsWith('Head')) this.bones.head = child;
          else if (name.endsWith('LeftShoulder')) this.bones.leftShoulder = child;
          else if (name.endsWith('LeftArm')) this.bones.leftArm = child;
          else if (name.endsWith('LeftForeArm')) this.bones.leftForeArm = child;
          else if (name.endsWith('LeftHand')) this.bones.leftHand = child;
          else if (name.endsWith('RightShoulder')) this.bones.rightShoulder = child;
          else if (name.endsWith('RightArm')) this.bones.rightArm = child;
          else if (name.endsWith('RightForeArm')) this.bones.rightForeArm = child;
          else if (name.endsWith('RightHand')) this.bones.rightHand = child;
          else if (name.includes('RightHand') && !name.endsWith('RightHand')) {
            this.bones.rightFingers.push(child);
          } else if (name.includes('LeftHand') && !name.endsWith('LeftHand')) {
            this.bones.leftFingers.push(child);
          }
        }
      });

      // Pose arms into poised command stance
      this.poseCommandStance();

      this.characterGroup.add(this.xbotModel);

      // Build the Sculpted Humanoid Face & Full-Body Armored Hardware
      this.buildMasterHumanoidFaceAndHardware();

      console.log("[AVATAR] Masterpiece Humanoid Face & Hardware Initialized!");
    } catch (e) {
      console.error("[AVATAR_LOAD_ERR]", e);
    }
  }

  // =========================================================================
  // SCULPTED HUMANOID FACE & FULL-BODY HARDWARE
  // =========================================================================
  buildMasterHumanoidFaceAndHardware() {
    // Master PBR Materials
    const lunarTitaniumMat = new THREE.MeshPhysicalMaterial({
      color: 0xbac9d8,
      metalness: 0.78,
      roughness: 0.32,
      clearcoat: 0.35,
      clearcoatRoughness: 0.20,
      envMapIntensity: 1.15
    });

    const carbonWeaveMat = new THREE.MeshPhysicalMaterial({
      color: 0x0a0f16,
      metalness: 0.70,
      roughness: 0.38,
      clearcoat: 0.45,
      envMapIntensity: 1.10
    });

    const solarGoldMat = new THREE.MeshPhysicalMaterial({
      color: 0xdf9838,
      metalness: 0.95,
      roughness: 0.15,
      clearcoat: 0.8,
      envMapIntensity: 1.45
    });

    const chromePistonMat = new THREE.MeshPhysicalMaterial({
      color: 0x9fb2c6,
      metalness: 0.98,
      roughness: 0.12,
      clearcoat: 0.9,
      envMapIntensity: 1.50
    });

    // Deep Obsidian Curved Mirror Glass Visor
    const obsidianVisorMat = new THREE.MeshPhysicalMaterial({
      color: 0x02050b,
      metalness: 0.96,
      roughness: 0.05,
      clearcoat: 1.0,
      clearcoatRoughness: 0.03,
      envMapIntensity: 1.65
    });

    const cyanLaserMat = new THREE.MeshStandardMaterial({
      color: 0x00d8ef,
      emissive: 0x00b4d8,
      emissiveIntensity: 1.20,
      roughness: 0.20
    });

    const amberLaserMat = new THREE.MeshStandardMaterial({
      color: 0xff9900,
      emissive: 0xd97706,
      emissiveIntensity: 1.20,
      roughness: 0.20
    });

    // -----------------------------------------------------------------------
    // 1. SCULPTED CRANIAL HELMET & ANATOMICAL VISOR FACEPLATE
    // -----------------------------------------------------------------------
    this.headArmorGroup = new THREE.Group();
    this.headArmorGroup.position.set(0, 0.35, 0.02);
    this.characterGroup.add(this.headArmorGroup);

    // A. Lunar Titanium Cranial Cowl (Encloses skull, temples, & occipital nape)
    const craniumGeo = new THREE.SphereGeometry(0.128, 36, 28, 0, Math.PI * 2, 0, Math.PI * 0.60);
    craniumGeo.scale(0.96, 1.05, 1.06);
    const cranium = new THREE.Mesh(craniumGeo, lunarTitaniumMat);
    cranium.position.set(0, 0.022, -0.012);
    this.headArmorGroup.add(cranium);

    // Sagittal Dorsal Crest with Solar Gold Pinstripe
    const crest = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.012, 0.18, 12), lunarTitaniumMat);
    crest.rotation.x = Math.PI / 2 + 0.15;
    crest.position.set(0, 0.138, -0.02);
    this.headArmorGroup.add(crest);

    const crestGold = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.004, 0.16, 8), solarGoldMat);
    crestGold.rotation.x = Math.PI / 2 + 0.15;
    crestGold.position.set(0, 0.144, -0.02);
    this.headArmorGroup.add(crestGold);

    // Occipital Carbon Nape Plate
    const occipital = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.08, 20), carbonWeaveMat);
    occipital.position.set(0, 0.02, -0.09);
    occipital.rotation.x = -0.32;
    this.headArmorGroup.add(occipital);

    // B. SCULPTED ANATOMICAL TITANIUM FACE FRAME (Brow, Cheekbones, Jaw, Chin)
    // 1. Supraorbital Brow Plate
    const browPlate = new THREE.Mesh(new THREE.BoxGeometry(0.150, 0.024, 0.035), lunarTitaniumMat);
    browPlate.position.set(0, 0.052, 0.098);
    browPlate.rotation.x = -0.22;
    this.headArmorGroup.add(browPlate);

    // Brow Gold Accent Trim
    const browGold = new THREE.Mesh(new THREE.BoxGeometry(0.154, 0.005, 0.038), solarGoldMat);
    browGold.position.set(0, 0.042, 0.104);
    browGold.rotation.x = -0.22;
    this.headArmorGroup.add(browGold);

    // 2. Sculpted Zygomatic Cheekbone Flanges
    [-1, 1].forEach((side) => {
      const cheek = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.062, 0.040), lunarTitaniumMat);
      cheek.position.set(side * 0.082, -0.008, 0.076);
      cheek.rotation.set(0.10, side * -0.28, side * 0.14);
      this.headArmorGroup.add(cheek);

      const cheekGold = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.052, 0.038), solarGoldMat);
      cheekGold.position.set(side * 0.086, -0.008, 0.080);
      cheekGold.rotation.set(0.10, side * -0.28, side * 0.14);
      this.headArmorGroup.add(cheekGold);
    });

    // 3. Defined Mandible & Chiseled Chin
    this.jawGroup = new THREE.Group();
    this.jawGroup.position.set(0, -0.060, 0.085);

    const jawFrame = new THREE.Mesh(new THREE.BoxGeometry(0.068, 0.028, 0.036), lunarTitaniumMat);
    this.jawGroup.add(jawFrame);

    const chinCap = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.014, 0.026), solarGoldMat);
    chinCap.position.set(0, -0.014, 0.012);
    this.jawGroup.add(chinCap);

    // Acoustic Voice Resonator Chamber (Dynamic speech waveform)
    const mouthCavity = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.012, 0.010), carbonWeaveMat);
    mouthCavity.position.set(0, 0.010, 0.018);
    this.jawGroup.add(mouthCavity);

    const mouthGeoA = new THREE.PlaneGeometry(0.046, 0.004);
    this.mouthResonator = new THREE.Mesh(mouthGeoA, cyanLaserMat);
    this.mouthResonator.position.set(0, 0.012, 0.024);
    this.jawGroup.add(this.mouthResonator);

    const mouthGeoB = new THREE.PlaneGeometry(0.032, 0.0025);
    this.mouthResonatorB = new THREE.Mesh(mouthGeoB, amberLaserMat);
    this.mouthResonatorB.position.set(0, 0.006, 0.024);
    this.jawGroup.add(this.mouthResonatorB);

    this.headArmorGroup.add(this.jawGroup);

    // C. SEAMLESSLY CURVED OBSIDIAN GLASS VISOR (Framed within the titanium face)
    const visorGeo = new THREE.SphereGeometry(0.120, 36, 24, 0, Math.PI, 0, Math.PI * 0.44);
    visorGeo.scale(0.88, 0.95, 1.02);
    const visor = new THREE.Mesh(visorGeo, obsidianVisorMat);
    visor.rotation.y = -Math.PI / 2;
    visor.rotation.x = 0.06;
    visor.position.set(0, 0.006, 0.020);
    this.headArmorGroup.add(visor);

    // D. ULTRA-SHARP CYBERNETIC OCULAR SENSORS (Inside Visor, Gaze-Tracking)
    const createCyberEye = (side) => {
      const eyeRoot = new THREE.Group();
      eyeRoot.position.set(side * 0.044, 0.022, 0.118);

      // Dark carbon socket frame behind eye
      const socket = new THREE.Mesh(new THREE.BoxGeometry(0.040, 0.028, 0.015), carbonWeaveMat);
      socket.position.z = -0.002;
      eyeRoot.add(socket);

      // Gold Gimbal Bezel
      const bezel = new THREE.Mesh(new THREE.TorusGeometry(0.017, 0.0028, 16, 28), solarGoldMat);
      eyeRoot.add(bezel);

      // Concentric Cyan Iris Reticle Ring
      const iris = new THREE.Mesh(new THREE.RingGeometry(0.009, 0.016, 32), cyanLaserMat);
      iris.position.z = 0.002;
      eyeRoot.add(iris);

      // Amber Telemetry Arc Reticle
      const arcGeo = new THREE.RingGeometry(0.006, 0.008, 24, 1, 0, Math.PI * 1.3);
      const amberArc = new THREE.Mesh(arcGeo, amberLaserMat);
      amberArc.position.z = 0.003;
      amberArc.rotation.z = side * 0.35;
      eyeRoot.add(amberArc);

      // Jet-Black Camera Pupil (Tracks mouse cursor)
      const pupil = new THREE.Mesh(new THREE.CircleGeometry(0.0055, 24), new THREE.MeshBasicMaterial({ color: 0x000000 }));
      pupil.position.z = 0.004;
      eyeRoot.add(pupil);

      // Specular Optical Highlight Glint
      const glint = new THREE.Mesh(new THREE.CircleGeometry(0.0016, 12), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      glint.position.set(0.0025, 0.0025, 0.005);
      eyeRoot.add(glint);

      this.headArmorGroup.add(eyeRoot);
      return { pupil, iris };
    };

    const leftEye = createCyberEye(-1);
    this.leftEyePupil = leftEye.pupil;
    this.leftEyeIris = leftEye.iris;

    const rightEye = createCyberEye(1);
    this.rightEyePupil = rightEye.pupil;
    this.rightEyeIris = rightEye.iris;

    // Focused Cyan Laser Brow Indicators
    [-1, 1].forEach((side) => {
      const browLED = new THREE.Mesh(new THREE.PlaneGeometry(0.044, 0.0024), cyanLaserMat);
      browLED.position.set(side * 0.044, 0.044, 0.120);
      browLED.rotation.z = side * -0.08;
      this.headArmorGroup.add(browLED);
    });

    // E. Flush Ear Audio Diaphragms & Temple Transducers
    [-1, 1].forEach((side) => {
      const earGroup = new THREE.Group();
      earGroup.position.set(side * 0.118, 0.016, 0.00);

      const earWell = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.030, 0.014, 24), carbonWeaveMat);
      earWell.rotation.z = Math.PI / 2;
      earGroup.add(earWell);

      const earRingA = new THREE.Mesh(new THREE.TorusGeometry(0.024, 0.0028, 12, 28), solarGoldMat);
      earRingA.rotation.y = Math.PI / 2;
      earGroup.add(earRingA);

      const earRingB = new THREE.Mesh(new THREE.RingGeometry(0.010, 0.016, 24), cyanLaserMat);
      earRingB.rotation.y = Math.PI / 2;
      earRingB.position.set(side * 0.008, 0, 0);
      earGroup.add(earRingB);

      const earLED = new THREE.Mesh(new THREE.SphereGeometry(0.0035, 8, 8), amberLaserMat);
      earLED.position.set(side * 0.009, 0, 0);
      earGroup.add(earLED);

      this.headArmorGroup.add(earGroup);
    });

    // F. Articulated Chrome Neck Hydraulics
    [-1, 1].forEach((side) => {
      const pistonGeo = new THREE.CylinderGeometry(0.007, 0.007, 0.12, 16);
      const piston = new THREE.Mesh(pistonGeo, chromePistonMat);
      piston.position.set(side * 0.060, -0.13, 0.015);
      piston.rotation.z = side * -0.15;
      this.headArmorGroup.add(piston);

      const collarGeo = new THREE.CylinderGeometry(0.010, 0.010, 0.032, 16);
      const collar = new THREE.Mesh(collarGeo, solarGoldMat);
      collar.position.set(side * 0.060, -0.10, 0.015);
      collar.rotation.z = side * -0.15;
      this.headArmorGroup.add(collar);
    });

    // -----------------------------------------------------------------------
    // 2. CHEST & STERNUM HARDWARE (Equal body armor distribution)
    // -----------------------------------------------------------------------
    this.chestArmorGroup = new THREE.Group();
    this.chestArmorGroup.position.set(0, 0.04, 0.0);
    this.characterGroup.add(this.chestArmorGroup);

    // Segmented Lunar Titanium Pectoral Armor Carapace (Left and Right)
    [-1, 1].forEach((side) => {
      const pecGeo = new THREE.BoxGeometry(0.120, 0.105, 0.042);
      const pecArmor = new THREE.Mesh(pecGeo, lunarTitaniumMat);
      pecArmor.position.set(side * 0.085, 0.045, 0.145);
      pecArmor.rotation.set(-0.08, side * -0.15, side * 0.05);
      this.chestArmorGroup.add(pecArmor);

      // Carbon weave upper insert
      const carbonTrim = new THREE.Mesh(new THREE.BoxGeometry(0.095, 0.032, 0.015), carbonWeaveMat);
      carbonTrim.position.set(side * 0.085, 0.080, 0.162);
      carbonTrim.rotation.set(-0.08, side * -0.15, side * 0.05);
      this.chestArmorGroup.add(carbonTrim);

      // Gold clavicle accent strut
      const clavicleStrut = new THREE.Mesh(new THREE.BoxGeometry(0.105, 0.007, 0.012), solarGoldMat);
      clavicleStrut.position.set(side * 0.085, 0.105, 0.155);
      clavicleStrut.rotation.set(-0.08, side * -0.15, side * 0.08);
      this.chestArmorGroup.add(clavicleStrut);
    });

    // FLUSH QUANTUM STERNUM NEXUS (Clean, integrated, NO giant blinding orb!)
    this.quantumNexus = new THREE.Group();
    this.quantumNexus.position.set(0, 0.038, 0.174);

    // Flush Hexagonal Bezel
    const nexusBezel = new THREE.Mesh(new THREE.CylinderGeometry(0.046, 0.050, 0.012, 6), solarGoldMat);
    nexusBezel.rotation.x = Math.PI / 2;
    this.quantumNexus.add(nexusBezel);

    // Dark Carbon Aperture
    const nexusDark = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.014, 24), carbonWeaveMat);
    nexusDark.rotation.x = Math.PI / 2;
    nexusDark.position.z = -0.002;
    this.quantumNexus.add(nexusDark);

    // Micro Counter-Rotating Quantum Rings (Crisp laser lines)
    const ringGeoA = new THREE.RingGeometry(0.022, 0.030, 32);
    this.nexusRingA = new THREE.Mesh(ringGeoA, cyanLaserMat);
    this.nexusRingA.position.z = 0.008;
    this.quantumNexus.add(this.nexusRingA);

    const ringGeoB = new THREE.RingGeometry(0.013, 0.019, 24);
    this.nexusRingB = new THREE.Mesh(ringGeoB, amberLaserMat);
    this.nexusRingB.position.z = 0.009;
    this.quantumNexus.add(this.nexusRingB);

    // Central Singularity Nexus Gem
    const coreGeo = new THREE.SphereGeometry(0.008, 16, 16);
    this.nexusCore = new THREE.Mesh(coreGeo, cyanLaserMat);
    this.nexusCore.position.z = 0.010;
    this.quantumNexus.add(this.nexusCore);

    this.chestArmorGroup.add(this.quantumNexus);

    // -----------------------------------------------------------------------
    // 3. SHOULDER PAULDRONS & DELTOID EXOSKELETON
    // -----------------------------------------------------------------------
    [-1, 1].forEach((side) => {
      const pauldronGroup = new THREE.Group();
      pauldronGroup.position.set(side * 0.24, 0.09, 0.02);

      // Curved Deltoid Shell
      const shellGeo = new THREE.SphereGeometry(0.085, 20, 16, 0, Math.PI, 0, Math.PI * 0.7);
      const pauldron = new THREE.Mesh(shellGeo, lunarTitaniumMat);
      pauldron.rotation.set(0.2, side * -0.4, side * 0.3);
      pauldronGroup.add(pauldron);

      // Gold Deltoid Rim Plate
      const rimGeo = new THREE.TorusGeometry(0.083, 0.005, 12, 24, Math.PI * 0.8);
      const pauldronRim = new THREE.Mesh(rimGeo, solarGoldMat);
      pauldronRim.rotation.set(0.2, side * -0.4, side * 0.3);
      pauldronGroup.add(pauldronRim);

      this.characterGroup.add(pauldronGroup);
    });

    // -----------------------------------------------------------------------
    // 4. INTERCOSTAL RIB FLANK ARMOR & SEGMENTED ABDOMINAL / PELVIC PLATING
    // -----------------------------------------------------------------------
    [-1, 1].forEach((side) => {
      for (let i = 0; i < 3; i++) {
        const ribGeo = new THREE.BoxGeometry(0.040, 0.022, 0.090);
        const rib = new THREE.Mesh(ribGeo, lunarTitaniumMat);
        rib.position.set(side * 0.165, -0.08 - i * 0.045, 0.03 + i * 0.015);
        rib.rotation.set(0.08, side * 0.25, side * -0.15);
        this.characterGroup.add(rib);

        const ribTrim = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.016, 0.080), solarGoldMat);
        ribTrim.position.set(side * 0.170, -0.08 - i * 0.045, 0.03 + i * 0.015);
        ribTrim.rotation.set(0.08, side * 0.25, side * -0.15);
        this.characterGroup.add(ribTrim);
      }
    });

    // Abdominal Central Carapace Plating
    for (let j = 0; j < 2; j++) {
      const abGeo = new THREE.BoxGeometry(0.080, 0.036, 0.030);
      const abPlate = new THREE.Mesh(abGeo, carbonWeaveMat);
      abPlate.position.set(0, -0.10 - j * 0.052, 0.138 - j * 0.015);
      this.characterGroup.add(abPlate);

      const abGold = new THREE.Mesh(new THREE.BoxGeometry(0.050, 0.005, 0.010), solarGoldMat);
      abGold.position.set(0, -0.088 - j * 0.052, 0.152 - j * 0.015);
      this.characterGroup.add(abGold);
    }

    // Pelvic Guard with Hexagonal Electrum Badge
    const pelvicArmor = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 0.05), carbonWeaveMat);
    pelvicArmor.position.set(0, -0.28, 0.10);
    pelvicArmor.rotation.x = -0.12;
    this.characterGroup.add(pelvicArmor);

    const pelvicBadge = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.026, 0.010, 6), solarGoldMat);
    pelvicBadge.rotation.x = Math.PI / 2;
    pelvicBadge.position.set(0, -0.26, 0.13);
    this.characterGroup.add(pelvicBadge);

    [-1, 1].forEach((side) => {
      const hipPiston = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.10, 16), chromePistonMat);
      hipPiston.position.set(side * 0.09, -0.32, 0.08);
      hipPiston.rotation.z = side * 0.22;
      this.characterGroup.add(hipPiston);
    });
  }

  // =========================================================================
  // POISED COMMAND STANCE FOR ARMS & HANDS (Forearms bent across midriff)
  // =========================================================================
  poseCommandStance() {
    if (!this.bones.rightArm || !this.bones.leftArm) return;

    // Right Arm: Lowered from T-pose and angled slightly forward
    this.bones.rightArm.rotation.set(0.25, 0.35, 1.15);
    // Right Forearm: Bent across lower chest (Y = 0.88, Z = 0.46)
    this.bones.rightForeArm.rotation.set(0.20, 0.88, 0.46);
    if (this.bones.rightHand) {
      this.bones.rightHand.rotation.set(0.12, 0.18, 0.12);
    }

    // Left Arm: Lowered from T-pose and angled slightly forward
    this.bones.leftArm.rotation.set(0.25, -0.35, -1.15);
    // Left Forearm: Bent across lower chest (Y = -0.88, Z = -0.46)
    this.bones.leftForeArm.rotation.set(0.20, -0.88, -0.46);
    if (this.bones.leftHand) {
      this.bones.leftHand.rotation.set(0.12, -0.18, -0.12);
    }

    // Natural curled cybernetic fingers
    this.bones.rightFingers.forEach(f => f.rotation.z = -0.20);
    this.bones.leftFingers.forEach(f => f.rotation.z = 0.20);

    if (this.xbotModel) {
      this.xbotModel.updateMatrixWorld(true);
    }
  }

  // =========================================================================
  // TOP-LEFT TACTICAL EARTH GLOBE (Neatly Positioned Under Clock)
  // =========================================================================
  createTopLeftTacticalGlobe() {
    this.holoGlobeGroup = new THREE.Group();
    this.holoGlobeGroup.position.set(-1.40, 0.52, 0.1);

    const wireGeo = new THREE.SphereGeometry(0.18, 24, 18);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x00d8ff,
      wireframe: true,
      transparent: true,
      opacity: 0.70
    });
    this.globeMesh = new THREE.Mesh(wireGeo, wireMat);
    this.holoGlobeGroup.add(this.globeMesh);

    const innerGeo = new THREE.SphereGeometry(0.16, 20, 20);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0x003355,
      transparent: true,
      opacity: 0.45
    });
    this.holoGlobeGroup.add(new THREE.Mesh(innerGeo, innerMat));

    const ringGeo = new THREE.RingGeometry(0.22, 0.24, 36);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00f7ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85
    });
    this.globeOrbitRing = new THREE.Mesh(ringGeo, ringMat);
    this.globeOrbitRing.rotation.x = Math.PI / 2.3;
    this.holoGlobeGroup.add(this.globeOrbitRing);

    const beaconGeo = new THREE.SphereGeometry(0.018, 12, 12);
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0xff8800 });
    const beacon = new THREE.Mesh(beaconGeo, beaconMat);
    beacon.position.set(0.23, 0, 0);
    this.globeOrbitRing.add(beacon);

    this.scene.add(this.holoGlobeGroup);
  }

  // =========================================================================
  // 3D HOLOGRAPHIC TELEMETRY HUD (Safely to the right side)
  // =========================================================================
  createHolographicHUD() {
    this.holoCanvas = document.createElement('canvas');
    this.holoCanvas.width = 512;
    this.holoCanvas.height = 256;
    this.updateHUDCanvas();

    this.holoTexture = new THREE.CanvasTexture(this.holoCanvas);
    const hudMat = new THREE.MeshBasicMaterial({
      map: this.holoTexture,
      transparent: true,
      opacity: 0.88,
      side: THREE.DoubleSide
    });

    const hudPlane = new THREE.Mesh(new THREE.PlaneGeometry(0.92, 0.46), hudMat);
    hudPlane.position.set(1.05, -0.06, 0.35);
    hudPlane.rotation.y = -0.32;

    this.holoDisplay = hudPlane;
    this.scene.add(this.holoDisplay);
  }

  updateHUDCanvas() {
    if (!this.holoCanvas) return;
    const ctx = this.holoCanvas.getContext('2d');
    const w = this.holoCanvas.width;
    const h = this.holoCanvas.height;

    ctx.clearRect(0, 0, w, h);

    // Glassmorphic Container
    ctx.fillStyle = 'rgba(3, 10, 22, 0.75)';
    ctx.strokeStyle = '#00f7ff';
    ctx.lineWidth = 3;
    ctx.strokeRect(4, 4, w - 8, h - 8);
    ctx.fillRect(4, 4, w - 8, h - 8);

    // Header
    ctx.fillStyle = '#00f7ff';
    ctx.font = 'bold 20px "Courier New", monospace';
    ctx.fillText('ACE AI // HUMANOID NEURAL CORE', 24, 38);

    ctx.font = '15px "Courier New", monospace';
    ctx.fillStyle = '#ffaa33';
    ctx.fillText(`STATE: [${this.agentState.toUpperCase()}]`, 280, 72);

    ctx.fillStyle = '#a0d8ef';
    const energyPct = Math.round(this.realAudioEnergy * 100);
    ctx.fillText(`SYNAPSE ENERGY: ${energyPct}%`, 24, 72);

    // Audio Equalizer Spectrum Bars
    const barCount = 20;
    const barW = 18;
    for (let i = 0; i < barCount; i++) {
      const hBar = Math.sin(this.animTime * 6 + i * 0.45) * 22 * (0.3 + this.realAudioEnergy * 0.7) + 26;
      ctx.fillStyle = i % 2 === 0 ? '#00f7ff' : '#ff9900';
      ctx.fillRect(24 + i * (barW + 5), 140 - hBar, barW, hBar);
    }

    ctx.fillStyle = '#5ac8fa';
    ctx.font = '13px "Courier New", monospace';
    ctx.fillText('AMD RYZEN AI NPU // LIVE ACCELERATED', 24, 185);
    ctx.fillText('HARDWARE ENGINES // GOOGLE SR VERIFIED', 24, 215);

    if (this.holoTexture) this.holoTexture.needsUpdate = true;
  }

  // =========================================================================
  // GAZE & MOUSE TRACKING
  // =========================================================================
  startTracking() {
    window.addEventListener('mousemove', (e) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = -(e.clientY / window.innerHeight) * 2 + 1;
      this.targetGaze.x = THREE.MathUtils.clamp(nx, -1, 1);
      this.targetGaze.y = THREE.MathUtils.clamp(ny, -1, 1);

      if (this.isOrbiting) {
        const dx = e.clientX - this.orbitStart.x;
        const dy = e.clientY - this.orbitStart.y;
        this.targetOrbitRotation.y += dx * 0.008;
        this.targetOrbitRotation.x += dy * 0.005;
        this.targetOrbitRotation.x = THREE.MathUtils.clamp(this.targetOrbitRotation.x, -0.4, 0.4);
        this.orbitStart = { x: e.clientX, y: e.clientY };
      }
    });

    window.addEventListener('mousedown', (e) => {
      if (e.button === 2 || e.button === 1) { // Right or middle click to orbit
        this.isOrbiting = true;
        this.orbitStart = { x: e.clientX, y: e.clientY };
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 2 || e.button === 1) {
        this.isOrbiting = false;
      }
    });

    window.addEventListener('contextmenu', (e) => {
      e.preventDefault(); // Prevent context menu during 3D inspection
    });

    window.addEventListener('dblclick', () => {
      this.targetOrbitRotation = { x: 0, y: 0 }; // Reset orientation on double click
    });
  }

  // =========================================================================
  // MAIN ANIMATION LOOP (Butter-Smooth Kinematics - Zero Shaking)
  // =========================================================================
  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = this.clock.getDelta();
    this.animTime += delta;

    // 1. Organic Cybernetic Breathing
    const breath = Math.sin(this.animTime * 1.6) * 0.010;
    if (this.characterGroup) {
      this.characterGroup.position.y = breath;
    }
    if (this.chestArmorGroup) {
      this.chestArmorGroup.position.y = 0.04 + breath * 0.5;
    }

    // 2. Smooth Gaze Tracking on Head & Eyes
    this.currentGaze.x += (this.targetGaze.x - this.currentGaze.x) * 0.08;
    this.currentGaze.y += (this.targetGaze.y - this.currentGaze.y) * 0.08;

    if (this.headArmorGroup) {
      this.headArmorGroup.rotation.y = this.currentGaze.x * 0.32;
      this.headArmorGroup.rotation.x = -this.currentGaze.y * 0.16;
    }

    // Head bone tracking
    if (this.bones.head) {
      this.bones.head.rotation.y = this.currentGaze.x * 0.32;
      this.bones.head.rotation.x = -this.currentGaze.y * 0.16;
    }

    // Pupils follow gaze inside cyber-optics
    if (this.leftEyePupil && this.rightEyePupil) {
      const eyeX = this.currentGaze.x * 0.005;
      const eyeY = -this.currentGaze.y * 0.004;
      this.leftEyePupil.position.x = eyeX;
      this.leftEyePupil.position.y = eyeY;
      this.rightEyePupil.position.x = eyeX;
      this.rightEyePupil.position.y = eyeY;
    }

    // Orbit Smoothing
    this.orbitRotation.x += (this.targetOrbitRotation.x - this.orbitRotation.x) * 0.10;
    this.orbitRotation.y += (this.targetOrbitRotation.y - this.orbitRotation.y) * 0.10;
    if (this.characterGroup) {
      this.characterGroup.rotation.y = this.orbitRotation.y;
      this.characterGroup.rotation.x = this.orbitRotation.x;
    }

    // 3. Flush Quantum Sternum Nexus Counter-Rotation & Pulse
    if (this.nexusCore) {
      const pulse = 1.0 + Math.sin(this.animTime * 3.0) * 0.08 + this.spectralLow * 0.35 + this.realAudioEnergy * 0.15;
      this.nexusCore.scale.set(pulse, pulse, pulse);
    }
    if (this.nexusRingA) {
      this.nexusRingA.rotation.z += delta * 0.75;
    }
    if (this.nexusRingB) {
      this.nexusRingB.rotation.z -= delta * 0.95;
    }

    // 4. Audio-Reactive Acoustic Speech Resonator & Mandible (FFT Spectral Formants)
    const activeVocalEnergy = Math.max(this.spectralMid * 1.35, this.realAudioEnergy);
    const targetMouthOpen = (this.agentState === 'speaking')
      ? Math.max(0.35, activeVocalEnergy * 0.95)
      : (this.agentState === 'listening' ? 0.08 : 0);

    if (this.mouthResonator) {
      const scaleY = 1.0 + targetMouthOpen * 2.8;
      this.mouthResonator.scale.y += (scaleY - this.mouthResonator.scale.y) * 0.25;
    }
    if (this.mouthResonatorB) {
      const scaleY2 = 1.0 + targetMouthOpen * 2.2;
      this.mouthResonatorB.scale.y += (scaleY2 - this.mouthResonatorB.scale.y) * 0.25;
    }
    if (this.jawGroup) {
      const jawY = -0.060 - targetMouthOpen * 0.012;
      this.jawGroup.position.y += (jawY - this.jawGroup.position.y) * 0.22;
    }

    // 5. BUTTER-SMOOTH FOREARM & HAND KINEMATICS (Zero Shaking / Poised Floating)
    const isSpeaking = (this.agentState === 'speaking');
    const gestureTime = this.animTime * 1.8;

    if (this.bones.rightForeArm && this.bones.leftForeArm) {
      const rForearmTargetY = isSpeaking ? 0.88 + Math.cos(gestureTime * 0.7) * 0.06 : 0.88;
      const rForearmTargetZ = isSpeaking ? 0.46 + Math.sin(gestureTime) * 0.05 : 0.46;

      const lForearmTargetY = isSpeaking ? -0.88 - Math.sin(gestureTime * 0.6) * 0.05 : -0.88;
      const lForearmTargetZ = isSpeaking ? -0.46 + Math.cos(gestureTime * 0.8) * 0.04 : -0.46;

      this.bones.rightForeArm.rotation.y += (rForearmTargetY - this.bones.rightForeArm.rotation.y) * 0.08;
      this.bones.rightForeArm.rotation.z += (rForearmTargetZ - this.bones.rightForeArm.rotation.z) * 0.08;

      this.bones.leftForeArm.rotation.y += (lForearmTargetY - this.bones.leftForeArm.rotation.y) * 0.08;
      this.bones.leftForeArm.rotation.z += (lForearmTargetZ - this.bones.leftForeArm.rotation.z) * 0.08;

      if (this.xbotModel) {
        this.xbotModel.updateMatrixWorld(true);
      }
    }

    // 6. Tactical Globe Rotation
    if (this.globeMesh) this.globeMesh.rotation.y += delta * 0.35;
    if (this.globeOrbitRing) this.globeOrbitRing.rotation.z += delta * 0.60;

    // 7. Update HUD Canvas
    if (Math.floor(this.animTime * 10) % 3 === 0) {
      this.updateHUDCanvas();
    }

    this.composer.render();
  }
}

window.AvatarRenderer = AvatarRenderer;

window.addEventListener('DOMContentLoaded', () => {
  if (!window.avatar) {
    const avatar = new AvatarRenderer('canvas3d');
    window.avatar = avatar;
  }
});

export { AvatarRenderer };

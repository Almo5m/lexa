import {
  ACESFilmicToneMapping,
  AmbientLight,
  CanvasTexture,
  CapsuleGeometry,
  CircleGeometry,
  Color,
  CylinderGeometry,
  DirectionalLight,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PMREMGenerator,
  PerspectiveCamera,
  Scene,
  SphereGeometry,
  TorusGeometry,
  WebGLRenderer,
  MathUtils,
  type Object3D,
} from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

export type BoMood = "happy" | "neutral" | "sad" | "thinking";

interface MoodPose {
  eyeScaleY: number;
  eyeTilt: number;
  eyeY: number;
  eyeLookUp: number;
  mouthRotation: number;
  mouthScaleY: number;
  antennaTilt: number;
  bulb: string;
  wave: number;
}

const POSES: Record<BoMood, MoodPose> = {
  happy: { eyeScaleY: 0.55, eyeTilt: 0, eyeY: 0.05, eyeLookUp: 0, mouthRotation: Math.PI, mouthScaleY: 1, antennaTilt: 0, bulb: "#ffc94a", wave: 1 },
  neutral: { eyeScaleY: 1, eyeTilt: 0, eyeY: 0, eyeLookUp: 0, mouthRotation: Math.PI, mouthScaleY: 0.12, antennaTilt: 0, bulb: "#5fd8ff", wave: 0 },
  sad: { eyeScaleY: 0.85, eyeTilt: 0.38, eyeY: -0.04, eyeLookUp: 0, mouthRotation: 0, mouthScaleY: 0.8, antennaTilt: 0.55, bulb: "#8aa0c8", wave: 0 },
  thinking: { eyeScaleY: 0.8, eyeTilt: -0.12, eyeY: 0.03, eyeLookUp: 0.09, mouthRotation: Math.PI, mouthScaleY: 0.1, antennaTilt: -0.15, bulb: "#7aa6ff", wave: 0 },
};

export interface BoScene {
  setMood(mood: BoMood): void;
  resize(width: number, height: number): void;
  start(): void;
  stop(): void;
  dispose(): void;
}

interface Options {
  reducedMotion: boolean;
}

function glowTexture(): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  const context = canvas.getContext("2d")!;
  const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, "rgba(47,45,159,0.34)");
  gradient.addColorStop(0.55, "rgba(47,45,159,0.14)");
  gradient.addColorStop(1, "rgba(47,45,159,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 128, 128);
  return new CanvasTexture(canvas);
}

interface Rig {
  root: Group;
  head: Group;
  eyes: Mesh[];
  mouth: Mesh;
  antenna: Group;
  bulb: Mesh;
  bulbMaterial: MeshBasicMaterial;
  armRight: Group;
  armLeft: Group;
}

/** Bo built from real geometry: glossy shell, dark glass face, glowing eyes. The same rig is driven by moods. */
function buildRobot(): Rig {
  const shell = new MeshPhysicalMaterial({ color: "#f4f6ff", roughness: 0.28, metalness: 0.05, clearcoat: 1, clearcoatRoughness: 0.12 });
  const trim = new MeshStandardMaterial({ color: "#3d5bff", roughness: 0.3, metalness: 0.7 });
  // Low reflection strength keeps the visor dark when the head leans (a bright ceiling reflection turned it white).
  const glass = new MeshPhysicalMaterial({ color: "#0a1030", roughness: 0.08, metalness: 0.2, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 0.3 });
  const glow = new MeshBasicMaterial({ color: "#2fc4ff", toneMapped: false });
  const bulbMaterial = new MeshBasicMaterial({ color: "#ffc94a", toneMapped: false });

  const root = new Group();

  const body = new Mesh(new SphereGeometry(0.62, 48, 32), shell);
  body.scale.set(1, 1.05, 0.88);
  body.position.y = -0.72;
  root.add(body);

  const belt = new Mesh(new TorusGeometry(0.5, 0.05, 16, 64), trim);
  belt.rotation.x = Math.PI / 2;
  belt.position.y = -0.52;
  belt.scale.set(1, 0.88, 1);
  root.add(belt);

  const chest = new Mesh(new CircleGeometry(0.1, 32), glow);
  chest.position.set(0, -0.78, 0.55);
  root.add(chest);

  const head = new Group();
  head.position.y = 0.38;
  root.add(head);

  head.add(new Mesh(new RoundedBoxGeometry(1.62, 1.2, 1.28, 10, 0.4), shell));

  const face = new Mesh(new RoundedBoxGeometry(1.32, 0.86, 0.16, 8, 0.28), glass);
  face.position.z = 0.6;
  head.add(face);

  const eyeGeometry = new CapsuleGeometry(0.085, 0.16, 8, 16);
  const eyes = [-1, 1].map((side) => {
    const eye = new Mesh(eyeGeometry, glow);
    eye.position.set(side * 0.3, 0.08, 0.7);
    head.add(eye);
    return eye;
  });

  const mouth = new Mesh(new TorusGeometry(0.14, 0.036, 12, 32, Math.PI), glow);
  mouth.position.set(0, -0.2, 0.7);
  head.add(mouth);

  for (const side of [-1, 1]) {
    const ear = new Mesh(new CylinderGeometry(0.2, 0.2, 0.2, 32), trim);
    ear.rotation.z = Math.PI / 2;
    ear.position.set(side * 0.86, 0, 0);
    head.add(ear);
    const earGlow = new Mesh(new CircleGeometry(0.1, 24), glow);
    earGlow.rotation.y = side * Math.PI / 2;
    earGlow.position.set(side * 0.965, 0, 0);
    head.add(earGlow);
  }

  const antenna = new Group();
  antenna.position.set(0, 0.58, 0);
  const stem = new Mesh(new CylinderGeometry(0.025, 0.025, 0.34, 12), trim);
  stem.position.y = 0.17;
  antenna.add(stem);
  const bulb = new Mesh(new SphereGeometry(0.075, 24, 16), bulbMaterial);
  bulb.position.y = 0.37;
  antenna.add(bulb);
  head.add(antenna);

  const makeArm = (side: number): Group => {
    const arm = new Group();
    arm.position.set(side * 0.66, -0.5, 0);
    const limb = new Mesh(new CapsuleGeometry(0.075, 0.3, 8, 16), shell);
    limb.position.set(side * 0.06, -0.2, 0);
    limb.rotation.z = side * 0.35;
    arm.add(limb);
    const hand = new Mesh(new SphereGeometry(0.1, 24, 16), trim);
    hand.position.set(side * 0.14, -0.42, 0);
    arm.add(hand);
    root.add(arm);
    return arm;
  };

  return { root, head, eyes, mouth, antenna, bulb, bulbMaterial, armRight: makeArm(1), armLeft: makeArm(-1) };
}

export async function createBoScene(canvas: HTMLCanvasElement, options: Options): Promise<BoScene> {
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new Scene();
  const pmrem = new PMREMGenerator(renderer);
  const environment = pmrem.fromScene(new RoomEnvironment(), 0.04);
  scene.environment = environment.texture;

  const camera = new PerspectiveCamera(30, 1, 0.1, 50);
  camera.position.set(0, 0.2, 6.3);
  camera.lookAt(0, 0.1, 0);

  scene.add(new AmbientLight("#b9c6ff", 0.35));
  const key = new DirectionalLight("#fff4e6", 2.2);
  key.position.set(2.5, 3.5, 4);
  scene.add(key);
  const rim = new DirectionalLight("#5fd8ff", 1.6);
  rim.position.set(-3, 1.5, -2.5);
  scene.add(rim);

  const rig = buildRobot();
  const stage = new Group();
  stage.add(rig.root);
  scene.add(stage);

  const glowMaterial = new MeshBasicMaterial({ map: glowTexture(), transparent: true, depthWrite: false });
  const floor = new Mesh(new CircleGeometry(0.95, 48), glowMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -1.55;
  scene.add(floor);

  let target: MoodPose = POSES.neutral;
  const current: MoodPose = { ...POSES.neutral };
  const bulbColor = new Color(POSES.neutral.bulb);
  let pointerX = 0;
  let pointerY = 0;
  let blinkAt = 2.5;
  let blinkUntil = 0;
  let raf = 0;
  let running = false;
  let last = performance.now();
  let time = 0;

  const onPointer = (event: PointerEvent) => {
    pointerX = MathUtils.clamp((event.clientX / window.innerWidth) * 2 - 1, -1, 1);
    pointerY = MathUtils.clamp((event.clientY / window.innerHeight) * 2 - 1, -1, 1);
  };
  if (!options.reducedMotion) window.addEventListener("pointermove", onPointer, { passive: true });

  function frame(now: number) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    time += dt;
    const ease = 1 - Math.pow(0.0015, dt);

    for (const key of Object.keys(target) as (keyof MoodPose)[]) {
      if (key === "bulb") continue;
      current[key] = MathUtils.lerp(current[key] as number, target[key] as number, ease) as never;
    }
    bulbColor.lerp(new Color(target.bulb), ease);

    const motion = options.reducedMotion ? 0 : 1;
    stage.position.y = Math.sin(time * 1.7) * 0.07 * motion;
    stage.rotation.y = MathUtils.lerp(stage.rotation.y, pointerX * 0.4 * motion, ease);

    const blinking = time > blinkAt && time < blinkUntil;
    if (time >= blinkUntil && time > blinkAt) {
      blinkAt = time + 2.5 + Math.random() * 3;
      blinkUntil = blinkAt + 0.13;
    }
    const lids = blinking ? 0.08 : 1;
    rig.eyes.forEach((eye, index) => {
      const side = index === 0 ? -1 : 1;
      eye.scale.set(1, current.eyeScaleY * lids, 1);
      eye.rotation.z = side * current.eyeTilt;
      eye.position.y = 0.08 + current.eyeY + current.eyeLookUp;
    });
    rig.mouth.rotation.z = current.mouthRotation;
    rig.mouth.scale.set(1, current.mouthScaleY, 1);
    rig.mouth.position.y = current.mouthRotation === Math.PI ? -0.18 : -0.2;

    rig.head.rotation.x = MathUtils.lerp(rig.head.rotation.x, pointerY * 0.18 * motion, ease);
    rig.head.rotation.z = Math.sin(time * 1.1) * 0.035 * motion;
    rig.antenna.rotation.z = current.antennaTilt + Math.sin(time * 2.2) * 0.06 * motion;
    rig.bulbMaterial.color.copy(bulbColor).multiplyScalar(0.85 + Math.sin(time * 3.2) * 0.15 * motion);

    rig.armRight.rotation.z = current.wave * (2.4 + Math.sin(time * 7) * 0.25 * motion);
    rig.armLeft.rotation.z = Math.sin(time * 1.6 + 1) * 0.06 * motion;

    const pulse = 1 + Math.sin(time * 1.7) * 0.06 * motion;
    floor.scale.set(pulse, pulse, 1);

    renderer.render(scene, camera);
    if (running && !options.reducedMotion) raf = requestAnimationFrame(frame);
  }

  return {
    setMood(mood) {
      target = POSES[mood];
      if (!running || options.reducedMotion) {
        // Nothing is animating, so jump straight to the pose instead of easing toward it.
        Object.assign(current, target);
        bulbColor.set(target.bulb);
        frame(performance.now());
      }
    },
    resize(width, height) {
      renderer.setSize(width, height, false);
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
      frame(performance.now());
    },
    start() {
      if (running) return;
      running = true;
      last = performance.now();
      if (options.reducedMotion) frame(last);
      else raf = requestAnimationFrame(frame);
    },
    stop() {
      running = false;
      cancelAnimationFrame(raf);
    },
    dispose() {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onPointer);
      scene.traverse((object) => {
        const mesh = object as Mesh;
        mesh.geometry?.dispose?.();
        const material = mesh.material;
        if (Array.isArray(material)) material.forEach((item) => item.dispose());
        else material?.dispose?.();
      });
      environment.dispose();
      pmrem.dispose();
      renderer.dispose();
    },
  };
}

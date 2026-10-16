import { Canvas, useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { cinematicState } from './cinematicState';

function seededRandom(seed) {
  const value = Math.sin(seed * 9283.73) * 43758.5453;
  return value - Math.floor(value);
}

function DropletField({ reducedMotion }) {
  const mesh = useRef();
  const group = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const droplets = useMemo(
    () =>
      Array.from({ length: 40 }, (_, index) => ({
        position: [
          (seededRandom(index + 1) - 0.5) * 9,
          (seededRandom(index + 17) - 0.5) * 5.4,
          -1.8 + seededRandom(index + 39) * 3.4,
        ],
        scale: 0.025 + seededRandom(index + 63) * 0.055,
        stretch: 0.72 + seededRandom(index + 91) * 1.4,
        rotation: seededRandom(index + 109) * Math.PI,
      })),
    [],
  );

  useLayoutEffect(() => {
    droplets.forEach((drop, index) => {
      dummy.position.set(...drop.position);
      dummy.scale.set(drop.scale, drop.scale * drop.stretch, drop.scale);
      dummy.rotation.set(drop.rotation, drop.rotation * 0.3, 0);
      dummy.updateMatrix();
      mesh.current.setMatrixAt(index, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  }, [droplets, dummy]);

  useFrame(({ pointer, clock }, delta) => {
    if (!group.current) return;
    const progress = cinematicState.progress;
    const targetX = reducedMotion ? 0 : pointer.x * 0.22 + progress * 0.5;
    const targetY = reducedMotion ? 0 : pointer.y * 0.12 - progress * 0.35;
    group.current.rotation.y = THREE.MathUtils.damp(group.current.rotation.y, targetX, 3.2, delta);
    group.current.rotation.x = THREE.MathUtils.damp(group.current.rotation.x, targetY, 3.2, delta);
    if (!reducedMotion) group.current.position.y = Math.sin(clock.elapsedTime * 0.32) * 0.05;
  });

  return (
    <group ref={group}>
      <instancedMesh ref={mesh} args={[null, null, droplets.length]} frustumCulled={false}>
        <sphereGeometry args={[1, 18, 18]} />
        <meshPhysicalMaterial
          color="#bff6ff"
          transparent
          opacity={0.32}
          transmission={0.92}
          thickness={0.7}
          roughness={0.04}
          metalness={0.08}
          clearcoat={1}
          clearcoatRoughness={0.04}
          ior={1.33}
        />
      </instancedMesh>
    </group>
  );
}

function ParticleMist({ reducedMotion }) {
  const points = useRef();
  const positions = useMemo(() => {
    const values = new Float32Array(210 * 3);
    for (let index = 0; index < 210; index += 1) {
      values[index * 3] = (seededRandom(index + 140) - 0.5) * 11;
      values[index * 3 + 1] = (seededRandom(index + 280) - 0.5) * 6;
      values[index * 3 + 2] = -2 + seededRandom(index + 420) * 5;
    }
    return values;
  }, []);

  useFrame(({ clock }) => {
    if (!points.current || reducedMotion) return;
    points.current.rotation.y = clock.elapsedTime * 0.018 + cinematicState.progress * 0.12;
    points.current.rotation.z = Math.sin(clock.elapsedTime * 0.08) * 0.025;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#8aeaff"
        size={0.019}
        transparent
        opacity={0.62}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function ReflectionArc({ reducedMotion }) {
  const arc = useRef();

  useFrame(({ pointer }, delta) => {
    if (!arc.current) return;
    const progress = cinematicState.progress;
    arc.current.rotation.z = THREE.MathUtils.damp(
      arc.current.rotation.z,
      reducedMotion ? -0.34 : -0.34 + pointer.x * 0.08 - progress * 0.22,
      2.4,
      delta,
    );
    arc.current.position.x = THREE.MathUtils.damp(arc.current.position.x, 2.4 - progress * 1.2, 2.2, delta);
  });

  return (
    <Float speed={reducedMotion ? 0 : 0.75} rotationIntensity={reducedMotion ? 0 : 0.08} floatIntensity={0.12}>
      <mesh ref={arc} position={[2.4, -1.6, 0.1]} rotation={[1.16, 0.15, -0.34]}>
        <torusGeometry args={[2.25, 0.018, 12, 160, Math.PI * 1.46]} />
        <meshPhysicalMaterial
          color="#55dfff"
          emissive="#0b6378"
          emissiveIntensity={1.5}
          roughness={0.12}
          metalness={0.75}
          clearcoat={1}
        />
      </mesh>
    </Float>
  );
}

function CameraRig({ reducedMotion }) {
  useFrame(({ camera, pointer }, delta) => {
    const progress = cinematicState.progress;
    const pointerX = reducedMotion ? 0 : pointer.x * 0.18;
    const pointerY = reducedMotion ? 0 : pointer.y * 0.08;
    camera.position.x = THREE.MathUtils.damp(camera.position.x, pointerX + progress * 0.75, 2.8, delta);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, pointerY - progress * 0.22, 2.8, delta);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, 5.7 - progress * 0.65, 2.8, delta);
    camera.lookAt(progress * 0.28, -progress * 0.12, 0);
  });
  return null;
}

export default function WebGLExperience({ reducedMotion }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 5.7], fov: 48, near: 0.1, far: 30 }}
      dpr={[1, 1.6]}
      frameloop={reducedMotion ? 'demand' : 'always'}
      gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
      performance={{ min: 0.55 }}
    >
      <ambientLight intensity={0.42} color="#7adff4" />
      <pointLight position={[-4, 3, 4]} intensity={24} color="#35d7ff" distance={10} />
      <pointLight position={[4, -2, 3]} intensity={14} color="#f6c900" distance={8} />
      <DropletField reducedMotion={reducedMotion} />
      <ParticleMist reducedMotion={reducedMotion} />
      <ReflectionArc reducedMotion={reducedMotion} />
      <CameraRig reducedMotion={reducedMotion} />
    </Canvas>
  );
}

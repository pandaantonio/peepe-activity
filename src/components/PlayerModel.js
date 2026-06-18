// components/PlayerModel.js
import { useRef, useMemo } from 'react'
import * as THREE from 'three'

// ============================================================================
// FUNCÃO AUXILIAR: Gera cubos arredondados
// ============================================================================
function createRoundedBoxGeometry(width, height, depth, radius, smoothness = 4) {
  const shape = new THREE.Shape()
  const x = -width / 2
  const y = -height / 2

  shape.absarc(x + radius, y + radius, radius, Math.PI, Math.PI * 1.5)
  shape.absarc(width / 2 - radius, y + radius, radius, Math.PI * 1.5, 0)
  shape.absarc(width / 2 - radius, height / 2 - radius, radius, 0, Math.PI * 0.5)
  shape.absarc(x + radius, height / 2 - radius, radius, Math.PI * 0.5, Math.PI)

  const extrudeSettings = {
    depth: depth - radius * 2,
    bevelEnabled: true,
    bevelSegments: smoothness,
    steps: 1,
    bevelSize: radius,
    bevelThickness: radius,
    curveSegments: smoothness
  }

  const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings)
  geometry.center()
  return geometry
}

// ============================================================================
// VERSÃO PARA O HEXAGON (Three.js Puro)
// ============================================================================
export function createMinecraftPlayer(scene) {
  const group = new THREE.Group()

  const skinMaterial = new THREE.MeshStandardMaterial({ color: 0xffdbac, roughness: 0.6 })
  const shirtMaterial = new THREE.MeshStandardMaterial({ color: 0x00a86b, roughness: 0.6 })
  const pantsMaterial = new THREE.MeshStandardMaterial({ color: 0x2244aa, roughness: 0.6 })

  const R = 0.04 

  // CABEÇA (sem textura)
  const headGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4)
  const head = new THREE.Mesh(headGeo, skinMaterial)
  head.position.y = 1.2
  head.castShadow = true
  head.receiveShadow = true
  group.add(head)

  // TRONCO
  const torsoGeo = createRoundedBoxGeometry(0.42, 0.6, 0.14, R)
  const torso = new THREE.Mesh(torsoGeo, shirtMaterial)
  torso.position.y = 0.7
  torso.castShadow = true
  torso.receiveShadow = true
  group.add(torso)

  // BRAÇO ESQUERDO
  const leftArmGroup = new THREE.Group()
  leftArmGroup.position.set(0.27, 0.9, 0)
  const armGeo = createRoundedBoxGeometry(0.12, 0.55, 0.12, R)
  const leftArmMesh = new THREE.Mesh(armGeo, shirtMaterial)
  leftArmMesh.position.y = -0.22 
  leftArmMesh.castShadow = true
  leftArmMesh.receiveShadow = true
  leftArmGroup.add(leftArmMesh)
  group.add(leftArmGroup)

  // BRAÇO DIREITO
  const rightArmGroup = new THREE.Group()
  rightArmGroup.position.set(-0.27, 0.9, 0)
  const rightArmMesh = new THREE.Mesh(armGeo, shirtMaterial)
  rightArmMesh.position.y = -0.22 
  rightArmMesh.castShadow = true
  rightArmMesh.receiveShadow = true
  rightArmGroup.add(rightArmMesh)
  group.add(rightArmGroup)

  // PERNA ESQUERDA
  const leftLegGroup = new THREE.Group()
  leftLegGroup.position.set(0.11, 0.4, 0)
  const legGeo = createRoundedBoxGeometry(0.16, 0.45, 0.14, R)
  const leftLegMesh = new THREE.Mesh(legGeo, pantsMaterial)
  leftLegMesh.position.y = -0.22 
  leftLegMesh.castShadow = true
  leftLegMesh.receiveShadow = true
  leftLegGroup.add(leftLegMesh)
  group.add(leftLegGroup)

  // PERNA DIREITA
  const rightLegGroup = new THREE.Group()
  rightLegGroup.position.set(-0.11, 0.4, 0)
  const rightLegMesh = new THREE.Mesh(legGeo, pantsMaterial)
  rightLegMesh.position.y = -0.22
  rightLegMesh.castShadow = true
  rightLegMesh.receiveShadow = true
  rightLegGroup.add(rightLegMesh)
  group.add(rightLegGroup)

  scene.add(group)

  return {
    group, torso, head,
    leftArm: leftArmGroup,
    rightArm: rightArmGroup,
    leftLeg: leftLegGroup,
    rightLeg: rightLegGroup,
    geometries: [headGeo, torsoGeo, armGeo, legGeo],
    materials: [skinMaterial, shirtMaterial, pantsMaterial]
  }
}

// ============================================================================
// VERSÃO PARA O ARMÁRIO (React Three Fiber) - SEM TEXTURA
// ============================================================================
let useFrameHook;
try {
  useFrameHook = require('@react-three/fiber').useFrame;
} catch (e) {
  useFrameHook = () => {};
}

export function PlayerModel({ 
  isWalking = true, 
  shirtColor = '#00a86b', 
  pantsColor = '#2244aa', 
  skinColor = '#ffdbac' 
}) {
  const mainGroup = useRef()
  const headRef = useRef()
  const torsoRef = useRef()
  const leftArmRef = useRef()
  const rightArmRef = useRef()
  const leftLegRef = useRef()
  const rightLegRef = useRef()

  const animationTime = useRef(0)
  const R = 0.04

  const geos = useMemo(() => ({
    head: new THREE.BoxGeometry(0.4, 0.4, 0.4),
    torso: createRoundedBoxGeometry(0.42, 0.6, 0.14, R),
    arm: createRoundedBoxGeometry(0.12, 0.55, 0.12, R),
    leg: createRoundedBoxGeometry(0.16, 0.45, 0.14, R),
  }), [])

  useFrameHook((state, delta) => {
    animationTime.current += delta * (isWalking ? 14 : 3)
    const t = animationTime.current

    if (isWalking) {
      if (leftLegRef.current) leftLegRef.current.rotation.x = Math.sin(t) * 0.65
      if (rightLegRef.current) rightLegRef.current.rotation.x = -Math.sin(t) * 0.65

      if (leftArmRef.current) {
        leftArmRef.current.rotation.x = -Math.sin(t) * 0.5
        leftArmRef.current.rotation.z = Math.cos(t) * 0.1 + 0.05
      }
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = Math.sin(t) * 0.5
        rightArmRef.current.rotation.z = -Math.cos(t) * 0.1 - 0.05
      }

      if (mainGroup.current) mainGroup.current.position.y = Math.abs(Math.sin(t * 2)) * 0.08
      if (torsoRef.current) torsoRef.current.rotation.x = 0.15
      if (headRef.current) headRef.current.rotation.x = -0.05
    } else {
      if (leftLegRef.current) leftLegRef.current.rotation.x *= 0.8
      if (rightLegRef.current) rightLegRef.current.rotation.x *= 0.8
      if (torsoRef.current) torsoRef.current.rotation.x *= 0.8
      if (mainGroup.current) mainGroup.current.position.y *= 0.8

      if (leftArmRef.current) {
        leftArmRef.current.rotation.x = Math.sin(t) * 0.05
        leftArmRef.current.rotation.z = 0.05 + Math.sin(t) * 0.03
      }
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = Math.sin(t) * 0.05
        rightArmRef.current.rotation.z = -0.05 - Math.sin(t) * 0.03
      }

      if (headRef.current) {
        headRef.current.rotation.y = Math.sin(t * 0.5) * 0.08
        headRef.current.rotation.x = Math.cos(t) * 0.02
      }
    }
  })

  return (
    <group ref={mainGroup}>
      {/* Cabeça - Agora usa apenas a cor da pele (sem textura) */}
      <mesh ref={headRef} geometry={geos.head} position={[0, 1.2, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={skinColor} roughness={0.6} />
      </mesh>

      {/* Tronco (Camisa) */}
      <mesh ref={torsoRef} geometry={geos.torso} position={[0, 0.7, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={shirtColor} roughness={0.6} />
      </mesh>

      {/* Braço Esquerdo */}
      <group ref={leftArmRef} position={[0.27, 0.9, 0]}>
        <mesh geometry={geos.arm} position={[0, -0.22, 0]} castShadow receiveShadow>
          <meshStandardMaterial color={shirtColor} roughness={0.6} />
        </mesh>
      </group>

      {/* Braço Direito */}
      <group ref={rightArmRef} position={[-0.27, 0.9, 0]}>
        <mesh geometry={geos.arm} position={[0, -0.22, 0]} castShadow receiveShadow>
          <meshStandardMaterial color={shirtColor} roughness={0.6} />
        </mesh>
      </group>

      {/* Perna Esquerda */}
      <group ref={leftLegRef} position={[0.11, 0.4, 0]}>
        <mesh geometry={geos.leg} position={[0, -0.22, 0]} castShadow receiveShadow>
          <meshStandardMaterial color={pantsColor} roughness={0.6} />
        </mesh>
      </group>

      {/* Perna Direita */}
      <group ref={rightLegRef} position={[-0.11, 0.4, 0]}>
        <mesh geometry={geos.leg} position={[0, -0.22, 0]} castShadow receiveShadow>
          <meshStandardMaterial color={pantsColor} roughness={0.6} />
        </mesh>
      </group>
    </group>
  )
}
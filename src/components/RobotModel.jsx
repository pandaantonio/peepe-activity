/**
 * RobotModel - Componente reutilizável de robô para React Three Fiber
 *
 * Props:
 *   position       – [x, y, z] posição do robô (default [0, 0, 0])
 *   rotation       – [x, y, z] rotação em radianos (default [0, 0, 0])
 *   isWalking      – boolean que ativa a animação de caminhada
 *   walkTime       – número crescente que controla o ciclo da caminhada
 *   isGameOver     – boolean que ativa a animação de queda
 *   color          – cor principal (hex, ex: "#4a90d9")
 *   accentColor    – cor de acento/pés (hex, ex: "#e74c3c")
 *   darkColor      – cor escura/pernas (hex, ex: "#2c3e50")
 *   glowColor      – cor do brilho/olhos (hex, ex: "#00ffcc")
 *   glowIntensity  – intensidade do ponto de luz interno (default 0.6)
 *   scale          – escala uniforme do robô (default 1)
 *
 * Uso básico:
 *   import RobotModel from './RobotModel'
 *   <RobotModel position={[0, 0, 0]} isWalking={moving} walkTime={t} />
 */

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export default function RobotModel({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  isWalking = false,
  walkTime = 0,
  isGameOver = false,
  color = '#4a90d9',
  accentColor = '#e74c3c',
  darkColor = '#2c3e50',
  glowColor = '#00ffcc',
  glowIntensity = 0.6,
  scale = 1,
}) {
  const groupRef = useRef()
  const leftArmRef = useRef()
  const rightArmRef = useRef()
  const leftLegRef = useRef()
  const rightLegRef = useRef()
  const leftEyeRef = useRef()
  const rightEyeRef = useRef()
  const antennaRef = useRef()
  const antennaBallRef = useRef()

  // Animação de queda no game over
  const fallRef = useRef({ velocity: 0, falling: false })

  useFrame((state) => {
    if (!groupRef.current) return
    const t = state.clock.elapsedTime

    if (isGameOver) {
      const f = fallRef.current
      if (!f.falling) f.falling = true
      f.velocity += 0.02
      groupRef.current.position.y -= f.velocity
      if (leftArmRef.current) leftArmRef.current.rotation.z = Math.sin(t * 10) * 2
      if (rightArmRef.current) rightArmRef.current.rotation.z = Math.cos(t * 10) * 2
      if (leftLegRef.current) leftLegRef.current.rotation.x = Math.sin(t * 10) * 1
      if (rightLegRef.current) rightLegRef.current.rotation.x = Math.cos(t * 10) * 1
      groupRef.current.rotation.x += 0.02
      groupRef.current.rotation.z += 0.01
      return
    }

    // Reset fall state when game restarts
    fallRef.current.velocity = 0
    fallRef.current.falling = false

    // Sincroniza posição/rotação via props
    groupRef.current.position.set(...position)
    groupRef.current.rotation.set(...rotation)

    // Animação de caminhada
    if (isWalking && walkTime > 0) {
      const wc = Math.sin(walkTime)
      const wc2 = Math.sin(walkTime + Math.PI)
      if (leftArmRef.current) {
        leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, wc2 * 0.6, 0.2)
        leftArmRef.current.rotation.z = THREE.MathUtils.lerp(leftArmRef.current.rotation.z, 0.1, 0.1)
      }
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, wc * 0.6, 0.2)
        rightArmRef.current.rotation.z = THREE.MathUtils.lerp(rightArmRef.current.rotation.z, -0.1, 0.1)
      }
      if (leftLegRef.current) leftLegRef.current.rotation.x = THREE.MathUtils.lerp(leftLegRef.current.rotation.x, wc * 0.5, 0.2)
      if (rightLegRef.current) rightLegRef.current.rotation.x = THREE.MathUtils.lerp(rightLegRef.current.rotation.x, wc2 * 0.5, 0.2)
      groupRef.current.position.y = position[1] + Math.abs(Math.sin(walkTime * 2)) * 0.05
      if (antennaRef.current) antennaRef.current.rotation.z = Math.sin(walkTime * 3) * 0.15
      if (antennaBallRef.current) antennaBallRef.current.position.x = Math.sin(walkTime * 3) * 0.05
    } else {
      if (leftArmRef.current) {
        leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, 0, 0.1)
        leftArmRef.current.rotation.z = THREE.MathUtils.lerp(leftArmRef.current.rotation.z, 0.1, 0.1)
      }
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, 0, 0.1)
        rightArmRef.current.rotation.z = THREE.MathUtils.lerp(rightArmRef.current.rotation.z, -0.1, 0.1)
      }
      if (leftLegRef.current) leftLegRef.current.rotation.x = THREE.MathUtils.lerp(leftLegRef.current.rotation.x, 0, 0.1)
      if (rightLegRef.current) rightLegRef.current.rotation.x = THREE.MathUtils.lerp(rightLegRef.current.rotation.x, 0, 0.1)
      groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, position[1], 0.1)
      if (antennaRef.current) antennaRef.current.rotation.z = THREE.MathUtils.lerp(antennaRef.current.rotation.z, 0, 0.1)
      if (antennaBallRef.current) antennaBallRef.current.position.x = THREE.MathUtils.lerp(antennaBallRef.current.position.x, 0, 0.1)
    }

    // Piscar dos olhos
    const blink = Math.sin(t * 3) > 0.98
    if (leftEyeRef.current) leftEyeRef.current.scale.y = blink ? 0.1 : 1
    if (rightEyeRef.current) rightEyeRef.current.scale.y = blink ? 0.1 : 1
  })

  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={scale}>
      {/* Luz interna */}
      <pointLight color={glowColor} intensity={glowIntensity} distance={5} />

      {/* Torso */}
      <mesh castShadow position={[0, 0.9, 0]}>
        <boxGeometry args={[0.5, 0.6, 0.35]} />
        <meshStandardMaterial color={color} metalness={0.4} roughness={0.3} />
      </mesh>

      {/* Painel do peito */}
      <mesh position={[0, 1.0, 0.18]}>
        <boxGeometry args={[0.3, 0.2, 0.05]} />
        <meshStandardMaterial color={darkColor} metalness={0.5} roughness={0.3} />
      </mesh>

      {/* Luz do peito */}
      <mesh position={[0, 1.0, 0.21]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshBasicMaterial color={glowColor} />
      </mesh>

      {/* Cabeça */}
      <mesh castShadow position={[0, 1.45, 0]}>
        <boxGeometry args={[0.4, 0.35, 0.4]} />
        <meshStandardMaterial color={color} metalness={0.4} roughness={0.3} />
      </mesh>

      {/* Olho esquerdo */}
      <mesh ref={leftEyeRef} position={[-0.1, 1.45, 0.22]}>
        <sphereGeometry args={[0.07, 8, 8]} />
        <meshBasicMaterial color={glowColor} />
      </mesh>

      {/* Olho direito */}
      <mesh ref={rightEyeRef} position={[0.1, 1.45, 0.22]}>
        <sphereGeometry args={[0.07, 8, 8]} />
        <meshBasicMaterial color={glowColor} />
      </mesh>

      {/* Antena (haste) */}
      <group ref={antennaRef} position={[0, 1.8, 0]}>
        <mesh>
          <cylinderGeometry args={[0.02, 0.02, 0.3, 6]} />
          <meshStandardMaterial color={darkColor} metalness={0.5} roughness={0.3} />
        </mesh>
        {/* Bolinha da antena */}
        <mesh ref={antennaBallRef} position={[0, 0.15, 0]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshBasicMaterial color={glowColor} />
        </mesh>
      </group>

      {/* Braço esquerdo */}
      <group ref={leftArmRef} position={[-0.35, 1.05, 0]}>
        <mesh castShadow position={[0, -0.2, 0]}>
          <boxGeometry args={[0.12, 0.5, 0.12]} />
          <meshStandardMaterial color={color} metalness={0.4} roughness={0.3} />
        </mesh>
      </group>

      {/* Braço direito */}
      <group ref={rightArmRef} position={[0.35, 1.05, 0]}>
        <mesh castShadow position={[0, -0.2, 0]}>
          <boxGeometry args={[0.12, 0.5, 0.12]} />
          <meshStandardMaterial color={color} metalness={0.4} roughness={0.3} />
        </mesh>
      </group>

      {/* Perna esquerda */}
      <group ref={leftLegRef} position={[-0.15, 0.5, 0]}>
        <mesh castShadow position={[0, -0.2, 0]}>
          <boxGeometry args={[0.15, 0.5, 0.15]} />
          <meshStandardMaterial color={darkColor} metalness={0.5} roughness={0.3} />
        </mesh>
        {/* Pé esquerdo */}
        <mesh position={[0, -0.5, 0.05]}>
          <boxGeometry args={[0.18, 0.08, 0.25]} />
          <meshStandardMaterial color={accentColor} metalness={0.3} roughness={0.4} />
        </mesh>
      </group>

      {/* Perna direita */}
      <group ref={rightLegRef} position={[0.15, 0.5, 0]}>
        <mesh castShadow position={[0, -0.2, 0]}>
          <boxGeometry args={[0.15, 0.5, 0.15]} />
          <meshStandardMaterial color={darkColor} metalness={0.5} roughness={0.3} />
        </mesh>
        {/* Pé direito */}
        <mesh position={[0, -0.5, 0.05]}>
          <boxGeometry args={[0.18, 0.08, 0.25]} />
          <meshStandardMaterial color={accentColor} metalness={0.3} roughness={0.4} />
        </mesh>
      </group>
    </group>
  )
}
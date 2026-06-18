/**
 * TNT Run — React Three Fiber (Versão Mobile 100% Corrigida para Discord Activities)
 * Deps: npm install @react-three/fiber @react-three/drei three
 */
import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

// ─── CONFIG ────────────────────────────────────────────────────────────────────
const COLS       = 22
const ROWS       = 22
const FLOORS     = 3
const BLOCK_W    = 1.05
const BLOCK_H    = 0.38
const BLOCK_GAP  = 0.04
const FLOOR_GAP  = 5.5
const STEP_DELAY = 380
const FALL_SPEED = 0.09
const PLAYER_SPEED  = 0.13
const GRAVITY       = 0.032
const CAMERA_HEIGHT   = 9
const CAMERA_DISTANCE = 13
const HALF = ((COLS - 1) / 2) * (BLOCK_W + BLOCK_GAP) + BLOCK_W * 0.5

const FLOOR_PALETTES = [
  { top: 0xe74c3c, side: 0xc0392b },
  { top: 0xf39c12, side: 0xe67e22 },
  { top: 0x27ae60, side: 0x1e8449 },
]

function floorSurface(f) { return f * -FLOOR_GAP + BLOCK_H / 2 }

function generateBlocks() {
  const list = []
  const step = BLOCK_W + BLOCK_GAP
  for (let f = 0; f < FLOORS; f++) {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        list.push({
          id: `${f}_${r}_${c}`,
          floorIdx: f,
          baseX: (c - (COLS - 1) / 2) * step,
          baseZ: (r - (ROWS - 1) / 2) * step,
          baseY: f * -FLOOR_GAP,
          state: 'solid',
          fallY: 0,
        })
      }
    }
  }
  return list
}

function getBlockUnder(x, z, floorIdx, blockStates) {
  const th = (BLOCK_W + BLOCK_GAP) * 0.5
  for (const b of blockStates) {
    if (b.state !== 'solid') continue
    if (b.floorIdx !== floorIdx) continue
    if (Math.abs(b.baseX - x) < th && Math.abs(b.baseZ - z) < th) return b
  }
  return null
}

// ─── FloorBlocks ─────────────────────────────────────────────────────────────
function FloorBlocks({ floorIdx, blockStates }) {
  const meshRef = useRef()
  const blocks = useMemo(() => 
    blockStates.filter(b => b.floorIdx === floorIdx), 
    [blockStates, floorIdx]
  )
  const count = blocks.length

  const geo = useMemo(() => new THREE.BoxGeometry(BLOCK_W, BLOCK_H, BLOCK_W), [])

  const colorArray = useMemo(() => {
    const pal = FLOOR_PALETTES[floorIdx % FLOOR_PALETTES.length]
    const arr = new Float32Array(count * 3)
    blocks.forEach((b, i) => {
      const even = Math.round(b.baseX * 10 + b.baseZ * 10) % 2 === 0
      const c = new THREE.Color(even ? pal.top : pal.side)
      c.offsetHSL(0, 0, (Math.sin(i * 127.1) * 0.5 + 0.5) * 0.04)
      arr[i * 3]     = c.r
      arr[i * 3 + 1] = c.g
      arr[i * 3 + 2] = c.b
    })
    return arr
  }, [blocks, floorIdx, count])

  useEffect(() => {
    const mesh = meshRef.current
    if (!mesh || count === 0) return

    const dummy = new THREE.Object3D()
    if (!mesh.instanceColor) {
      const colorAttribute = new THREE.InstancedBufferAttribute(colorArray, 3)
      mesh.geometry.setAttribute('color', colorAttribute)
      mesh.instanceColor = colorAttribute
    }

    blocks.forEach((b, i) => {
      dummy.position.set(b.baseX, b.baseY, b.baseZ)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
      mesh.setColorAt(i, new THREE.Color(colorArray[i*3], colorArray[i*3+1], colorArray[i*3+2]))
    })

    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [blocks, colorArray, count])

  useFrame(() => {
    const mesh = meshRef.current
    if (!mesh) return
    const dummy = new THREE.Object3D()
    let changed = false

    blocks.forEach((b, i) => {
      if (b.state === 'falling') {
        b.fallY += FALL_SPEED
        dummy.position.set(b.baseX, b.baseY - b.fallY, b.baseZ)
        dummy.updateMatrix()
        mesh.setMatrixAt(i, dummy.matrix)
        changed = true
        if (b.baseY - b.fallY < -70) b.state = 'gone'
      } else if (b.state === 'gone') {
        dummy.position.set(0, -9999, 0)
        dummy.updateMatrix()
        mesh.setMatrixAt(i, dummy.matrix)
        changed = true
      }
    })
    if (changed) mesh.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh 
      ref={meshRef} 
      args={[geo, null, count]} 
      frustumCulled={false}
    >
      <meshPhongMaterial 
        shininess={10} 
        vertexColors 
        specular={0x222222}
      />
    </instancedMesh>
  )
}

// ─── Robot ───────────────────────────────────────────────────────────────────
function Robot({ playerRef, isGameOverRef, keysRef, joystickRef, cameraRef, blockStates, onGameOver, onFloorChange, gameStateRef, resetKey }) {
  const groupRef = useRef()
  const bobRef = useRef()
  const leftArmRef = useRef()
  const rightArmRef = useRef()
  const leftLegRef = useRef()
  const rightLegRef = useRef()
  const antennaRef = useRef()
  const antBallRef = useRef()
  const leftEyeRef = useRef()
  const rightEyeRef = useRef()

  const walkTimeRef = useRef(0)
  const velYRef = useRef(0)
  const curFloorRef = useRef(0)
  const onGroundRef = useRef(true)
  const fallAnimRef = useRef(null)
  const blockTimers = useRef({})

  useEffect(() => {
    if (groupRef.current) groupRef.current.rotation.set(0, 0, 0)
    walkTimeRef.current = 0
    velYRef.current = 0
    curFloorRef.current = 0
    onGroundRef.current = true
    fallAnimRef.current = null
    blockTimers.current = {}
  }, [resetKey])

  function triggerBlock(b) {
    if (blockTimers.current[b.id]) return
    blockTimers.current[b.id] = setTimeout(() => {
      if (b.state === 'solid') b.state = 'falling'
      delete blockTimers.current[b.id]
    }, STEP_DELAY)
  }

  function doGameOver() {
    if (isGameOverRef.current) return
    isGameOverRef.current = true
    onGameOver()
  }

  useFrame((state, dt) => {
    if (!groupRef.current) return
    const p = playerRef.current

    if (isGameOverRef.current) {
      if (!fallAnimRef.current) fallAnimRef.current = { fv: 0, t: 0 }
      const fa = fallAnimRef.current
      fa.fv += 0.03; fa.t++
      groupRef.current.position.y -= fa.fv
      if (leftArmRef.current) leftArmRef.current.rotation.z = Math.sin(fa.t * 0.09) * 2.2
      if (rightArmRef.current) rightArmRef.current.rotation.z = Math.cos(fa.t * 0.09) * 2.2
      if (leftLegRef.current) leftLegRef.current.rotation.x = Math.sin(fa.t * 0.09) * 1.5
      if (rightLegRef.current) rightLegRef.current.rotation.x = Math.cos(fa.t * 0.09) * 1.5
      groupRef.current.rotation.x += 0.025
      groupRef.current.rotation.z += 0.012
      return
    }

    if (gameStateRef.current !== 'playing') return

    const keys = keysRef.current
    const js = joystickRef.current
    const cam = cameraRef.current
    let mx = 0, mz = 0

    if (keys['w'] || keys['arrowup']) { mx -= Math.sin(cam.angle); mz -= Math.cos(cam.angle) }
    if (keys['s'] || keys['arrowdown']) { mx += Math.sin(cam.angle); mz += Math.cos(cam.angle) }
    if (keys['a'] || keys['arrowleft']) { mx -= Math.cos(cam.angle); mz += Math.sin(cam.angle) }
    if (keys['d'] || keys['arrowright']) { mx += Math.cos(cam.angle); mz -= Math.sin(cam.angle) }
    if (js.active) {
      mx += Math.cos(cam.angle) * js.dx - Math.sin(cam.angle) * js.dy
      mz += -Math.sin(cam.angle) * js.dx - Math.cos(cam.angle) * js.dy
    }

    const len = Math.sqrt(mx * mx + mz * mz)
    if (len > 1) { mx /= len; mz /= len }
    const walking = len > 0.05

    p.x = Math.max(-HALF, Math.min(HALF, p.x + mx * PLAYER_SPEED))
    p.z = Math.max(-HALF, Math.min(HALF, p.z + mz * PLAYER_SPEED))

    const grav = GRAVITY * (dt / (1 / 60))
    velYRef.current -= grav
    p.y += velYRef.current
    onGroundRef.current = false

    const sf = floorSurface(curFloorRef.current)
    let bCur = getBlockUnder(p.x, p.z, curFloorRef.current, blockStates)

    if (bCur && velYRef.current <= 0 && p.y <= sf) {
      p.y = sf
      velYRef.current = 0
      onGroundRef.current = true
      triggerBlock(bCur)
    } else {
      for (let f = curFloorRef.current + 1; f < FLOORS; f++) {
        const sf2 = floorSurface(f)
        const bF = getBlockUnder(p.x, p.z, f, blockStates)
        if (bF && velYRef.current <= 0 && p.y <= sf2) {
          p.y = sf2
          velYRef.current = 0
          onGroundRef.current = true
          curFloorRef.current = f
          onFloorChange(f)
          triggerBlock(bF)
          break
        }
      }
    }

    const deathLine = floorSurface(FLOORS - 1) - FLOOR_GAP
    if (p.y < deathLine) doGameOver()

    groupRef.current.position.set(p.x, p.y, p.z)

    if (walking) {
      p.angle = Math.atan2(mx, mz)
      groupRef.current.rotation.y = p.angle
      walkTimeRef.current += dt * 8
      const wt = walkTimeRef.current
      const wc = Math.sin(wt), wc2 = Math.sin(wt + Math.PI)
      if (leftArmRef.current) { leftArmRef.current.rotation.x = wc2 * 0.6; leftArmRef.current.rotation.z = 0.1 }
      if (rightArmRef.current) { rightArmRef.current.rotation.x = wc * 0.6; rightArmRef.current.rotation.z = -0.1 }
      if (leftLegRef.current) leftLegRef.current.rotation.x = wc * 0.55
      if (rightLegRef.current) rightLegRef.current.rotation.x = wc2 * 0.55
      if (bobRef.current) bobRef.current.position.y = Math.abs(Math.sin(wt * 2)) * 0.04
      if (antennaRef.current) antennaRef.current.rotation.z = Math.sin(wt * 3) * 0.15
      if (antBallRef.current) antBallRef.current.position.x = Math.sin(wt * 3) * 0.05
    } else {
      walkTimeRef.current = 0
      const l = 0.12
      const lerpR = (ref, ax, target) => {
        if (ref.current) ref.current.rotation[ax] = THREE.MathUtils.lerp(ref.current.rotation[ax], target, l)
      }
      lerpR(leftArmRef, 'x', 0); lerpR(leftArmRef, 'z', 0.1)
      lerpR(rightArmRef, 'x', 0); lerpR(rightArmRef, 'z', -0.1)
      lerpR(leftLegRef, 'x', 0); lerpR(rightLegRef, 'x', 0)
      if (bobRef.current) bobRef.current.position.y = THREE.MathUtils.lerp(bobRef.current.position.y, 0, l)
      if (antennaRef.current) antennaRef.current.rotation.z = THREE.MathUtils.lerp(antennaRef.current.rotation.z, 0, l)
      if (antBallRef.current) antBallRef.current.position.x = THREE.MathUtils.lerp(antBallRef.current.position.x, 0, l)
    }

    const blink = Math.sin(state.clock.elapsedTime * 3) > 0.97
    if (leftEyeRef.current) leftEyeRef.current.scale.y = blink ? 0.1 : 1
    if (rightEyeRef.current) rightEyeRef.current.scale.y = blink ? 0.1 : 1
  })

  const robotMat = useMemo(() => new THREE.MeshPhongMaterial({ color: 0x4a90d9, shininess: 30 }), [])
  const robotDarkMat = useMemo(() => new THREE.MeshPhongMaterial({ color: 0x2c3e50, shininess: 30 }), [])
  const robotAccentMat = useMemo(() => new THREE.MeshPhongMaterial({ color: 0xe74c3c, shininess: 20 }), [])
  const eyeMat = useMemo(() => new THREE.MeshBasicMaterial({ color: 0x00ffcc }), [])

  return (
    <group ref={groupRef}>
      <group ref={bobRef}>
        <mesh material={robotMat} position={[0, 0.9, 0]}><boxGeometry args={[0.5, 0.6, 0.35]} /></mesh>
        <mesh material={robotDarkMat} position={[0, 1.0, 0.18]}><boxGeometry args={[0.3, 0.2, 0.05]} /></mesh>
        <mesh material={eyeMat} position={[0, 1.0, 0.21]}><sphereGeometry args={[0.06, 4, 4]} /></mesh>
        <mesh material={robotMat} position={[0, 1.45, 0]}><boxGeometry args={[0.4, 0.35, 0.4]} /></mesh>
        <mesh ref={leftEyeRef} material={eyeMat} position={[-0.1, 1.45, 0.22]}><sphereGeometry args={[0.07, 4, 4]} /></mesh>
        <mesh ref={rightEyeRef} material={eyeMat} position={[0.1, 1.45, 0.22]}><sphereGeometry args={[0.07, 4, 4]} /></mesh>
        <mesh ref={antennaRef} material={robotDarkMat} position={[0, 1.8, 0]}><cylinderGeometry args={[0.02, 0.02, 0.3, 4]} /></mesh>
        <mesh ref={antBallRef} material={eyeMat} position={[0, 1.95, 0]}><sphereGeometry args={[0.05, 4, 4]} /></mesh>

        <group ref={leftArmRef} position={[-0.35, 1.05, 0]}>
          <mesh material={robotMat} position={[0, -0.2, 0]}><boxGeometry args={[0.12, 0.5, 0.12]} /></mesh>
        </group>
        <group ref={rightArmRef} position={[0.35, 1.05, 0]}>
          <mesh material={robotMat} position={[0, -0.2, 0]}><boxGeometry args={[0.12, 0.5, 0.12]} /></mesh>
        </group>
        <group ref={leftLegRef} position={[-0.15, 0.5, 0]}>
          <mesh material={robotDarkMat} position={[0, -0.2, 0]}><boxGeometry args={[0.15, 0.5, 0.15]} /></mesh>
          <mesh material={robotAccentMat} position={[0, -0.5, 0.05]}><boxGeometry args={[0.18, 0.08, 0.25]} /></mesh>
        </group>
        <group ref={rightLegRef} position={[0.15, 0.5, 0]}>
          <mesh material={robotDarkMat} position={[0, -0.2, 0]}><boxGeometry args={[0.15, 0.5, 0.15]} /></mesh>
          <mesh material={robotAccentMat} position={[0, -0.5, 0.05]}><boxGeometry args={[0.18, 0.08, 0.25]} /></mesh>
        </group>
      </group>
    </group>
  )
}

// ─── Camera & Timer ─────────────────────────────────────────────────────────
function FollowCamera({ playerRef, cameraRef, isGameOverRef }) {
  const { camera, size } = useThree()
  useFrame(() => {
    if (isGameOverRef.current) return
    const p = playerRef.current
    const cam = cameraRef.current
    const short = size.height < 520 && size.width > size.height
    const dist = short ? CAMERA_DISTANCE * 1.25 : CAMERA_DISTANCE
    const height = short ? CAMERA_HEIGHT * 1.15 : CAMERA_HEIGHT

    const cx = p.x + Math.sin(cam.angle) * dist * Math.cos(cam.pitch)
    const cy = p.y + height * Math.sin(cam.pitch) + 1.5
    const cz = p.z + Math.cos(cam.angle) * dist * Math.cos(cam.pitch)

    camera.position.set(cx, Math.max(p.y + 2, cy), cz)
    camera.lookAt(p.x, p.y + 1.0, p.z)
  })
  return null
}

function GameTimer({ gameStateRef, onTick, isGameOverRef }) {
  const elapsedRef = useRef(0)
  useFrame((_, dt) => {
    if (gameStateRef.current !== 'playing' || isGameOverRef.current) return
    elapsedRef.current += dt
    onTick(elapsedRef.current)
  })
  return null
}

function GameScene({ blockStates, playerRef, cameraRef, keysRef, joystickRef, gameStateRef, isGameOverRef, onGameOver, onFloorChange, onTick, resetKey }) {
  return (
    <>
      <fog attach="fog" args={['#080810', 35, 95]} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[15, 30, 15]} intensity={0.6} />
      <hemisphereLight skyColor={0x6688cc} groundColor={0x222244} intensity={0.25} />

      {Array.from({ length: FLOORS }).map((_, f) => (
        <FloorBlocks key={f} floorIdx={f} blockStates={blockStates} />
      ))}

      <Robot
        key={resetKey}
        playerRef={playerRef}
        isGameOverRef={isGameOverRef}
        keysRef={keysRef}
        joystickRef={joystickRef}
        cameraRef={cameraRef}
        blockStates={blockStates}
        onGameOver={onGameOver}
        onFloorChange={onFloorChange}
        gameStateRef={gameStateRef}
        resetKey={resetKey}
      />

      <FollowCamera playerRef={playerRef} cameraRef={cameraRef} isGameOverRef={isGameOverRef} />
      <GameTimer gameStateRef={gameStateRef} onTick={onTick} isGameOverRef={isGameOverRef} />
    </>
  )
}

function Countdown({ count }) {
  if (count === null) return null
  return (
    <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
      <div
        key={count}
        className="text-white font-black select-none"
        style={{
          fontSize: 'clamp(80px, 20vw, 160px)',
          textShadow: '0 0 40px rgba(251,146,60,0.9), 0 0 80px rgba(251,146,60,0.4)',
          animation: 'countPop 0.9s ease-out forwards',
          lineHeight: 1,
        }}
      >
        {count === 0 ? 'GO!' : count}
      </div>
      <style>{`
        @keyframes countPop {
          0%   { transform: scale(1.6); opacity: 0; }
          15%  { transform: scale(1.0); opacity: 1; }
          70%  { transform: scale(1.0); opacity: 1; }
          100% { transform: scale(0.7); opacity: 0; }
        }
      `}</style>
    </div>
  )
}

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────
export default function TNTRun() {
  const [gameState, setGameState] = useState('menu')
  const [score, setScore] = useState(0)
  const [gameTime, setGameTime] = useState(0)
  const [currentFloor, setCurrentFloor] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [countdown, setCountdown] = useState(null)
  const [resetKey, setResetKey] = useState(0)

  const gameStateRef = useRef('menu')
  const isGameOverRef = useRef(false)
  const playerRef = useRef({ x: 0, y: floorSurface(0), z: 0, angle: 0 })
  const cameraRef = useRef({ angle: Math.PI / 5, pitch: 0.38 })
  const keysRef = useRef({})
  const joystickRef = useRef({ active: false, dx: 0, dy: 0, originX: 0, originY: 0 })
  const joystickBaseRef = useRef(null)
  const [joystickKnob, setJoystickKnob] = useState({ x: 0, y: 0 })
  const lastScoreRef = useRef(0)
  const blockStates = useRef(generateBlocks()).current

  const [isTouchDevice, setIsTouchDevice] = useState(false)
  const [compactLandscape, setCompactLandscape] = useState(false)
  const [isPortraitTouch, setIsPortraitTouch] = useState(false)

  useEffect(() => { gameStateRef.current = gameState }, [gameState])

  // Device detection
  useEffect(() => {
    const touch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0
    setIsTouchDevice(touch)
    const check = () => {
      const portrait = window.innerHeight > window.innerWidth
      setIsPortraitTouch(touch && portrait)
      setCompactLandscape(!portrait && window.innerHeight < 520)
    }
    check()
    window.addEventListener('resize', check, { passive: true })
    window.addEventListener('orientationchange', check, { passive: true })
    return () => {
      window.removeEventListener('resize', check)
      window.removeEventListener('orientationchange', check)
    }
  }, [])

  // Keyboard
  useEffect(() => {
    const down = e => { keysRef.current[e.key.toLowerCase()] = true }
    const up = e => { keysRef.current[e.key.toLowerCase()] = false }
    window.addEventListener('keydown', down, { passive: true })
    window.addEventListener('keyup', up, { passive: true })
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [])

  // Mouse camera
  useEffect(() => {
    let down = false, lx = 0, ly = 0
    const md = e => { down = true; lx = e.clientX; ly = e.clientY }
    const mu = () => { down = false }
    const mm = e => {
      if (!down || gameStateRef.current !== 'playing') return
      cameraRef.current.angle -= (e.clientX - lx) * 0.005
      cameraRef.current.pitch = Math.max(0.12, Math.min(0.75, cameraRef.current.pitch - (e.clientY - ly) * 0.005))
      lx = e.clientX; ly = e.clientY
    }
    window.addEventListener('mousedown', md, { passive: true })
    window.addEventListener('mouseup', mu, { passive: true })
    window.addEventListener('mousemove', mm, { passive: true })
    return () => {
      window.removeEventListener('mousedown', md)
      window.removeEventListener('mouseup', mu)
      window.removeEventListener('mousemove', mm)
    }
  }, [])

  // Touch Controls (Mapeado para o bounding box correto do Discord)
  useEffect(() => {
    const JOY_MAX = 45
    const JOY_GRAB = 85
    let joyId = null, camId = null, ltx = 0, lty = 0

    const onStart = e => {
      if (e.cancelable) e.preventDefault()
      for (const t of e.changedTouches) {
        const base = joystickBaseRef.current
        const rect = base?.getBoundingClientRect()
        if (rect) {
          const cx = rect.left + rect.width / 2
          const cy = rect.top + rect.height / 2
          const dx = t.clientX - cx
          const dy = t.clientY - cy
          if (joyId === null && Math.sqrt(dx*dx + dy*dy) < JOY_GRAB) {
            joyId = t.identifier
            const js = joystickRef.current
            js.active = true
            js.originX = cx
            js.originY = cy
            const d = Math.sqrt(dx*dx + dy*dy)
            let kx = dx, ky = dy
            if (d > JOY_MAX) { kx = (dx/d)*JOY_MAX; ky = (dy/d)*JOY_MAX }
            js.dx = kx/JOY_MAX
            js.dy = ky/JOY_MAX
            setJoystickKnob({ x: kx, y: ky })
            continue
          }
        }
        if (camId === null && gameStateRef.current === 'playing') {
          camId = t.identifier
          ltx = t.clientX
          lty = t.clientY
        }
      }
    }

    const onMove = e => {
      if (e.cancelable) e.preventDefault()
      for (const t of e.changedTouches) {
        if (t.identifier === joyId) {
          const js = joystickRef.current
          let dx = t.clientX - js.originX
          let dy = t.clientY - js.originY
          const d = Math.sqrt(dx*dx + dy*dy)
          if (d > JOY_MAX) { dx = (dx/d)*JOY_MAX; dy = (dy/d)*JOY_MAX }
          js.dx = dx/JOY_MAX
          js.dy = dy/JOY_MAX
          setJoystickKnob({ x: dx, y: dy })
        } else if (t.identifier === camId && gameStateRef.current === 'playing') {
          cameraRef.current.angle -= (t.clientX - ltx) * 0.0065
          cameraRef.current.pitch = Math.max(0.12, Math.min(0.75, cameraRef.current.pitch - (t.clientY - lty) * 0.0065))
          ltx = t.clientX
          lty = t.clientY
        }
      }
    }

    const onEnd = e => {
      for (const t of e.changedTouches) {
        if (t.identifier === joyId) {
          joyId = null
          const js = joystickRef.current
          js.active = false; js.dx = 0; js.dy = 0
          setJoystickKnob({ x: 0, y: 0 })
        } else if (t.identifier === camId) camId = null
      }
    }

    window.addEventListener('touchstart', onStart, { passive: false })
    window.addEventListener('touchmove', onMove, { passive: false })
    window.addEventListener('touchend', onEnd, { passive: true })
    window.addEventListener('touchcancel', onEnd, { passive: true })

    return () => {
      window.removeEventListener('touchstart', onStart)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onEnd)
      window.removeEventListener('touchcancel', onEnd)
    }
  }, [])

  const handleGameOver = useCallback(() => {
    setTimeout(() => {
      setHighScore(prev => Math.max(prev, lastScoreRef.current))
      setGameState('gameover')
    }, 1800)
  }, [])

  const handleTick = useCallback((elapsed) => {
    const s = Math.floor(elapsed * 12)
    lastScoreRef.current = s
    setScore(s)
    setGameTime(Math.floor(elapsed))
  }, [])

  const handleStart = useCallback(() => {
    if (isTouchDevice) {
      document.documentElement.requestFullscreen?.().catch(() => {})
      screen.orientation?.lock?.('landscape').catch(() => {})
    }

    blockStates.forEach(b => { b.state = 'solid'; b.fallY = 0 })

    playerRef.current = { x: 0, y: floorSurface(0), z: 0, angle: 0 }
    cameraRef.current = { angle: Math.PI / 5, pitch: 0.38 }
    isGameOverRef.current = false
    lastScoreRef.current = 0

    setScore(0)
    setGameTime(0)
    setCurrentFloor(0)
    setResetKey(k => k + 1)

    setGameState('countdown')
    gameStateRef.current = 'countdown'

    const steps = [5, 4, 3, 2, 1, 0]
    steps.forEach((n, i) => {
      setTimeout(() => {
        setCountdown(n)
        if (n === 0) {
          setTimeout(() => {
            setCountdown(null)
            setGameState('playing')
            gameStateRef.current = 'playing'
          }, 700)
        }
      }, i * 1000)
    })
  }, [isTouchDevice, blockStates])

  return (
    <>
      <Head>
        <title>TNT Run</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </Head>

      {/* Injeção global das variáveis recomendadas pelo Discord */}
      <style jsx global>{`
        :root {
          --sait: var(--discord-safe-area-inset-top, env(safe-area-inset-top));
          --saib: var(--discord-safe-area-inset-bottom, env(safe-area-inset-bottom));
          --sail: var(--discord-safe-area-inset-left, env(safe-area-inset-left));
          --sair: var(--discord-safe-area-inset-right, env(safe-area-inset-right));
        }
      `}</style>

      <div 
        className="relative w-full h-screen overflow-hidden bg-black select-none touch-none"
        style={{ touchAction: 'none' }}
      >
        <Canvas
          className="absolute inset-0"
          gl={{ 
            antialias: true, 
            powerPreference: 'high-performance',
            alpha: false 
          }}
          camera={{ fov: 60, near: 0.1, far: 200 }}
          dpr={typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, 2) : 1}
          style={{ background: '#080810', touchAction: 'none' }}
        >
          {(gameState === 'playing' || gameState === 'countdown' || gameState === 'gameover') && (
            <GameScene
              blockStates={blockStates}
              playerRef={playerRef}
              cameraRef={cameraRef}
              keysRef={keysRef}
              joystickRef={joystickRef}
              gameStateRef={gameStateRef}
              isGameOverRef={isGameOverRef}
              onGameOver={handleGameOver}
              onFloorChange={setCurrentFloor}
              onTick={handleTick}
              resetKey={resetKey}
            />
          )}
        </Canvas>

        <Link href="/">
          <button className={`absolute z-50 bg-black/70 backdrop-blur-sm border border-white/10 rounded-xl text-white/80 font-medium hover:bg-white/10 hover:text-white transition-all flex items-center gap-2 ${compactLandscape ? 'top-2 left-2 px-3 py-1.5 text-xs' : 'top-4 left-4 px-4 py-2 text-sm'}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Hub
          </button>
        </Link>

        <Countdown count={countdown} />

        {(gameState === 'playing' || gameState === 'countdown') && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-3 pointer-events-none z-40">
            <div className="bg-black/70 backdrop-blur-sm rounded-xl px-5 py-2 border border-white/10 text-center min-w-[70px]">
              <div className="text-white text-2xl font-bold font-mono">{gameTime}s</div>
              <div className="text-white/40 text-xs uppercase tracking-wider">Tempo</div>
            </div>
            <div className="bg-black/70 backdrop-blur-sm rounded-xl px-5 py-2 border border-white/10 text-center min-w-[70px]">
              <div className="text-white text-2xl font-bold">{score}</div>
              <div className="text-white/40 text-xs uppercase tracking-wider">Pontos</div>
            </div>
            <div className="bg-black/70 backdrop-blur-sm rounded-xl px-5 py-2 border border-orange-500/40 text-center min-w-[70px]">
              <div className="text-orange-400 text-2xl font-bold">
                {currentFloor + 1}<span className="text-white/30 text-base">/{FLOORS}</span>
              </div>
              <div className="text-white/40 text-xs uppercase tracking-wider">Andar</div>
            </div>
          </div>
        )}

        {/* Menu */}
        {gameState === 'menu' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-40">
            <div className="text-center px-4">
              <h1 className="font-black text-white mb-1 tracking-tight text-5xl md:text-6xl">
                TNT <span className="block text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-red-400 to-yellow-400">RUN</span>
              </h1>
              <p className="text-white/50 max-w-md mx-auto text-base md:text-lg mb-6">
                Ande sobre os blocos — eles desaparecem sob seus pés!<br />
                Sobreviva o máximo que puder.
              </p>
              <button onClick={handleStart} className="bg-gradient-to-r from-orange-600 to-red-600 text-white font-bold rounded-xl hover:from-orange-500 hover:to-red-500 transition-all transform hover:scale-105 shadow-lg shadow-orange-500/30 px-10 py-4 text-xl">
                JOGAR
              </button>
              {highScore > 0 && <p className="text-white/30 mt-4">Recorde: {highScore} pts</p>}
            </div>
          </div>
        )}

        {/* Game Over */}
        {gameState === 'gameover' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-40">
            <div className="text-center px-4">
              <h2 className="font-black text-red-400 mb-2 text-4xl md:text-5xl">GAME OVER</h2>
              <div className="flex justify-center gap-4 mb-8">
                <div className="bg-white/5 rounded-xl px-6 py-4">
                  <div className="text-white/40 text-sm uppercase tracking-wider">Pontuação</div>
                  <div className="text-white font-bold text-3xl">{score}</div>
                </div>
                <div className="bg-white/5 rounded-xl px-6 py-4">
                  <div className="text-white/40 text-sm uppercase tracking-wider">Tempo</div>
                  <div className="text-white font-bold text-3xl">{gameTime}s</div>
                </div>
              </div>
              <button onClick={handleStart} className="bg-gradient-to-r from-orange-600 to-red-600 text-white font-bold rounded-xl hover:from-orange-500 hover:to-red-500 transition-all transform hover:scale-105 shadow-lg shadow-orange-500/30 px-10 py-4 text-xl">
                JOGAR NOVAMENTE
              </button>
              {highScore > 0 && <p className="text-white/30 mt-4">Recorde: {highScore} pts</p>}
            </div>
          </div>
        )}

        {/* Joystick Mapado com as variáveis seguras injetadas do Discord */}
        {isTouchDevice && (gameState === 'playing' || gameState === 'countdown') && (
          <div 
            ref={joystickBaseRef} 
            className="fixed z-50 pointer-events-auto" 
            style={{ 
              left: 'calc(var(--sail) + 24px)', 
              bottom: 'calc(var(--saib) + 24px)' 
            }}
          >
            <div className="w-[130px] h-[130px] rounded-full bg-white/10 border-2 border-white/30 backdrop-blur-sm flex items-center justify-center">
              <div 
                className="w-14 h-14 rounded-full bg-white/40 border border-white/60 shadow-xl" 
                style={{ transform: `translate(${joystickKnob.x}px, ${joystickKnob.y}px)` }} 
              />
            </div>
          </div>
        )}

        {isPortraitTouch && (
          <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center px-6 text-center">
            <div className="text-6xl mb-4 animate-bounce">📱</div>
            <h2 className="text-white text-xl font-bold mb-2">Gire seu dispositivo</h2>
            <button 
              onClick={() => { 
                document.documentElement.requestFullscreen?.().catch(()=>{})
                screen.orientation?.lock?.('landscape').catch(()=>{})
              }} 
              className="px-6 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white/70 text-sm hover:bg-white/20 transition-all"
            >
              Tentar girar automaticamente
            </button>
          </div>
        )}
      </div>
    </>
  )
}
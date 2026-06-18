import { useEffect, useRef, useState, useCallback } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import * as THREE from 'three'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'
import { createMinecraftPlayer } from '@/components/PlayerModel'

const COLORS = [
  0xFF3B30, 0x007AFF, 0x34C759, 0xFF9500,
  0xAF52DE, 0xFFCC00, 0x00C7BE, 0xFF2D55,
  0x5856D6, 0xA2845E, 0x64D2FF, 0x30D158,
]

const TILE_SIZE = 2.4
const TILE_HEIGHT = 0.5
const GRID_RADIUS = 6
const FALL_SPEED = 0.15
const ROUND_TIME = 5
const PLAYER_SPEED = 0.12
const CAMERA_HEIGHT = 5
const CAMERA_DISTANCE = 8

function getTilePosition(q, r) {
  return { x: TILE_SIZE * q, z: TILE_SIZE * r }
}

function generateHexGrid() {
  const hexagons = []
  for (let q = -GRID_RADIUS; q <= GRID_RADIUS; q++) {
    for (let r = -GRID_RADIUS; r <= GRID_RADIUS; r++) {
      if (Math.sqrt(q * q + r * r) > GRID_RADIUS) continue
      const pos = getTilePosition(q, r)
      const colorIndex = Math.floor(Math.random() * COLORS.length)
      hexagons.push({
        q, r, x: pos.x, z: pos.z,
        colorIndex, color: COLORS[colorIndex],
        active: true, falling: false, fallY: 0,
      })
    }
  }
  return hexagons
}

function getHexAtPosition(x, z, hexagons) {
  const half = TILE_SIZE / 2
  for (const hex of hexagons) {
    if (!hex.active) continue
    if (Math.abs(x - hex.x) <= half && Math.abs(z - hex.z) <= half) return hex
  }
  return null
}

export default function HexagonGame() {
  const mountRef = useRef(null)
  const gameRef = useRef(null)
  const stateRef = useRef('menu')
  const [gameState, setGameState] = useState('menu')
  const [score, setScore] = useState(0)
  const [round, setRound] = useState(0)
  const [targetColor, setTargetColor] = useState(null)
  const [timeLeft, setTimeLeft] = useState(ROUND_TIME)
  const [highScore, setHighScore] = useState(0)
  const [shake, setShake] = useState(false)

  const joystickRef = useRef({ active: false, originX: 0, originY: 0, dx: 0, dy: 0 })
  const joystickBaseRef = useRef(null)
  const [joystickKnob, setJoystickKnob] = useState({ x: 0, y: 0 })

  const [isTouchDevice, setIsTouchDevice] = useState(false)
  const [compactLandscape, setCompactLandscape] = useState(false)
  const [isPortraitTouch, setIsPortraitTouch] = useState(false)

  useEffect(() => { stateRef.current = gameState }, [gameState])

  useEffect(() => {
    const touch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0
    setIsTouchDevice(touch)

    const checkLayout = () => {
      const portrait = window.innerHeight > window.innerWidth
      setIsPortraitTouch(touch && portrait)
      setCompactLandscape(!portrait && window.innerHeight < 520)
    }
    checkLayout()
    window.addEventListener('resize', checkLayout, { passive: true })
    window.addEventListener('orientationchange', checkLayout, { passive: true })
    return () => {
      window.removeEventListener('resize', checkLayout)
      window.removeEventListener('orientationchange', checkLayout)
    }
  }, [])

  const initGame = useCallback(() => {
    const mount = mountRef.current
    if (!mount) return () => { }

    const geometriesToDispose = []
    const materialsToDispose = []

    while (mount.firstChild) mount.removeChild(mount.firstChild)

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0a0a0a)
    scene.fog = new THREE.Fog(0x0a0a0a, 25, 60)

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000)

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    mount.appendChild(renderer.domElement)

    scene.add(new THREE.AmbientLight(0xffffff, 0.5))
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.7)
    dirLight.position.set(10, 25, 10)
    dirLight.castShadow = true
    dirLight.shadow.mapSize.set(2048, 2048)
    dirLight.shadow.camera.near = 0.5
    dirLight.shadow.camera.far = 50
    dirLight.shadow.camera.left = -20
    dirLight.shadow.camera.right = 20
    dirLight.shadow.camera.top = 20
    dirLight.shadow.camera.bottom = -20
    scene.add(dirLight)
    scene.add(new THREE.HemisphereLight(0x87ceeb, 0x222222, 0.3))

    const hexGeometry = new THREE.BoxGeometry(TILE_SIZE, TILE_HEIGHT, TILE_SIZE)
    geometriesToDispose.push(hexGeometry)

    const hexagons = generateHexGrid()
    const hexMeshes = []
    const hexMaterials = []

    hexagons.forEach((hex) => {
      const material = new THREE.MeshStandardMaterial({ color: hex.color, metalness: 0.15, roughness: 0.7 })
      hexMaterials.push(material)
      materialsToDispose.push(material)
      const mesh = new THREE.Mesh(hexGeometry, material)
      mesh.position.set(hex.x, 0, hex.z)
      mesh.receiveShadow = true
      mesh.castShadow = true
      mesh.userData = { hexIndex: hexMeshes.length }
      scene.add(mesh)
      hexMeshes.push(mesh)
    })

    // ========== CONTÊINER DO PLAYER ==========
    const robotGroup = new THREE.Group()
    scene.add(robotGroup)

    // Instancia o nosso modelo procedural estilo Minecraft
    const playerModel = createMinecraftPlayer(robotGroup)

    // Mantém o tamanho grande
    if (playerModel && playerModel.group) {
      playerModel.group.scale.set(1.45, 1.45, 1.45)
    }

    playerModel.geometries.forEach(g => geometriesToDispose.push(g))
    playerModel.materials.forEach(m => materialsToDispose.push(m))

    let animationTime = 0
    let mixer = null

    const robotGlow = new THREE.PointLight(0x00ffcc, 0.4, 4)
    robotGlow.position.y = 1
    robotGroup.add(robotGlow)

    const ringGeo = new THREE.RingGeometry(TILE_SIZE * 0.25, TILE_SIZE * 0.38, 32)
    geometriesToDispose.push(ringGeo)
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, side: THREE.DoubleSide })
    materialsToDispose.push(ringMat)
    const targetRing = new THREE.Mesh(ringGeo, ringMat)
    targetRing.rotation.x = -Math.PI / 2
    targetRing.position.y = 0.1
    scene.add(targetRing)

    const arrowGeo = new THREE.ConeGeometry(0.12, 0.4, 8)
    geometriesToDispose.push(arrowGeo)
    const arrowMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 })
    materialsToDispose.push(arrowMat)
    const arrow = new THREE.Mesh(arrowGeo, arrowMat)
    arrow.rotation.x = Math.PI
    arrow.position.y = 2.5
    robotGroup.add(arrow)

    const mouse = new THREE.Vector2()

    let currentRound = 0
    let currentScore = 0
    let targetColorIndex = -1
    let timeRemaining = ROUND_TIME
    let lastTime = performance.now()
    let isGameOver = false
    let animFrameId = null

    let playerPos = { x: 0, z: 0 }
    let playerAngle = 0
    let cameraAngle = Math.PI / 6
    let cameraPitch = 0.35
    let isMouseDown = false
    let lastMouseX = 0
    let lastMouseY = 0
    let isWalking = false

    const keys = {}
    const handleKeyDown = (e) => { keys[e.key.toLowerCase()] = true }
    const handleKeyUp = (e) => { keys[e.key.toLowerCase()] = false }

    const handleMouseDown = (e) => {
      isMouseDown = true
      lastMouseX = e.clientX
      lastMouseY = e.clientY
    }
    const handleMouseUp = () => { isMouseDown = false }
    const handleMouseMove = (e) => {
      if (isMouseDown && stateRef.current === 'playing') {
        const dx = e.clientX - lastMouseX
        const dy = e.clientY - lastMouseY
        cameraAngle -= dx * 0.005
        cameraPitch = Math.max(0.1, Math.min(0.8, cameraPitch - dy * 0.005))
        lastMouseX = e.clientX
        lastMouseY = e.clientY
      }
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1
    }

    let joystickTouchId = null
    let cameraTouchId = null
    let lastTouchX = 0
    let lastTouchY = 0
    const JOY_MAX_DIST = 32
    const JOY_GRAB_RADIUS = 70

    const handleTouchStart = (e) => {
      if (e.cancelable) e.preventDefault()
      for (const touch of e.changedTouches) {
        const base = joystickBaseRef.current
        const rect = base ? base.getBoundingClientRect() : null
        if (rect) {
          const cx = rect.left + rect.width / 2
          const cy = rect.top + rect.height / 2
          const dx = touch.clientX - cx
          const dy = touch.clientY - cy
          if (joystickTouchId === null && Math.sqrt(dx * dx + dy * dy) < JOY_GRAB_RADIUS) {
            joystickTouchId = touch.identifier
            const js = joystickRef.current
            js.active = true
            js.originX = cx
            js.originY = cy
            const dist = Math.sqrt(dx * dx + dy * dy)
            let kx = dx, ky = dy
            if (dist > JOY_MAX_DIST) {
              kx = (dx / dist) * JOY_MAX_DIST
              ky = (dy / dist) * JOY_MAX_DIST
            }
            js.dx = kx / JOY_MAX_DIST
            js.dy = ky / JOY_MAX_DIST
            setJoystickKnob({ x: kx, y: ky })
            continue
          }
        }
        if (cameraTouchId === null && stateRef.current === 'playing') {
          cameraTouchId = touch.identifier
          lastTouchX = touch.clientX
          lastTouchY = touch.clientY
        }
      }
    }

    const handleTouchMove = (e) => {
      if (e.cancelable) e.preventDefault()
      for (const touch of e.changedTouches) {
        if (touch.identifier === joystickTouchId) {
          const js = joystickRef.current
          let dx = touch.clientX - js.originX
          let dy = touch.clientY - js.originY
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist > JOY_MAX_DIST) {
            dx = (dx / dist) * JOY_MAX_DIST
            dy = (dy / dist) * JOY_MAX_DIST
          }
          js.dx = dx / JOY_MAX_DIST
          js.dy = dy / JOY_MAX_DIST
          setJoystickKnob({ x: dx, y: dy })
        } else if (touch.identifier === cameraTouchId) {
          if (stateRef.current === 'playing') {
            const dx = touch.clientX - lastTouchX
            const dy = touch.clientY - lastTouchY
            cameraAngle -= dx * 0.006
            cameraPitch = Math.max(0.1, Math.min(0.8, cameraPitch - dy * 0.006))
          }
          lastTouchX = touch.clientX
          lastTouchY = touch.clientY
        }
      }
    }

    const handleTouchEnd = (e) => {
      for (const touch of e.changedTouches) {
        if (touch.identifier === joystickTouchId) {
          joystickTouchId = null
          const js = joystickRef.current
          js.active = false
          js.dx = 0
          js.dy = 0
          setJoystickKnob({ x: 0, y: 0 })
        } else if (touch.identifier === cameraTouchId) {
          cameraTouchId = null
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown, { passive: true })
    window.addEventListener('keyup', handleKeyUp, { passive: true })
    window.addEventListener('mousedown', handleMouseDown, { passive: true })
    window.addEventListener('mouseup', handleMouseUp, { passive: true })
    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    mount.addEventListener('touchstart', handleTouchStart, { passive: false })
    mount.addEventListener('touchmove', handleTouchMove, { passive: false })
    mount.addEventListener('touchend', handleTouchEnd, { passive: true })
    mount.addEventListener('touchcancel', handleTouchEnd, { passive: true })

    function checkColorMatch() {
      const hex = getHexAtPosition(playerPos.x, playerPos.z, hexagons)
      if (hex && hex.colorIndex === targetColorIndex) {
        nextRound()
      }
    }

    function nextRound() {
      currentRound++
      currentScore += Math.ceil(timeRemaining * 10)
      timeRemaining = ROUND_TIME
      const activeHexes = hexagons.filter(h => h.active)
      if (activeHexes.length === 0) { gameOver(); return }
      const randomHex = activeHexes[Math.floor(Math.random() * activeHexes.length)]
      targetColorIndex = randomHex.colorIndex
      setRound(currentRound)
      setScore(currentScore)
      setTargetColor(COLORS[targetColorIndex])
      setTimeLeft(ROUND_TIME)
    }

    function gameOver() {
      if (isGameOver) return
      isGameOver = true
      let fallVelocity = 0

      if (mixer) mixer.stopAllAction()

      const fallPlayer = () => {
        if (robotGroup.position.y > -20) {
          fallVelocity += 0.02
          robotGroup.position.y -= fallVelocity
          robotGroup.rotation.x += 0.02
          robotGroup.rotation.z += 0.01
          requestAnimationFrame(fallPlayer)
        }
      }
      fallPlayer()
      setGameState('gameover')
      setHighScore(prev => Math.max(prev, currentScore))
    }

    function startGame() {
      currentRound = 1
      currentScore = 0
      timeRemaining = ROUND_TIME
      isGameOver = false
      playerPos = { x: 0, z: 0 }
      playerAngle = 0
      cameraAngle = Math.PI / 6
      cameraPitch = 0.35
      isWalking = false

      robotGroup.position.set(0, 0, 0)
      robotGroup.rotation.set(0, 0, 0)

      hexagons.forEach((hex, i) => {
        hex.active = true
        hex.falling = false
        hex.fallY = 0
        hexMeshes[i].position.y = 0
        hexMeshes[i].visible = true
        hex.colorIndex = Math.floor(Math.random() * COLORS.length)
        hex.color = COLORS[hex.colorIndex]
        hexMaterials[i].color.setHex(hex.color)
      })

      const activeHexes = hexagons.filter(h => h.active)
      const randomHex = activeHexes[Math.floor(Math.random() * activeHexes.length)]
      targetColorIndex = randomHex.colorIndex

      setRound(1)
      setScore(0)
      setTargetColor(COLORS[targetColorIndex])
      setTimeLeft(ROUND_TIME)
      setGameState('playing')
    }

    function updatePlayer(delta) {
      if (isGameOver || stateRef.current !== 'playing') return

      let moveX = 0
      let moveZ = 0

      if (keys['w'] || keys['arrowup']) {
        moveX -= Math.sin(cameraAngle) * PLAYER_SPEED
        moveZ -= Math.cos(cameraAngle) * PLAYER_SPEED
      }
      if (keys['s'] || keys['arrowdown']) {
        moveX += Math.sin(cameraAngle) * PLAYER_SPEED
        moveZ += Math.cos(cameraAngle) * PLAYER_SPEED
      }
      if (keys['a'] || keys['arrowleft']) {
        moveX -= Math.cos(cameraAngle) * PLAYER_SPEED
        moveZ += Math.sin(cameraAngle) * PLAYER_SPEED
      }
      if (keys['d'] || keys['arrowright']) {
        moveX += Math.cos(cameraAngle) * PLAYER_SPEED
        moveZ -= Math.cos(cameraAngle) * PLAYER_SPEED
      }

      const js = joystickRef.current
      if (js.active) {
        moveX += js.dx * PLAYER_SPEED
        moveZ += js.dy * PLAYER_SPEED
      }

      const len = Math.sqrt(moveX * moveX + moveZ * moveZ)
      if (len > PLAYER_SPEED) {
        moveX = (moveX / len) * PLAYER_SPEED
        moveZ = (moveZ / len) * PLAYER_SPEED
      }

      isWalking = len > 0.01
      animationTime += delta * (isWalking ? 14 : 3)

      // CORREÇÃO: Altura Y fixa no nível superior dos blocos (sem flutuar no ar)
      if (playerModel && playerModel.group) {
        playerModel.group.position.y = TILE_HEIGHT / 2
      }

      if (isWalking) {
        playerAngle = Math.atan2(moveX, moveZ)
        robotGroup.rotation.y = playerAngle

        playerModel.leftLeg.rotation.x = Math.sin(animationTime) * 0.65
        playerModel.rightLeg.rotation.x = -Math.sin(animationTime) * 0.65

        playerModel.leftArm.rotation.x = -Math.sin(animationTime) * 0.5
        playerModel.leftArm.rotation.z = (Math.cos(animationTime) * 0.1) + 0.05
        playerModel.rightArm.rotation.x = Math.sin(animationTime) * 0.5
        playerModel.rightArm.rotation.z = -(Math.cos(animationTime) * 0.1) - 0.05

        playerModel.torso.rotation.x = 0.15
        playerModel.head.rotation.x = -0.05
        
        playerModel.group.rotation.x = THREE.MathUtils.lerp(playerModel.group.rotation.x, 0.12, 0.1)
      } else {
        playerModel.leftLeg.rotation.x *= 0.8
        playerModel.rightLeg.rotation.x *= 0.8
        playerModel.torso.rotation.x *= 0.8

        playerModel.leftArm.rotation.x = Math.sin(animationTime) * 0.05
        playerModel.leftArm.rotation.z = 0.05 + Math.sin(animationTime) * 0.03
        playerModel.rightArm.rotation.x = Math.sin(animationTime) * 0.05
        playerModel.rightArm.rotation.z = -0.05 - Math.sin(animationTime) * 0.03

        playerModel.head.rotation.y = Math.sin(animationTime * 0.5) * 0.08
        playerModel.head.rotation.x = (Math.cos(animationTime) * 0.02)
        
        playerModel.group.rotation.x = THREE.MathUtils.lerp(playerModel.group.rotation.x, 0, 0.1)
      }

      let newX = playerPos.x + moveX
      let newZ = playerPos.z + moveZ

      const closestHex = getHexAtPosition(newX, newZ, hexagons)

      if (closestHex) {
        playerPos.x = newX
        playerPos.z = newZ
      } else {
        const hexX = getHexAtPosition(newX, playerPos.z, hexagons)
        if (hexX) playerPos.x = newX

        const hexZ = getHexAtPosition(playerPos.x, newZ, hexagons)
        if (hexZ) playerPos.z = newZ

        const finalHex = getHexAtPosition(playerPos.x, playerPos.z, hexagons)
        if (!finalHex) {
          let nearest = null
          let minDist = Infinity
          for (const hex of hexagons) {
            if (!hex.active) continue
            const dx = playerPos.x - hex.x
            const dz = playerPos.z - hex.z
            const dist = dx * dx + dz * dz
            if (dist < minDist) {
              minDist = dist
              nearest = hex
            }
          }
          if (nearest) {
            playerPos.x = nearest.x
            playerPos.z = nearest.z
          }
        }
      }

      robotGroup.position.x = playerPos.x
      robotGroup.position.z = playerPos.z

      checkColorMatch()
    }

    function updateCamera() {
      const shortScreen = window.innerHeight < 520 && window.innerWidth > window.innerHeight
      const distance = shortScreen ? CAMERA_DISTANCE * 1.25 : CAMERA_DISTANCE
      const height = shortScreen ? CAMERA_HEIGHT * 1.15 : CAMERA_HEIGHT

      const camX = playerPos.x + Math.sin(cameraAngle) * distance
      const camY = height * Math.sin(cameraPitch) + 2
      const camZ = playerPos.z + Math.cos(cameraAngle) * distance

      camera.position.set(camX, camY, camZ)
      camera.lookAt(playerPos.x, 1.2, playerPos.z)
    }

    function updateArrow() {
      if (targetColorIndex === -1 || isGameOver) {
        arrow.material.opacity = 0
        return
      }
      const targetHex = hexagons.find(h => h.colorIndex === targetColorIndex && h.active)
      if (!targetHex) { arrow.material.opacity = 0; return }

      const dx = targetHex.x - playerPos.x
      const dz = targetHex.z - playerPos.z
      const angle = Math.atan2(dx, dz)
      arrow.rotation.y = angle - playerAngle
      arrow.material.opacity = 0.7 + Math.sin(performance.now() * 0.005) * 0.3
      arrow.material.color.setHex(COLORS[targetColorIndex])
    }

    function animate() {
      animFrameId = requestAnimationFrame(animate)
      const now = performance.now()
      const delta = (now - lastTime) / 1000
      lastTime = now

      if (!isGameOver && stateRef.current === 'playing') {
        timeRemaining -= delta
        if (timeRemaining <= 0) {
          timeRemaining = 0
          const hex = getHexAtPosition(playerPos.x, playerPos.z, hexagons)
          if (hex) {
            const idx = hexagons.indexOf(hex)
            if (idx !== -1) hexagons[idx].falling = true
          }
          setShake(true)
          setTimeout(() => setShake(false), 300)
          gameOver()
        }
        setTimeLeft(Math.max(0, Math.ceil(timeRemaining * 10) / 10))
        updatePlayer(delta)
      }

      hexagons.forEach((hex, i) => {
        if (hex.falling) {
          hex.fallY -= FALL_SPEED
          hexMeshes[i].position.y = hex.fallY
          if (hex.fallY < -10) hexMeshes[i].visible = false
        }
      })

      if (targetColorIndex !== -1 && !isGameOver && stateRef.current === 'playing') {
        const targetHex = hexagons.find(h => h.colorIndex === targetColorIndex && h.active)
        if (targetHex) {
          targetRing.position.x = targetHex.x
          targetRing.position.z = targetHex.z
          targetRing.material.opacity = 0.5 + Math.sin(now * 0.005) * 0.3
          targetRing.material.color.setHex(COLORS[targetColorIndex])
          targetRing.scale.setScalar(1 + Math.sin(now * 0.003) * 0.1)
        }
      } else {
        targetRing.material.opacity = Math.max(0, targetRing.material.opacity - 0.05)
      }

      updateCamera()
      updateArrow()

      renderer.render(scene, camera)
    }

    gameRef.current = { startGame, camera, renderer }

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    }
    window.addEventListener('resize', handleResize, { passive: true })

    animate()

    return () => {
      if (animFrameId) cancelAnimationFrame(animFrameId)

      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('mousemove', handleMouseMove)
      mount.removeEventListener('touchstart', handleTouchStart)
      mount.removeEventListener('touchmove', handleTouchMove)
      mount.removeEventListener('touchend', handleTouchEnd)
      mount.removeEventListener('touchcancel', handleTouchEnd)
      window.removeEventListener('resize', handleResize)

      geometriesToDispose.forEach(g => g.dispose())
      materialsToDispose.forEach(m => m.dispose())
      renderer.dispose()

      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement)
    }
  }, [])

  useEffect(() => {
    const cleanup = initGame()
    return cleanup
  }, [initGame])

  const handleStart = () => {
    if (isTouchDevice) {
      const elem = document.documentElement
      if (elem.requestFullscreen) {
        elem.requestFullscreen().catch(() => { })
      }
      if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock('landscape').catch(() => { })
      }
    }
    if (gameRef.current) gameRef.current.startGame()
  }

  const colorHex = targetColor ? '#' + targetColor.toString(16).padStart(6, '0') : '#ffffff'

  return (
    <>
      <Head>
        <title>Hexagon Color Rush</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, max-scale=1, user-scalable=no, viewport-fit=cover" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </Head>

      <div className="relative w-full h-screen overflow-hidden bg-black select-none touch-none pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
        <div ref={mountRef} className="absolute inset-0 cursor-crosshair" />

        <Link href="/">
          <button className={`absolute z-50 bg-black/70 backdrop-blur-sm border border-white/10 rounded-xl text-white/80 font-medium hover:bg-white/10 hover:text-white transition-all flex items-center gap-2 ${compactLandscape ? 'top-2 left-2 px-3 py-1.5 text-xs' : 'top-4 left-4 px-4 py-2 text-sm'}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Hub
          </button>
        </Link>

        {gameState === 'playing' && (
          <>
            {compactLandscape ? (
              <div className={`absolute top-2 left-1/2 -translate-x-1/2 flex items-center gap-2 pointer-events-none ${shake ? 'shake' : ''}`}>
                <div className="bg-black/70 backdrop-blur-sm rounded-lg pl-2 pr-3 py-1.5 border border-white/10 flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-md border-2 border-white/30 shadow-lg shrink-0"
                    style={{ backgroundColor: colorHex, boxShadow: `0 0 12px ${colorHex}80` }}
                  />
                  <span className="text-white/60 text-[10px] uppercase tracking-wider leading-tight">Pise<br />na cor</span>
                </div>
                <div className={`bg-black/70 backdrop-blur-sm rounded-lg px-3 py-1.5 border ${timeLeft <= 1.5 ? 'border-red-500/50' : 'border-white/10'}`}>
                  <div className={`text-lg font-bold font-mono ${timeLeft <= 1.5 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
                    {timeLeft.toFixed(1)}s
                  </div>
                </div>
              </div>
            ) : (
              <div className={`absolute top-4 left-1/2 -translate-x-1/2 right-auto p-0 flex justify-center items-start pointer-events-none ${shake ? 'shake' : ''}`}>
                <div className="flex flex-col items-center">
                  <div className="bg-black/70 backdrop-blur-sm rounded-xl px-6 py-3 border border-white/10 mb-2">
                    <div className="text-white/60 text-xs uppercase tracking-wider text-center">Pise na cor</div>
                    <div
                      className="w-12 h-12 md:w-16 md:h-16 rounded-lg mt-2 mx-auto border-2 border-white/30 shadow-lg transition-all duration-300"
                      style={{ backgroundColor: colorHex, boxShadow: `0 0 30px ${colorHex}80` }}
                    />
                  </div>
                  <div className={`bg-black/70 backdrop-blur-sm rounded-xl px-5 py-2 border ${timeLeft <= 1.5 ? 'border-red-500/50' : 'border-white/10'}`}>
                    <div className={`text-2xl md:text-3xl font-bold font-mono ${timeLeft <= 1.5 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
                      {timeLeft.toFixed(1)}s
                    </div>
                  </div>
                </div>
              </div>
            )}

            {compactLandscape ? (
              <div className="absolute top-2 right-2 flex flex-row gap-1.5 pointer-events-none">
                <div className="bg-black/70 backdrop-blur-sm rounded-xl border border-white/10 text-center px-2.5 py-1">
                  <div className="text-white/60 uppercase tracking-wider text-[9px]">Pontuação</div>
                  <div className="text-white font-bold text-sm">{score}</div>
                </div>
                <div className="bg-black/70 backdrop-blur-sm rounded-xl border border-white/10 text-center px-2.5 py-1">
                  <div className="text-white/60 uppercase tracking-wider text-[9px]">Rodada</div>
                  <div className="text-white font-bold text-sm">#{round}</div>
                </div>
              </div>
            ) : (
              <div className="absolute top-4 right-4 flex flex-col gap-2 pointer-events-none">
                <div className="bg-black/70 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/10">
                  <div className="text-white/60 text-xs uppercase tracking-wider">Pontuação</div>
                  <div className="text-white text-xl font-bold">{score}</div>
                </div>
                <div className="bg-black/70 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/10">
                  <div className="text-white/60 text-xs uppercase tracking-wider">Rodada</div>
                  <div className="text-white text-xl font-bold">#{round}</div>
                </div>
              </div>
            )}

            {!compactLandscape && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm rounded-lg px-4 py-2 text-white/40 text-xs pointer-events-none hidden md:block">
                WASD para andar · Segure clique e arraste para rotacionar câmera
              </div>
            )}
          </>
        )}

        {gameState === 'menu' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-40 overflow-y-auto">
            <div className={`text-center px-4 ${compactLandscape ? 'py-4' : ''}`}>
              <h1 className={`font-black text-white mb-2 tracking-tight ${compactLandscape ? 'text-3xl' : 'text-5xl md:text-6xl'}`}>
                HEXAGON
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400">
                  COLOR RUSH
                </span>
              </h1>
              <p className={`text-white/50 max-w-md mx-auto ${compactLandscape ? 'text-sm mb-3' : 'text-base md:text-lg mb-6'}`}>
                Hexágonos coloridos no chão. 5 segundos para pisar na cor certa. Não pisou? Caiu!
              </p>
              <div className={`bg-white/5 rounded-xl max-w-sm mx-auto ${compactLandscape ? 'p-2 mb-3' : 'p-4 mb-6'}`}>
                <div className="text-white/30 text-xs uppercase tracking-wider mb-2">Controles</div>
                <div className="grid grid-cols-2 gap-2 text-sm text-white/50">
                  <div className="flex items-center gap-2"><span className="bg-white/10 px-2 py-0.5 rounded text-xs">WASD</span> Andar</div>
                  <div className="flex items-center gap-2"><span className="bg-white/10 px-2 py-0.5 rounded text-xs">Joystick</span> Andar</div>
                  <div className="flex items-center gap-2"><span className="bg-white/10 px-2 py-0.5 rounded text-xs">Mouse</span> Câmera</div>
                  <div className="flex items-center gap-2"><span className="bg-white/10 px-2 py-0.5 rounded text-xs">Arraste</span> Câmera</div>
                </div>
              </div>
              <button
                onClick={handleStart}
                className={`bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:from-purple-500 hover:to-pink-500 transition-all transform hover:scale-105 shadow-lg shadow-purple-500/30 ${compactLandscape ? 'px-8 py-3 text-lg' : 'px-10 py-4 text-xl'}`}
              >
                JOGAR
              </button>
              {highScore > 0 && <p className="text-white/30 mt-4">Recorde: {highScore} pts</p>}
            </div>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-40 overflow-y-auto">
            <div className={`text-center px-4 ${compactLandscape ? 'py-4' : ''}`}>
              <h2 className={`font-black text-red-400 mb-2 ${compactLandscape ? 'text-3xl' : 'text-4xl md:text-5xl'}`}>GAME OVER</h2>
              <p className={`text-white/50 mb-2 ${compactLandscape ? 'text-base' : 'text-lg'}`}>Você caiu!</p>
              <div className={`flex justify-center gap-2 ${compactLandscape ? 'mb-4' : 'mb-8'}`}>
                <div className={`bg-white/5 rounded-xl ${compactLandscape ? 'px-5 py-2' : 'px-6 py-4'}`}>
                  <div className="text-white/40 text-sm uppercase tracking-wider">Pontuação</div>
                  <div className={`text-white font-bold ${compactLandscape ? 'text-2xl' : 'text-3xl md:text-4xl'}`}>{score}</div>
                </div>
                <div className={`bg-white/5 rounded-xl ${compactLandscape ? 'px-5 py-2' : 'px-6 py-4'}`}>
                  <div className="text-white/40 text-sm uppercase tracking-wider">Rodadas</div>
                  <div className={`text-white font-bold ${compactLandscape ? 'text-2xl' : 'text-3xl md:text-4xl'}`}>{round}</div>
                </div>
              </div>
              <button
                onClick={handleStart}
                className={`bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:from-purple-500 hover:to-pink-500 transition-all transform hover:scale-105 shadow-lg shadow-purple-500/30 ${compactLandscape ? 'px-8 py-3 text-lg' : 'px-10 py-4 text-xl'}`}
              >
                JOGAR NOVAMENTE
              </button>
              {highScore > 0 && <p className="text-white/30 mt-4">Recorde: {highScore} pts</p>}
            </div>
          </div>
        )}

        {isTouchDevice && gameState === 'playing' && (
          <div
            ref={joystickBaseRef}
            className="fixed z-50 pointer-events-none"
            style={{ left: 'calc(env(safe-area-inset-left) + 20px)', bottom: 'calc(env(safe-area-inset-bottom) + 20px)' }}
          >
            <div className="w-[110px] h-[110px] rounded-full bg-white/10 border-2 border-white/20 backdrop-blur-sm flex items-center justify-center">
              <div
                className="w-12 h-12 rounded-full bg-white/40 border border-white/50 shadow-lg"
                style={{ transform: `translate(${joystickKnob.x}px, ${joystickKnob.y}px)` }}
              />
            </div>
          </div>
        )}

        {isPortraitTouch && (
          <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center px-6 text-center">
            <div className="text-6xl mb-4 animate-bounce">📱</div>
            <h2 className="text-white text-xl font-bold mb-2">Gire seu dispositivo</h2>
            <p className="text-white/50 text-sm max-w-xs mb-6">
              Este jogo foi feito para a tela na horizontal. Vire o celular de lado para uma experiência melhor.
            </p>
            <button
              onClick={() => {
                const elem = document.documentElement
                if (elem.requestFullscreen) elem.requestFullscreen().catch(() => { })
                if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(() => { })
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
import { useEffect, useRef, useState, useCallback } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import * as THREE from 'three'

const COLORS = [
  0xFF3B30, 0x007AFF, 0x34C759, 0xFF9500,
  0xAF52DE, 0xFFCC00, 0x00C7BE, 0xFF2D55,
  0x5856D6, 0xA2845E, 0x64D2FF, 0x30D158,
]

const HEX_RADIUS = 1.2
const HEX_HEIGHT = 0.5
const GRID_RADIUS = 6
const FALL_SPEED = 0.15
const ROUND_TIME = 5
const PLAYER_SPEED = 0.12
const CAMERA_HEIGHT = 5
const CAMERA_DISTANCE = 8

function getHexPosition(q, r) {
  const x = HEX_RADIUS * 1.75 * q
  const z = HEX_RADIUS * 1.5 * r + (q % 2 !== 0 ? HEX_RADIUS * 0.75 : 0)
  return { x, z }
}

function generateHexGrid() {
  const hexagons = []
  for (let q = -GRID_RADIUS; q <= GRID_RADIUS; q++) {
    for (let r = -GRID_RADIUS; r <= GRID_RADIUS; r++) {
      const dist = (Math.abs(q) + Math.abs(r) + Math.abs(-q - r)) / 2
      if (dist <= GRID_RADIUS) {
        const pos = getHexPosition(q, r)
        const colorIndex = Math.floor(Math.random() * COLORS.length)
        hexagons.push({
          q, r, x: pos.x, z: pos.z,
          colorIndex, color: COLORS[colorIndex],
          active: true, falling: false, fallY: 0,
        })
      }
    }
  }
  return hexagons
}

function getHexAtPosition(x, z, hexagons) {
  let closest = null
  let minDist = Infinity
  for (const hex of hexagons) {
    if (!hex.active) continue
    const dx = x - hex.x
    const dz = z - hex.z
    const dist = Math.sqrt(dx * dx + dz * dz)
    if (dist < minDist) {
      minDist = dist
      closest = hex
    }
  }
  return closest
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

  // Joystick state
  const joystickRef = useRef({ active: false, originX: 0, originY: 0, currentX: 0, currentY: 0, dx: 0, dy: 0 })
  const [joystickVisible, setJoystickVisible] = useState(false)
  const [joystickPos, setJoystickPos] = useState({ x: 0, y: 0 })
  const [joystickKnob, setJoystickKnob] = useState({ x: 0, y: 0 })

  useEffect(() => { stateRef.current = gameState }, [gameState])

  const initGame = useCallback(() => {
    const mount = mountRef.current
    if (!mount) return () => {}

    while (mount.firstChild) mount.removeChild(mount.firstChild)

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0a0a0a)
    scene.fog = new THREE.Fog(0x0a0a0a, 25, 60)

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    mount.appendChild(renderer.domElement)

    // Lights
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

    // Hexagons
    const hexGeometry = new THREE.CylinderGeometry(HEX_RADIUS, HEX_RADIUS, HEX_HEIGHT, 6)
    hexGeometry.rotateY(Math.PI / 6)
    const hexagons = generateHexGrid()
    const hexMeshes = []
    const hexMaterials = []

    hexagons.forEach((hex) => {
      const material = new THREE.MeshStandardMaterial({ color: hex.color, metalness: 0.15, roughness: 0.7 })
      hexMaterials.push(material)
      const mesh = new THREE.Mesh(hexGeometry, material)
      mesh.position.set(hex.x, 0, hex.z)
      mesh.receiveShadow = true
      mesh.castShadow = true
      mesh.userData = { hexIndex: hexMeshes.length }
      scene.add(mesh)
      hexMeshes.push(mesh)
    })

    // ========== ROBÔZINHO ==========
    const robotGroup = new THREE.Group()
    const robotMat = new THREE.MeshStandardMaterial({ color: 0x4a90d9, metalness: 0.4, roughness: 0.3 })
    const robotDarkMat = new THREE.MeshStandardMaterial({ color: 0x2c3e50, metalness: 0.5, roughness: 0.3 })
    const robotAccentMat = new THREE.MeshStandardMaterial({ color: 0xe74c3c, metalness: 0.3, roughness: 0.4 })
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x00ffcc })

    // Torso
    const torsoGeo = new THREE.BoxGeometry(0.5, 0.6, 0.35)
    const torso = new THREE.Mesh(torsoGeo, robotMat)
    torso.position.y = 0.9
    torso.castShadow = true
    robotGroup.add(torso)

    // Peito / painel
    const chestGeo = new THREE.BoxGeometry(0.3, 0.2, 0.05)
    const chest = new THREE.Mesh(chestGeo, robotDarkMat)
    chest.position.set(0, 1.0, 0.18)
    robotGroup.add(chest)

    // Luz do peito
    const chestLightGeo = new THREE.SphereGeometry(0.06, 8, 8)
    const chestLight = new THREE.Mesh(chestLightGeo, eyeMat)
    chestLight.position.set(0, 1.0, 0.21)
    robotGroup.add(chestLight)

    // Cabeça
    const headGeo = new THREE.BoxGeometry(0.4, 0.35, 0.4)
    const head = new THREE.Mesh(headGeo, robotMat)
    head.position.y = 1.45
    head.castShadow = true
    robotGroup.add(head)

    // Olhos
    const eyeGeo = new THREE.SphereGeometry(0.07, 8, 8)
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat)
    leftEye.position.set(-0.1, 1.45, 0.22)
    robotGroup.add(leftEye)
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat)
    rightEye.position.set(0.1, 1.45, 0.22)
    robotGroup.add(rightEye)

    // Antena
    const antennaGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.3, 6)
    const antenna = new THREE.Mesh(antennaGeo, robotDarkMat)
    antenna.position.set(0, 1.8, 0)
    robotGroup.add(antenna)
    const antennaBallGeo = new THREE.SphereGeometry(0.05, 8, 8)
    const antennaBall = new THREE.Mesh(antennaBallGeo, eyeMat)
    antennaBall.position.set(0, 1.95, 0)
    robotGroup.add(antennaBall)

    // Braços (com pivô para animação)
    const armGeo = new THREE.BoxGeometry(0.12, 0.5, 0.12)
    
    const leftArmGroup = new THREE.Group()
    leftArmGroup.position.set(-0.35, 1.05, 0)
    const leftArm = new THREE.Mesh(armGeo, robotMat)
    leftArm.position.y = -0.2
    leftArm.castShadow = true
    leftArmGroup.add(leftArm)
    robotGroup.add(leftArmGroup)

    const rightArmGroup = new THREE.Group()
    rightArmGroup.position.set(0.35, 1.05, 0)
    const rightArm = new THREE.Mesh(armGeo, robotMat)
    rightArm.position.y = -0.2
    rightArm.castShadow = true
    rightArmGroup.add(rightArm)
    robotGroup.add(rightArmGroup)

    // Pernas (com pivô para animação)
    const legGeo = new THREE.BoxGeometry(0.15, 0.5, 0.15)
    
    const leftLegGroup = new THREE.Group()
    leftLegGroup.position.set(-0.15, 0.5, 0)
    const leftLeg = new THREE.Mesh(legGeo, robotDarkMat)
    leftLeg.position.y = -0.2
    leftLeg.castShadow = true
    leftLegGroup.add(leftLeg)
    robotGroup.add(leftLegGroup)

    const rightLegGroup = new THREE.Group()
    rightLegGroup.position.set(0.15, 0.5, 0)
    const rightLeg = new THREE.Mesh(legGeo, robotDarkMat)
    rightLeg.position.y = -0.2
    rightLeg.castShadow = true
    rightLegGroup.add(rightLeg)
    robotGroup.add(rightLegGroup)

    // Pés
    const footGeo = new THREE.BoxGeometry(0.18, 0.08, 0.25)
    const leftFoot = new THREE.Mesh(footGeo, robotAccentMat)
    leftFoot.position.set(0, -0.5, 0.05)
    leftLegGroup.add(leftFoot)
    const rightFoot = new THREE.Mesh(footGeo, robotAccentMat)
    rightFoot.position.set(0, -0.5, 0.05)
    rightLegGroup.add(rightFoot)

    // Glow do robô
    const robotGlow = new THREE.PointLight(0x00ffcc, 0.6, 5)
    robotGlow.position.set(0, 1.2, 0)
    robotGroup.add(robotGlow)

    robotGroup.position.set(0, 0, 0)
    scene.add(robotGroup)

    // Target ring
    const ringGeo = new THREE.RingGeometry(HEX_RADIUS * 0.5, HEX_RADIUS * 0.7, 32)
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, side: THREE.DoubleSide })
    const targetRing = new THREE.Mesh(ringGeo, ringMat)
    targetRing.rotation.x = -Math.PI / 2
    targetRing.position.y = 0.1
    scene.add(targetRing)

    // Arrow pointing to target
    const arrowGeo = new THREE.ConeGeometry(0.12, 0.4, 8)
    const arrowMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 })
    const arrow = new THREE.Mesh(arrowGeo, arrowMat)
    arrow.rotation.x = Math.PI
    arrow.position.y = 2.3
    robotGroup.add(arrow)

    const raycaster = new THREE.Raycaster()
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
    let walkTime = 0
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

    // Joystick touch handlers
    const handleJoystickStart = (e) => {
      const touch = e.touches[0]
      const js = joystickRef.current
      js.active = true
      js.originX = touch.clientX
      js.originY = touch.clientY
      js.currentX = touch.clientX
      js.currentY = touch.clientY
      js.dx = 0
      js.dy = 0
      setJoystickVisible(true)
      setJoystickPos({ x: touch.clientX, y: touch.clientY })
      setJoystickKnob({ x: 0, y: 0 })
    }

    const handleJoystickMove = (e) => {
      const js = joystickRef.current
      if (!js.active) return
      const touch = e.touches[0]
      const maxDist = 50
      let dx = touch.clientX - js.originX
      let dy = touch.clientY - js.originY
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist > maxDist) {
        dx = (dx / dist) * maxDist
        dy = (dy / dist) * maxDist
      }
      js.currentX = js.originX + dx
      js.currentY = js.originY + dy
      js.dx = dx / maxDist
      js.dy = dy / maxDist
      setJoystickKnob({ x: dx, y: dy })
    }

    const handleJoystickEnd = () => {
      const js = joystickRef.current
      js.active = false
      js.dx = 0
      js.dy = 0
      setJoystickVisible(false)
      setJoystickKnob({ x: 0, y: 0 })
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('touchstart', handleJoystickStart, { passive: false })
    window.addEventListener('touchmove', handleJoystickMove, { passive: false })
    window.addEventListener('touchend', handleJoystickEnd)

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
      const fallPlayer = () => {
        if (robotGroup.position.y > -20) {
          fallVelocity += 0.02
          robotGroup.position.y -= fallVelocity
          leftArmGroup.rotation.z = Math.sin(performance.now() * 0.01) * 2
          rightArmGroup.rotation.z = Math.cos(performance.now() * 0.01) * 2
          leftLegGroup.rotation.x = Math.sin(performance.now() * 0.015) * 1
          rightLegGroup.rotation.x = Math.cos(performance.now() * 0.015) * 1
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
      walkTime = 0
      isWalking = false

      robotGroup.position.set(0, 0, 0)
      robotGroup.rotation.set(0, 0, 0)
      leftArmGroup.rotation.set(0, 0, 0)
      rightArmGroup.rotation.set(0, 0, 0)
      leftLegGroup.rotation.set(0, 0, 0)
      rightLegGroup.rotation.set(0, 0, 0)

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

      // Keyboard input
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
        moveZ -= Math.sin(cameraAngle) * PLAYER_SPEED
      }

      // Joystick input
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

      if (isWalking) {
        playerAngle = Math.atan2(moveX, moveZ)
        robotGroup.rotation.y = playerAngle
        walkTime += delta * 8

        const walkCycle = Math.sin(walkTime)
        const walkCycle2 = Math.sin(walkTime + Math.PI)

        leftArmGroup.rotation.x = walkCycle2 * 0.6
        rightArmGroup.rotation.x = walkCycle * 0.6
        leftArmGroup.rotation.z = 0.1
        rightArmGroup.rotation.z = -0.1

        leftLegGroup.rotation.x = walkCycle * 0.5
        rightLegGroup.rotation.x = walkCycle2 * 0.5

        robotGroup.position.y = Math.abs(Math.sin(walkTime * 2)) * 0.05
        
        antenna.rotation.z = Math.sin(walkTime * 3) * 0.15
        antennaBall.position.x = Math.sin(walkTime * 3) * 0.05
      } else {
        walkTime = 0
        leftArmGroup.rotation.x = THREE.MathUtils.lerp(leftArmGroup.rotation.x, 0, 0.1)
        rightArmGroup.rotation.x = THREE.MathUtils.lerp(rightArmGroup.rotation.x, 0, 0.1)
        leftArmGroup.rotation.z = THREE.MathUtils.lerp(leftArmGroup.rotation.z, 0.1, 0.1)
        rightArmGroup.rotation.z = THREE.MathUtils.lerp(rightArmGroup.rotation.z, -0.1, 0.1)
        leftLegGroup.rotation.x = THREE.MathUtils.lerp(leftLegGroup.rotation.x, 0, 0.1)
        rightLegGroup.rotation.x = THREE.MathUtils.lerp(rightLegGroup.rotation.x, 0, 0.1)
        robotGroup.position.y = THREE.MathUtils.lerp(robotGroup.position.y, 0, 0.1)
        antenna.rotation.z = THREE.MathUtils.lerp(antenna.rotation.z, 0, 0.1)
        antennaBall.position.x = THREE.MathUtils.lerp(antennaBall.position.x, 0, 0.1)
      }

      const blink = Math.sin(performance.now() * 0.003) > 0.98
      leftEye.scale.y = blink ? 0.1 : 1
      rightEye.scale.y = blink ? 0.1 : 1

      playerPos.x += moveX
      playerPos.z += moveZ

      const maxDist = GRID_RADIUS * HEX_RADIUS * 2
      const distFromCenter = Math.sqrt(playerPos.x * playerPos.x + playerPos.z * playerPos.z)
      if (distFromCenter > maxDist) {
        const angle = Math.atan2(playerPos.z, playerPos.x)
        playerPos.x = Math.cos(angle) * maxDist
        playerPos.z = Math.sin(angle) * maxDist
      }

      robotGroup.position.x = playerPos.x
      robotGroup.position.z = playerPos.z

      checkColorMatch()
    }

    function updateCamera() {
      const camX = playerPos.x + Math.sin(cameraAngle) * CAMERA_DISTANCE
      const camY = CAMERA_HEIGHT * Math.sin(cameraPitch) + 2
      const camZ = playerPos.z + Math.cos(cameraAngle) * CAMERA_DISTANCE

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
    }
    window.addEventListener('resize', handleResize)

    animate()

    return () => {
      cancelAnimationFrame(animFrameId)
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('touchstart', handleJoystickStart)
      window.removeEventListener('touchmove', handleJoystickMove)
      window.removeEventListener('touchend', handleJoystickEnd)
      window.removeEventListener('resize', handleResize)
      renderer.dispose()
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement)
    }
  }, [])

  useEffect(() => {
    const cleanup = initGame()
    return cleanup
  }, [initGame])

  const handleStart = () => { if (gameRef.current) gameRef.current.startGame() }

  const colorHex = targetColor ? '#' + targetColor.toString(16).padStart(6, '0') : '#ffffff'

  return (
    <>
      <Head>
        <title>Hexagon Color Rush</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no" />
      </Head>

      <div className="relative w-full h-screen overflow-hidden bg-black select-none touch-none">
        <div ref={mountRef} className="absolute inset-0 cursor-crosshair" />

        {/* Botão Voltar pro Hub */}
        <Link href="/">
          <button className="absolute top-4 left-4 z-50 bg-black/70 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-2 text-white/80 text-sm font-medium hover:bg-white/10 hover:text-white transition-all flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Hub
          </button>
        </Link>

        {gameState === 'playing' && (
          <>
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

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm rounded-lg px-4 py-2 text-white/40 text-xs pointer-events-none hidden md:block">
              WASD para andar · Segure clique e arraste para rotacionar câmera
            </div>
          </>
        )}

        {gameState === 'menu' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-40">
            <div className="text-center px-4">
              <h1 className="text-5xl md:text-6xl font-black text-white mb-2 tracking-tight">
                HEXAGON
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400">
                  COLOR RUSH
                </span>
              </h1>
              <p className="text-white/50 text-base md:text-lg mb-6 max-w-md mx-auto">
                Hexágonos coloridos no chão. 5 segundos para pisar na cor certa. Não pisou? Caiu!
              </p>
              <div className="bg-white/5 rounded-xl p-4 mb-6 max-w-sm mx-auto">
                <div className="text-white/30 text-xs uppercase tracking-wider mb-2">Controles</div>
                <div className="grid grid-cols-2 gap-2 text-sm text-white/50">
                  <div className="flex items-center gap-2"><span className="bg-white/10 px-2 py-0.5 rounded text-xs">WASD</span> Andar</div>
                  <div className="flex items-center gap-2"><span className="bg-white/10 px-2 py-0.5 rounded text-xs">Touch</span> Joystick</div>
                </div>
              </div>
              <button
                onClick={handleStart}
                className="px-10 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xl font-bold rounded-xl hover:from-purple-500 hover:to-pink-500 transition-all transform hover:scale-105 shadow-lg shadow-purple-500/30"
              >
                JOGAR
              </button>
              {highScore > 0 && <p className="text-white/30 mt-4">Recorde: {highScore} pts</p>}
            </div>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-40">
            <div className="text-center px-4">
              <h2 className="text-4xl md:text-5xl font-black text-red-400 mb-2">GAME OVER</h2>
              <p className="text-white/50 text-lg mb-2">Você caiu!</p>
              <div className="flex justify-center gap-2 mb-8">
                <div className="bg-white/5 rounded-xl px-6 py-4">
                  <div className="text-white/40 text-sm uppercase tracking-wider">Pontuação</div>
                  <div className="text-white text-3xl md:text-4xl font-bold">{score}</div>
                </div>
                <div className="bg-white/5 rounded-xl px-6 py-4">
                  <div className="text-white/40 text-sm uppercase tracking-wider">Rodadas</div>
                  <div className="text-white text-3xl md:text-4xl font-bold">{round}</div>
                </div>
              </div>
              <button
                onClick={handleStart}
                className="px-10 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xl font-bold rounded-xl hover:from-purple-500 hover:to-pink-500 transition-all transform hover:scale-105 shadow-lg shadow-purple-500/30"
              >
                JOGAR NOVAMENTE
              </button>
              {highScore > 0 && <p className="text-white/30 mt-4">Recorde: {highScore} pts</p>}
            </div>
          </div>
        )}

        {/* Joystick Visual */}
        {joystickVisible && (
          <div
            className="fixed z-50 pointer-events-none md:hidden"
            style={{
              left: joystickPos.x - 50,
              top: joystickPos.y - 50,
            }}
          >
            <div className="w-[100px] h-[100px] rounded-full bg-white/10 border-2 border-white/20 backdrop-blur-sm flex items-center justify-center">
              <div
                className="w-10 h-10 rounded-full bg-white/40 border border-white/50 shadow-lg"
                style={{
                  transform: `translate(${joystickKnob.x}px, ${joystickKnob.y}px)`,
                }}
              />
            </div>
          </div>
        )}
      </div>
    </>
  )
}
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
const FALL_SPEED = 0.25
const ROUND_TIME = 5
const PLAYER_SPEED = 0.14
const CAMERA_HEIGHT = 6
const CAMERA_DISTANCE = 9
const GRAVITY = 0.015

const HEX_COLLISION_RADIUS = HEX_RADIUS * 0.95

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
    if (!hex.active || hex.falling) continue
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

function isPositionOnActiveHex(x, z, hexagons) {
  const hex = getHexAtPosition(x, z, hexagons)
  if (!hex) return false
  const dx = x - hex.x
  const dz = z - hex.z
  const dist = Math.sqrt(dx * dx + dz * dz)
  return dist <= HEX_COLLISION_RADIUS
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
    scene.background = new THREE.Color(0x050508)
    scene.fog = new THREE.FogExp2(0x050508, 0.025)

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000)

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    mount.appendChild(renderer.domElement)

    // Luzes ambiente e direcionais estilizadas
    scene.add(new THREE.AmbientLight(0x111122, 0.6))
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8)
    dirLight.position.set(15, 30, 15)
    dirLight.castShadow = true
    dirLight.shadow.mapSize.set(1024, 1024)
    dirLight.shadow.camera.near = 0.5
    dirLight.shadow.camera.far = 60
    const d = 15
    dirLight.shadow.camera.left = -d
    dirLight.shadow.camera.right = d
    dirLight.shadow.camera.top = d
    dirLight.shadow.camera.bottom = -d
    dirLight.shadow.bias = -0.0005
    scene.add(dirLight)

    const semiLight = new THREE.HemisphereLight(0xaa88ff, 0x110022, 0.4)
    scene.add(semiLight)

    // Grid de fundo inferior (Efeito Neon Synthwave/Cyberpunk no abismo)
    const gridHelper = new THREE.GridHelper(100, 40, 0x331166, 0x110522)
    gridHelper.position.y = -12
    scene.add(gridHelper)

    // Geometria dos Hexágonos com chanfro implícito (bordas marcadas pelo material roughness)
    const hexGeometry = new THREE.CylinderGeometry(HEX_RADIUS, HEX_RADIUS * 0.96, HEX_HEIGHT, 6)
    hexGeometry.rotateY(Math.PI / 6)
    const hexagons = generateHexGrid()
    const hexMeshes = []
    const hexMaterials = []

    hexagons.forEach((hex) => {
      const material = new THREE.MeshStandardMaterial({ 
        color: hex.color, 
        emissive: hex.color,
        emissiveIntensity: 0.15,
        metalness: 0.2, 
        roughness: 0.4 
      })
      hexMaterials.push(material)
      const mesh = new THREE.Mesh(hexGeometry, material)
      mesh.position.set(hex.x, 0, hex.z)
      mesh.receiveShadow = true
      mesh.castShadow = true
      mesh.userData = { hexIndex: hexMeshes.length }
      scene.add(mesh)
      hexMeshes.push(mesh)
    })

    // ========== ROBÔZINHO PERSONALIZADO ==========
    const robotGroup = new THREE.Group()
    const robotMat = new THREE.MeshStandardMaterial({ color: 0xddddf0, metalness: 0.5, roughness: 0.2 })
    const robotDarkMat = new THREE.MeshStandardMaterial({ color: 0x1e1e2f, metalness: 0.7, roughness: 0.3 })
    const robotAccentMat = new THREE.MeshStandardMaterial({ color: 0xff3b30, metalness: 0.2, roughness: 0.4 })
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x00ffcc })

    // Torso
    const torsoGeo = new THREE.BoxGeometry(0.5, 0.6, 0.35)
    const torso = new THREE.Mesh(torsoGeo, robotMat)
    torso.position.y = 0.9
    torso.castShadow = true
    robotGroup.add(torso)

    // Painel do peito
    const chestGeo = new THREE.BoxGeometry(0.3, 0.2, 0.05)
    const chest = new THREE.Mesh(chestGeo, robotDarkMat)
    chest.position.set(0, 1.0, 0.18)
    robotGroup.add(chest)

    // Luz Central do Painel
    const chestLightGeo = new THREE.SphereGeometry(0.05, 8, 8)
    const chestLight = new THREE.Mesh(chestLightGeo, eyeMat)
    chestLight.position.set(0, 1.0, 0.21)
    robotGroup.add(chestLight)

    // Cabeça
    const headGeo = new THREE.BoxGeometry(0.4, 0.35, 0.4)
    const head = new THREE.Mesh(headGeo, robotMat)
    head.position.y = 1.45
    head.castShadow = true
    robotGroup.add(head)

    // Olhos Visor Neon
    const eyeGeo = new THREE.SphereGeometry(0.06, 8, 8)
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat)
    leftEye.position.set(-0.1, 1.45, 0.21)
    robotGroup.add(leftEye)
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat)
    rightEye.position.set(0.1, 1.45, 0.21)
    robotGroup.add(rightEye)

    // Antena
    const antennaGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.25, 6)
    const antenna = new THREE.Mesh(antennaGeo, robotDarkMat)
    antenna.position.set(0, 1.75, 0)
    robotGroup.add(antenna)
    const antennaBallGeo = new THREE.SphereGeometry(0.04, 8, 8)
    const antennaBall = new THREE.Mesh(antennaBallGeo, eyeMat)
    antennaBall.position.set(0, 1.9, 0)
    robotGroup.add(antennaBall)

    // Braços
    const armGeo = new THREE.BoxGeometry(0.12, 0.45, 0.12)
    const leftArmGroup = new THREE.Group()
    leftArmGroup.position.set(-0.35, 1.05, 0)
    const leftArm = new THREE.Mesh(armGeo, robotMat)
    leftArm.position.y = -0.18
    leftArm.castShadow = true
    leftArmGroup.add(leftArm)
    robotGroup.add(leftArmGroup)

    const rightArmGroup = new THREE.Group()
    rightArmGroup.position.set(0.35, 1.05, 0)
    const rightArm = new THREE.Mesh(armGeo, robotMat)
    rightArm.position.y = -0.18
    rightArm.castShadow = true
    rightArmGroup.add(rightArm)
    robotGroup.add(rightArmGroup)

    // Pernas e Pés
    const legGeo = new THREE.BoxGeometry(0.14, 0.45, 0.14)
    const leftLegGroup = new THREE.Group()
    leftLegGroup.position.set(-0.14, 0.5, 0)
    const leftLeg = new THREE.Mesh(legGeo, robotDarkMat)
    leftLeg.position.y = -0.18
    leftLeg.castShadow = true
    leftLegGroup.add(leftLeg)
    robotGroup.add(leftLegGroup)

    const rightLegGroup = new THREE.Group()
    rightLegGroup.position.set(0.14, 0.5, 0)
    const rightLeg = new THREE.Mesh(legGeo, robotDarkMat)
    rightLeg.position.y = -0.18
    rightLeg.castShadow = true
    rightLegGroup.add(rightLeg)
    robotGroup.add(rightLegGroup)

    const footGeo = new THREE.BoxGeometry(0.16, 0.08, 0.22)
    const leftFoot = new THREE.Mesh(footGeo, robotAccentMat)
    leftFoot.position.set(0, -0.42, 0.04)
    leftLegGroup.add(leftFoot)
    const rightFoot = new THREE.Mesh(footGeo, robotAccentMat)
    rightFoot.position.set(0, -0.42, 0.04)
    rightLegGroup.add(rightFoot)

    // Luz de Base anexada ao Player
    const robotGlow = new THREE.PointLight(0x00ffcc, 0.8, 4)
    robotGlow.position.set(0, 0.5, 0)
    robotGroup.add(robotGlow)

    robotGroup.position.set(0, 0, 0)
    scene.add(robotGroup)

    // Anel indicador sob a cor alvo no chão
    const ringGeo = new THREE.RingGeometry(HEX_RADIUS * 0.6, HEX_RADIUS * 0.8, 6)
    ringGeo.rotateX(-Math.PI / 2)
    ringGeo.rotateY(Math.PI / 6)
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, side: THREE.DoubleSide })
    const targetRing = new THREE.Mesh(ringGeo, ringMat)
    targetRing.position.y = 0.26
    scene.add(targetRing)

    // Seta flutuante direcional
    const arrowGeo = new THREE.ConeGeometry(0.12, 0.35, 4)
    const arrowMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 })
    const arrow = new THREE.Mesh(arrowGeo, arrowMat)
    arrow.rotation.x = Math.PI
    arrow.position.y = 2.4
    robotGroup.add(arrow)

    let currentRound = 0
    let currentScore = 0
    let targetColorIndex = -1
    let timeRemaining = ROUND_TIME
    let lastTime = performance.now()
    let isGameOver = false
    let isFallingInVoid = false
    let yVelocity = 0
    let animFrameId = null

    let playerPos = { x: 0, z: 0 }
    let playerAngle = 0
    let cameraAngle = Math.PI / 4
    let cameraPitch = 0.45
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
        cameraAngle -= dx * 0.006
        cameraPitch = Math.max(0.15, Math.min(0.85, cameraPitch - dy * 0.005))
        lastMouseX = e.clientX
        lastMouseY = e.clientY
      }
    }

    // Handlers do Touch Joystick adaptados perfeitamente para Câmera rotativa
    const handleJoystickStart = (e) => {
      if (stateRef.current !== 'playing') return
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
      const maxDist = 45
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
    mount.addEventListener('touchstart', handleJoystickStart, { passive: false })
    window.addEventListener('touchmove', handleJoystickMove, { passive: false })
    window.addEventListener('touchend', handleJoystickEnd)

    function checkColorMatch() {
      if (isFallingInVoid || isGameOver) return
      const hex = getHexAtPosition(playerPos.x, playerPos.z, hexagons)
      if (hex && hex.colorIndex === targetColorIndex) {
        nextRound()
      }
    }

    function nextRound() {
      currentRound++
      currentScore += Math.ceil(timeRemaining * 15)
      timeRemaining = Math.max(2.5, ROUND_TIME - currentRound * 0.15) // Dificuldade progressiva por tempo
      const activeHexes = hexagons.filter(h => h.active && !h.falling)
      if (activeHexes.length === 0) { triggerGameOver(); return }
      
      const randomHex = activeHexes[Math.floor(Math.random() * activeHexes.length)]
      targetColorIndex = randomHex.colorIndex
      setRound(currentRound)
      setScore(currentScore)
      setTargetColor(COLORS[targetColorIndex])
      setTimeLeft(timeRemaining)
    }

    function triggerGameOver() {
      if (isGameOver) return
      isGameOver = true
      setGameState('gameover')
      setHighScore(prev => Math.max(prev, currentScore))
    }

    function startGame() {
      currentRound = 1
      currentScore = 0
      timeRemaining = ROUND_TIME
      isGameOver = false
      isFallingInVoid = false
      yVelocity = 0
      playerPos = { x: 0, z: 0 }
      playerAngle = 0
      cameraAngle = Math.PI / 4
      cameraPitch = 0.45
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
        hexMaterials[i].emissive.setHex(hex.color)
        hexMaterials[i].opacity = 1
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
      if (isGameOver && !isFallingInVoid) return

      let inputX = 0
      let inputZ = 0

      if (!isFallingInVoid) {
        // Inputs Teclado
        if (keys['w'] || keys['arrowup']) {
          inputX -= Math.sin(cameraAngle)
          inputZ -= Math.cos(cameraAngle)
        }
        if (keys['s'] || keys['arrowdown']) {
          inputX += Math.sin(cameraAngle)
          inputZ += Math.cos(cameraAngle)
        }
        if (keys['a'] || keys['arrowleft']) {
          inputX -= Math.cos(cameraAngle)
          inputZ += Math.sin(cameraAngle)
        }
        if (keys['d'] || keys['arrowright']) {
          inputX += Math.cos(cameraAngle)
          inputZ -= Math.sin(cameraAngle)
        }

        // Inputs Mobile Joystick baseados no ângulo da câmera
        const js = joystickRef.current
        if (js.active) {
          const forwardX = -Math.sin(cameraAngle)
          const forwardZ = -Math.cos(cameraAngle)
          const rightX = Math.cos(cameraAngle)
          const rightZ = -Math.sin(cameraAngle)

          inputX += forwardX * (-js.dy) + rightX * js.dx
          inputZ += forwardZ * (-js.dy) + rightZ * js.dx
        }
      }

      const len = Math.sqrt(inputX * inputX + inputZ * inputZ)
      if (len > 0.01 && !isFallingInVoid) {
        inputX = (inputX / len) * PLAYER_SPEED
        inputZ = (inputZ / len) * PLAYER_SPEED
        isWalking = true
      } else {
        inputX = 0
        inputZ = 0
        isWalking = false
      }

      if (isWalking && !isFallingInVoid) {
        playerAngle = Math.atan2(inputX, inputZ)
        
        // Inclinação estilizada ao correr
        robotGroup.rotation.y = THREE.MathUtils.lerp(robotGroup.rotation.y, playerAngle, 0.15)
        robotGroup.rotation.z = THREE.MathUtils.lerp(robotGroup.rotation.z, -Math.sin(playerAngle - cameraAngle) * 0.1, 0.1)
        
        walkTime += delta * 12

        const walkCycle = Math.sin(walkTime)
        const walkCycle2 = Math.sin(walkTime + Math.PI)

        leftArmGroup.rotation.x = walkCycle2 * 0.6
        rightArmGroup.rotation.x = walkCycle * 0.6
        leftLegGroup.rotation.x = walkCycle * 0.5
        rightLegGroup.rotation.x = walkCycle2 * 0.5

        robotGroup.position.y = Math.abs(Math.sin(walkTime * 2)) * 0.06
        antenna.rotation.z = Math.sin(walkTime * 3) * 0.15
        antennaBall.position.x = Math.sin(walkTime * 3) * 0.04
      } else if (!isFallingInVoid) {
        // Retorno suave à pose IDLE
        leftArmGroup.rotation.x = THREE.MathUtils.lerp(leftArmGroup.rotation.x, 0, 0.1)
        rightArmGroup.rotation.x = THREE.MathUtils.lerp(rightArmGroup.rotation.x, 0, 0.1)
        leftLegGroup.rotation.x = THREE.MathUtils.lerp(leftLegGroup.rotation.x, 0, 0.1)
        rightLegGroup.rotation.x = THREE.MathUtils.lerp(rightLegGroup.rotation.x, 0, 0.1)
        robotGroup.position.y = THREE.MathUtils.lerp(robotGroup.position.y, 0, 0.1)
        robotGroup.rotation.z = THREE.MathUtils.lerp(robotGroup.rotation.z, 0, 0.1)
        antenna.rotation.z = THREE.MathUtils.lerp(antenna.rotation.z, 0, 0.1)
        antennaBall.position.x = THREE.MathUtils.lerp(antennaBall.position.x, 0, 0.1)
      }

      // Piscar de olhos mecânico
      const blink = Math.sin(performance.now() * 0.003) > 0.97
      leftEye.scale.y = blink ? 0.1 : 1
      rightEye.scale.y = blink ? 0.1 : 1

      // Atualiza coordenadas planares
      playerPos.x += inputX
      playerPos.z += inputZ

      // SISTEMA DE QUEDA TOTAL NO VOID FIX
      const currentlyOnHex = isPositionOnActiveHex(playerPos.x, playerPos.z, hexagons)
      
      if (!currentlyOnHex && !isFallingInVoid) {
        isFallingInVoid = true
        setShake(true)
        setTimeout(() => setShake(false), 250)
        triggerGameOver()
      }

      if (isFallingInVoid) {
        yVelocity += GRAVITY
        robotGroup.position.y -= yVelocity
        // Rotação dramática de queda livre
        robotGroup.rotation.x += 0.05
        robotGroup.rotation.z += 0.03
        leftArmGroup.rotation.z = Math.sin(performance.now() * 0.02) * 1.5
        rightArmGroup.rotation.z = Math.cos(performance.now() * 0.02) * 1.5

        if (robotGroup.position.y < -30) {
          isFallingInVoid = false // Parar loops internos de renderização fora de vista
        }
      } else {
        robotGroup.position.x = playerPos.x
        robotGroup.position.z = playerPos.z
        checkColorMatch()
      }
    }

    function updateCamera() {
      const camX = playerPos.x + Math.sin(cameraAngle) * CAMERA_DISTANCE
      const camY = CAMERA_HEIGHT * Math.sin(cameraPitch) + (isFallingInVoid ? 0 : robotGroup.position.y + 1.5)
      const camZ = playerPos.z + Math.cos(cameraAngle) * CAMERA_DISTANCE

      camera.position.set(camX, camY, camZ)
      // Mantém foco suave no ponto planar onde o jogador caiu ou está correndo
      camera.lookAt(playerPos.x, isFallingInVoid ? -2 : 1.0, playerPos.z)
    }

    function updateArrow() {
      if (targetColorIndex === -1 || isGameOver || isFallingInVoid) {
        arrow.material.opacity = 0
        return
      }
      const targetHex = hexagons.find(h => h.colorIndex === targetColorIndex && h.active && !h.falling)
      if (!targetHex) { arrow.material.opacity = 0; return }

      const dx = targetHex.x - playerPos.x
      const dz = targetHex.z - playerPos.z
      const angle = Math.atan2(dx, dz)
      arrow.rotation.y = angle - robotGroup.rotation.y
      arrow.material.opacity = 0.75 + Math.sin(performance.now() * 0.006) * 0.25
      arrow.material.color.setHex(COLORS[targetColorIndex])
    }

    function animate() {
      animFrameId = requestAnimationFrame(animate)
      const now = performance.now()
      const delta = Math.min((now - lastTime) / 1000, 0.1) // Trava delta alto para evitar skips de colisão
      lastTime = now

      if (!isGameOver && stateRef.current === 'playing') {
        timeRemaining -= delta
        if (timeRemaining <= 0) {
          timeRemaining = 0
          
          // Derruba todos os hexágonos que NÃO combinam com a cor alvo!
          hexagons.forEach((hex, i) => {
            if (hex.colorIndex !== targetColorIndex) {
              hex.falling = true
            }
          })

          // Verifica se o jogador sobreviveu após a queda das placas erradas
          setTimeout(() => {
            const hex = getHexAtPosition(playerPos.x, playerPos.z, hexagons)
            if (!hex || hex.colorIndex !== targetColorIndex || hex.falling) {
              if (!isFallingInVoid) {
                isFallingInVoid = true
                triggerGameOver()
              }
            } else {
              // Se sobreviveu em cima do bloco correto, avança para a próxima rodada
              nextRound()
            }
          }, 150)
        }
        setTimeLeft(Math.max(0, timeRemaining))
      }

      // Animando a queda física das placas erradas
      hexagons.forEach((hex, i) => {
        if (hex.falling) {
          hex.fallY -= FALL_SPEED
          hexMeshes[i].position.y = hex.fallY
          if (hex.fallY < -15) {
            hexMeshes[i].visible = false
            hex.active = false
          }
        }
      })

      // Gerencia o anel indicador brilhante de chão
      if (targetColorIndex !== -1 && !isGameOver) {
        const targetHex = hexagons.find(h => h.colorIndex === targetColorIndex && h.active && !h.falling)
        if (targetHex) {
          targetRing.position.x = targetHex.x
          targetRing.position.z = targetHex.z
          targetRing.material.opacity = 0.6 + Math.sin(now * 0.006) * 0.3
          targetRing.material.color.setHex(COLORS[targetColorIndex])
          targetRing.scale.setScalar(1 + Math.sin(now * 0.004) * 0.08)
        } else {
          targetRing.material.opacity = 0
        }
      } else {
        targetRing.material.opacity = 0
      }

      updatePlayer(delta)
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
      mount.removeEventListener('touchstart', handleJoystickStart)
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
        <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no, viewport-fit=cover" />
      </Head>

      <div className="relative w-full h-screen overflow-hidden bg-[#050508] select-none touch-none">
        {/* Camada do WebGL Mount */}
        <div ref={mountRef} className="absolute inset-0 cursor-grab active:cursor-grabbing" />

        {/* Botão Hub */}
        <Link href="/">
          <button className="absolute top-4 left-4 z-50 bg-black/50 backdrop-blur-md border border-white/10 rounded-xl px-4 py-2 text-white/80 text-sm font-medium hover:bg-white/10 transition-all flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Hub
          </button>
        </Link>

        {/* Interface Principal In-Game */}
        {gameState === 'playing' && (
          <>
            <div className={`absolute top-4 left-1/2 -translate-x-1/2 p-0 flex flex-col items-center pointer-events-none ${shake ? 'animate-bounce' : ''}`}>
              <div className="bg-black/60 backdrop-blur-md rounded-2xl px-6 py-3 border border-white/10 mb-2 flex flex-col items-center shadow-2xl">
                <div className="text-white/50 text-[10px] uppercase tracking-widest font-bold">PISE NA COR</div>
                <div
                  className="w-14 h-14 md:w-16 md:h-16 rounded-xl mt-2 border border-white/20 transition-all duration-300"
                  style={{ backgroundColor: colorHex, boxShadow: `0 0 25px ${colorHex}` }}
                />
              </div>
              <div className={`bg-black/60 backdrop-blur-md rounded-xl px-4 py-1.5 border ${timeLeft <= 1.5 ? 'border-red-500/50' : 'border-white/10'}`}>
                <div className={`text-xl md:text-2xl font-black font-mono ${timeLeft <= 1.5 ? 'text-red-400 animate-pulse' : 'text-cyan-400'}`}>
                  {timeLeft.toFixed(1)}s
                </div>
              </div>
            </div>

            {/* Placar de Pontos Superior Direito */}
            <div className="absolute top-4 right-4 flex flex-col gap-2 pointer-events-none">
              <div className="bg-black/60 backdrop-blur-md rounded-xl px-4 py-2 border border-white/10 text-right">
                <div className="text-white/40 text-[10px] uppercase tracking-wider font-bold">Pontos</div>
                <div className="text-white text-lg font-black font-mono">{score}</div>
              </div>
              <div className="bg-black/60 backdrop-blur-md rounded-xl px-4 py-1 border border-white/10 text-right">
                <div className="text-white/40 text-[10px] uppercase tracking-wider font-bold">Rodada</div>
                <div className="text-amber-400 text-sm font-bold font-mono">#{round}</div>
              </div>
            </div>

            {/* Dica Desktop inferior */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm rounded-full px-4 py-1.5 text-white/40 text-[11px] pointer-events-none hidden md:block border border-white/5">
              Arrastar tela rotaciona câmera • Mover com <span className="text-white/70 font-mono font-bold">WASD</span>
            </div>
          </>
        )}

        {/* Menu Inicial de Jogo */}
        {gameState === 'menu' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-md z-40">
            <div className="text-center px-6 max-w-sm w-full">
              <h1 className="text-4xl md:text-5xl font-black text-white mb-1 tracking-tight">
                HEXAGON
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-500">
                  COLOR RUSH
                </span>
              </h1>
              <p className="text-white/40 text-xs md:text-sm mb-6">
                O chão vai sumir! Corra e fique parado apenas em cima da cor correta antes do cronômetro zerar.
              </p>
              
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6 text-left">
                <div className="text-cyan-400 text-[10px] font-bold uppercase tracking-widest mb-2 text-center">Como Jogar</div>
                <div className="flex flex-col gap-1.5 text-xs text-white/60">
                  <div className="flex justify-between"><span>💻 Teclado:</span> <span className="text-white font-mono font-bold">W A S D</span></div>
                  <div className="flex justify-between"><span>📱 Mobile:</span> <span className="text-white font-bold">Toque & Arraste na tela</span></div>
                  <div className="flex justify-between"><span>🎥 Câmera:</span> <span className="text-white font-bold">Arraste para girar</span></div>
                </div>
              </div>

              <button
                onClick={handleStart}
                className="w-full py-4 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 text-white text-lg font-black rounded-xl shadow-lg shadow-purple-500/20 active:scale-95 transition-transform"
              >
                COMEÇAR PROVA
              </button>
              {highScore > 0 && <p className="text-white/30 text-xs font-mono mt-3">Recorde Atual: {highScore} pts</p>}
            </div>
          </div>
        )}

        {/* Tela de Fim de Jogo (Game Over) */}
        {gameState === 'gameover' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/85 backdrop-blur-md z-40">
            <div className="text-center px-6 max-w-sm w-full animate-fadeIn">
              <h2 className="text-4xl font-black text-red-500 mb-1 tracking-tighter">ELIMINADO</h2>
              <p className="text-white/40 text-xs mb-6">Você caiu direto no abismo digital.</p>
              
              <div className="flex justify-center gap-3 mb-6">
                <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 flex-1">
                  <div className="text-white/30 text-[10px] uppercase font-bold">Pontuação</div>
                  <div className="text-white text-2xl font-black font-mono">{score}</div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 flex-1">
                  <div className="text-white/30 text-[10px] uppercase font-bold">Sobreviveu</div>
                  <div className="text-amber-400 text-2xl font-black font-mono">{round} <span className="text-xs">Rds</span></div>
                </div>
              </div>

              <button
                onClick={handleStart}
                className="w-full py-4 bg-gradient-to-r from-amber-500 to-red-500 text-white text-base font-black rounded-xl active:scale-95 transition-transform shadow-lg shadow-red-500/10"
              >
                TENTAR NOVAMENTE
              </button>
              {highScore > 0 && <p className="text-white/30 text-xs font-mono mt-3">Melhor Recorde: {highScore} pts</p>}
            </div>
          </div>
        )}

        {/* Analógico Virtual Dinâmico e Responsivo (Oculto em telas grandes) */}
        {joystickVisible && (
          <div
            className="fixed z-50 pointer-events-none md:hidden"
            style={{
              left: joystickPos.x - 45,
              top: joystickPos.y - 45,
            }}
          >
            <div className="w-24 h-24 rounded-full bg-black/40 border-2 border-white/20 backdrop-blur-sm flex items-center justify-center shadow-2xl">
              <div
                className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-400 to-purple-500 shadow-xl border border-white/30"
                style={{
                  transform: `translate(${joystickKnob.x}px, ${joystickKnob.y}px)`,
                  transition: 'transform 0.05s linear'
                }}
              />
            </div>
          </div>
        )}
      </div>
    </>
  )
}
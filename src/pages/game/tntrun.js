import { useEffect, useRef, useState, useCallback } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import * as THREE from 'three'

// ─── CONFIG ────────────────────────────────────────────────────────────────
const COLS = 22
const ROWS = 22
const FLOORS = 3
const BLOCK_W = 1.05
const BLOCK_H = 0.38
const BLOCK_GAP = 0.04
const FLOOR_GAP = 5.5          // distância vertical entre andares
const STEP_DELAY = 380          // ms antes do bloco começar a cair
const FALL_SPEED = 0.09         // velocidade dos blocos caindo
const PLAYER_SPEED = 0.13
const GRAVITY = 0.032           // gravidade por frame (60fps base)
const CAMERA_HEIGHT = 9
const CAMERA_DISTANCE = 13
//FLOOR_PALETLES
const FLOOR_PALETTES = [
  { top: 0xe74c3c, side: 0xc0392b },
  { top: 0xf39c12, side: 0xe67e22 },
  { top: 0x27ae60, side: 0x1e8449 },
]

// Superfície do topo de um bloco no andar f
function floorSurface(f) {
  return f * -FLOOR_GAP + BLOCK_H / 2
}

// Retorna o bloco sólido diretamente sob (x, z) no andar floorIdx
function getBlockUnder(x, z, floorIdx, blocks) {
  const th = (BLOCK_W + BLOCK_GAP) * 0.5
  for (const b of blocks) {
    if (b.state !== 'solid') continue
    if (b.floorIdx !== floorIdx) continue
    if (Math.abs(b.baseX - x) < th && Math.abs(b.baseZ - z) < th) return b
  }
  return null
}

function generateBlocks() {
  const list = []
  const step = BLOCK_W + BLOCK_GAP
  for (let f = 0; f < FLOORS; f++) {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        list.push({
          floorIdx: f,
          baseX: (c - (COLS - 1) / 2) * step,
          baseZ: (r - (ROWS - 1) / 2) * step,
          baseY: f * -FLOOR_GAP,
          state: 'solid',
          fallY: 0,
          _timer: null,
        })
      }
    }
  }
  return list
}

export default function TNTRun() {
  const mountRef      = useRef(null)
  const gameRef       = useRef(null)
  const stateRef      = useRef('menu')

  const [gameState,    setGameState]    = useState('menu')
  const [score,        setScore]        = useState(0)
  const [gameTime,     setGameTime]     = useState(0)
  const [currentFloor, setCurrentFloor] = useState(0)
  const [highScore,    setHighScore]    = useState(0)

  const joystickRef     = useRef({ active: false, originX: 0, originY: 0, dx: 0, dy: 0 })
  const joystickBaseRef = useRef(null)
  const [joystickKnob, setJoystickKnob] = useState({ x: 0, y: 0 })

  const [isTouchDevice,   setIsTouchDevice]   = useState(false)
  const [compactLandscape, setCompactLandscape] = useState(false)
  const [isPortraitTouch,  setIsPortraitTouch]  = useState(false)

  useEffect(() => { stateRef.current = gameState }, [gameState])

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

  const initGame = useCallback(() => {
    const mount = mountRef.current
    if (!mount) return () => {}

    const geometriesToDispose = []
    const materialsToDispose  = []
    while (mount.firstChild) mount.removeChild(mount.firstChild)

    // ─── Scene ────────────────────────────────────────────────────────────
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x080810)
    scene.fog = new THREE.Fog(0x080810, 35, 95)

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200)

    // OTIMIZAÇÃO: Desativado antialias e ativado otimizações de energia
    const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(1) // OTIMIZAÇÃO: Travado em 1 para poupar GPUs Mobile/4K
    renderer.shadowMap.enabled = false // OTIMIZAÇÃO: Desativado sombras dinâmicas de cascata (maior ganho de fps)
    mount.appendChild(renderer.domElement)

    // ─── Luzes ────────────────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xffffff, 0.6))
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.6)
    dirLight.position.set(15, 30, 15)
    scene.add(dirLight)
    scene.add(new THREE.HemisphereLight(0x6688cc, 0x222244, 0.25))

    // ─── Blocos ───────────────────────────────────────────────────────────
    const blocks     = generateBlocks()
    const blockMeshes = []

    // OTIMIZAÇÃO: Uma única geometria compartilhada por todos os 1450+ blocos
    const sharedBlockGeo = new THREE.BoxGeometry(BLOCK_W, BLOCK_H, BLOCK_W)
    geometriesToDispose.push(sharedBlockGeo)

    blocks.forEach((b) => {
      const pal   = FLOOR_PALETTES[b.floorIdx % FLOOR_PALETTES.length]
      const even  = Math.round(b.baseX * 10 + b.baseZ * 10) % 2 === 0
      const col   = new THREE.Color(even ? pal.top : pal.side)
      col.offsetHSL(0, 0, (Math.random() - 0.5) * 0.04)

      // OTIMIZAÇÃO: Mudado para MeshPhongMaterial (Muito mais leve que o Standard PBR)
      const mat = new THREE.MeshPhongMaterial({ color: col, shininess: 10 })
      materialsToDispose.push(mat)

      const mesh = new THREE.Mesh(sharedBlockGeo, mat)
      mesh.position.set(b.baseX, b.baseY, b.baseZ)
      scene.add(mesh)
      blockMeshes.push(mesh)
    })

    // ─── Robozinho ────────────────────────────────────────────────────────
    // OTIMIZAÇÃO: Robô usando MeshPhongMaterial para performance consistente
    const robotMat       = new THREE.MeshPhongMaterial({ color: 0x4a90d9, shininess: 30 })
    const robotDarkMat   = new THREE.MeshPhongMaterial({ color: 0x2c3e50, shininess: 30 })
    const robotAccentMat = new THREE.MeshPhongMaterial({ color: 0xe74c3c, shininess: 20 })
    const eyeMat         = new THREE.MeshBasicMaterial({ color: 0x00ffcc })
    materialsToDispose.push(robotMat, robotDarkMat, robotAccentMat, eyeMat)

    const robotGroup = new THREE.Group()
    const robotBobGroup = new THREE.Group()
    robotGroup.add(robotBobGroup)

    const mkBox = (w, h, d, mat, x, y, z, parent) => {
      const geo = new THREE.BoxGeometry(w, h, d)
      const m = new THREE.Mesh(geo, mat)
      geometriesToDispose.push(geo)
      m.position.set(x, y, z)
      ;(parent || robotBobGroup).add(m)
      return m
    }

    mkBox(0.5, 0.6, 0.35, robotMat,     0, 0.9,  0)
    mkBox(0.3, 0.2, 0.05, robotDarkMat, 0, 1.0,  0.18)
    
    // OTIMIZAÇÃO: Segmentos de esferas reduzidos de 8 para 4 para economizar polígonos
    const lightGeo = new THREE.SphereGeometry(0.06, 4, 4)
    geometriesToDispose.push(lightGeo)
    const chestLight = new THREE.Mesh(lightGeo, eyeMat)
    chestLight.position.set(0, 1.0, 0.21); robotBobGroup.add(chestLight)

    mkBox(0.4, 0.35, 0.4, robotMat, 0, 1.45, 0)

    const eyeGeo  = new THREE.SphereGeometry(0.07, 4, 4)
    geometriesToDispose.push(eyeGeo)
    const leftEye  = new THREE.Mesh(eyeGeo, eyeMat); leftEye.position.set(-0.1, 1.45, 0.22);  robotBobGroup.add(leftEye)
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat); rightEye.position.set(0.1,  1.45, 0.22); robotBobGroup.add(rightEye)

    const antennaGeo  = new THREE.CylinderGeometry(0.02, 0.02, 0.3, 4)
    geometriesToDispose.push(antennaGeo)
    const antenna = new THREE.Mesh(antennaGeo, robotDarkMat)
    antenna.position.set(0, 1.8, 0); robotBobGroup.add(antenna)
    
    const antBallGeo = new THREE.SphereGeometry(0.05, 4, 4)
    geometriesToDispose.push(antBallGeo)
    const antennaBall = new THREE.Mesh(antBallGeo, eyeMat)
    antennaBall.position.set(0, 1.95, 0); robotBobGroup.add(antennaBall)

    // Braços
    const armGeo = new THREE.BoxGeometry(0.12, 0.5, 0.12)
    geometriesToDispose.push(armGeo)
    const leftArmGroup  = new THREE.Group(); leftArmGroup.position.set(-0.35, 1.05, 0)
    const rightArmGroup = new THREE.Group(); rightArmGroup.position.set(0.35,  1.05, 0)
    const lArm = new THREE.Mesh(armGeo, robotMat); lArm.position.y = -0.2; leftArmGroup.add(lArm)
    const rArm = new THREE.Mesh(armGeo, robotMat); rArm.position.y = -0.2; rightArmGroup.add(rArm)
    robotBobGroup.add(leftArmGroup, rightArmGroup)

    // Pernas
    const legGeo = new THREE.BoxGeometry(0.15, 0.5, 0.15)
    geometriesToDispose.push(legGeo)
    const leftLegGroup  = new THREE.Group(); leftLegGroup.position.set(-0.15, 0.5, 0)
    const rightLegGroup = new THREE.Group(); rightLegGroup.position.set(0.15,  0.5, 0)
    const lLeg = new THREE.Mesh(legGeo, robotDarkMat); lLeg.position.y = -0.2; leftLegGroup.add(lLeg)
    const rLeg = new THREE.Mesh(legGeo, robotDarkMat); rLeg.position.y = -0.2; rightLegGroup.add(rLeg)
    robotBobGroup.add(leftLegGroup, rightLegGroup)

    // Pés
    const footGeo = new THREE.BoxGeometry(0.18, 0.08, 0.25)
    geometriesToDispose.push(footGeo)
    const lFoot = new THREE.Mesh(footGeo, robotAccentMat); lFoot.position.set(0, -0.5, 0.05); leftLegGroup.add(lFoot)
    const rFoot = new THREE.Mesh(footGeo, robotAccentMat); rFoot.position.set(0, -0.5, 0.05); rightLegGroup.add(rFoot)

    scene.add(robotGroup)

    // ─── Estado de jogo ───────────────────────────────────────────────────
    let playerX  = 0
    let playerY  = floorSurface(0)
    let playerZ  = 0
    let velY     = 0
    let onGround = true
    let curFloor = 0

    let playerAngle = 0
    let cameraAngle = Math.PI / 5
    let cameraPitch = 0.38
    let isMouseDown = false, lastMouseX = 0, lastMouseY = 0
    let walkTime = 0, isWalking = false
    let elapsed  = 0
    let isGameOver   = false
    let animFrameId  = null
    let lastTime     = performance.now()

    const keys = {}
    const HALF = ((COLS - 1) / 2) * (BLOCK_W + BLOCK_GAP) + BLOCK_W * 0.5

    // ─── Input ────────────────────────────────────────────────────────────
    const handleKeyDown = (e) => { keys[e.key.toLowerCase()] = true }
    const handleKeyUp   = (e) => { keys[e.key.toLowerCase()] = false }
    const handleMouseDown = (e) => { isMouseDown = true; lastMouseX = e.clientX; lastMouseY = e.clientY }
    const handleMouseUp   = ()  => { isMouseDown = false }
    const handleMouseMove = (e) => {
      if (isMouseDown && stateRef.current === 'playing') {
        cameraAngle -= (e.clientX - lastMouseX) * 0.005
        cameraPitch  = Math.max(0.12, Math.min(0.75, cameraPitch - (e.clientY - lastMouseY) * 0.005))
        lastMouseX = e.clientX; lastMouseY = e.clientY
      }
    }

    let joystickTouchId = null, cameraTouchId = null
    let lastTouchX = 0, lastTouchY = 0
    const JOY_MAX_DIST  = 34
    const JOY_GRAB_RADIUS = 72

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
            js.active = true; js.originX = cx; js.originY = cy
            const dist = Math.sqrt(dx * dx + dy * dy)
            let kx = dx, ky = dy
            if (dist > JOY_MAX_DIST) { kx = dx / dist * JOY_MAX_DIST; ky = dy / dist * JOY_MAX_DIST }
            js.dx = kx / JOY_MAX_DIST; js.dy = ky / JOY_MAX_DIST
            setJoystickKnob({ x: kx, y: ky })
            continue
          }
        }
        if (cameraTouchId === null && stateRef.current === 'playing') {
          cameraTouchId = touch.identifier
          lastTouchX = touch.clientX; lastTouchY = touch.clientY
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
          if (dist > JOY_MAX_DIST) { dx = dx / dist * JOY_MAX_DIST; dy = dy / dist * JOY_MAX_DIST }
          js.dx = dx / JOY_MAX_DIST; js.dy = dy / JOY_MAX_DIST
          setJoystickKnob({ x: dx, y: dy })
        } else if (touch.identifier === cameraTouchId && stateRef.current === 'playing') {
          cameraAngle -= (touch.clientX - lastTouchX) * 0.006
          cameraPitch  = Math.max(0.12, Math.min(0.75, cameraPitch - (touch.clientY - lastTouchY) * 0.006))
          lastTouchX = touch.clientX; lastTouchY = touch.clientY
        }
      }
    }

    const handleTouchEnd = (e) => {
      for (const touch of e.changedTouches) {
        if (touch.identifier === joystickTouchId) {
          joystickTouchId = null
          const js = joystickRef.current
          js.active = false; js.dx = 0; js.dy = 0
          setJoystickKnob({ x: 0, y: 0 })
        } else if (touch.identifier === cameraTouchId) {
          cameraTouchId = null
        }
      }
    }

    window.addEventListener('keydown',    handleKeyDown,   { passive: true })
    window.addEventListener('keyup',      handleKeyUp,     { passive: true })
    window.addEventListener('mousedown',  handleMouseDown, { passive: true })
    window.addEventListener('mouseup',    handleMouseUp,   { passive: true })
    window.addEventListener('mousemove',  handleMouseMove, { passive: true })
    mount.addEventListener('touchstart',  handleTouchStart, { passive: false })
    mount.addEventListener('touchmove',   handleTouchMove,  { passive: false })
    mount.addEventListener('touchend',    handleTouchEnd,   { passive: true })
    mount.addEventListener('touchcancel', handleTouchEnd,   { passive: true })

    function triggerBlock(b) {
      if (b._timer) return
      b._timer = setTimeout(() => {
        if (b.state === 'solid') b.state = 'falling'
      }, STEP_DELAY)
    }

    function gameOver() {
      if (isGameOver) return
      isGameOver = true
      let fv = 0, t = 0
      const fallAnim = () => {
        if (robotGroup.position.y > -60) {
          fv += 0.03; t++
          robotGroup.position.y -= fv
          leftArmGroup.rotation.z  = Math.sin(t * 0.09) * 2.2
          rightArmGroup.rotation.z = Math.cos(t * 0.09) * 2.2
          leftLegGroup.rotation.x  = Math.sin(t * 0.09) * 1.5
          rightLegGroup.rotation.x = Math.cos(t * 0.09) * 1.5
          robotGroup.rotation.x += 0.025
          robotGroup.rotation.z += 0.012
          const tx = playerX + Math.sin(cameraAngle) * CAMERA_DISTANCE * 0.8
          const tz = playerZ + Math.cos(cameraAngle) * CAMERA_DISTANCE * 0.8
          camera.position.set(tx, robotGroup.position.y + 7, tz)
          camera.lookAt(playerX, robotGroup.position.y, playerZ)
          renderer.render(scene, camera)
          requestAnimationFrame(fallAnim)
        } else {
          setGameState('gameover')
          setHighScore(prev => Math.max(prev, Math.floor(elapsed * 12)))
        }
      }
      fallAnim()
    }

    function startGame() {
      blocks.forEach((b, i) => {
        if (b._timer) { clearTimeout(b._timer); b._timer = null }
        b.state  = 'solid'
        b.fallY  = 0
        blockMeshes[i].position.y = b.baseY
        blockMeshes[i].visible    = true
      })

      playerX  = 0
      playerZ  = 0
      playerY  = floorSurface(0)
      velY     = 0
      onGround = true
      curFloor = 0

      playerAngle = 0
      cameraAngle = Math.PI / 5
      cameraPitch = 0.38
      walkTime    = 0
      isWalking   = false
      elapsed     = 0
      isGameOver  = false
      lastTime    = performance.now()

      robotGroup.position.set(0, floorSurface(0), 0)
      robotGroup.rotation.set(0, 0, 0)
      robotBobGroup.position.y = 0
      leftArmGroup.rotation.set(0, 0, 0)
      rightArmGroup.rotation.set(0, 0, 0)
      leftLegGroup.rotation.set(0, 0, 0)
      rightLegGroup.rotation.set(0, 0, 0)
      antenna.rotation.set(0, 0, 0)
      antennaBall.position.x = 0

      setScore(0); setGameTime(0); setCurrentFloor(0)
      setGameState('playing')
    }

    function updatePhysics(dt) {
      const grav = GRAVITY * (dt / (1 / 60))
      velY -= grav
      playerY += velY
      onGround = false

      const sf = floorSurface(curFloor)
      const blockCur = getBlockUnder(playerX, playerZ, curFloor, blocks)
      if (blockCur && velY <= 0 && playerY <= sf) {
        playerY  = sf
        velY     = 0
        onGround = true
        triggerBlock(blockCur)
        return
      }

      for (let f = curFloor + 1; f < FLOORS; f++) {
        const sf2    = floorSurface(f)
        const blockF = getBlockUnder(playerX, playerZ, f, blocks)
        if (blockF && velY <= 0 && playerY <= sf2) {
          playerY  = sf2
          velY     = 0
          onGround = true
          curFloor = f
          setCurrentFloor(f)
          triggerBlock(blockF)
          return
        }
      }

      const deathLine = floorSurface(FLOORS - 1) - FLOOR_GAP
      if (playerY < deathLine) {
        gameOver()
      }
    }

    function updatePlayer(dt) {
      if (isGameOver || stateRef.current !== 'playing') return

      let moveX = 0, moveZ = 0
      if (keys['w'] || keys['arrowup'])    { moveX -= Math.sin(cameraAngle); moveZ -= Math.cos(cameraAngle) }
      if (keys['s'] || keys['arrowdown'])  { moveX += Math.sin(cameraAngle); moveZ += Math.cos(cameraAngle) }
      if (keys['a'] || keys['arrowleft'])  { moveX -= Math.cos(cameraAngle); moveZ += Math.sin(cameraAngle) }
      if (keys['d'] || keys['arrowright']) { moveX += Math.cos(cameraAngle); moveZ -= Math.sin(cameraAngle) }

      const js = joystickRef.current
      if (js.active) {
        moveX += Math.cos(cameraAngle) * js.dx - Math.sin(cameraAngle) * js.dy
        moveZ += -Math.sin(cameraAngle) * js.dx - Math.cos(cameraAngle) * js.dy
      }

      const len = Math.sqrt(moveX * moveX + moveZ * moveZ)
      if (len > 1) { moveX /= len; moveZ /= len }
      isWalking = len > 0.05

      playerX = Math.max(-HALF, Math.min(HALF, playerX + moveX * PLAYER_SPEED))
      playerZ = Math.max(-HALF, Math.min(HALF, playerZ + moveZ * PLAYER_SPEED))

      updatePhysics(dt)

      robotGroup.position.x = playerX
      robotGroup.position.z = playerZ
      robotGroup.position.y = playerY

      if (isWalking) {
        playerAngle = Math.atan2(moveX, moveZ)
        robotGroup.rotation.y = playerAngle
        walkTime += dt * 8

        const wc  = Math.sin(walkTime)
        const wc2 = Math.sin(walkTime + Math.PI)
        leftArmGroup.rotation.x  = wc2 * 0.6
        rightArmGroup.rotation.x = wc  * 0.6
        leftArmGroup.rotation.z  = 0.1
        rightArmGroup.rotation.z = -0.1
        leftLegGroup.rotation.x  = wc  * 0.55
        rightLegGroup.rotation.x = wc2 * 0.55

        robotBobGroup.position.y = Math.abs(Math.sin(walkTime * 2)) * 0.04
        antenna.rotation.z     = Math.sin(walkTime * 3) * 0.15
        antennaBall.position.x = Math.sin(walkTime * 3) * 0.05
      } else {
        walkTime = 0
        leftArmGroup.rotation.x  = THREE.MathUtils.lerp(leftArmGroup.rotation.x,  0,   0.12)
        rightArmGroup.rotation.x = THREE.MathUtils.lerp(rightArmGroup.rotation.x, 0,   0.12)
        leftArmGroup.rotation.z  = THREE.MathUtils.lerp(leftArmGroup.rotation.z,  0.1, 0.12)
        rightArmGroup.rotation.z = THREE.MathUtils.lerp(rightArmGroup.rotation.z, -0.1,0.12)
        leftLegGroup.rotation.x  = THREE.MathUtils.lerp(leftLegGroup.rotation.x,  0,   0.12)
        rightLegGroup.rotation.x = THREE.MathUtils.lerp(rightLegGroup.rotation.x, 0,   0.12)
        robotBobGroup.position.y = THREE.MathUtils.lerp(robotBobGroup.position.y, 0,   0.12)
        antenna.rotation.z       = THREE.MathUtils.lerp(antenna.rotation.z,       0,   0.12)
        antennaBall.position.x   = THREE.MathUtils.lerp(antennaBall.position.x,   0,   0.12)
      }

      const blink = Math.sin(performance.now() * 0.003) > 0.97
      leftEye.scale.y  = blink ? 0.1 : 1
      rightEye.scale.y = blink ? 0.1 : 1
    }

    function updateCamera() {
      const shortScreen = window.innerHeight < 520 && window.innerWidth > window.innerHeight
      const dist   = shortScreen ? CAMERA_DISTANCE * 1.25 : CAMERA_DISTANCE
      const height = shortScreen ? CAMERA_HEIGHT   * 1.15 : CAMERA_HEIGHT

      const camX = playerX + Math.sin(cameraAngle) * dist * Math.cos(cameraPitch)
      const camY = playerY + height * Math.sin(cameraPitch) + 1.5
      const camZ = playerZ + Math.cos(cameraAngle) * dist * Math.cos(cameraPitch)

      camera.position.set(camX, Math.max(playerY + 2, camY), camZ)
      camera.lookAt(playerX, playerY + 1.0, playerZ)
    }

    function updateBlocks() {
      blocks.forEach((b, i) => {
        if (b.state === 'falling') {
          b.fallY += FALL_SPEED
          blockMeshes[i].position.y = b.baseY - b.fallY
          if (blockMeshes[i].position.y < -70) {
            b.state = 'gone'
            blockMeshes[i].visible = false
          }
        }
      })
    }

    function animate() {
      animFrameId = requestAnimationFrame(animate)
      const now   = performance.now()
      const dt    = Math.min((now - lastTime) / 1000, 0.05)
      lastTime    = now

      if (!isGameOver && stateRef.current === 'playing') {
        elapsed += dt
        setScore(Math.floor(elapsed * 12))
        setGameTime(Math.floor(elapsed))
        updatePlayer(dt)
        updateBlocks()
        updateCamera()
      }

      renderer.render(scene, camera)
    }

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
      renderer.setPixelRatio(1) // OTIMIZAÇÃO: Mantido em 1 no resize
    }
    window.addEventListener('resize', handleResize, { passive: true })

    gameRef.current = { startGame }
    animate()

    return () => {
      if (animFrameId) cancelAnimationFrame(animFrameId)
      blocks.forEach(b => { if (b._timer) clearTimeout(b._timer) })
      window.removeEventListener('keydown',    handleKeyDown)
      window.removeEventListener('keyup',      handleKeyUp)
      window.removeEventListener('mousedown',  handleMouseDown)
      window.removeEventListener('mouseup',    handleMouseUp)
      window.removeEventListener('mousemove',  handleMouseMove)
      mount.removeEventListener('touchstart',  handleTouchStart)
      mount.removeEventListener('touchmove',   handleTouchMove)
      mount.removeEventListener('touchend',    handleTouchEnd)
      mount.removeEventListener('touchcancel', handleTouchEnd)
      window.removeEventListener('resize',     handleResize)
      geometriesToDispose.forEach(g => g.dispose())
      materialsToDispose.forEach(m  => m.dispose())
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
      if (elem.requestFullscreen) elem.requestFullscreen().catch(() => {})
      if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(() => {})
    }
    if (gameRef.current) gameRef.current.startGame()
  }

  return (
    <>
      <Head>
        <title>TNT Run</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </Head>

      <div className="relative w-full h-screen overflow-hidden bg-black select-none touch-none pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
        <div ref={mountRef} className="absolute inset-0 cursor-crosshair" />

        {/* Botão Voltar */}
        <Link href="/">
          <button className={`absolute z-50 bg-black/70 backdrop-blur-sm border border-white/10 rounded-xl text-white/80 font-medium hover:bg-white/10 hover:text-white transition-all flex items-center gap-2 ${compactLandscape ? 'top-2 left-2 px-3 py-1.5 text-xs' : 'top-4 left-4 px-4 py-2 text-sm'}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Hub
          </button>
        </Link>

        {/* HUD durante o jogo */}
        {gameState === 'playing' && (
          <>
            {compactLandscape ? (
              <div className="absolute top-2 left-1/2 -translate-x-1/2 flex items-center gap-2 pointer-events-none">
                <div className="bg-black/70 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-white/10 text-center">
                  <div className="text-white font-bold text-base">{gameTime}s</div>
                  <div className="text-white/40 text-[9px] uppercase tracking-wider">Tempo</div>
                </div>
                <div className="bg-black/70 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-white/10 text-center">
                  <div className="text-white font-bold text-base">{score}</div>
                  <div className="text-white/40 text-[9px] uppercase tracking-wider">Pontos</div>
                </div>
                <div className="bg-black/70 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-orange-500/40 text-center">
                  <div className="text-orange-400 font-bold text-base">{currentFloor + 1}/{FLOORS}</div>
                  <div className="text-white/40 text-[9px] uppercase tracking-wider">Andar</div>
                </div>
              </div>
            ) : (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-3 pointer-events-none">
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

            {!compactLandscape && (
              <div className="absolute top-1/2 -translate-y-1/2 right-4 flex flex-col gap-2 pointer-events-none">
                {Array.from({ length: FLOORS }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-2.5 h-2.5 rounded-full border transition-all duration-300 ${
                      i === currentFloor
                        ? 'bg-orange-400 border-orange-400 shadow-[0_0_8px_#f904]'
                        : i < currentFloor
                        ? 'bg-white/15 border-white/15'
                        : 'bg-white/30 border-white/30'
                    }`}
                  />
                ))}
              </div>
            )}

            {!compactLandscape && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm rounded-lg px-4 py-2 text-white/40 text-xs pointer-events-none hidden md:block">
                WASD para andar · Segure clique e arraste para rotacionar câmera
              </div>
            )}
          </>
        )}

        {/* Menu */}
        {gameState === 'menu' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-40 overflow-y-auto">
            <div className={`text-center px-4 ${compactLandscape ? 'py-4' : ''}`}>
              <h1 className={`font-black text-white mb-1 tracking-tight ${compactLandscape ? 'text-3xl' : 'text-5xl md:text-6xl'}`}>
                TNT
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-red-400 to-yellow-400">
                  RUN
                </span>
              </h1>
              <p className={`text-white/50 max-w-md mx-auto ${compactLandscape ? 'text-sm mb-3' : 'text-base md:text-lg mb-6'}`}>
                Ande sobre os blocos — eles desaparecem sob seus pés!<br />
                Sobreviva o máximo que puder sem cair no vazio.
              </p>
              <div className={`bg-white/5 rounded-xl max-w-sm mx-auto ${compactLandscape ? 'p-2 mb-3' : 'p-4 mb-6'}`}>
                <div className="text-white/30 text-xs uppercase tracking-wider mb-2">Controles</div>
                <div className="grid grid-cols-2 gap-2 text-sm text-white/50">
                  <div className="flex items-center gap-2"><span className="bg-white/10 px-2 py-0.5 rounded text-xs">WASD</span> Andar</div>
                  <div className="flex items-center gap-2"><span className="bg-white/10 px-2 py-0.5 rounded text-xs">Joystick</span> Touch</div>
                  <div className="flex items-center gap-2"><span className="bg-white/10 px-2 py-0.5 rounded text-xs">Mouse ⬤</span> Câmera</div>
                  <div className="flex items-center gap-2"><span className="bg-white/10 px-2 py-0.5 rounded text-xs">Arraste</span> Câmera</div>
                </div>
              </div>
              <div className={`flex justify-center gap-3 ${compactLandscape ? 'mb-3' : 'mb-5'}`}>
                {FLOOR_PALETTES.map((p, i) => (
                  <div key={i} className="text-center">
                    <div className="w-6 h-6 rounded mx-auto mb-1" style={{ background: `#${p.top.toString(16).padStart(6, '0')}` }} />
                    <div className="text-white/30 text-[10px]">Andar {i + 1}</div>
                  </div>
                ))}
              </div>
              <button
                onClick={handleStart}
                className={`bg-gradient-to-r from-orange-600 to-red-600 text-white font-bold rounded-xl hover:from-orange-500 hover:to-red-500 transition-all transform hover:scale-105 shadow-lg shadow-orange-500/30 ${compactLandscape ? 'px-8 py-3 text-lg' : 'px-10 py-4 text-xl'}`}
              >
                JOGAR
              </button>
              {highScore > 0 && <p className="text-white/30 mt-4">Recorde: {highScore} pts</p>}
            </div>
          </div>
        )}

        {/* Game Over */}
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
                  <div className="text-white/40 text-sm uppercase tracking-wider">Tempo</div>
                  <div className={`text-white font-bold ${compactLandscape ? 'text-2xl' : 'text-3xl md:text-4xl'}`}>{gameTime}s</div>
                </div>
                <div className={`bg-white/5 rounded-xl ${compactLandscape ? 'px-5 py-2' : 'px-6 py-4'}`}>
                  <div className="text-white/40 text-sm uppercase tracking-wider">Andar</div>
                  <div className={`text-orange-400 font-bold ${compactLandscape ? 'text-2xl' : 'text-3xl md:text-4xl'}`}>{currentFloor + 1}</div>
                </div>
              </div>
              <button
                onClick={handleStart}
                className={`bg-gradient-to-r from-orange-600 to-red-600 text-white font-bold rounded-xl hover:from-orange-500 hover:to-red-500 transition-all transform hover:scale-105 shadow-lg shadow-orange-500/30 ${compactLandscape ? 'px-8 py-3 text-lg' : 'px-10 py-4 text-xl'}`}
              >
                JOGAR NOVAMENTE
              </button>
              {highScore > 0 && <p className="text-white/30 mt-4">Recorde: {highScore} pts</p>}
            </div>
          </div>
        )}

        {/* Joystick fixo */}
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

        {/* Aviso girar aparelho */}
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
                if (elem.requestFullscreen) elem.requestFullscreen().catch(() => {})
                if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(() => {})
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
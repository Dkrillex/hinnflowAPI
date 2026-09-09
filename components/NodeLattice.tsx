'use client'

import { useEffect, useRef } from 'react'

/**
 * 首屏右侧的 3D 节点点阵：若干簇线框立方体用连线串起来，外围一圈放射状星点。
 * 隐喻是"多模型节点汇聚成一张网"，与 gmicloud.ai 首屏同一类视觉。
 *
 * 用 canvas 2D 而不是 SVG 或 3D 库：约 40 个立方体（每个 12 条棱）加 220 个星点，
 * DOM 节点会上千，canvas 一次性绘制更稳，包体也不用多背一个 3D 运行时。
 */

type Vec3 = [number, number, number]

/**
 * 三簇节点，坐标是格点单位，投影前再统一缩放。
 * 每簇都必须在三个轴上都有厚度——早期版本把簇摆在同一平面里，
 * 转到侧面时整簇会压成一条线。
 */
const CLUSTERS: { origin: Vec3; cells: Vec3[] }[] = [
  {
    // 主簇：4×3×3 的密集块，挖掉几格避免看起来像实心方阵
    origin: [-1.6, -1.1, -1.6],
    cells: [
      [0, 0, 0], [1, 0, 0], [2, 0, 0], [3, 0, 0],
      [0, 1, 0], [1, 1, 0], [2, 1, 0], [3, 1, 0],
      [0, 2, 0], [2, 2, 0],
      [0, 0, 1], [1, 0, 1], [2, 0, 1], [3, 0, 1],
      [0, 1, 1], [2, 1, 1], [3, 1, 1],
      [1, 2, 1], [2, 2, 1],
      [0, 0, 2], [1, 0, 2], [2, 0, 2],
      [1, 1, 2], [2, 1, 2], [2, 2, 2],
      [4, 1, 1], [-1, 0, 1], [1, 3, 1],
    ],
  },
  {
    // 上方卫星簇：主要沿 +z 拉开
    origin: [0.4, 1.9, 2.4],
    cells: [
      [0, 0, 0], [1, 0.4, -0.6], [2, 0.1, 0.8],
      [0, -1, 0.4], [1, -1.2, -0.5], [2, -1, 0.9],
      [1, -2.1, 0.2], [2, -2.3, -0.8],
    ],
  },
  {
    // 下方卫星簇：主要沿 -z 拉开
    origin: [0.2, -2.6, -2.6],
    cells: [
      [0, 0.4, 0], [1, 0.7, 0.6], [1, -0.3, -0.4],
      [0, -0.7, 0.9], [1, -1.3, 0.3],
      [2.2, -0.4, -0.5], [2.4, -1.1, 0.6], [1.8, -0.9, 1.4],
    ],
  },
]

const CUBE_CORNERS: Vec3[] = [
  [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
  [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1],
]
const CUBE_EDGES: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 0],
  [4, 5], [5, 6], [6, 7], [7, 4],
  [0, 4], [1, 5], [2, 6], [3, 7],
]
const CUBE_FACES: number[][] = [
  [0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4],
  [2, 3, 7, 6], [1, 2, 6, 5], [0, 3, 7, 4],
]

/** 节点两两之间在格距内才连线，形成"相邻才有边"的网格观感 */
function buildLinks(nodes: Vec3[], maxDist: number): [number, number][] {
  const links: [number, number][] = []
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dx = nodes[i][0] - nodes[j][0]
      const dy = nodes[i][1] - nodes[j][1]
      const dz = nodes[i][2] - nodes[j][2]
      if (Math.hypot(dx, dy, dz) <= maxDist) links.push([i, j])
    }
  }
  return links
}

/** 外围星点：球面均匀采样后往外推，形成放射状点云 */
function buildParticles(count: number): Vec3[] {
  const pts: Vec3[] = []
  const golden = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2
    const r = Math.sqrt(Math.max(0, 1 - y * y))
    const theta = golden * i
    // 半径抖动，避免看起来像一层规整的壳
    const shell = 3.4 + ((i * 2654435761) % 1000) / 1000 * 2.6
    pts.push([Math.cos(theta) * r * shell, y * shell * 0.82, Math.sin(theta) * r * shell])
  }
  return pts
}

export function NodeLattice({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const nodes: Vec3[] = []
    for (const c of CLUSTERS) {
      for (const cell of c.cells) {
        nodes.push([c.origin[0] + cell[0], c.origin[1] + cell[1], c.origin[2] + cell[2]])
      }
    }
    const links = buildLinks(nodes, 1.45)
    const particles = buildParticles(220)

    let raf = 0
    let disposed = false
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // 主题色从 CSS 变量读，切主题时无需重建
    const readTheme = () => {
      const dark = document.documentElement.classList.contains('dark')
      return {
        edge: dark ? 'rgba(74,140,255,0.85)' : 'rgba(11,78,217,0.75)',
        face: dark ? 'rgba(11,15,24,0.92)' : 'rgba(255,255,255,0.92)',
        dot: dark ? 'rgba(147,190,255,0.5)' : 'rgba(11,78,217,0.32)',
      }
    }
    let theme = readTheme()
    const mo = new MutationObserver(() => {
      theme = readTheme()
    })
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

    let cssW = 0
    let cssH = 0
    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      cssW = rect.width
      cssH = rect.height
      canvas.width = Math.round(cssW * dpr)
      canvas.height = Math.round(cssH * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    const TILT = -0.42 // 绕 X 轴固定俯角，等距观感
    // 相机距离必须大于点云最大半径（星点外壳到 6），否则背后的点会越过近平面、
    // 投影出发散的巨大图形。留足余量后再配近平面裁剪兜底。
    const FOV = 14
    const NEAR = 1.5

    // 模型对齐到节点质心，免得整簇偏出画布
    const center: Vec3 = [0, 0, 0]
    for (const n of nodes) {
      center[0] += n[0] / nodes.length
      center[1] += n[1] / nodes.length
      center[2] += n[2] / nodes.length
    }

    const draw = (t: number) => {
      if (disposed) return
      // 转一圈约 100 秒：只求缓慢漂移，转快了会在某些角度晃眼
      const yaw = reduced ? 0.75 : 0.75 + t * 0.00006
      const cy = Math.cos(yaw)
      const sy = Math.sin(yaw)
      const cx = Math.cos(TILT)
      const sx = Math.sin(TILT)
      const scale = Math.min(cssW, cssH) * 0.105
      const ox = cssW / 2
      const oy = cssH / 2

      // 世界坐标 → 屏幕坐标，返回 z 用于深度排序与近大远小；
      // vis=false 表示落在近平面内侧，调用方直接跳过不画
      const project = (p: Vec3) => {
        const px = p[0] - center[0]
        const py = p[1] - center[1]
        const pz = p[2] - center[2]
        const x1 = px * cy + pz * sy
        const z1 = -px * sy + pz * cy
        const y2 = py * cx - z1 * sx
        const z2 = py * sx + z1 * cx
        const denom = FOV + z2
        const k = FOV / denom
        return { x: ox + x1 * scale * k, y: oy - y2 * scale * k, z: z2, k, vis: denom > NEAR }
      }

      ctx.clearRect(0, 0, cssW, cssH)

      // 星点在最底层
      ctx.strokeStyle = theme.dot
      ctx.lineWidth = 0.7
      ctx.beginPath()
      for (const p of particles) {
        const s = project(p)
        if (!s.vis) continue
        const r = 2.6 * s.k
        // 六角星芒，和参考站的小星点一致
        for (let a = 0; a < 3; a++) {
          const ang = (a * Math.PI) / 3
          ctx.moveTo(s.x - Math.cos(ang) * r, s.y - Math.sin(ang) * r)
          ctx.lineTo(s.x + Math.cos(ang) * r, s.y + Math.sin(ang) * r)
        }
      }
      ctx.stroke()

      const proj = nodes.map(project)

      // 连线
      ctx.strokeStyle = theme.edge
      ctx.lineWidth = 0.9
      ctx.beginPath()
      for (const [a, b] of links) {
        if (!proj[a].vis || !proj[b].vis) continue
        ctx.moveTo(proj[a].x, proj[a].y)
        ctx.lineTo(proj[b].x, proj[b].y)
      }
      ctx.stroke()

      // 立方体按深度从远到近画，近处才能正确遮住远处
      const order = nodes.map((_, i) => i).sort((a, b) => proj[b].z - proj[a].z)
      const half = 0.3
      for (const i of order) {
        if (!proj[i].vis) continue
        const n = nodes[i]
        const corners = CUBE_CORNERS.map((c) =>
          project([n[0] + c[0] * half, n[1] + c[1] * half, n[2] + c[2] * half] as Vec3)
        )
        if (corners.some((c) => !c.vis)) continue
        ctx.fillStyle = theme.face
        for (const f of CUBE_FACES) {
          ctx.beginPath()
          ctx.moveTo(corners[f[0]].x, corners[f[0]].y)
          for (let k = 1; k < f.length; k++) ctx.lineTo(corners[f[k]].x, corners[f[k]].y)
          ctx.closePath()
          ctx.fill()
        }
        ctx.strokeStyle = theme.edge
        ctx.lineWidth = 1
        ctx.beginPath()
        for (const [a, b] of CUBE_EDGES) {
          ctx.moveTo(corners[a].x, corners[a].y)
          ctx.lineTo(corners[b].x, corners[b].y)
        }
        ctx.stroke()
      }

      if (running) raf = requestAnimationFrame(draw)
    }

    // 首屏滚出视口后停掉 rAF，别让它在后台空转
    let running = false
    const start = () => {
      if (running || disposed) return
      running = true
      raf = requestAnimationFrame(draw)
    }
    const stop = () => {
      running = false
      cancelAnimationFrame(raf)
    }
    const io = new IntersectionObserver(
      ([e]) => (e.isIntersecting ? start() : stop()),
      { threshold: 0 }
    )
    io.observe(canvas)
    start()

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      io.disconnect()
      ro.disconnect()
      mo.disconnect()
    }
  }, [])

  return <canvas ref={canvasRef} aria-hidden className={className} />
}

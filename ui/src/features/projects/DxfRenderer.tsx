import React, { useMemo, useRef, useState, useCallback, useEffect } from 'react'
import DxfParser from 'dxf-parser'
import type {
  DxfFile, DxfEntity, DxfLine, DxfCircle, DxfArc, DxfLwPolyline,
  DxfPolyline, DxfText, DxfMText, DxfEllipse, DxfSpline,
} from 'dxf-parser'

// ── ACI Color Map ────────────────────────────────────────────────────────────
const ACI: Record<number, string> = {
  1: '#ff2020', 2: '#ffff00', 3: '#00ff00', 4: '#00ffff',
  5: '#0050ff', 6: '#ff00ff', 7: '#ffffff', 8: '#404040',
  9: '#808080', 10: '#ff4040', 11: '#ffaaaa', 12: '#bd3d3d',
  30: '#ff8000', 40: '#ffbf00', 50: '#ffff40',
  70: '#00ff80', 80: '#00bf40', 90: '#00803d',
  130: '#0080ff', 140: '#4040ff', 150: '#0040bf',
  200: '#8000ff', 210: '#bf00ff', 220: '#ff00bf',
}

function aciToHex(aci: number | undefined, layerAci?: number): string {
  if (aci === undefined || aci === 256) {
    // BYLAYER
    const c = layerAci !== undefined ? ACI[layerAci] : undefined
    return c ?? '#1e293b'
  }
  if (aci === 0) return '#1e293b' // BYBLOCK
  return ACI[aci] ?? '#1e293b'
}

// ── Bounding box ─────────────────────────────────────────────────────────────
interface BBox { minX: number; minY: number; maxX: number; maxY: number }

function expandBBox(b: BBox, x: number, y: number): BBox {
  return {
    minX: Math.min(b.minX, x), minY: Math.min(b.minY, y),
    maxX: Math.max(b.maxX, x), maxY: Math.max(b.maxY, y),
  }
}

function entityBBox(entity: DxfEntity): BBox | null {
  const inf = Infinity
  let b: BBox = { minX: inf, minY: inf, maxX: -inf, maxY: -inf }

  switch (entity.type) {
    case 'LINE': {
      const e = entity as DxfLine
      b = expandBBox(expandBBox(b, e.start.x, e.start.y), e.end.x, e.end.y)
      break
    }
    case 'CIRCLE': {
      const e = entity as DxfCircle
      b = expandBBox(b, e.center.x - e.radius, e.center.y - e.radius)
      b = expandBBox(b, e.center.x + e.radius, e.center.y + e.radius)
      break
    }
    case 'ARC': {
      const e = entity as DxfArc
      b = expandBBox(b, e.center.x - e.radius, e.center.y - e.radius)
      b = expandBBox(b, e.center.x + e.radius, e.center.y + e.radius)
      break
    }
    case 'ELLIPSE': {
      const e = entity as DxfEllipse
      const rx = Math.sqrt(e.majorAxisEndPoint.x ** 2 + e.majorAxisEndPoint.y ** 2)
      const ry = rx * e.axisRatio
      b = expandBBox(b, e.center.x - rx, e.center.y - ry)
      b = expandBBox(b, e.center.x + rx, e.center.y + ry)
      break
    }
    case 'LWPOLYLINE':
    case 'POLYLINE': {
      const e = entity as DxfLwPolyline
      e.vertices.forEach((v) => { b = expandBBox(b, v.x, v.y) })
      break
    }
    case 'SPLINE': {
      const e = entity as DxfSpline
      ;(e.controlPoints ?? e.fitPoints ?? []).forEach((p) => { b = expandBBox(b, p.x, p.y) })
      break
    }
    case 'TEXT': {
      const e = entity as DxfText
      b = expandBBox(b, e.startPoint.x, e.startPoint.y)
      break
    }
    case 'MTEXT': {
      const e = entity as DxfMText
      b = expandBBox(b, e.position.x, e.position.y)
      break
    }
    default: return null
  }

  if (b.minX === inf) return null
  return b
}

// ── SVG Arc path ──────────────────────────────────────────────────────────────
function arcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  const toRad = (d: number) => (d * Math.PI) / 180
  const sx = cx + r * Math.cos(toRad(startDeg))
  const sy = cy - r * Math.sin(toRad(startDeg))   // flip Y
  const ex = cx + r * Math.cos(toRad(endDeg))
  const ey = cy - r * Math.sin(toRad(endDeg))

  let sweep = endDeg - startDeg
  if (sweep < 0) sweep += 360
  const largeArc = sweep > 180 ? 1 : 0
  const sweepFlag = 0  // counter-clockwise in screen coords (Y flipped)

  return `M ${sx} ${sy} A ${r} ${r} 0 ${largeArc} ${sweepFlag} ${ex} ${ey}`
}

// ── Render one entity ─────────────────────────────────────────────────────────
function renderEntity(
  entity: DxfEntity,
  layers: Record<string, { color: number }>,
  scale: number,
  flip: (y: number) => number,
  isDark: boolean,
): React.ReactNode {
  const layerColor = entity.layer ? layers[entity.layer]?.color : undefined
  const raw = aciToHex(entity.color, layerColor)

  // In dark mode draw white-ish strokes; in light mode draw dark strokes
  // But keep colored entities as-is for layer differentiation
  const stroke = raw === '#1e293b' ? (isDark ? '#cbd5e1' : '#1e293b') : raw
  const sw = Math.max(0.5, 1 / scale)

  const key = (entity as DxfEntityBase & { handle?: string }).handle ?? Math.random().toString(36)

  switch (entity.type) {
    case 'LINE': {
      const e = entity as DxfLine
      return (
        <line key={key}
          x1={e.start.x} y1={flip(e.start.y)}
          x2={e.end.x}   y2={flip(e.end.y)}
          stroke={stroke} strokeWidth={sw} />
      )
    }

    case 'CIRCLE': {
      const e = entity as DxfCircle
      return (
        <circle key={key}
          cx={e.center.x} cy={flip(e.center.y)}
          r={e.radius}
          stroke={stroke} strokeWidth={sw} fill="none" />
      )
    }

    case 'ARC': {
      const e = entity as DxfArc
      // In SVG coords (Y flipped) angles are mirrored
      const startDeg = -e.endAngle
      const endDeg   = -e.startAngle
      return (
        <path key={key}
          d={arcPath(e.center.x, flip(e.center.y), e.radius, startDeg + 360, endDeg + 360)}
          stroke={stroke} strokeWidth={sw} fill="none" />
      )
    }

    case 'ELLIPSE': {
      const e = entity as DxfEllipse
      const rx = Math.sqrt(e.majorAxisEndPoint.x ** 2 + e.majorAxisEndPoint.y ** 2)
      const ry = rx * e.axisRatio
      const rot = (Math.atan2(e.majorAxisEndPoint.y, e.majorAxisEndPoint.x) * 180) / Math.PI
      return (
        <ellipse key={key}
          cx={e.center.x} cy={flip(e.center.y)}
          rx={rx} ry={ry}
          transform={`rotate(${rot} ${e.center.x} ${flip(e.center.y)})`}
          stroke={stroke} strokeWidth={sw} fill="none" />
      )
    }

    case 'LWPOLYLINE':
    case 'POLYLINE': {
      const e = entity as DxfLwPolyline
      if (e.vertices.length < 2) return null
      const basePts = e.vertices.map((v) => `${v.x},${flip(v.y)}`).join(' ')
      const pts = e.closed && e.vertices.length > 0
        ? basePts + ` ${e.vertices[0].x},${flip(e.vertices[0].y)}`
        : basePts
      return (
        <polyline key={key}
          points={pts}
          stroke={stroke} strokeWidth={sw} fill="none"
          strokeLinejoin="round"
        />
      )
    }

    case 'SPLINE': {
      const e = entity as DxfSpline
      const pts = (e.controlPoints ?? e.fitPoints ?? [])
      if (pts.length < 2) return null
      const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${flip(p.y)}`).join(' ')
      return (
        <path key={key}
          d={d} stroke={stroke} strokeWidth={sw} fill="none" strokeLinejoin="round" />
      )
    }

    case 'TEXT': {
      const e = entity as DxfText
      const h = (e.textHeight ?? 2.5)
      return (
        <text key={key}
          x={e.startPoint.x} y={flip(e.startPoint.y)}
          fontSize={h}
          fill={stroke}
          transform={e.rotation ? `rotate(${-e.rotation} ${e.startPoint.x} ${flip(e.startPoint.y)})` : undefined}
          style={{ userSelect: 'none' }}
        >
          {e.text}
        </text>
      )
    }

    case 'MTEXT': {
      const e = entity as DxfMText
      return (
        <text key={key}
          x={e.position.x} y={flip(e.position.y)}
          fontSize={e.height ?? 2.5}
          fill={stroke}
          style={{ userSelect: 'none' }}
        >
          {e.text.replace(/\\[A-Za-z0-9;.,{}\\]+;?/g, '')}
        </text>
      )
    }

    default: return null
  }
}

// ── Main component ────────────────────────────────────────────────────────────
interface Props {
  content: string
  isDark?: boolean
}

interface Transform { x: number; y: number; scale: number }

interface DxfEntityBase { handle?: string }

export const DxfRenderer: React.FC<Props> = ({ content, isDark = false }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, scale: 1 })
  const [isDragging, setIsDragging] = useState(false)
  const [visibleLayers, setVisibleLayers] = useState<Set<string> | null>(null)
  const lastPos = useRef<{ x: number; y: number } | null>(null)

  // Parse DXF
  const { dxf, error } = useMemo(() => {
    try {
      const parser = new DxfParser()
      return { dxf: parser.parseSync(content), error: null }
    } catch (e: unknown) {
      return { dxf: null, error: e instanceof Error ? e.message : 'Parse error' }
    }
  }, [content])

  // Extract layers
  const layers: Record<string, { color: number }> = useMemo(() => {
    if (!dxf) return {}
    return Object.fromEntries(
      Object.entries(dxf.tables?.layer?.layers ?? {}).map(([k, v]) => [
        k, { color: (v as { color: number }).color ?? 7 },
      ]),
    )
  }, [dxf])

  const layerNames = useMemo(() => Object.keys(layers), [layers])

  // Filter entities by visible layers
  const entities = useMemo(() => {
    if (!dxf) return []
    if (!visibleLayers) return dxf.entities
    return dxf.entities.filter((e) => {
      const l = e.layer ?? '0'
      return visibleLayers.has(l)
    })
  }, [dxf, visibleLayers])

  // Calculate bounding box
  const bbox: BBox | null = useMemo(() => {
    if (!dxf) return null
    let b: BBox | null = null
    for (const e of dxf.entities) {
      const eb = entityBBox(e)
      if (!eb) continue
      b = b
        ? {
            minX: Math.min(b.minX, eb.minX), minY: Math.min(b.minY, eb.minY),
            maxX: Math.max(b.maxX, eb.maxX), maxY: Math.max(b.maxY, eb.maxY),
          }
        : eb
    }
    return b
  }, [dxf])

  // Y-flip function (DXF Y up → SVG Y down)
  const flip = useCallback(
    (y: number) => {
      if (!bbox) return y
      return bbox.maxY - y + bbox.minY
    },
    [bbox],
  )

  // Auto fit on first load
  const fitView = useCallback(() => {
    if (!bbox || !containerRef.current) return
    const w = containerRef.current.clientWidth
    const h = containerRef.current.clientHeight
    const dxfW = bbox.maxX - bbox.minX || 1
    const dxfH = bbox.maxY - bbox.minY || 1
    const scale = Math.min(w / dxfW, h / dxfH) * 0.9
    const cx = (bbox.minX + bbox.maxX) / 2
    const cy = (bbox.minY + bbox.maxY) / 2
    setTransform({
      scale,
      x: w / 2 - cx * scale,
      y: h / 2 - ((bbox.minY + bbox.maxY) / 2) * scale,
    })
  }, [bbox])

  useEffect(() => { fitView() }, [fitView])

  // ── Interactions ──────────────────────────────────────────────────────────
  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const rect = containerRef.current!.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    const factor = e.deltaY < 0 ? 1.12 : 0.89
    setTransform((t) => {
      const ns = Math.min(Math.max(t.scale * factor, 0.02), 500)
      return {
        scale: ns,
        x: mx - ((mx - t.x) / t.scale) * ns,
        y: my - ((my - t.y) / t.scale) * ns,
      }
    })
  }, [])

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return
    setIsDragging(true)
    lastPos.current = { x: e.clientX, y: e.clientY }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging || !lastPos.current) return
    const dx = e.clientX - lastPos.current.x
    const dy = e.clientY - lastPos.current.y
    lastPos.current = { x: e.clientX, y: e.clientY }
    setTransform((t) => ({ ...t, x: t.x + dx, y: t.y + dy }))
  }, [isDragging])

  const onPointerUp = useCallback(() => {
    setIsDragging(false)
    lastPos.current = null
  }, [])

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    if (!dxf) return null
    const counts: Record<string, number> = {}
    dxf.entities.forEach((e) => { counts[e.type] = (counts[e.type] ?? 0) + 1 })
    return counts
  }, [dxf])

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-500 dark:text-slate-400">
        <span className="text-4xl">⚠️</span>
        <p className="font-semibold text-sm">Failed to parse DXF file</p>
        <p className="text-xs text-center max-w-xs opacity-70">{error}</p>
      </div>
    )
  }

  if (!dxf) return null

  // Viewbox based on bbox
  const vbX = bbox?.minX ?? 0
  const vbY = bbox ? flip(bbox.maxY) : 0
  const vbW = bbox ? bbox.maxX - bbox.minX : 100
  const vbH = bbox ? bbox.maxY - bbox.minY : 100

  return (
    <div className="relative flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
        <button
          onClick={fitView}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
        >
          ⊞ Fit View
        </button>
        <button
          onClick={() => setTransform((t) => ({ ...t, scale: t.scale * 1.3 }))}
          className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
        >
          +
        </button>
        <button
          onClick={() => setTransform((t) => ({ ...t, scale: t.scale * 0.77 }))}
          className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
        >
          −
        </button>
        <span className="text-xs text-slate-400 ml-1">{Math.round(transform.scale * 100)}%</span>

        <div className="flex-1" />

        {/* Stats */}
        {stats && (
          <div className="flex gap-2 flex-wrap">
            {Object.entries(stats).map(([type, count]) => (
              <span
                key={type}
                className="text-xs px-2 py-0.5 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-full"
              >
                {type}: {count}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Layer panel */}
        {layerNames.length > 0 && (
          <div className="w-44 flex-shrink-0 border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-y-auto">
            <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Layers</p>
            </div>
            <div className="p-2 space-y-1">
              {layerNames.map((name) => {
                const lColor = aciToHex(layers[name]?.color)
                const isVisible = visibleLayers === null || visibleLayers.has(name)
                return (
                  <button
                    key={name}
                    onClick={() => {
                      setVisibleLayers((prev) => {
                        const all = new Set(prev ?? layerNames)
                        if (all.has(name)) {
                          if (all.size === 1) return null // show all
                          all.delete(name)
                        } else {
                          all.add(name)
                          if (all.size === layerNames.length) return null
                        }
                        return all
                      })
                    }}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-left"
                  >
                    <span
                      className="w-3 h-3 rounded-sm flex-shrink-0 border border-slate-200 dark:border-slate-600"
                      style={{ background: isVisible ? lColor : 'transparent' }}
                    />
                    <span className={`text-xs font-medium truncate ${isVisible ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400 dark:text-slate-500'}`}>
                      {name || '0'}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Canvas area */}
        <div
          ref={containerRef}
          className="flex-1 overflow-hidden relative"
          style={{ background: isDark ? '#0f172a' : '#f8fafc', cursor: isDragging ? 'grabbing' : 'grab' }}
          onWheel={onWheel}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <svg
            width="100%"
            height="100%"
            style={{ position: 'absolute', inset: 0 }}
          >
            <g transform={`translate(${transform.x} ${transform.y}) scale(${transform.scale})`}>
              <g>
                {entities.map((entity, i) =>
                  renderEntity(entity, layers, transform.scale, flip, isDark),
                )}
              </g>
            </g>
          </svg>

          {/* Zoom hint */}
          <div className="absolute bottom-3 right-3 text-xs text-slate-400 dark:text-slate-500 pointer-events-none">
            Scroll to zoom · Drag to pan
          </div>
        </div>
      </div>
    </div>
  )
}

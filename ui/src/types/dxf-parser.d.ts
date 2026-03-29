declare module 'dxf-parser' {
  export interface DxfPoint {
    x: number
    y: number
    z?: number
  }

  export interface DxfVertex {
    x: number
    y: number
    bulge?: number
  }

  export interface DxfEntityBase {
    type: string
    layer?: string
    color?: number        // ACI color index; 256 = BYLAYER, 0 = BYBLOCK
    colorIndex?: number
    handle?: string
    lineType?: string
    lineweight?: number
    visible?: boolean
  }

  export interface DxfLine extends DxfEntityBase {
    type: 'LINE'
    start: DxfPoint
    end: DxfPoint
  }

  export interface DxfLwPolyline extends DxfEntityBase {
    type: 'LWPOLYLINE'
    vertices: DxfVertex[]
    closed?: boolean
    elevation?: number
  }

  export interface DxfPolyline extends DxfEntityBase {
    type: 'POLYLINE'
    vertices: DxfVertex[]
    closed?: boolean
  }

  export interface DxfCircle extends DxfEntityBase {
    type: 'CIRCLE'
    center: DxfPoint
    radius: number
  }

  export interface DxfArc extends DxfEntityBase {
    type: 'ARC'
    center: DxfPoint
    radius: number
    startAngle: number
    endAngle: number
  }

  export interface DxfEllipse extends DxfEntityBase {
    type: 'ELLIPSE'
    center: DxfPoint
    majorAxisEndPoint: DxfPoint
    axisRatio: number
    startAngle: number
    endAngle: number
  }

  export interface DxfSpline extends DxfEntityBase {
    type: 'SPLINE'
    controlPoints: DxfPoint[]
    fitPoints?: DxfPoint[]
    degreeOfSplineCurve?: number
    knotValues?: number[]
  }

  export interface DxfText extends DxfEntityBase {
    type: 'TEXT'
    startPoint: DxfPoint
    endPoint?: DxfPoint
    textHeight?: number
    text: string
    rotation?: number
  }

  export interface DxfMText extends DxfEntityBase {
    type: 'MTEXT'
    position: DxfPoint
    text: string
    height?: number
    width?: number
    rotation?: number
  }

  export interface DxfInsert extends DxfEntityBase {
    type: 'INSERT'
    name: string
    position: DxfPoint
    xScale?: number
    yScale?: number
    rotation?: number
  }

  export interface DxfSolid extends DxfEntityBase {
    type: 'SOLID'
    corner1: DxfPoint
    corner2: DxfPoint
    corner3: DxfPoint
    corner4: DxfPoint
  }

  export interface DxfHatch extends DxfEntityBase {
    type: 'HATCH'
  }

  export type DxfEntity =
    | DxfLine
    | DxfLwPolyline
    | DxfPolyline
    | DxfCircle
    | DxfArc
    | DxfEllipse
    | DxfSpline
    | DxfText
    | DxfMText
    | DxfInsert
    | DxfSolid
    | DxfHatch
    | DxfEntityBase

  export interface DxfLayer {
    name: string
    color: number
    lineType?: string
    frozen?: boolean
    visible?: boolean
  }

  export interface DxfBlock {
    name: string
    entities: DxfEntity[]
    position: DxfPoint
  }

  export interface DxfFile {
    entities: DxfEntity[]
    blocks: Record<string, DxfBlock>
    tables: {
      layer?: { layers: Record<string, DxfLayer> }
      lineType?: { lineTypes: Record<string, unknown> }
    }
    header?: Record<string, unknown>
  }

  export default class DxfParser {
    parseSync(input: string): DxfFile
    parse(input: string, done: (err: Error | null, dxf: DxfFile | null) => void): void
  }
}

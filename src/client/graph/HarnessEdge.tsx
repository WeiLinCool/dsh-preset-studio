/**
 * One Harness Graph edge. Color and dash encode the DSL edge type:
 * data (composition order, gray dashed), lifecycle (group ownership, violet),
 * service (declarative dependency, blue).
 */
import { getBezierPath } from '@xyflow/react'
import type { EdgeProps } from '@xyflow/react'
import type { EdgeType } from '../../core/types.ts'

/** Edge payload. */
export interface HarnessEdgeData {
  edgeType: EdgeType
}

const EDGE_STYLE: Readonly<Record<EdgeType, { color: string; dash: string | undefined }>> = {
  data: { color: '#8a8f98', dash: '6 5' },
  lifecycle: { color: '#8a6cd9', dash: undefined },
  service: { color: '#2f7de1', dash: undefined },
  event: { color: '#d97b29', dash: '2 4' },
  context: { color: '#2f9e6f', dash: '2 4' },
}

/** Render one harness edge. */
export function HarnessEdgeView(props: EdgeProps) {
  const data = (props.data ?? { edgeType: 'data' }) as unknown as HarnessEdgeData
  const style = EDGE_STYLE[data.edgeType] ?? EDGE_STYLE.data
  const [path, labelX, labelY] = getBezierPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    sourcePosition: props.sourcePosition,
    targetX: props.targetX,
    targetY: props.targetY,
    targetPosition: props.targetPosition,
    curvature: 0.28,
  })
  return (
    <g data-edge-type={data.edgeType}>
      <path
        id={props.id}
        className="react-flow__edge-path"
        d={path}
        stroke={style.color}
        strokeWidth={1.6}
        strokeDasharray={style.dash}
        markerEnd={props.markerEnd ?? `url(#marker-${props.id})`}
      />
      {props.label !== undefined
        ? (
          <text
            className="react-flow__edge-text"
            x={labelX}
            y={labelY}
            textAnchor="middle"
            dominantBaseline="middle"
            style={{ fill: style.color, fontSize: 10 }}
          >
            {props.label}
          </text>
        )
        : null}
      <defs>
        <marker
          id={`marker-${props.id}`}
          viewBox="0 0 12 12"
          refX="10"
          refY="6"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
          markerUnits="strokeWidth"
        >
          <path d="M2 2 L10 6 L2 10 z" fill={style.color} />
        </marker>
      </defs>
    </g>
  )
}

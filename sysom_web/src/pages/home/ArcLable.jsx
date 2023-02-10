import { withSize } from 'react-sizeme'


const arcLable2NormalArcs = [
  { startAngle: 0, endAngle: 20, color: "#39E1CF" },
  { startAngle: 20, endAngle: 60, color: "#72E0DF" },
  { startAngle: 60, endAngle: 120, color: "#67EDF0" },
  { startAngle: 120, endAngle: 190, color: "#79BFE8" },
  { startAngle: 190, endAngle: 250, color: "#2DA7EE" },
  { startAngle: 250, endAngle: 360, color: "#1E80F1" },
]

const arcLable2WarningArcs = [
  { startAngle: 0, endAngle: 20, color: "#D55E6E" },
  { startAngle: 20, endAngle: 60, color: "#D86D60" },
  { startAngle: 60, endAngle: 120, color: "#EF9067" },
  { startAngle: 120, endAngle: 190, color: "#E89164" },
  { startAngle: 190, endAngle: 250, color: "#E1B276" },
  { startAngle: 250, endAngle: 360, color: "#E1B276" },
]

const arcLableWithLine_NormalArcs = [
  { startAngle: -270, endAngle: -225, color: "#39E1CF" },
  { startAngle: -225, endAngle: -170, color: "#72E0DF" },
  { startAngle: -170, endAngle: -140, color: "#67EDF0" },
  { startAngle: -140, endAngle: -120, color: "#79BFE8" },
  { startAngle: -120, endAngle: -80, color: "#2DA7EE" },
  { startAngle: -80, endAngle: 30, color: "#1E80F1" },
]

export const calArcXY = (startAngle, endAngle, radius) => {
  const x0 = (Math.sin(startAngle * Math.PI / 180) * radius).toFixed(2)
  const y0 = -(Math.cos(startAngle * Math.PI / 180) * radius).toFixed(2)
  const x1 = (Math.sin(endAngle * Math.PI / 180) * radius).toFixed(2)
  const y1 = -(Math.cos(endAngle * Math.PI / 180) * radius).toFixed(2)
  return [x0, y0, x1, y1]
}
const ArcLable = withSize({ monitorHeight: true })(props => {
  const { arcs, value, subValue, title, size, subArcColor, warning, withLine, textColor } = props;
  const radius = size.width / 2 - 15
  const subRadius = radius - 8
  const strokeWidth = (subArcColor || withLine) ? 4 : 8
  const TextColor = textColor || (warning ? "#C2415D" : "#FFFFFF")
  const Arcs = arcs || (warning ? arcLable2WarningArcs : withLine ? arcLableWithLine_NormalArcs : arcLable2NormalArcs)

  const arcsInner = Arcs.map(arc => {
    const [x0, y0, x1, y1] = calArcXY(arc.startAngle, arc.endAngle - 6, radius)
    const [subX0, subY0, subX1, subY1] = calArcXY(arc.startAngle, arc.endAngle - 6, subRadius)
    const arcFlag = +(arc.endAngle - arc.startAngle > 180)
    return (
      <g key={arc.startAngle}>
        <path strokeWidth={strokeWidth} stroke={arc.color} fill="transparent"
          d={`M ${x0} ${y0} A ${radius} ${radius} 0 ${arcFlag} 1 ${x1} ${y1}`} />
        {
          subArcColor ?
            <path strokeWidth="2" stroke={subArcColor} fill="transparent"
              d={`M ${subX0} ${subY0} A ${subRadius} ${subRadius} 0 ${arcFlag} 1 ${subX1} ${subY1}`}
            /> : <></>
        }
      </g>
    )
  })

  return (
    <svg width={size.width} height={size.width + 10}>
      <g transform={`translate(${size.width / 2}, ${size.width / 2 - 10})`}>
        {withLine ? <circle r={radius - 2} stroke={Arcs[0].color} /> : <></>}
        {arcsInner}
        {subValue ?
          <>
            <text textAnchor="middle" y="-10" dominantBaseline="middle" fontSize="large" fill={TextColor}> {value}</text>
            <text textAnchor="middle" y="15" dominantBaseline="middle" fill={TextColor}> {subValue}</text>
          </>
          : <text textAnchor="middle" dominantBaseline="middle" fontSize="large" fill={TextColor}> {value}</text>
        }
      </g>
      <text x={size.width / 2} y={size.height - 10} textAnchor="middle" dominantBaseline="ideographic" fill="#FFFFFF"> {title}</text>
    </svg>
  )
})

export default ArcLable
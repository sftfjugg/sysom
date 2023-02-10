import { withSize } from 'react-sizeme'
import { calArcXY } from './ArcLable'

const DashLable = withSize({ monitorHeight: true })(props => {
  const { arcs, value, subValue, title, size, subArcColor, warning, line, textColor } = props;
  const TextColor = textColor || (warning ? "#C2415D" : "#FFFFFF")

  const outerRadius = size.width / 2 - 10
  const innerRadius = size.width / 2 - 20
  const startAngle = -130
  const endAngle = 130
  const valueAngle = (endAngle - startAngle) * value / 100 + startAngle
  const arcFlag = +(valueAngle - startAngle > 180)


  let lines = [], texts = [], step = (endAngle - startAngle) / 5;
  for (let i = 0; i <= 5; i++) {
    lines.push(<line key={i} x1="0" y1={-(outerRadius - 4)} x2="0" y2={-outerRadius}
      stroke="#1E80F1" transform={`rotate(${startAngle + i * step})`} />)
    texts.push(<text key={i} x="0" y={-outerRadius - 3}
      textAnchor="middle" fill="#FFFFFF" fontSize="xx-small"
      transform={`rotate(${startAngle + i * step})`}>{`${i * 20}%`}</text>)
  }


  const [outerX0, outerY0, outerX1, outerY1] = calArcXY(startAngle, endAngle, outerRadius)
  const [innerX0, innerY0, innerX1, innerY1] = calArcXY(startAngle, endAngle, innerRadius)
  const [valueX0, valueY0, valueX1, valueY1] = calArcXY(startAngle, valueAngle, innerRadius)

  return (
    <svg width={size.width} height={size.width + 10}>
      <g transform={`translate(${size.width / 2}, ${size.height / 2})`}>
        {lines}
        {texts}
        <path strokeWidth="1px" stroke="#1E80F1" fill="transparent"
          d={`M ${outerX0} ${outerY0} A ${outerRadius} ${outerRadius} 0 1 1 ${outerX1} ${outerY1}`} />
        <path strokeWidth="6px" stroke="#222B4F" fill="transparent"
          d={`M ${innerX0} ${innerY0} A ${innerRadius} ${innerRadius} 0 1 1 ${innerX1} ${innerY1}`} />
        <path strokeWidth="6px" stroke="#1E80F1" fill="transparent"
          d={`M ${valueX0} ${valueY0} A ${innerRadius} ${innerRadius} 0 ${arcFlag} 1 ${valueX1} ${valueY1}`} />
        <text textAnchor="middle" dominantBaseline="middle" fontSize="large" fill={TextColor}> {`${value}%`}</text>
        <text y={innerRadius + 2} fontSize="x-small" textAnchor="middle" dominantBaseline="ideographic" fill="#FFFFFF"> {title}</text>
      </g>

    </svg>
  )
})

export default DashLable;
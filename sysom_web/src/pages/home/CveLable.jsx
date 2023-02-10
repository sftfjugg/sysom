import { withSize } from 'react-sizeme';

const CveLable = withSize({ monitorHeight: true })(props => {
  const { arcs, value, subValue, title, size, subArcColor, warning, line, textColor } = props;
  const TextColor = textColor || (warning ? "#C2415D" : "#39E1CF")

  let lines = []
  for (let i = -200; i <= 20; i += 10) {
    lines.push(<line y1="0" x1={size.width / 2 - 12} y2="0" x2={size.width / 2}
      stroke={`url(${warning ? "#Warning" : "#Normal"})`}
      transform={`rotate(${i})`} strokeWidth="4" />)
  }
  for (let i = 30; i <= 150; i += 10) {
    lines.push(lines.push(<line y1="0" x1={size.width / 2 - 12} y2="0" x2={size.width / 2} stroke="#222B4F"
      transform={`rotate(${i})`} strokeWidth="4" />))
  }

  return (
    <svg width={size.width} height={size.width + 10}>
      <defs>
        <linearGradient id="Normal" y1="0" x1={size.width / 2 - 12} y2="0" x2={size.width / 2} gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#39E1CF" />
          <stop offset="100%" stopColor="#1E80F1" />
        </linearGradient>
        <linearGradient id="Warning" y1="0" x1={size.width / 2 - 12} y2="0" x2={size.width / 2} gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#E1B276" />
          <stop offset="100%" stopColor="#D55E6E" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="10em" height="10em" stroke="#1E80F1" />
      <text x="0" y="0"> 紧急</text>
    </svg>
  )
})

export default CveLable;
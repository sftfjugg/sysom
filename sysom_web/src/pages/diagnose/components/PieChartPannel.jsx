import ProCard from '@ant-design/pro-card';
import { Pie } from '@ant-design/plots';

const PieChartPannel = (props) => {
  const configs = props.configs
  const data = props.data

  const pieTemplate = {
    appendPadding: 10,
    data: data,
    angleField: 'value',
    colorField: 'key',
    radius: 0.8,
    label: {
      type: 'outer',
      content: '{name} {percentage}'
    },
    interactions: [
      {
        type: 'pie-legend-active',
      },
      {
        type: 'element-active',
      },
    ],
  };

  return (
    <ProCard title={configs.title} style={{height:300}}>
      <Pie {...pieTemplate} />
    </ProCard>
  )
}

export default PieChartPannel
import ProCard from '@ant-design/pro-card';
import { Pie } from '@ant-design/plots';

const PieCharts = (props) => {
  const config = {
    appendPadding: 10,
    data: props.data,
    angleField: 'value',
    colorField: 'type',
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
    <>
      <ProCard title={props.title} layout="center">
        <Pie {...config} />
      </ProCard>
    </>
  );
}
export default PieCharts
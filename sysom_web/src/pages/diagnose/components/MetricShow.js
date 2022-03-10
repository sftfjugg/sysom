import { Button, Statistic } from 'antd';
import ProCard from '@ant-design/pro-card';
import { Line } from '@ant-design/charts';

const MetricShow = (props) => {
  console.log(props);
  const config = {
    data: props.data,
    padding: 'auto',
    xField: props.xField,
    yField: props.yField,
    seriesField: props.category,
    xAxis: {
      tickCount: 5,
    },
    // props.slider === "false" ? slider:false : slider: { start: 0,end: 1},
    slider: {
      start: 0.1,
      end: 0.5,
    },
  };
  return (
    <>
      <ProCard title={props.title}>
        <Line {...config} />
      </ProCard>
    </>
  );
}
export default MetricShow
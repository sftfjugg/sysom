import { Button, Statistic } from 'antd';
import ProCard from '@ant-design/pro-card';
import { Line } from '@ant-design/charts';

const MetricShow = (props) => {
  const config = {
    data: props.data,
    padding: 'auto',
    xField: props.xField,
    yField: props.yField,
    xAxis: {
      tickCount: 50,
    },
    slider: {
      start: 0,
      end: 1,
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
import { Button, Statistic } from 'antd';
import { useModel } from 'umi';
import ProCard from '@ant-design/pro-card';
import { Line } from '@ant-design/charts';

const MetricShow = (props) => {
  const { count, handleCount } = useModel('diagnose', model => (
    {
      count: model.count,
      handleCount: model.handleCount,
    }
  ))
  const config = {
    data: props.data[count],
    padding: 'auto',
    xField: props.xField,
    yField: props.yField,
    seriesField: props.category,
    yAxis: {
      title:{
        text: props.yAxisTitle || ''
      },
    },   
    xAxis: {
      title:{
        text: props.xAxisTitle || ''
      },
      tickCount: 5,
    },
    meta : props.meta || {},
    tooltip: props.customTooltips ? { customContent: props.customTooltips } : {},
    slider: {
      start: 0,
      end: 1.0,
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
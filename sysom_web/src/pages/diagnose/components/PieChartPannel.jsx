import ProCard from '@ant-design/pro-card';
import { Pie } from '@ant-design/plots';
import { Empty } from 'antd';
import { Typography } from 'antd';
const { Text } = Typography;

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
    <ProCard title={configs.title} style={{ height: 300 }}>
      {
        data ? <Pie {...pieTemplate} />
          : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div>Datasource  <Text type="danger"> {configs?.datasource} </Text> no data</div>
            } />
      }
    </ProCard>
  )
}

export default PieChartPannel
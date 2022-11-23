import ProCard from '@ant-design/pro-card';
import { Statistic } from 'antd';
import fieldModifier from './fieldModifier'
import { Empty } from 'antd';
import { Typography } from 'antd';
const { Text } = Typography;

const StatisticPannel = (props) => {
  const configs = props.configs
  const datas = props.data

  return (
    <ProCard.Group title={configs.title} direction='row' bordered>
      {
        datas ?
          Object.keys(datas).map((key) => {
            let data = datas[key]
            let [value, color] = fieldModifier(props.configs?.fieldConfig, data.value, data, datas)
            return (
              <ProCard key={key}>
                <Statistic
                  title={datas[key].key} value={value}
                  valueStyle={{
                    color: color,
                    whiteSpace: "pre-wrap"
                  }}
                />
              </ProCard>
            )
          })
          : <Empty style={{ marginBottom: 20 }} image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div>Datasource  <Text type="danger"> {configs?.datasource} </Text> no data</div>
            } />
      }
    </ProCard.Group>
  )
}

export default StatisticPannel
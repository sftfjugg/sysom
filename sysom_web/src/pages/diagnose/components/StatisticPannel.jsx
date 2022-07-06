import ProCard from '@ant-design/pro-card';
import { Statistic} from 'antd';
import fieldModifier from './fieldModifier'

const StatisticPannel = (props) => {
    //console.log("configs", props.configs.title)
    //console.log(props)
    const configs = props.configs
    const datas = props.data  
    
    return (
      <ProCard.Group title={configs.title} direction='row' bordered>
        {
          Object.keys(datas).map((key) => {
            let data = datas[key]
            let [value, color] = fieldModifier(props.configs?.fieldConfig, data.value, data, datas)
  
            return (
              <ProCard key={key}>
                <Statistic title={datas[key].key} value={value} valueStyle={{ color: color }} />
              </ProCard>
            )
          })
        }
      </ProCard.Group>
    )
  }

  export default StatisticPannel
import ProCard from '@ant-design/pro-card';
import { Line } from '@ant-design/plots'; 
import { Empty } from 'antd';
import { Typography } from 'antd';
const { Text } = Typography;


const TimeSeriesPannel = (props) => {
  const configs = props.configs
  const data = props.data

  //Tanslate the flat format to antv format.
  //from: { "time": "2022-06-29 10:11:40", "webserver1": 50, "webserver2": 65, "webserver3": 30 },
  //to: [{ "time": "2022-06-29 10:11:40", value: 50, category:"webserver1"},
  //     { "time": "2022-06-29 10:11:40", value: 65, category:"webserver2"}
  //     { "time": "2022-06-29 10:11:40", value: 30, category:"webserver3"}]
  let antvData = data?.reduce((ret, item) => {
    Object.keys(item).filter(key => key != 'time').reduce((ret, key) => {
      ret.push({ time: item.time, value: item[key], category: key })
      return ret
    }, ret)
    return ret
  }, [])

  const config = {
    data: antvData,
    padding: 'auto',
    xField: "time",
    yField: "value",
    seriesField: "category",
    slider: {
      start: 0,
      end: 1.0,
    },
  };

  return (
    <>
      <ProCard title={configs.title} style={{ marginTop: 16, }} bordered collapsible >
        {
          data ?
            <Line  {...config} style={{ height: 300 }} />
            : <Empty style={{ marginBottom: 20 }} image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <div>Datasource  <Text type="danger"> {configs?.datasource} </Text> no data</div>
              } />
        }
      </ProCard>
    </>
  );
}

export default TimeSeriesPannel

import { PageContainer } from '@ant-design/pro-layout';
import { useState, useRef, useEffect } from 'react';
import { request } from 'umi';
import ProCard from '@ant-design/pro-card';
import IOTableList from './IOTableList';
import IOResults from './IOResults'
import IOTaskForm from './IOTaskForm';
import MetricShow from '../components/MetricShow'
import { getTask } from '../service'

const { Divider } = ProCard;

const IOList = () => {
  const refIoTableList = useRef();
  const [data, setData] = useState();

  const onListClick = async () => {
    const msg = await request('/api/curve/');
    const stated = msg.data.stat[0];
    const metric = msg.data.seq[0]["slow ios"].reduce((metric, item) => { 
      const block = item.delays.filter((item2) => {
        metric.push({
          x:item.time,
          y:item2.delay,
          category:item2.component,
        }); 
      });
      return metric}, [])
    setData({rawData:msg, metric:metric, stated:stated});
  }

  const onPostTask = () => {
    refIoTableList.current.reload();
  }

  const onError = async (record) => {
    const msg = await getTask(record.id);
    Modal.error({
      title: '诊断失败',
      content: (
        <div>
          <div>错误信息：{msg.result}</div>
        </div>
      ),
    });
  }
  return (
    <PageContainer>    
      <IOTaskForm onSuccess={onPostTask} />
      <Divider />                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 
      <IOTableList headerTitle="诊断列表" search={true} onClick = {onListClick} onError={onError} ref={refIoTableList} />
      <Divider />
      {
        data ?
          <>
            <IOResults data={data.stated} />
            <MetricShow data={data.metric} title="IO 诊断各阶段延迟分析" xField="x" yField="y" category="category" slider="false" />
          </>
          :
          <></>
          
      }
    </PageContainer>
  );
};

export default IOList;

import { PageContainer } from '@ant-design/pro-layout';
import { useState, useRef, useEffect } from 'react';
import { request } from 'umi';
import ProCard from '@ant-design/pro-card';
import NetTableList from './NetTableList';
import PacketLoss from './PacketLoss'
import NetworkFlow from './NetworkFlow';
import MetricShow from '../components/MetricShow'

const { Divider } = ProCard;

const NetList = () => {
  const [data, setData] = useState();

  const onListClick = async () => {
    const msg = await request('/api/metric/');
    const metric = msg.data.seq.reduce((metric, item) => { 
      metric.push({
          x:item.meta.seq,
          y:item.delays.filter((item) => item.delay === "total")[0].ts
      }); return metric}, [])
    setData({rawData:msg, metric:metric});
  }
  
  return (
    <PageContainer>
      <NetTableList headerTitle="诊断记录查看" search={true} onClick = {onListClick}/>
      <Divider />
      {
        data ?
          <>
            <PacketLoss />
            <Divider />
            <NetworkFlow data={data.rawData.data} />
            <Divider />
            <MetricShow data={data.metric} title="Metric展示" xField="x" yField="y" />
          </>
          :
          <></>
      }
    </PageContainer>
  );
};

export default NetList;

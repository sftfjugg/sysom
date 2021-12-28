import { PageContainer } from '@ant-design/pro-layout';
import { useState, useRef, useEffect } from 'react';
import { request } from 'umi';
import ProCard from '@ant-design/pro-card';
import IOTableList from './IOTableList';
import IOResults from './IOResults'

const { Divider } = ProCard;

const IOList = () => {
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
      <IOTableList headerTitle="诊断列表" search={true} onClick = {onListClick} />
      <Divider />
      {
        data ?
          <>
            <IOResults />
          </>
          :
          <></>
          
      }
    </PageContainer>
  );
};

export default IOList;

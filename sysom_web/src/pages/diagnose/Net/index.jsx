import { PageContainer } from '@ant-design/pro-layout';
import { Button, Modal } from "antd";
import { useState, useRef, useEffect } from 'react';
import { request } from 'umi';
import ProCard from '@ant-design/pro-card';
import NetTableList from './NetTableList';
import PacketLoss from './PacketLoss'
import NetworkFlow from './NetworkFlow';
import NetTaskForm from './NetTaskForm';
import MetricShow from '../components/MetricShow'
import { getTask } from '../service'

const { Divider } = ProCard;

const NetList = () => {

  const refNetListTable = useRef();
  const [data, setData] = useState();

  const onPostTask = () => {
    refNetListTable.current.reload();
  }


  /*
  const onListClick = async (record) => {
    const msg = await request('/api/metric/');
    const metric = msg.data.seq.reduce((metric, item) => { 
      metric.push({
          x:item.meta.seq,
          y:item.delays.filter((item) => item.delay === "total")[0].ts
      }); return metric}, [])
    setData({rawData:msg, metric:metric});
  }

  */

  const onListClick = async (record) => {
    const msg = await getTask(record.id);
    setData(msg);
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
      <NetTaskForm onSuccess={onPostTask} />
      <Divider />
      <NetTableList headerTitle="诊断记录查看"
        search={true} onClick={onListClick} onError={onError} ref={refNetListTable} />
      <Divider />
      {
        data ?
          <>
            <PacketLoss data={data}/>
            <Divider />
            <NetworkFlow data={data.result} />
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

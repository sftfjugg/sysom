import { PageContainer } from '@ant-design/pro-layout';
import { useState, useRef } from 'react';
import { Modal } from "antd";
import { request, useModel } from 'umi';
import ProCard from '@ant-design/pro-card';
import IOTableList from './IOTableList';
import IOResults from './IOResults'
import IOTaskForm from './IOTaskForm';
import MetricShow2 from '../../components/MetricShow2'
import { getTask } from '../../service'

const { Divider } = ProCard;

const IOList = () => {
  const refIoTableList = useRef();
  const [data, setData] = useState();
  const { count, handleCount } = useModel('diagnose', model => (
    { 
      count: model.count, 
      handleCount: model.handleCount,
    }
  ))

  const onListClick = async (record) => {
    const msg = await getTask(record.id);
    setData(msg);
  }
  // const onListClick = async (record) => {
  //   const recorded = record;
  //   const msg = await getTask(record.id);
  //   const metlist = [];
  //   const metric = msg.data.seq.reduce((metric, item, index, arr) => { 
  //     const block = item["slow ios"].filter((item2,index2) => {
  //       const block2 = item2.delays.filter((item3,index3) => {
  //         metlist.push({
  //           x:item2.time,
  //           y:item3.delay,
  //           category:item3.component,
  //         });
  //       })
  //     });
  //     metric.push({
  //       diskname: item.diskname,
  //       slowios: item["slow ios"],
  //       delays: msg.data.stat[index].delays,
  //     });
  //     return metric
  //   }, [])
  //   const restlist = [];
  //   const size = metlist.length / metric.length;
  //   for(let i = 0;i<Math.ceil(metric.length);i++){
  //     let start = i*size;
  //     let end = start + size;
  //     restlist.push(metlist.slice(start,end));
  //   }
  //   setData({rawData:msg, metric:metric, restlist:restlist, recorded: recorded});
  // }

  const onPostTask = () => {
    refIoTableList.current.reload();
  }

  const onError = async (record) => {
    const msg = await getTask(record.id);
    Modal.error({
      title: '诊断失败',
      content: (
        <div>
          <div>错误信息: {msg.result}</div>
        </div>
      ),
    });
  }
  return (
    <PageContainer>    
      <IOTaskForm onSuccess={onPostTask} />
      <Divider />                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 
      <IOTableList headerTitle="诊断列表" search={true} onClick = {(record) => onListClick(record)} onError={onError} ref={refIoTableList} />
      <Divider />
      {
        data ?
          <>
            <IOResults data={data.metric} recorded={data.recorded} />
            <MetricShow2 data={data.restlist} title="IO 诊断各阶段延迟分析" xField="x" yField="y" category="category" slider="false" />
          </>
          :
          <></>
          
      }
    </PageContainer>
  );
};

export default IOList;

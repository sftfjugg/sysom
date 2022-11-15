import { PageContainer } from '@ant-design/pro-layout';
import { useState, useRef } from 'react';
import { Modal } from "antd";
import { request } from 'umi';
import ProCard from '@ant-design/pro-card';
import IOTableList from './IOTableList';
import IOResults from './IOResults'
import IOTaskForm from './IOTaskForm';
import MetricShow from '../../components/MetricShow'
import { getTask } from '../../service'

const { Divider } = ProCard;

const IOList = () => {
  const refIoTableList = useRef();
  const [data, setData] = useState();
  const [diskIdx, setDiskIdx] = useState(0);

  const onListClick = async (record) => {
    const recorded = record;
    const msg = await getTask(record.task_id);
    if (msg.result.status == "success" && msg.result["IO timeout"] == "false") {
        Modal.success({
          title: '诊断成功',
          content: (
            <div>
              <div>诊断完成，无异常超时IO</div>
            </div>
          ),
        });
        return
    }
    const metlist = [];
    const ioList = msg.result.seq.reduce((ioList, item, index, arr) => {
      const block = item["slow ios"].filter((item2,index2) => {
        const block2 = item2.delays.filter((item3,index3) => {
          metlist.push({
            x:item2.time,
            y:item3.delay,
            category:item3.component,
          });
        })
      });
      ioList.push({
        diskname: item.diskname,
        delays: msg.result.stat[index].delays,
      });
      return ioList
    }, [])
    const metric = [];
    const size = metlist.length / ioList.length;
    for(let i = 0;i<Math.ceil(ioList.length);i++){
      let start = i*size;
      let end = start + size;
      metric.push(metlist.slice(start,end));
    }
    setData({rawData:msg, metric:metric, ioList:ioList, recorded: recorded});
  }

  const onPostTask = () => {
    refIoTableList.current.reload();
  }

  const onError = async (record) => {
    const msg = await getTask(record.task_id);
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
      <IOTableList headerTitle="诊断记录查看" search={true} onClick = {(record) => onListClick(record)} onError={onError} ref={refIoTableList} />
      <Divider />
      {
        data ?
          <>
            <IOResults data={data.ioList} diskChange={setDiskIdx} diskIdx={diskIdx ? diskIdx : 0} recorded={data.recorded} />
            <MetricShow data={data.metric[diskIdx ? diskIdx : 0]}
              title="IO 诊断各阶段延迟分析"
              xField="x" yField="y"
              category="category" slider="false"
              yAxisTitle="时延（us)"
            />
          </>
          :
          <></>
          
      }
    </PageContainer>
  );
};

export default IOList;

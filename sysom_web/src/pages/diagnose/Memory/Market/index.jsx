import { PageContainer } from '@ant-design/pro-layout';
import { useState, useRef } from 'react';
import { Modal } from "antd";
import { request } from 'umi';
import ProCard from '@ant-design/pro-card';
import MarketTaskForm from './MarketTaskForm';
import MarketTableList from './MarketTableList';
import MarketEvent from './MarketEvent'
import MarketMemory from './MarketMemory'
import MarketMemoryTable from './MarketMemoryTable'
import MarketCacheTable from './MarketCacheTable'
import { getTask } from '../../service'

const { Divider } = ProCard;

const MarketList = () => {
  const refIoTableList = useRef();
  const [data, setData] = useState();

  const onListClick = async (record) => {
    const recorded = record;
    const msg = await request('/api/v1/tasks/' + record.id);
    msg.data.result = JSON.parse(msg.data.result)
    const memgraph = Object.entries(msg.data.result.memgraph).reduce((memgraph, items) => {
      memgraph.push(
        {
          type: items[0],
          value: items[1]
        }
      );
      return memgraph;
    }, [])
    const kernel = Object.entries(msg.data.result.kernel).reduce((kernel, items) => {
      kernel.push(
        {
          type: items[0],
          value: items[1]
        }
      );
      return kernel;
    }, [])
    const user = Object.entries(msg.data.result.user).reduce((user, items) => {
      user.push(
        {
          type: items[0],
          value: items[1]
        }
      );
      return user;
    }, [])
    setData({rawData:msg.data.result, recorded:recorded, memgraph:memgraph, kernel: kernel, user:user});
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
          <div>错误信息: {msg.result}</div>
        </div>
      ),
    });
  }
  return (
    <PageContainer>    
      <MarketTaskForm onSuccess={onPostTask} />
      <Divider />
      <MarketTableList headerTitle="内存列表" search={true} onClick = {(record) => onListClick(record)} onError={onError} ref={refIoTableList} />
      <Divider />
      {
        data ?
          <>
            <MarketEvent title="诊断结果" subtitle="事件总览" recorded={data.recorded} data={data.rawData}  />
            <Divider />
            <MarketMemory memgraph={data.memgraph} kernel={data.kernel} user={data.user} />
            <Divider />
            <MarketMemoryTable subtitle="进程内存排序" data={data.rawData} />
            <Divider />
            <MarketCacheTable subtitle="文件cache排序" data={data.rawData} />
          </>
          :
          <></>
      }
    </PageContainer>
  );
};

export default MarketList;

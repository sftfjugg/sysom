import { PageContainer } from '@ant-design/pro-layout';
import { Modal } from "antd";
import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom'
import ProCard from '@ant-design/pro-card';
import CPUTaskForm from './CPUTaskForm';
import CPUTaskList from './CPUTaskList';
import CPUPieChart from './CPUPieChart';
import CPUEvent from './CPUEvent';
import { _getTask } from '../../service'

const { Divider } = ProCard;

class SmartIFrame extends React.Component {
  render() {
      return <iframe src={this.props.src}
                     scrolling="no"
                     frameBorder={0}
                    
                     onLoad = {e => setTimeout(() => {
                         const obj = ReactDOM.findDOMNode(this);
                         obj.style.height = obj.contentWindow.document.body.scrollHeight + 'px';
                         obj.style.width = obj.contentWindow.document.body.scrollWidth + 'px';
                     }, 50)}/>
  }
}

export default (props) => {

  const refOSCheckList = useRef();
  const [CPUTaskResult, setCPUTaskResult] = useState();

  const onPostTask = () => {
    refOSCheckList.current.reload();
  }

  const onError = async (record) => {
    const msg = await _getTask(record.id);
    Modal.error({
      title: '诊断失败',
      content: (
        <div>
          <div>错误信息：{msg.result}</div>
        </div>
      ),
    });
  }

  const onListClick = async (record) => {
    const msg = await _getTask(record.id);
    setCPUTaskResult(msg);
  }

  /*
               <iframe
                frameBorder="0"
                style={{ width: "1200px", height: "422px" }}
                src={`/api/v1/tasks/${CPUTaskResult.id}/svg/`}
                onLoad={e => setTimeout(() => {
                  const obj = ReactDOM.findDOMNode(this);
                  obj.style.height = obj.contentWindow.document.body.scrollHeight + 'px';
                }, 50)}
              />*/

  return (
    <PageContainer>
      <CPUTaskForm onSuccess={onPostTask} />
      <Divider />
      <CPUTaskList headerTitle="诊断记录查看"
        search={true} onClick={onListClick} onError={onError} ref={refOSCheckList} />
      <Divider />
      {
        CPUTaskResult ?
          <>
            <CPUEvent title="诊断结果" subtitle="事件总览" data={CPUTaskResult} />
            <Divider />
            <CPUPieChart data={CPUTaskResult} />
            <Divider />
            <ProCard title="调度火焰图" layout="center">
            <div style={{textAlign:'center', width:'100%'}}>
              <SmartIFrame src={`/api/v1/tasks/${CPUTaskResult.id}/svg/`} />
              </div>
            </ProCard>
          </>
          :
          <></>
      }
    </PageContainer>
  );
};

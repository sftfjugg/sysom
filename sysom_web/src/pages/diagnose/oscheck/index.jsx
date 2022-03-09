import { PageContainer } from '@ant-design/pro-layout';
import { useState, useRef } from 'react';
import ProCard from '@ant-design/pro-card';
import OSCheckTaskForm from './osCheckTaskForm';
import OSCheckTaskResult from './osCheckResult'
import OSCheckList from './osCheckList';
import { _getTask } from '../service'

const { Divider } = ProCard;

const NetList = () => {

  const refOSCheckList = useRef();
  const [osCheckResult, setOsCheckResult] = useState();

  const onPostTask = () => {
    refOSCheckList.current.reload();
  }


  const onListClick = async (record) => {
    let map = {
      CONFIG: "配置检查",
      HW: "硬件检查",
      ISSUE: "已知问题检查",
      LOG: "日志检查",
      SLI: "SLI检查",
      CPU: "CPU",
      MEM: "内存",
      NET: "网络",
      IO: "IO",
      SCHED: "调度",
      HOTFIX: "热补丁",
      MISC: "其他",
      DMESG: "dmesg",
      CRIT: "Critical",
      ERR: "Error",
      WARN: "Warnning",
      CRASH: "宕机"
    }

    const msg = await _getTask(record.id);

    const statusLevelList = ["none", "info", "warning", "error", "critical", "fatal"]
    const statusLevelMap = { none: 0, info: 1, warning: 2, error: 3, critical: 4, fatal: 5 }

    //格式转换， 转换为Antd Table格式
    delete msg.result.check_success
    let osCheckResult = []
    for (let type in msg.result) {
      let children = []
      let maxStatusLevel = 0;
      for (let item in msg.result[type]) {
        msg.result[type][item].summary = "fefef</br>" + msg.result[type][item].summary
        children.push({ ...msg.result[type][item], item: map[item], key: type + item })
        maxStatusLevel = maxStatusLevel < statusLevelMap[msg.result[type][item].level] ?
          statusLevelMap[msg.result[type][item].level] : maxStatusLevel
      }
      osCheckResult.push({
        children: children, item: map[type], summary: "",
        level: statusLevelList[maxStatusLevel], key: type
      })
    }

    setOsCheckResult(osCheckResult);
  }

  return (
    <PageContainer>
      <OSCheckTaskForm onSuccess={onPostTask} />
      <Divider />
      <OSCheckList headerTitle="诊断记录查看"
        search={true} onClick={onListClick} ref={refOSCheckList} />
      <Divider />
      {
        osCheckResult ? <OSCheckTaskResult data={osCheckResult} /> : <></>
      }
    </PageContainer>
  );
};

export default NetList;

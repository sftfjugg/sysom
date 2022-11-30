import React, { useEffect, useReducer, createContext } from 'react';
import { withRouter } from 'umi';
import rootReducer from './reducers';
// import { SET_DATA } from './constants';
// import { qyeryMachineInfo, qyeryLog, qyeryReport,getBannerList } from '../../service';

// 初始化全量数据（全部的分类、应用数据）
const initState = {
  loadingVisible: true,
  machineTableLoading: true,
  machineDetailLoading: true,
  // 机器总数
  nodeTotal: 0,
  // 待迁移机器数
  abnormalNodeTotal: 0,
  isFocused: false,
  isDefault: false,
  // 机器信息
  systemMessage: {},
  // 迁移日志
  logtMessage: '',
  // 迁移报告
  reportMessage: {},
  // 当前展示的机器ip(系统版本)
  tableIpVersion: '',
  // 当前展示的机器ip
  tableIp: '',
  // 批量迁移
  allMoveVisible: false,
  // 机器组列表
  machineGroupsList: [],
  // 机器列表
  machineList:[],
  // 选中机器组id
  activeMachineGroupId: '',
  // 开始迁移弹窗机器ip
  startMigrateIp: '', 
};

// 创建需要共享全量数据的 Context
export const WrapperContext = createContext();

export default withRouter((props) => {
  
  // 使用 useReducer 取代 useState 集中管理数据
  const [state, dispatch] = useReducer(rootReducer, initState);

  useEffect(() => {
    (async () => {
     
    })();
  }, []);

  // 使用 Provider 提供 Context 的值，Provider所包含的子树都可以直接访问 Context 的值
  return (
    <WrapperContext.Provider value={{ state, dispatch }}>{props.children}</WrapperContext.Provider>
  );
});

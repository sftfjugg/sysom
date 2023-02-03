import React, {useEffect, useReducer, createContext} from 'react';
import {withRouter} from 'umi';
import rootReducer from './reducers';

const initState = {
  // 选中查看报告的项
  activeId: '',
  activeIp: '',
  activeOld: '',
  activeNew: '',
  // 根据选择评估展示对应切换
  activeAssType: ['mig_imp'],
  activeKey: 'risk',
  // 切换loading
  tabsLoading: true,
  // 应用列表
  appList: [],
  // 选中软件包的id
  appActiveId: '',
  // acl依赖列表
  aclList: [],
  aclLoading: true,
  // 选中appList项
  activeAppRpmName: '',
  activeAppName: '',
  // 选中的acl依赖项
  aclActiveName: '',
  aclActiveRpmName: '',
  aclActiveType: '', // so 、 binary
  // abi报告列表
  abiList: [],
  // abi报告列表loading
  abiLoading: true,
  // abi变更内容
  abiContent: '',
  abiContentLoading: false,
  // 硬件列表
  hwInfo: [],
  hwList: [],
  // 风险列表
  riskList: [],
  // 根据全部风险项判断评估结果
  isPassStatus: '',
  // 系统配置类型
  sysType: [],
  activeSysType: '',
  // 系统配置列表
  sysTableList: [],
  // 系统配置列表loading
  sysTableLoading: false,
};

export const WrapperContext = createContext();

export default withRouter((props) => {
  const [state, dispatch] = useReducer(rootReducer, initState);

  useEffect(() => {
    (async () => {})();
  }, []);

  return (
    <WrapperContext.Provider value={{state, dispatch}}>{props.children}</WrapperContext.Provider>
  );
});

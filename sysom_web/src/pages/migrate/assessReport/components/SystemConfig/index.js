import React, {useContext,useState,useEffect} from 'react';
import ProCard from '@ant-design/pro-card';
import {Skeleton, Empty} from 'antd';
import ReportType from '../ReportType';
import SystemTable from '../SystemTable/SystemTable.js';
import {querySysConfigList,querySysList} from '../../../service';
import { WrapperContext } from '../../containers';
import { SET_DATA } from '../../containers/constants';
import './index.less';

const getSysConfigList = async () => {
  return await querySysConfigList();
}

const SYS_CONFIG_TYPE = {
  os_env: '环境变量',
  os_service: '系统服务',
  os_syscmd: '系统命令',
  kolist: '内核模块',
  kconfig: '内核静态配置',
  kcmdline: '内核启动参数',
  kparams: '内核动态配置',
  kabi: 'KABI',
  ksyscall: '系统调用',
}

const SystemConfig = (props, ref) => {
  const {
    dispatch,
    state: { sysType,tabsLoading,activeSysType,activeId,sysTableLoading },
  } = useContext(WrapperContext);
  const [detailsText,setDetailsText] = useState('');
  const [detailsModal,setDetailsModal] = useState(false);
  const [sysCount,setAclCount] = useState({
    total: '',
    change: '',
    lack: '',
  });

  useEffect

  const changeActive = async (key) => {
    if(!sysTableLoading){
      if(key !== activeSysType){
        dispatch({
          type: SET_DATA,
          payload: {
            activeSysType: key,
            sysTableList: []
          },
        });
        getSysList(key)
      }
    }
  }

  const getSysList = async (type) => {
    dispatch({
      type: SET_DATA,
      payload: {
        sysTableLoading: true,
      },
    });
    try {
      const { code,data } = await querySysList({id:activeId,type});
      if (code === 200) {
        dispatch({
          type: SET_DATA,
          payload: {
            sysTableList: data?data:[],
          },
        });
        return true;
      }
      return false;
    } catch (e) {
      dispatch({
        type: SET_DATA,
        payload: {
          sysTableList: [],
        },
      });
      return false;
    } finally {
      dispatch({
        type: SET_DATA,
        payload: {
          sysTableLoading: false,
        },
      });
    }
  }

  return (
    <div className="sys_container">
      <ReportType title='系统配置'/>
      <Skeleton loading={tabsLoading}>
        {
          sysType?.length > 0 ?
          <ProCard
            tabs={{
              type: 'card',
              activeKey: activeSysType,
              style: {marginTop: 18},
              className:"application-tabs-card",
              onChange: (key) => {
                changeActive(key);
              },
            }}
          >
            {
              sysType?.length > 0 && sysType.map((i)=>{
                if(SYS_CONFIG_TYPE[i]){
                  return (
                    <ProCard.TabPane key={i} tab={SYS_CONFIG_TYPE[i]}>
                      <SystemTable type={SYS_CONFIG_TYPE[i]} key={i}/>
                    </ProCard.TabPane>
                  )
                }
            })
            }
          </ProCard>
          : 
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ marginTop: 100 }} />
        }
      </Skeleton>
    </div>
  );
};

export default SystemConfig;

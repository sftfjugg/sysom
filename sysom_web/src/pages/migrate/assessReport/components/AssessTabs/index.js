import React, {Fragment,useContext,useRef, useState} from 'react';
import {Breadcrumb, message} from "antd";
import ProCard from '@ant-design/pro-card';
import Application from '../Application';
import Hardware from '../Hardware';
import Risk from '../Risk';
import SystemConfig from '../SystemConfig';
import {queryAppList,queryHardwareList,queryRiskList,querySysType,querySysList} from '../../../service';
import {WrapperContext} from '../../containers';
import {SET_DATA} from '../../containers/constants';
import {SYS_CONFIG_TYPE} from '../../../utils';
import "./index.less";

const AssessTabs = (props) => {
  const {
    dispatch,
    state: {activeId},
  } = useContext(WrapperContext);
  const [activeKey, setActiveKey] = useState('1');

  const changeActive = (key) => {
    setActiveKey(key);
    switch (key){
        case '1':
          getAppList();
          break;
        case '2':
          getHWList();
          break;
        case '3':
          getRiskList();
          break;
        case '4':
          getSysType();
          break;
        default: break;
    }
  }

  const getAppList = async () => {
    dispatch({
      type: SET_DATA,
      payload: {
        tabsLoading: true,
        activeAppRpmName: '',
        activeAppName: '',
        aclActiveName: '',
        aclActiveRpmName: '',
        aclActiveType: '',
        aclList: [],
        abiList: [],
        abiContent: '',
      },
    });
    const hide = message.loading('loading...', 0);
    try {
      const { code,data } = await queryAppList({id:activeId});
      if (code === 200) {
        dispatch({
          type: SET_DATA,
          payload: {
            appList: data?data:[],
          },
        });
        return true;
      }
      return false;
    } catch (e) {
      dispatch({
        type: SET_DATA,
        payload: {
          appList: [],
        },
      });
      return false;
    } finally {
      hide();
      dispatch({
        type: SET_DATA,
        payload: {
          tabsLoading: false,
        },
      });
    }
  }

  const getHWList = async () => {
    dispatch({
      type: SET_DATA,
      payload: {
        tabsLoading: true,
      },
    });
    const hide = message.loading('loading...', 0);
    try {
      const { code,data } = await queryHardwareList({id:activeId});
      const {hard_result,hard_info} = data || {};
      if(hard_result?.length > 0){
        hard_result.forEach((item,index)=>{
          hard_result[index].id = index;
        })
      }
      if (code === 200) {
        dispatch({
          type: SET_DATA,
          payload: {
            hwInfo: hard_info?hard_info:[],
            hwList: hard_result?hard_result:[],
          },
        });
        return true;
      }
      return false;
    } catch (e) {
      dispatch({
        type: SET_DATA,
        payload: {
          hwInfo: [],
          hwList: [],
        },
      });
      return false;
    } finally {
      console.log('执行o')
      hide();
      dispatch({
        type: SET_DATA,
        payload: {
          tabsLoading: false,
        },
      });
    }
  }

  const getRiskList = async () => {
    dispatch({
      type: SET_DATA,
      payload: {
        tabsLoading: true,
      },
    });
    const hide = message.loading('loading...', 0);
    try {
      const { code,data } = await queryRiskList({id:activeId});
      if(data?.length > 0){
        data.map((item,index)=>{
          data[index].id = index;
        })
      }
      if (code === 200) {
        dispatch({
          type: SET_DATA,
          payload: {
            riskList: data,
          },
        });
        return true;
      }
      return false;
    } catch (e) {
      dispatch({
        type: SET_DATA,
        payload: {
          riskList: [],
        },
      });
      return false;
    } finally {
      hide();
      dispatch({
        type: SET_DATA,
        payload: {
          tabsLoading: false,
        },
      });
    }
  }

  const getSysType = async () => {
    dispatch({
      type: SET_DATA,
      payload: {
        tabsLoading: true,
      },
    });
    const hide = message.loading('loading...', 0);
    try {
      const { code,data } = await querySysType({id:activeId});
      if (code === 200) {
        let list = data?.length > 0
            ? data.filter((item) => {
                if (SYS_CONFIG_TYPE[item]) return item;
              })
            : [];
        dispatch({
          type: SET_DATA,
          payload: {
            sysType: list,
            activeSysType: list?.length>0?list[0]:''
          },
        });
        if(list?.length>0){
          getSysList(list[0])
        }
        return true;
      }
      return false;
    } catch (e) {
      dispatch({
        type: SET_DATA,
        payload: {
          sysType: [],
          activeSysType: '',
        },
      });
      return false;
    } finally {
      hide();
      dispatch({
        type: SET_DATA,
        payload: {
          tabsLoading: false,
        },
      });
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
    <Fragment>
      <ProCard>
        <Breadcrumb separator=">">
          <Breadcrumb.Item href="/migrate/implement">操作系统迁移</Breadcrumb.Item>
          <Breadcrumb.Item href="/migrate/assess">迁移评估</Breadcrumb.Item>
          <Breadcrumb.Item>评估报告</Breadcrumb.Item>
        </Breadcrumb>
      </ProCard>
      <ProCard
        tabs={{
          type: 'line',
          tabPosition: 'top',
          activeKey: activeKey,
          onChange: (key) => {
            changeActive(key);
          },
          className:"assess-tabs-card",
        }}
      >
        {/* forceRender={true} */}
        <ProCard.TabPane key='1' tab="应用评估">
          <Application />
        </ProCard.TabPane>
        <ProCard.TabPane key='2' tab="硬件评估">
          <Hardware />
        </ProCard.TabPane>
        <ProCard.TabPane key='3' tab="迁移风险评估">
          <Risk />
        </ProCard.TabPane>
        <ProCard.TabPane key='4' tab="系统配置评估">
          <SystemConfig />
        </ProCard.TabPane>
      </ProCard>
    </Fragment>
  );
}

export default AssessTabs;

import React, { useState, useEffect, useContext } from 'react';
import { Tabs, Card, message } from 'antd';
import styles from './style.less';
import { ReactComponent as TabIcon } from '@/pages/migrate/static/tab.svg';
import { ReactComponent as LiveTabIcon } from '@/pages/migrate/static/liveTab.svg';
import MachineMessage from './components/MachineMessage';
import MigrateMessage from './components/MigrateMessage';
import LogMessage from './components/Log';
import { WrapperContext } from '../../containers';
import {
  qyeryMachineInfo,
  qyeryMigrateInfo,
  qyeryLog,
} from '../../../service';
import { SET_DATA } from '../../containers/constants';


const { TabPane } = Tabs;

export default function Message() {
  const {
    dispatch,
    state: {tableIpVersion, logtMessage, reportMessage, impLogMessage, impReportMessage, tableIp},
  } = useContext(WrapperContext);
  const [activeKey, setActiveKey] = useState('1');
  
  const getActiveKey = (key) => {
    setActiveKey(key);
    switch (key){
        case '1':
          getMachine();
          break;
        case '2':
          getMigrate();
          break;
        case '3':
        case '4':
        case '5':
        case '6':
    console.log(key,'key')
          getLog();
          break;
        default: break;
    }
  }

  const getMachine = async () => {
    dispatch({
      type: SET_DATA,
      payload: {
        machineDetailLoading: true,
      },
    });
    const hide = message.loading('loading...', 0);
    try {
      const { code,data } = await qyeryMachineInfo({ip: tableIp});
      if (code === 200) {
        dispatch({
          type: SET_DATA,
          payload: {
            systemMessage: data ? data : {},
          },
        });
        return true;
      }
      return false;
    } catch (e) {
      dispatch({
        type: SET_DATA,
        payload: {
          systemMessage: {},
        },
      });
      return false;
    } finally {
      hide();
      dispatch({
        type: SET_DATA,
        payload: {
          machineDetailLoading: false,
        },
      });
    }
  }

  const getMigrate = async () => {
    dispatch({
      type: SET_DATA,
      payload: {
        machineDetailLoading: true,
      },
    });
    const hide = message.loading('loading...', 0);
    try {
      const { code,data } = await qyeryMigrateInfo({ip:tableIp});
      if (code === 200) {
        dispatch({
          type: SET_DATA,
          payload: {
            migMessage: data ? data : {},
          },
        });
        return true;
      }
      return false;
    } catch (e) {
      dispatch({
        type: SET_DATA,
        payload: {
          migMessage: {},
        },
      });
      return false;
    } finally {
      hide();
      dispatch({
        type: SET_DATA,
        payload: {
          machineDetailLoading: false,
        },
      });
    }
  }

  const getLog = async () => {
    dispatch({
      type: SET_DATA,
      payload: {
        machineDetailLoading: true,
      },
    });
    const hide = message.loading('loading...', 0);
    try {
      const {code,data,msg} = await qyeryLog({ip:tableIp});
      if (code === 200 && data) {
        dispatch({
          type: SET_DATA,
          payload: {
            logtMessage: data.ass_log ? data.ass_log : '',
            reportMessage: data.ass_report ? data.ass_report : '',
            impLogMessage: data.imp_log ? data.imp_log : '',
            impReportMessage: data.imp_report ? data.imp_report : '',
          },
        });
        return true;
      }
      message.error(msg);
      return false;
    } catch (e) {
      dispatch({
        type: SET_DATA,
        payload: {
          logtMessage: '',
          reportMessage: '',
          impLogMessage: '',
          impReportMessage: '',
        },
      });
      return false;
    } finally {
      hide();
      dispatch({
        type: SET_DATA,
        payload: {
          machineDetailLoading: false,
        },
      });
    }
  }

  return (
    <div className={styles.content}>
      <Card title={tableIpVersion}>
        <Tabs
          defaultActiveKey="1"
          activeKey={activeKey}
          onChange={(key) => {
            getActiveKey(key);
          }}
        >
          <TabPane
            key="1"
            tab={
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {activeKey === '1' ? (
                  <LiveTabIcon style={{ marginRight: 6 }} />
                ) : (
                  <TabIcon style={{ marginRight: 6 }} />
                )}
                机器信息
              </div>
            }
          >
            <MachineMessage />
          </TabPane>
          <TabPane
            key="2"
            tab={
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {activeKey === '2' ? (
                  <LiveTabIcon style={{ marginRight: 6 }} />
                ) : (
                  <TabIcon style={{ marginRight: 6 }} />
                )}
                迁移信息
              </div>
            }
          >
            <MigrateMessage />
          </TabPane>
          <TabPane
            key="3"
            tab={
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {activeKey === '3' ? (
                  <LiveTabIcon style={{ marginRight: 6 }} />
                ) : (
                  <TabIcon style={{ marginRight: 6 }} />
                )}
                评估日志
              </div>
            }
          >
            <LogMessage data={logtMessage}/>
          </TabPane>
          <TabPane
            key="4"
            tab={
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {activeKey === '4' ? (
                  <LiveTabIcon style={{ marginRight: 6 }} />
                ) : (
                  <TabIcon style={{ marginRight: 6 }} />
                )}
                评估报告
              </div>
            }
          >
            <LogMessage data={reportMessage}/>
          </TabPane>
          <TabPane
            key="5"
            tab={
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {activeKey === '5' ? (
                  <LiveTabIcon style={{ marginRight: 6 }} />
                ) : (
                  <TabIcon style={{ marginRight: 6 }} />
                )}
                实施日志
              </div>
            }
          >
            <LogMessage data={impLogMessage}/>
          </TabPane>
          <TabPane
            key="6"
            tab={
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {activeKey === '6' ? (
                  <LiveTabIcon style={{ marginRight: 6 }} />
                ) : (
                  <TabIcon style={{ marginRight: 6 }} />
                )}
                实施报告
              </div>
            }
          >
            <LogMessage data={impReportMessage}/>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
}

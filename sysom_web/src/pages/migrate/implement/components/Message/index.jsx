import React, { useState, useEffect, useContext } from 'react';
import { Tabs, Card } from 'antd';
import styles from './style.less';
import { ReactComponent as TabIcon } from '@/pages/migrate/static/tab.svg';
import { ReactComponent as LiveTabIcon } from '@/pages/migrate/static/liveTab.svg';
import MachineMessage from './components/MachineMessage';
import LogMessage from './components/Log';
import { WrapperContext } from '../../containers';
import Report from './components/Report';
const { TabPane } = Tabs;

export default function Message() {
  const {
    dispatch,
    state: { tableIpVersion },
  } = useContext(WrapperContext);
  const [activeKey, setActiveKey] = useState('1');
  
  return (
    <div className={styles.content}>
      <Card title={tableIpVersion}>
        <Tabs
          defaultActiveKey="1"
          activeKey={activeKey}
          onChange={(key) => {
            setActiveKey(key);
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
            key="3"
            tab={
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {activeKey === '3' ? (
                  <LiveTabIcon style={{ marginRight: 6 }} />
                ) : (
                  <TabIcon style={{ marginRight: 6 }} />
                )}
                迁移日志
              </div>
            }
          >
            <LogMessage />
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
                迁移报告
              </div>
            }
          >
            <Report />
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
}

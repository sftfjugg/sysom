import React, { useContext, useState } from 'react';
import { Collapse, Card, Row, Col, Empty, Skeleton } from 'antd';
import {
  BankOutlined,
  RotateLeftOutlined,
  RotateRightOutlined,
} from '@ant-design/icons';
import styles from './style.less';
import { WrapperContext } from '../../../../containers';
import { nanoid } from 'nanoid';

const { Panel } = Collapse;
export default function Report() {
  const {
    state: { reportMessage, machineDetailLoading },
  } = useContext(WrapperContext);
  
  return (
    <div style={{ height: 'calc(100vh - 48px)', overflow: 'scroll' }}>
      <Skeleton loading={machineDetailLoading}>
        {reportMessage ? (
          <pre style={{ color: 'rgba(255,255,255,0.65)' }}>{reportMessage}</pre>
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ marginTop: 100 }} />
        )}
      </Skeleton>
    </div>
    // <div className={styles.content}>
    //   <Skeleton loading={machineDetailLoading}>
    //     {reportMessage && reportMessage.before === undefined ? (
    //       <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ marginTop: 100 }} />
    //     ) : (
    //       <>
    //         <Collapse defaultActiveKey={['1']} style={{ marginBottom: 24 }}>
    //           <Panel
    //             header={
    //               <div style={{ fontSize: 16 }}>
    //                 <BankOutlined style={{ color: '#1890ff', marginRight: '13px' }} />
    //                 <span>系统信息迁移对比</span>
    //               </div>
    //             }
    //             key="1"
    //           >
    //             <Row>
    //               <Col span={12}>
    //                 <Card
    //                   title={
    //                     <>
    //                       <RotateLeftOutlined style={{ color: '#FCC00B', marginRight: '9px' }} />
    //                       迁移前
    //                     </>
    //                   }
    //                 >
    //                   {reportMessage && reportMessage.before && reportMessage.before.length !== 0 && reportMessage.before.map((item) => (
    //                     <div className={styles.rowLine} key={nanoid()}>
    //                       {item.name}：{item.value}
    //                     </div>
    //                   ))}
    //                 </Card>
    //               </Col>
    //               <Col span={12}>
    //                 <Card
    //                   title={
    //                     <>
    //                       <RotateRightOutlined style={{ color: '#FCC00B', marginRight: '9px' }} />
    //                       迁移后
    //                     </>
    //                   }
    //                 >
    //                   {reportMessage && reportMessage.after && reportMessage.after.length !== 0 && reportMessage.after.map((item) => (
    //                     <div className={styles.rowLine} key={nanoid()}>
    //                       {item.name}：{item.value}
    //                     </div>
    //                   ))}
    //                 </Card>
    //               </Col>
    //             </Row>
    //           </Panel>
    //         </Collapse>
    //       </>
    //     )}
    //   </Skeleton>
    // </div>
  );
}

import React, { useContext } from 'react';
import { Card, Col, Row, Empty, Skeleton, Popover } from 'antd';
import { AppstoreOutlined, HddOutlined } from '@ant-design/icons';
import { WrapperContext } from '../../../../containers';
import { ReactComponent as SoftIcon } from '@/pages/migrate/static/softIcon.svg';
import styles from './style.less';
import { nanoid } from 'nanoid';

export default function MachineMessage() {
  const {
    state: { systemMessage, machineDetailLoading },
  } = useContext(WrapperContext);
  
  const showItemDom = (item,index) => {
    return (
      <Col span={12} key={index}>
        {Number(item.name ? item.name.length : 0) + Number(item.value ? item.value.length : 0) > 25 ?
          <Popover content={<pre style={{ color: 'rgba(255,255,255,0.65)' }}>{item.value}</pre>} placement="bottomLeft">
            <div className={styles.machineItem}>{item.name}：{item.value}</div>
          </Popover>
          :
          <div className={styles.machineItem}>{item.name}：{item.value}</div>
        }
      </Col>
    )
  }

  return (
    <div className={styles.content}>
      <Skeleton loading={machineDetailLoading}>
        <Card
          className={styles.card}
          title={
            <>
              <AppstoreOutlined style={{ marginRight: 12, color: '#1890ff' }} />
              基本信息
            </>
          }
        >
          <Row gutter={[0, 20]}>
            {systemMessage.base_info && systemMessage.base_info.length !== 0 ? (
              <>
                {systemMessage.base_info.map((item,index) => (
                  showItemDom(item,index)
                ))}
              </>
            ) : (
              <Col span={24} key={nanoid()}>
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
              </Col>
            )}
          </Row>
        </Card>
        <Card
          className={styles.card}
          title={
            <>
              <HddOutlined style={{ marginRight: 12, color: '#1890ff' }} />
              硬件信息
            </>
          }
        >
          <Row gutter={[0, 20]}>
            {systemMessage.hard_info && systemMessage.hard_info.length !== 0  ? (
              <>
                {systemMessage.hard_info.map((item,index) => (
                  showItemDom(item,index)
                ))}
              </>
            ) : (
              <Col span={24} key={nanoid()}>
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
              </Col>
            )}
          </Row>
        </Card>
        <Card
          className={styles.card}
          title={
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <SoftIcon style={{ marginRight: 12 }} />
              软件信息
            </div>
          }
        >
          <Row gutter={[0, 20]}>
            {systemMessage.soft_info && systemMessage.soft_info.length !== 0  ? (
              <>
                {systemMessage.soft_info.map((item,index) => (
                  showItemDom(item,index)
                ))}
              </>
            ) : (
              <Col span={24} key={nanoid()}>
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
              </Col>
            )}
          </Row>
        </Card>
      </Skeleton>
    </div>
  );
}

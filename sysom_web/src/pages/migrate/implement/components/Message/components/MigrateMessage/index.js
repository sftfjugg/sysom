import React, { useContext } from 'react';
import { Card, Col, Row, Empty, Skeleton, Popover } from 'antd';
import { AppstoreOutlined, HddOutlined } from '@ant-design/icons';
import { WrapperContext } from '../../../../containers';
import { ReactComponent as SoftIcon } from '@/pages/migrate/static/softIcon.svg';
import styles from '../MachineMessage/style.less';
import { nanoid } from 'nanoid';

export default function MigrateMessage() {
  const {
    state: {migMessage, machineDetailLoading},
  } = useContext(WrapperContext);
  
  const showItemDom = (item) => {
    return (
      <Col span={12} key={nanoid()}>
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
              迁移配置
            </>
          }
        >
          <Row gutter={[0, 20]}>
            {migMessage.migration_info && migMessage.migration_info.length !== 0 ? (
              <>
                {migMessage.migration_info.map((item) => (
                  showItemDom(item)
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
              实施步骤
            </>
          }
        >
          <Row gutter={[0, 20]}>
            {migMessage.migration_step && migMessage.migration_step.length !== 0  ? (
              <>
                {migMessage.migration_step.map((item) => (
                  showItemDom(item)
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

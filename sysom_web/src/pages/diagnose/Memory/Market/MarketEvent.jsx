import { Statistic } from 'antd';
import { useState } from 'react';
import ProCard from '@ant-design/pro-card';
import RcResizeObserver from 'rc-resize-observer';
import styles from '../../diagnose.less';

const { Divider } = ProCard;

const DiagExtra = (props) => {
  return (
    <>
      <div className={styles.titname}>诊断ID: </div>
      <div className={styles.titneir}>{props.dataSour.task_id}</div>
      <div className={styles.titname}>诊断时间: </div>
      <div className={styles.titneir}>{props.dataSour.created_at}</div>
    </>
  )
}

export default (props) => {
  const [responsive, setResponsive] = useState(false);
  return (
    <RcResizeObserver
      key="resize-observer"
      onResize={(offset) => {
        setResponsive(offset.width < 596);
      }}
    >
      <ProCard
        title={props.title}
        extra={[
          <DiagExtra dataSour={props.recorded} key="diagextra"/>,
        ]}
        split={responsive ? 'horizontal' : 'vertical'}
        headerBordered
      >
        <ProCard.Group title={props.subtitle} direction={responsive ? 'column' : 'row'}>
          <ProCard>
            <Statistic title="内存利用率" value={props.data.event.util} suffix="%" valueStyle={{ color: (props.data.event.util) > "50" ? "red" : "green" }} />
          </ProCard>
          <Divider type={responsive ? 'horizontal' : 'vertical'} />
          <ProCard>
            <Statistic title="内存泄漏检查" value={(props.data.event.leak) === false ? "正常" : (props.data.memleak.type)} valueStyle={{ color: (props.data.event.leak) === false ? "green" : "red" }} />
          </ProCard>
          <Divider type={responsive ? 'horizontal' : 'vertical'} />
          <ProCard>
            <Statistic title="Memcg泄露检查" value={(props.data.event.memcg) === false ? "正常" : "危险"} valueStyle={{ color: (props.data.event.memcg) === false ? "green" : "red" }} />
          </ProCard>
          <Divider type={responsive ? 'horizontal' : 'vertical'} />
          <ProCard>
            <Statistic title="内存碎片化评估" value={(props.data.event.memfrag) === false ? "正常" : "危险"} valueStyle={{ color: (props.data.event.memfrag) === false ? "green" : "red" }} />
          </ProCard>
        </ProCard.Group>
      </ProCard>
    </RcResizeObserver>
  );
}
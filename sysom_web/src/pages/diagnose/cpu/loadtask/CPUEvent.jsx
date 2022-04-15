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
          <DiagExtra dataSour={props.data} key="diagextra" />,
        ]}
        split={responsive ? 'horizontal' : 'vertical'}
        headerBordered
      >
        <ProCard.Group title={props.subtitle} direction={responsive ? 'column' : 'row'}>
          <ProCard>
            <Statistic title="系统平均负载" value={props.data.result.result.loadavg}
              valueStyle={{ color: (props.data.result.result.loadavg) > "50" ? "red" : "green" }} />
          </ProCard>
          <Divider type={responsive ? 'horizontal' : 'vertical'} />
          <ProCard>
            <Statistic title="Sys影响检测" value={(props.data.result.result.sys) === "false" ? "正常" : "危险"}
              valueStyle={{ color: (props.data.result.result.sys) === "false" ? "green" : "red" }} />
          </ProCard>
          <Divider type={responsive ? 'horizontal' : 'vertical'} />
          <ProCard>
            <Statistic title="硬件中断影响检测" value={(props.data.result.result.irq) === "false" ? "正常" : "危险"}
              valueStyle={{ color: (props.data.result.result.irq) === "false" ? "green" : "red" }} />
          </ProCard>
          <Divider type={responsive ? 'horizontal' : 'vertical'} />
          <ProCard>
            <Statistic title="软中断影响检测" value={(props.data.result.result.softirq) === "false" ? "正常" : "危险"}
              valueStyle={{ color: (props.data.result.result.softirq) === "false" ? "green" : "red" }} />
          </ProCard>
          <Divider type={responsive ? 'horizontal' : 'vertical'} />
          <ProCard>
            <Statistic title="IO影响检测" value={(props.data.result.result.io) === "false" ? "正常" : "危险"}
              valueStyle={{ color: (props.data.result.result.io) === "false" ? "green" : "red" }} />
          </ProCard>
        </ProCard.Group>
      </ProCard>
    </RcResizeObserver>
  );
}
import { Button, Statistic, Select, Descriptions, message } from 'antd';
import { useState, useRef } from 'react';
import ProCard from '@ant-design/pro-card';
import RcResizeObserver from 'rc-resize-observer';
import { EditOutlined, EllipsisOutlined, SettingOutlined } from '@ant-design/icons';
import styles from '../diagnose.less';

const { Divider } = ProCard;
const { Option } = Select;

const DiagCard = () => {
  const handleChange = (value) => {
    console.log(value);
  }
  return (
    <>
      <div className={styles.titname}>诊断ID：</div>
      <div className={styles.titneir}>{"pt-8cenu2bm"}</div>
      <div className={styles.titname}>诊断时间：</div>
      <div className={styles.titneir}>{"pt-8cenu2bm"}</div>
      <div className={styles.titname}>选择磁盘：</div>
      <div className={styles.titneir}>
        <Select
          labelInValue
          defaultValue={{ value: 'sda' }}
          style={{ width: 120 }}
          onChange={handleChange}
        >
          <Option value="sda">sda</Option>
          <Option value="sde">sde</Option>
        </Select>
      </div>
    </>
  )
}

const PacketLoss = () => {
  const [responsive, setResponsive] = useState(false);
  return (
    <RcResizeObserver
      key="resize-observer"
      onResize={(offset) => {
        setResponsive(offset.width < 596);
      }}
    >
      <ProCard
        title="诊断结果"
        extra={[
          <DiagCard key="diagcard"/>,
        ]}
        split={responsive ? 'horizontal' : 'vertical'}
        headerBordered
      >
        <ProCard title="诊断链路" gutter={8}>
          <ProCard colSpan={{md: 6}} title="OS(block)" layout="center" bordered headerBordered direction="column">
            <div className={styles.ostitle}>{"4.975"} %</div>
            <div>Max：{"61.0"}</div>
            <div>AVG：{"61.0"}</div>
            <div>MIN：{"61.0"}</div>
          </ProCard>
          <ProCard colSpan={{md: 6}} title="OS(driver)" layout="center" bordered headerBordered direction="column">
            <div className={styles.ostitle}>{"1.468"} %</div>
            <div>Max：{"18.0"}</div>
            <div>AVG：{"18.0"}</div>
            <div>MIN：{"18.0"}</div>
          </ProCard>
          <ProCard colSpan={{md: 6}} title="disk" layout="center" bordered headerBordered direction="column">
            <div className={styles.ostitle}>{"93.158"} %</div>
            <div>Max：{"1142.0"}</div>
            <div>AVG：{"1142.0"}</div>
            <div>MIN：{"1142.0"}</div>
          </ProCard>
          <ProCard colSpan={{md: 6}} title="OS(complete)" layout="center" bordered headerBordered direction="column">
            <div className={styles.ostitle}>{"0.407"} %</div>
            <div>Max：{"5.0"}</div>
            <div>AVG：{"5.0"}</div>
            <div>MIN：{"5.0"}</div>
          </ProCard>
        </ProCard>
      </ProCard>
    </RcResizeObserver>
  );
}
export default PacketLoss
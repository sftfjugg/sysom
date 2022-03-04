import { Button, Statistic, Select, Descriptions, message, Row, Col } from 'antd';
import { ArrowRightOutlined } from '@ant-design/icons';
import { useState, useRef } from 'react';
import ProCard from '@ant-design/pro-card';
import RcResizeObserver from 'rc-resize-observer';
import { EditOutlined, EllipsisOutlined, SettingOutlined } from '@ant-design/icons';
import styles from '../diagnose.less';

const { Divider } = ProCard;
const { Option } = Select;

const DiagExtra = () => {
  return (
    <>
      <div className={styles.titname}>诊断ID：</div>
      <div className={styles.titneir}>{"pt-8cenu2bm"}</div>
      <div className={styles.titname}>诊断时间：</div>
      <div className={styles.titneir}>{"pt-8cenu2bm"}</div>
    </>
  )
}

const PacketLoss = (props) => {
  const [responsive, setResponsive] = useState(false);
  return (
    <RcResizeObserver
      key="resize-observer"
      onResize={(offset) => {
        setResponsive(offset.width < 596);
      }}
    >
      <ProCard
        title={props.data.diskname}
        extra={[
          <DiagExtra key="diagextra"/>,
        ]}
        split={responsive ? 'horizontal' : 'vertical'}
        headerBordered
      >
        <ProCard title="诊断链路" gutter={8}>
          {/* <ProCard colSpan={{md: 1}} layout="center" direction="column"></ProCard> */}
          {
            props.data.delays.map((item,index) => {
              console.log(item,index,"kkkkkk");
              return(
                  <ProCard
                    colSpan={{md: 6}} 
                    key={index} 
                    title={item.component} 
                    layout="center" 
                    bordered 
                    headerBordered 
                    direction="column" 
                    >
                      <div className={styles.ostitle}>{item.percent}</div>
                      <div>Max：{item.max}</div>
                      <div>AVG：{item.avg}</div>
                      <div>MIN：{item.min}</div>
                      {
                        index !== 3 ? 
                        <ArrowRightOutlined className={styles.iconcard} />
                        : 
                        <></>
                      }
                    </ProCard>
              )
            })
          }
          {/* <ProCard colSpan={{md: 1}} layout="center" direction="column"></ProCard> */}
        </ProCard>
      </ProCard>
    </RcResizeObserver>
  );
}
export default PacketLoss
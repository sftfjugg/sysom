import { Button, Statistic } from 'antd';
import { useState, useRef } from 'react';
import ProCard from '@ant-design/pro-card';
import RcResizeObserver from 'rc-resize-observer';

const { Divider } = ProCard;

const PacketLoss = (props) => {
  const [responsive, setResponsive] = useState(false);
  return (
    <RcResizeObserver
      key="resize-observer"
      onResize={(offset) => {
        setResponsive(offset.width < 596);
      }}
    >
      <ProCard.Group title="丢包统计" direction={responsive ? 'column' : 'row'}>
        <ProCard>
          <Statistic title="诊断ID" value={props.data.task_id} valueStyle={{ color: "red" }} />
        </ProCard>
        <Divider type={responsive ? 'horizontal' : 'vertical'} />
        <ProCard>
          <Statistic title="诊断时间" value={props.data.created_at} valueStyle={{ color: "red" }} />
        </ProCard>
        <Divider type={responsive ? 'horizontal' : 'vertical'} />
        <ProCard>
          <Statistic title="发包数量" value={props.data.result.stat.packet_num[0].num} suffix="个" valueStyle={{ color: "red" }} />
        </ProCard>
        <Divider type={responsive ? 'horizontal' : 'vertical'} />
        <ProCard>
          <Statistic title="丢包数量" value={props.data.result.stat.packet_num[2].num} suffix="个" valueStyle={{ color: "red" }} />
        </ProCard>
        <Divider type={responsive ? 'horizontal' : 'vertical'} />
        <ProCard>
          <Statistic title="回包数量" value={props.data.result.stat.packet_num[1].num} suffix="个" valueStyle={{ color: "red" }} />
        </ProCard>
      </ProCard.Group>
    </RcResizeObserver>
  );
}
export default PacketLoss
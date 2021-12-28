import { Button, Statistic } from 'antd';
import { useState, useRef } from 'react';
import ProCard from '@ant-design/pro-card';
import RcResizeObserver from 'rc-resize-observer';

const { Divider } = ProCard;

const PacketLoss = () => {
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
          <Statistic title="诊断ID" value={"pt-8cenu2bm"} valueStyle={{ color: "red" }} />
        </ProCard>
        <Divider type={responsive ? 'horizontal' : 'vertical'} />
        <ProCard>
          <Statistic title="诊断时间" value="2021-12-17" valueStyle={{ color: "red" }} />
        </ProCard>
        <Divider type={responsive ? 'horizontal' : 'vertical'} />
        <ProCard>
          <Statistic title="发包数量" value={100} suffix="个" valueStyle={{ color: "red" }} />
        </ProCard>
        <Divider type={responsive ? 'horizontal' : 'vertical'} />
        <ProCard>
          <Statistic title="丢包数量" value={0} suffix="个" valueStyle={{ color: "red" }} />
        </ProCard>
        <Divider type={responsive ? 'horizontal' : 'vertical'} />
        <ProCard>
          <Statistic title="回包数量" value={100} suffix="个" valueStyle={{ color: "red" }} />
        </ProCard>
      </ProCard.Group>
    </RcResizeObserver>
  );
}
export default PacketLoss
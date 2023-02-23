import { Statistic } from 'antd';
import { useState, useEffect } from 'react';
import ProCard from '@ant-design/pro-card';
import RcResizeObserver from 'rc-resize-observer';
import { getStatistics } from '../service';

const { Divider } = ProCard;

const VmcoreCard = () => {
  const [responsive, setResponsive] = useState(false);
  const [StatisticList, setStatisticList] = useState()

  useEffect(async () => {
    const data = await getStatistics()
    setStatisticList(data)
  }, [])

  return (
    <RcResizeObserver
      key="resize-observer"
      onResize={(offset) => {
        setResponsive(offset.width < 596);
      }}
    >
      <ProCard.Group title="核心指标" direction={responsive ? 'column' : 'row'}>
        <ProCard>
          <Statistic title="最近30天宕机总数" value={StatisticList?.vmcore_30days} valueStyle={{ color: "red" }} />
        </ProCard>
        <Divider type={responsive ? 'horizontal' : 'vertical'} />
        <ProCard>
          <Statistic title="最近7天宕机总数" value={StatisticList?.vmcore_7days} valueStyle={{ color: "red" }} />
        </ProCard>
        <Divider type={responsive ? 'horizontal' : 'vertical'} />
        <ProCard>
          <Statistic title="月宕机率" value={StatisticList?.rate_30days} precision={2} suffix="%" valueStyle={{ color: "red" }} />
        </ProCard>
        <Divider type={responsive ? 'horizontal' : 'vertical'} />
        <ProCard>
          <Statistic title="最近7天宕机率" value={StatisticList?.rate_7days} precision={2} suffix="%" valueStyle={{ color: "red" }} />
        </ProCard>
      </ProCard.Group>
    </RcResizeObserver>
  );
}
export default VmcoreCard
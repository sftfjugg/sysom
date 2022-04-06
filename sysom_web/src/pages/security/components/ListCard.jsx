import { Statistic ,Button} from 'antd';
import { useState, useEffect } from 'react';
import ProCard from '@ant-design/pro-card';
import RcResizeObserver from 'rc-resize-observer';
import {summaryApi} from '../service'
const { Divider } = ProCard;


const  ListCard=()=> {
    const [responsive, setResponsive] = useState(false);
    const [StatisticList, setStatisticList] = useState()

    useEffect(async() => {
        const   msg=await summaryApi();
         console.log(msg)
         setStatisticList(msg)
        }, []);
  return (
    <RcResizeObserver
    key="resize-observer"
    onResize={(offset) => {
      setResponsive(offset.width < 596);
    }}>
      <ProCard.Group  direction={responsive ? 'column' : 'row'}>
        <ProCard>
          <Statistic title="需要修复的漏洞(CVE)" value={StatisticList?.affect} valueStyle={{ color: "red" }} />
        </ProCard>
        <Divider type={responsive ? 'horizontal' : 'vertical'} />
        <ProCard>
          <Statistic title="需要修复的高危漏洞(CVE)" value={StatisticList?.vmcore_7days} valueStyle={{ color: "red" }} />
        </ProCard>
        <Divider type={responsive ? 'horizontal' : 'vertical'} />
        <ProCard>
          <Statistic title="存在漏洞的主机" value={StatisticList?.rate_30days}  valueStyle={{ color: "red" }} />
        </ProCard>
        <Divider type={responsive ? 'horizontal' : 'vertical'} />
        <ProCard>
          <Statistic title="今日已修复漏洞" value={StatisticList?.rate_7days}   valueStyle={{ color: "red" }} />
        </ProCard>
        <Divider type={responsive ? 'horizontal' : 'vertical'} />
        <ProCard>
          <Statistic title="累计已修复的漏洞" value={StatisticList?.vmcore_30days} valueStyle={{ color: "red" }} />
        </ProCard>
        <Divider type={responsive ? 'horizontal' : 'vertical'} />
        <ProCard>
          <Statistic title="最新扫描时间" value={StatisticList?.vmcore_30days} valueStyle={{ color: "red" }} />
        </ProCard>
        <Divider type={responsive ? 'horizontal' : 'vertical'} />
        <ProCard>            
             <Button >一键扫描</Button>
        </ProCard>
      </ProCard.Group>
    </RcResizeObserver>
  );
}

export default ListCard;

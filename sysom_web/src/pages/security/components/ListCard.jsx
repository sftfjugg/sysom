import { Statistic ,Button} from 'antd';
import { useState, useEffect } from 'react';
import ProCard from '@ant-design/pro-card';
import RcResizeObserver from 'rc-resize-observer';
import {summaryApi} from '../service'
const { Divider } = ProCard;
import '../List/list.less'
import { size } from 'lodash-es';


const  ListCard=()=> {
    const [responsive, setResponsive] = useState(false);
    const [StatisticList, setStatisticList] = useState()

    useEffect(async() => {
        const   msg=await summaryApi();
        //  console.log(msg)
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
          <Statistic title="需要修复的高危漏洞(CVE)" value={StatisticList?.cvecount} valueStyle={{ color: "red" }} />
        </ProCard>
        <Divider type={responsive ? 'horizontal' : 'vertical'} />
        <ProCard>
          <Statistic title="存在漏洞的主机" value={StatisticList?.highcount}  valueStyle={{ color: "red" }} />
        </ProCard>
        <Divider type={responsive ? 'horizontal' : 'vertical'} />
        <ProCard>
          <Statistic title="今日已修复漏洞" value={StatisticList?.cvefix}   valueStyle={{ color: "red" }} />
        </ProCard>
        <Divider type={responsive ? 'horizontal' : 'vertical'} />
        <ProCard>
          <Statistic title="累计已修复的漏洞" value={StatisticList?.cvefix_all} valueStyle={{ color: "red" }} />
        </ProCard>
        <Divider type={responsive ? 'horizontal' : 'vertical'} />
        <ProCard>
          <Statistic title="最新扫描时间" className="fontsize" value={StatisticList?.last_time} valueStyle={{ color: "red",fontSize:22 }} />
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

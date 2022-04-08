import { Statistic ,Button, message} from 'antd';
import { useState, useEffect } from 'react';
import { useIntl, FormattedMessage } from 'umi';
import ProCard from '@ant-design/pro-card';
import RcResizeObserver from 'rc-resize-observer';
import {summaryApi,updataApi} from '../service'
const { Divider } = ProCard;
import '../List/list.less'
import { size } from 'lodash-es';


const  ListCard=(props)=> {
  const intl = useIntl();
    const [responsive, setResponsive] = useState(false);
    const [complete, setComplete] = useState(false);
    const [StatisticList, setStatisticList] = useState()
    const getSummary = async() => {
      setComplete(true);
      let msg=await summaryApi();
      if(msg){
        setComplete(false);
        if(msg.success){
          message.success(intl.formatMessage({id:'component.ListCard.success',defaultMessage:'Scan success'}));
          setStatisticList(msg.data.fixed_cve)
          props.refreshTable();
        }else{
          message.error(intl.formatMessage({id:'component.ListCard.failed',defaultMessage:'Scan failed'}));
        }
      }
    }
    useEffect(async() => {
      let msg=await summaryApi();
      if(msg.success)
       setStatisticList(msg.data.fixed_cve)
      }, []);
        
  return (
    <RcResizeObserver
    key="resize-observer"
    onResize={(offset) => {
      setResponsive(offset.width < 596);
    }}>
      <ProCard.Group  direction={responsive ? 'column' : 'row'}>
        <ProCard>
          <Statistic title={intl.formatMessage({
          id: 'component.ListCard.needed_to_repair',
          defaultMessage: 'Need to repair',
        })}
           value={StatisticList?.cve_count} valueStyle={{ color: "red", textAlign:'center' }} />
        </ProCard>
        <Divider type={responsive ? 'horizontal' : 'vertical'} />
        <ProCard>
          <Statistic title={intl.formatMessage({
          id: 'component.ListCard.high_needed_to_repair',
          defaultMessage: 'High-risk need to Repair',
        })}
           value={StatisticList?.high_cve_count} valueStyle={{ color: "red", textAlign:'center' }} />
        </ProCard>
        <Divider type={responsive ? 'horizontal' : 'vertical'} />
        <ProCard>
          <Statistic title={intl.formatMessage({
          id: 'component.ListCard.hosts_with_vul',
          defaultMessage: 'Hosts with vulnerabilities',
        })} 
        value={StatisticList?.affect_host_count}  valueStyle={{ color: "red", textAlign:'center' }} />
        </ProCard>
        <Divider type={responsive ? 'horizontal' : 'vertical'} />
        <ProCard>
          <Statistic title={intl.formatMessage({
          id: 'component.ListCard.today_repaired',
          defaultMessage: 'Today has been repaired',
        })}
           value={StatisticList?.cvefix_today_count}   valueStyle={{ color: "red", textAlign:'center' }} />
        </ProCard>
        <Divider type={responsive ? 'horizontal' : 'vertical'} />
        <ProCard>
          <Statistic title={intl.formatMessage({
          id: 'component.ListCard.cumulate_repaired',
          defaultMessage: 'Cumulative revision',
        })}
           value={StatisticList?.cvefix_all_count} valueStyle={{ color: "red",textAlign:'center' }} />
        </ProCard>
        <Divider type={responsive ? 'horizontal' : 'vertical'} />
        <ProCard>
          <Statistic title={intl.formatMessage({
          id: 'component.ListCard.latest_scan_time',
          defaultMessage: 'Latest scan time',
        })}
           value={StatisticList?.latest_scan_time} valueStyle={{ color: "white",fontSize:13,whiteSpace:'nowrap',textAlign:'center' }} />
        </ProCard>
        <ProCard>            
            <Button onClick={getSummary} type="primary" loading={complete}>{complete ? <FormattedMessage id="component.ListCard.scanning" defaultMessage="Scanning" /> : <FormattedMessage id="component.ListCard.scan" defaultMessage="Scan" />}</Button>
        </ProCard>
      </ProCard.Group>
    </RcResizeObserver>
  );
}

export default ListCard;

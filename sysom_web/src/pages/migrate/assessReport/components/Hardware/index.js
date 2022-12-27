import React, {useContext,useEffect,useState} from 'react';
import ProTable from '@ant-design/pro-table';
import ProCard from '@ant-design/pro-card';
import ReportType from '../ReportType';
import {Col, Row,Skeleton,Popover} from 'antd';
import { WrapperContext } from '../../containers';
import {HARDWARE_TYPE} from '../../../utils';

import './index.less';

const Hardware = (props, ref) => {
  const {
    dispatch,
    state: { tabsLoading,hwInfo,hwList },
  } = useContext(WrapperContext);
  
  const completeData = [
    {title: '生产商', name:'Huawei Technologies Co, Ltd.'},
    {title: '生产商', name:'Huawei Technologies Co, Ltd.'},
    {title: '生产商', name:'Huawei Technologies Co, Ltd.'},
    {title: '生产商', name:'Huawei Technologies Co, Ltd.'},
    {title: '生产商', name:'Huawei Technologies Co, Ltd.'},
    {title: '生产商', name:'Huawei Technologies Co, Ltd.'},
  ]

  const columns = [
    {
      title: '设备名称',
      dataIndex: 'name',
      ellipsis: true,
      width: '20%',
    },
    {
      title: 'bdf',
      dataIndex: 'bdf',
      ellipsis: true,
    },
    {
      title: 'vid',
      dataIndex: 'vid',
      ellipsis: true,
    },
    {
      title: 'did',
      dataIndex: 'did',
      ellipsis: true,
    },
    {
      title: 'svid',
      dataIndex: 'svid',
      ellipsis: true,
    },
    {
      title: 'sdid',
      dataIndex: 'sdid',
      ellipsis: true,
    },
    {
      title: '驱动评估结果',
      dataIndex: 'compatible',
      width: 140,
      filters: true,
      onFilter: true,
      valueEnum: {
        support: {
          text: <span style={{fontSize: 13}}>支持</span>,
          status: false,
        },
        'need check': {
          text: <span style={{fontSize: 13}}>需人工确认（need支持）</span>,
          status: false,
        },
        'class support': {
          text: <span style={{fontSize: 13}}>需人工确认（class支持）</span>,
          status: false,
        },
        'not support': {
          text: <span style={{fontSize: 13}}>不支持</span>,
          status: false,
        },
        'unclaimed': {
          text: <span style={{fontSize: 13}}>不支持（unclaimed）</span>,
          status: false,
        },
      },
      render: ((_,record)=>{
        switch (record && record.compatible){
            case 'need check':
            case 'class support':
              return (
                <div style={{fontSize: 13, display:'flex',alignItems:'center'}}>
                  <i style={{background: '#D89614',height: '6px',width:'6px',borderRadius:'3px',marginRight:'7px'}}></i>
                  <span>需人工评估</span>
                </div>
              );
            case 'not support':
            case 'unclaimed':
              return (
                <div style={{fontSize: 13, display:'flex',alignItems:'center'}}>
                  <i style={{background: '#A61D24',height: '6px',width:'6px',borderRadius:'3px',marginRight:'7px'}}></i>
                  <span>不支持</span>
                </div>
              );
            case 'support':
              return (
                <div style={{fontSize: 13, display:'flex',alignItems:'center'}}>
                  <i style={{background: '#49AA19',height: '6px',width:'6px',borderRadius:'3px',marginRight:'7px'}}></i>
                  <span>支持</span>
                </div>
              );
            default: return record.compatible;
        }
      }),
    },
    {
      title: 'ancert验证结果',
      dataIndex: 'certified',
      width: 150,
      filters: true,
      onFilter: true,
      valueEnum: {
        False: {
          text: <span style={{fontSize: 13}}>无</span>,
          status: 'Error',
        },
        True: {
          text: <span style={{fontSize: 13}}>通过</span>,
          status: 'Success',
        },
      },
    },
    {
      title: '操作',
      dataIndex: 'option',
      valueType: 'option',
      render: (_, record) => (
        <a key="assessListOption" href={'https://eco.openanolis.cn/'}>
          <span style={{marginLeft: '8px'}}>自助验证</span>
        </a>
      ),
    }
  ];

  const showItemDom = (item,index) => {
    let name = item&&HARDWARE_TYPE[item.key]?HARDWARE_TYPE[item.key]:item.key;
    return (
      <Col span={8} key={index}>
        {Number(name.length) + Number(item.value ? item.value.length : 0)> 25 ?
          <Popover content={<pre style={{ color: 'rgba(255,255,255,0.65)' }}>{item.value}</pre>} placement="bottomLeft">
            <div className='row_item_ell'>{name}：{item.value}</div>
          </Popover>
          :
          <div className='row_item'>{name}：{item.value}</div>
        }
      </Col>
    )
  }

  return (
    <div>
      <ReportType title='硬件评估报告'/>
      <Skeleton loading={tabsLoading}>
        {
          hwInfo.length !== 0 &&
          <ProCard
            title={<span>整机信息</span>}
            bodyStyle={{display: 'flex'}}
          >
            <Row className="complete_row" gutter={[10,10]}>
              {hwInfo.map((item,index) => (
                showItemDom(item,index)
              ))}
            </Row>
          </ProCard>
        }
        <div className='assess_line' />
        <ProCard
          bodyStyle={{padding: '12px 0'}}
        >
          <ProTable
            tableClassName='hardwareTable'
            headerTitle='板卡评估结果'
            rowKey='id'
            dataSource={hwList}
            columns={columns}
            search={false}
          />
        </ProCard>
      </Skeleton>
    </div>
  );
};

export default Hardware;

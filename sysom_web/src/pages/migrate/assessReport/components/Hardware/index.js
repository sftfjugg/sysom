import React, {useContext, useEffect, useState} from 'react';
import ProTable from '@ant-design/pro-table';
import ProCard from '@ant-design/pro-card';
import ReportType from '../ReportType';
import {Col, Row, Skeleton, Popover} from 'antd';
import {WrapperContext} from '../../containers';
import {HARDWARE_TYPE} from '../../../utils';
import PieCharts from '../../../../../components/Charts/Pie';
import './index.less';

const Hardware = (props, ref) => {
  const {
    dispatch,
    state: {tabsLoading, hwInfo, hwList},
  } = useContext(WrapperContext);
  const [options, setOptions] = useState([]);

  useEffect(()=>{
    let support=0,noSupport=0,check=0;
    hwList?.length >0 && hwList.forEach((i)=>{
      switch(i.compatible){
          case 'support':
            support += 1;
            return;
          case 'not support':
          case 'unclaimed':
            noSupport += 1;
            return;
          case 'need check':
          case 'class support':
            check += 1;
            return;
          default: 
            return;
      }
    });
    let arr = [
      {value: check, name: '需人工评估',color: '#D89614'},
      {value: noSupport, name: '不支持板卡',color: '#A61D24'},
      {value: support, name: '支持板卡',color: '#49AA19'},
    ];
    setOptions(arr);
  },[hwList])
  
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
      render: ((_, record)=>{
        switch (record && record.compatible) {
            case 'need check':
            case 'class support':
              return (
                <div style={{fontSize: 13, display: 'flex',alignItems: 'center'}}>
                  <i style={{background: '#D89614',height: '6px',width: '6px',borderRadius: '3px',marginRight: '7px'}}></i>
                  <span>需人工评估</span>
                </div>
              );
            case 'not support':
            case 'unclaimed':
              return (
                <div style={{fontSize: 13, display: 'flex',alignItems: 'center'}}>
                  <i style={{background: '#A61D24',height: '6px',width: '6px',borderRadius: '3px',marginRight: '7px'}}></i>
                  <span>不支持</span>
                </div>
              );
            case 'support':
              return (
                <div style={{fontSize: 13, display: 'flex',alignItems: 'center'}}>
                  <i style={{background: '#49AA19',height: '6px',width: '6px',borderRadius: '3px',marginRight: '7px'}}></i>
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

  const showItemDom = (item, index) => {
    let name = item && HARDWARE_TYPE[item.key] ? HARDWARE_TYPE[item.key] : item.key;
    return (
      <Col span={8} key={index}>
        {Number(name.length)+Number(item.value ? item.value.length : 0)>25 
          ? <Popover content={<pre style={{color: 'rgba(255,255,255,0.65)'}}>{item.value}</pre>} placement="bottomLeft">
            <div className='row_item_ell'>{name}：{item.value}</div>
          </Popover>
          : <div className='row_item'>{name}：{item.value}</div>
        }
      </Col>
    );
  };

  return (
    <div>
      <Row>
        <Col span={14}>
          <ReportType title='硬件评估报告'/>
        </Col>
        <Col span={10} style={{background: '#000'}}>
          <PieCharts
            id='hardWare'
            width='100%'
            height='120px'
            padding='15px 0 0 0'
            options={options}
          />
        </Col>
      </Row>
      <Skeleton loading={tabsLoading}>
        {
          hwInfo.length !== 0
          && <ProCard
            title={<span>整机信息</span>}
            bodyStyle={{display: 'flex'}}
          >
            <Row className='complete_row' gutter={[10, 10]}>
              {hwInfo.map((item, index) => (
                showItemDom(item, index)
              ))}
            </Row>
          </ProCard>
        }
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

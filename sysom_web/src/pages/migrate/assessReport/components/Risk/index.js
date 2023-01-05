import React, {useContext, useState, useEffect} from 'react';
import ProTable from '@ant-design/pro-table';
import ProCard from '@ant-design/pro-card';
import {RightCircleOutlined} from "@ant-design/icons";
import ReportType from '../ReportType';
import {Modal, Skeleton, Row, Col} from 'antd';
import { WrapperContext } from '../../containers';
import PieCharts from '../../../../../components/Charts/Pie';
import './index.less';

const Risk = (props, ref) => {
  const {
    dispatch,
    state: {tabsLoading, riskList},
  } = useContext(WrapperContext);
  const {id} = props;
  const [detailsTitle,setDetailsTitle] = useState('');
  const [detailsText,setDetailsText] = useState('');
  const [detailsModal,setDetailsModal] = useState(false);
  const [options, setOptions] = useState([]);

  useEffect(()=>{
    let high=0,medium=0,low=0,info=0;
    riskList?.length >0 && riskList.forEach((i)=>{
      switch(i.severity){
          case 'high':
            high += 1;
            return;
          case 'medium':
            medium += 1;
            return;
          case 'low':
            low += 1;
            return;
          case 'info':
            info += 1;
            return;
          default: 
            return;
      }
    });
    let arr = [
      {value: high, name: '高风险',color: '#A61D24'},
      {value: medium, name: '中风险',color: '#D89614'},
      {value: low, name: '低风险',color: '#177DDC'},
      {value: info, name: '无风险',color: '#49AA19'},
    ];
    setOptions(arr);
  },[riskList])

  const columns = [
    {
      title: '风险项',
      width: '40%',
      dataIndex: 'title',
      // ellipsis: true,
      renderText: (item, record) => {
        return(
        <div>
          <div className="risk_option" key='title'> 
            <div className='risk_option_detail' id={`title${record.id}`}>{record.title}</div>
            {isElipsis(`title${record.id}`) ? (
              <RightCircleOutlined style={{marginLeft:'5px'}} onClick={()=>showDetailsModal(record.title,'风险项')}/>
            ) : null}
          </div>
          <div className="risk_option" key='summary'> 
            <div className='risk_option_detail' id={`summary${record.id}`}>{record.summary}</div>
            {isElipsis(`summary${record.id}`) ? (
              <RightCircleOutlined style={{marginLeft:'5px'}} onClick={()=>showDetailsModal(record.summary,'详情')}/>
            ) : null}
          </div>
        </div>
      )}
    },
    {
      title: '风险',
      dataIndex: 'severity',
      filters: true,
      onFilter: true,
      width: 150,
      valueEnum: {
        high: {
          text: <span style={{fontSize: 13}}>高L1</span>,
          status: false,
        },
        medium: {
          text: <span style={{fontSize: 13}}>中L2</span>,
          status: false,
        },
        low: {
          text: <span style={{fontSize: 13}}>低L3</span>,
          status: false,
        },
        info: {
          text: <span style={{fontSize: 13}}>无</span>,
          status: false,
        },
      },
      render: ((_,record)=>{
        switch (record && record.severity){
            case 'high':
              return (
                <div style={{fontSize: 13, display:'flex',alignItems:'center'}}>
                  <i style={{background: '#A61D24',height: '6px',width:'6px',borderRadius:'3px',marginRight:'7px'}}></i>
                  <span>高L1</span>
                </div>
              );
            case 'medium':
              return (
                <div style={{fontSize: 13, display:'flex',alignItems:'center'}}>
                  <i style={{background: '#D89614',height: '6px',width:'6px',borderRadius:'3px',marginRight:'7px'}}></i>
                  <span>中L2</span>
                </div>
              );
            case 'low':
              return (
                <div style={{fontSize: 13, display:'flex',alignItems:'center'}}>
                  <i style={{background: '#177DDC',height: '6px',width:'6px',borderRadius:'3px',marginRight:'7px'}}></i>
                  <span>低L3</span>
                </div>
              );
            case 'info':
              return (
                <div style={{fontSize: 13, display:'flex',alignItems:'center'}}>
                  <i style={{background: '#49AA19',height: '6px',width:'6px',borderRadius:'3px',marginRight:'7px'}}></i>
                  <span>无</span>
                </div>
              );
            default: return '';
        }
      }),
    },
    {
      title: '建议操作',
      dataIndex: 'remediations',
      ellipsis: true,
      // width: '40%',
      render: (_, record) => {
        if(record.remediations && record.remediations.length !== 0){
          return(
            <>
              {
                record.remediations.map((i,index)=>{
                  return (
                    <div className='risk_option' key={'remediations'+index} style={{marginBottom:record.remediations.length === 1 ? 0 : '6px'}}>
                      <div className='risk_option_type'>{i.type}</div>
                      <div className='risk_option_detail' id={`detail${record.id}_${index}`}>{i.context}</div>
                      {isElipsis(`detail${record.id}_${index}`) ? (
                        <RightCircleOutlined
                          style={{marginLeft:'5px'}}
                          onClick={() => showDetailsModal(i.context, "建议操作")}
                        />
                      ) : null}
                    </div>
                  )
                })
              }
            </>
          )
        }else{
          return '无'
        }
      }
    }
  ];

  const isElipsis = (id) => {
    if(document.getElementById(id)){
      let clientWidth = document.getElementById(id).clientWidth;
      let scrollWidth = document.getElementById(id).scrollWidth;
      return (clientWidth < scrollWidth); // 说明文字被省略了
    }else{
      return false;
    }
  }

  const showDetailsModal = (text,title) => {
    setDetailsText(text);
    setDetailsTitle(title);
    setDetailsModal(true);
  }

  const handleCancel = () => {
    setDetailsModal(false);
    setDetailsText('');
    setDetailsTitle('');
  }

  return (
    <div className="risk_container">
      <Row>
        <Col span={14}>
          <ReportType title='迁移风险评估报告'/>
        </Col>
        <Col span={10} style={{background: '#000'}}>
          <PieCharts
            id='risk'
            width='100%'
            height='120px'
            padding='15px 0 0 0'
            options={options}
          />
        </Col>
      </Row>
      <Skeleton loading={tabsLoading}>
        <ProCard
          bodyStyle={{padding: '12px 0'}}
        >
          <ProTable
            tableClassName='riskTable'
            headerTitle='迁移实施风险'
            rowKey='id'
            dataSource={riskList}
            columns={columns}
            search={false}
          />
        </ProCard>
      </Skeleton>
      <Modal
        title={detailsTitle}
        visible={detailsModal}
        footer={null}
        onCancel={handleCancel}
        bodyStyle={{color: 'rgba(255,255,255,0.65)'}}
      >
        {detailsText}
      </Modal>
    </div>
  );
};

export default Risk;

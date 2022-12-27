import React,{useState,useContext,useEffect, Fragment} from 'react';
import ProTable from '@ant-design/pro-table';
import ProCard from '@ant-design/pro-card';
import {LeftOutlined} from "@ant-design/icons";
import {queryAbiList} from '../../../service';
import {Col,Row, Skeleton, Empty} from 'antd';
import { WrapperContext } from '../../containers';
import { SET_DATA } from '../../containers/constants';
import './AclDependent.less';
import {assessColumns} from '../../../utils';

const AclDependent = (props) => {
  const {
    dispatch,
    state: {
      activeId,
      aclLoading,
      aclList,
      aclActiveName,
      aclActiveType,
      abiList,
      abiLoading,
      abiContentLoading,
      abiContent,
      activeAppName,
    },
  } = useContext(WrapperContext);
  const {handleGoAppList} = props;
  // const { data, error, loading } = useRequest(queryAssessList);
  let columns = [
    {
      title: '依赖项',
      dataIndex: 'name',
      ellipsis: true,
    },
    {
      title: '源操作系统',
      dataIndex: 'provide_rpm_name_x',
      ellipsis: true,
    },
    {
      title: '目标操作系统',
      dataIndex: 'provide_rpm_name_y',
      ellipsis: true,
    },
    {
      title: '一致度',
      dataIndex: 'metric',
      width: 100,
      renderText: ((_,record)=>{
        if(record && record.metric){
          if(Number(record.metric) === 1){
            return <div>100%</div>
          }else if(Number(record.metric) === 0){
            return <div style={{color:'#D32029'}}>0%</div>
          }else{
            return <div style={Number(record.metric) !== 1 ? {color:'#D32029'}: {}}>{(record.metric * 100).toFixed(2)+'%'}</div>
          }
        } else {
          return '-';
        }
      }),
    },
  ];
  columns.push(assessColumns('评估结果','result',150))
  
  let ABIcolumns = [
    {
      title: 'ABI接口',
      dataIndex: 'name',
      ellipsis: true,
    },
  ];
  ABIcolumns.push(assessColumns('评估结果','result', 100));

  let CLIcolumns = [
    {
      title: 'CLI options',
      dataIndex: 'options',
      ellipsis: true,
    },
    {
      title: '源操作系统',
      dataIndex: 'cmp_value_x',
      ellipsis: true,
    },
    {
      title: '目标操作系统',
      dataIndex: 'cmp_value_y',
      ellipsis: true,
    },
  ];
  CLIcolumns.push(assessColumns('评估结果','result'));

  const handleAclItem = async (data) => {
    if(Number(aclActiveName) !== Number(data.name)){
      dispatch({
        type: SET_DATA,
        payload: {
          aclActiveName: data.name,
          aclActiveRpmName: data.rpm_name,
          aclActiveType: data.type,
        },
      });
      getAbiList(data);
    }
  }

  const getAbiList = async (d) => {
    dispatch({
      type: SET_DATA,
      payload: {
        abiLoading: true,
      },
    });
    try {
      const { code,data } = await queryAbiList({id:activeId,rpm_name:d.rpm_name,abi_name: d.name});
      if (code === 200) {
        dispatch({
          type: SET_DATA,
          payload: {
            abiList: data?data:[],
            abiContent: data?.length>0?data[0].detail:'',
          },
        });
        return true;
      }
      return false;
    } catch (e) {
      dispatch({
        type: SET_DATA,
        payload: {
          abiList: [],
          abiContent: '',
        },
      });
      return false;
    } finally {
      dispatch({
        type: SET_DATA,
        payload: {
          abiLoading: false,
        },
      });
    }
  }

  const handleAbiItem = async (data) => {
    dispatch({
      type: SET_DATA,
      payload: {
        abiContent: data.detail?data.detail:'',
      },
    });
  }


  const showAclTitle = () => {
    return (
      <div className='acl-title'>
        <div className='aclBtn' onClick={()=>handleGoAppList()}>
          <LeftOutlined />&nbsp;返回应用列表
        </div>
        <div className='aclTit'>{activeAppName}依赖评估</div>
      </div>
    )
  }

  const showAbiTitle = () => {
    return (
      <div className='acl-title'>
        <div className='aclTit'>{aclActiveName}</div>
        <div className='aclTit'>{(aclActiveType==='binary'?'CLI':'ABI')+'评估报告'}</div>
      </div>
    )
  }

  const showExtra = (data) => {
    if(data?.length > 0){
      let diff = data.filter((i)=>i.result==='diff');
      let less = data.filter((i)=>i.result==='less');
      return (
        <div className='acl-extra'>
          <div>共{data.length}项</div>｜
          <div>变更{diff?diff.length:0}</div>｜
          <div>缺失{less?less.length:0}</div>
        </div>
      )
    }
  }
  return(
    <Skeleton loading={aclLoading}>
      <ProCard
        headStyle={{paddingTop: '24px'}}
        title={showAclTitle()}
        extra={showExtra(aclList)}
      >
        <ProTable
          size="small"
          // rowKey='rpm_name'
          dataSource={aclList}
          columns={columns}
          toolBarRender={false}
          search={false}
          pagination={{
            pageSize: 10,
            // showSizeChanger: false,
          }}
          onRow={(record, index) => {
            return {onClick: (e) => handleAclItem(record)}
          }}
        />
      </ProCard>
      <div className='assess_line' />
      {
        aclActiveName &&
        <Skeleton loading={abiLoading}>
          <ProCard
            headStyle={{paddingTop: '24px'}}
            title={showAbiTitle()}
            extra={showExtra(abiList)}
          >
            {
              aclActiveType === 'binary'?
                <ProTable
                  size="small"
                  // rowKey='options'
                  dataSource={abiList}
                  columns={CLIcolumns}
                  toolBarRender={false}
                  search={false}
                  options={false}
                  // headerTitle="批量操作"
                  pagination={{
                    pageSize: 15,
                    // showSizeChanger: false,
                  }}
                />
              :
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <Row gutter={[16, 16]}>
                  <Col span={24}>
                    <ProTable
                      size="small"
                      // rowKey='name'
                      dataSource={abiList}
                      columns={ABIcolumns}
                      toolBarRender={false}
                      search={false}
                      options={false}
                      headerTitle="批量操作"
                      pagination={{
                        pageSize: 15,
                        // showSizeChanger: false,
                      }}
                      onRow={(record, index) => {
                        return {
                          onClick: (e) => {
                            handleAbiItem(record);
                          },
                        }
                      }}
                    />
                  </Col>
                </Row>
              </Col>
              <Col span={16} style={{overflow: 'auto'}}>
                <div className='abi_Content_title'>变更内容</div>
                <div className='abi_change_content'>
                  <Skeleton loading={abiContentLoading}>
                    {abiContent ? (
                      <pre style={{ color: 'rgba(255,255,255,0.65)' }}>{abiContent}</pre>
                    ) : (
                      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ marginTop: 100 }} />
                    )}
                  </Skeleton>
                </div>
              </Col>
            </Row>
            }

          </ProCard>
        </Skeleton>
      }
    </Skeleton>
  )
}

export default AclDependent;

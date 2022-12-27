import React, {useState,useContext, useEffect} from 'react';
import ProTable from '@ant-design/pro-table';
import ProCard from '@ant-design/pro-card';
import AclDependent from '../AclDependent/AclDependent';
import {queryAclList,queryAbiList} from '../../../service';
import {message,Skeleton, Button, Empty} from 'antd';
import ReportType from '../ReportType';
import {WrapperContext} from '../../containers';
import {SET_DATA} from '../../containers/constants';
import {assessColumns} from '../../../utils';

const Application = (props, ref) => {
  const {
    dispatch,
    state: {appList,tabsLoading,activeId,aclLoading,activeAppRpmName},
  } = useContext(WrapperContext);
  let columns = [
    {
      title: '软件包',
      dataIndex: 'rpm_name',
      ellipsis: true,
    },
    // {
    //   title: '一致度',
    //   dataIndex: 'metric',
    //   renderText: ((_,record)=>{
    //     if(Number(record.metric) === 1){
    //       return <div>100%</div>
    //     }else if(Number(record.metric) === 0){
    //       return <div style={{color:'#D32029'}}>0%</div>
    //     }else{
    //       return <div style={Number(record.metric) !== 1 ? {color:'#D32029'}: {}}>{(record.metric * 100).toFixed(2)+'%'}</div>
    //     }
    //   }),
    // },
    {
      title: '操作',
      dataIndex: 'option',
      render: (_, record) => (
        <div onClick={()=>handleGoAclList(record)} style={{color:'#177DDC',cursor:'pointer'}}>详细</div>
      ),
    }
  ];

  columns.splice(2,0,assessColumns('依赖评估结果','result'))

  const handleGoAclList = (r) => {
    getAclList(r);
  }

  const handleGoAppList = () => {
    dispatch({
      type: SET_DATA,
      payload: {
        activeAppRpmName: '',
        activeAppName: '',
        aclActiveName: '',
        aclActiveRpmName: '',
        aclActiveType: '',
        aclList: [],
        abiList: [],
        abiContent: '',
      },
    });
  }

  const getAclList = async (r) => {
    dispatch({
      type: SET_DATA,
      payload: {
        aclLoading: true,
        activeAppRpmName: r.rpm_name,
        activeAppName: r.name,
      },
    });
    const hide = message.loading('loading...', 0);
    try {
      const { code,data } = await queryAclList({id: activeId,rpm_name:r.rpm_name});
      if (code === 200) {
        if(data && data.length>0){
          let arr = data.filter(i=>i.type==='so' || i.type==='binary');
          dispatch({
            type: SET_DATA,
            payload: {
              aclList: arr,
              aclActiveName: data[0].name,
              aclActiveRpmName: data[0].rpm_name,
            },
          });
          if(arr?.length>0){
            getAbiList(arr[0]);
          }
        }else{
          dispatch({
            type: SET_DATA,
            payload: {
              aclList: [],
              aclActiveName: '',
              aclActiveRpmName: '',
              aclActiveType: '',
            },
          });
        }
        return true;
      }
      return false;
    } catch (e) {
      dispatch({
        type: SET_DATA,
        payload: {
          aclList: [],
          aclActiveName: '',
          aclActiveRpmName: '',
          aclActiveType: '',
        },
      });
      return false;
    } finally {
      hide();
      dispatch({
        type: SET_DATA,
        payload: {
          aclLoading: false,
        },
      });
    }
  }

  const getAbiList = async (d) => {
    // so类型展示abi，dinary类型展示cli
    dispatch({
      type: SET_DATA,
      payload: {
        abiLoading: true,
        aclActiveName: d.name,
        aclActiveRpmName: d.rpm_name,
        aclActiveType: d.type,
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

  return (
    <div>
      <ReportType title='应用评估报告'/>
      <Skeleton loading={tabsLoading}>
      {
        activeAppRpmName && activeAppRpmName !== '' ?
        <AclDependent handleGoAppList={handleGoAppList}/>
        :
        <ProCard bodyStyle={{padding: '12px 0'}}>
          <ProTable
            headerTitle='应用列表'
            rowKey='name'
            dataSource={appList}
            columns={columns}
            search={false}
            onRow={(record, index) => {
              return {
                onClick: () => handleGoAclList(record),
              }
            }}
          />
        </ProCard>
      }
      </Skeleton>
    </div>
  );
};

export default Application;

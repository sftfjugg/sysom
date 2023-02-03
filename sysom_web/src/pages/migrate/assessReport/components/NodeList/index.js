import React, {useContext, useEffect, useState} from 'react';
import {Card, message, Statistic, Skeleton} from "antd";
import {useRequest} from 'umi';
import ProCard from '@ant-design/pro-card';
import ProTable from '@ant-design/pro-table';
import {
  queryAssessList,
  queryAppList,
  queryHardwareList,
  queryRiskList,
  querySysType,
  querySysList,
} from "../../../service";
import { WrapperContext } from '../../containers';
import { SET_DATA } from '../../containers/constants';
import './index.less';
import {getUrlParams,SYS_CONFIG_TYPE} from '../../../utils';

const NodeList = (props) => {
  const {
    dispatch,
    state: {activeId},
  } = useContext(WrapperContext);

  const [nodeList, setNodeList] = useState([]);
  const [loading, setLoading] = useState(false);

  const columns = [
    {
      title: '机器ip',
      dataIndex: 'ip',
      ellipsis: true,
      render: (t, r) => (
        <span style={{cursor:"pointer"}}>{r.ip}</span>
      ),
    },
    {
      title: '评估状态',
      dataIndex: 'status',
      filters: false,
      render: ((_,record)=>{
        switch (record && record.status){
            case 'running':
              return (
                <div style={{fontSize: 13, display:'flex',alignItems:'center'}}>
                  <i style={{background: '#FCC00B',height: '6px',width:'6px',borderRadius:'3px',marginRight:'7px'}}></i>
                  <span>评估中</span>
                </div>
              );
            case 'stop':
              return (
                <div style={{fontSize: 13, display:'flex',alignItems:'center'}}>
                  <i style={{background: '#A61D24',height: '6px',width:'6px',borderRadius:'3px',marginRight:'7px'}}></i>
                  <span>评估停止</span>
                </div>
              );
            case 'success':
              return (
                <div style={{fontSize: 13, display:'flex',alignItems:'center'}}>
                  <i style={{background: '#52C41A',height: '6px',width:'6px',borderRadius:'3px',marginRight:'7px'}}></i>
                  <span>评估完成</span>
                </div>
              );
            case 'fail':
              return (
                <div style={{fontSize: 13, display:'flex',alignItems:'center'}}>
                  <i style={{background: '#A61D24',height: '6px',width:'6px',borderRadius:'3px',marginRight:'7px'}}></i>
                  <span>评估失败</span>
                </div>
              );
            default: return;
        }
      }),
    },
  ];

  useEffect(()=>{
    const id = props.id;
    const ip = getUrlParams('ip');
    const old_ver = getUrlParams('old_ver');
    const new_ver = getUrlParams('new_ver');
    new Promise(async(resolve) => {
      await getNodeList(id);
      resolve();
    }).then(()=>{
      handleNodeItem({id,ip,old_ver,new_ver});
    });
  },[])

  const getNodeList = async (id) => {
    setLoading(true);
    try {
      const {code, data, msg} = await queryAssessList();
      if (code === 200) {
        setNodeList(data?data:[]);
        return true;
      }
      message.error(msg);
      return false;
    } catch (error) {
      console.log(error,'error')
      return false;
    } finally {
      setLoading(false);
    }
  }
  
  const changeActive = (id,ip,old_ver,new_ver) => {
    dispatch({
      type: SET_DATA,
      payload: {
        activeId: id,
        activeIp: ip,
        activeOld: old_ver,
        activeNew: new_ver,
      },
    })
  }

  const judgeActiveItem = (id) => {
    let activeItem = nodeList.filter((i)=> i.id == id);
    let acitveArr = ['mig_imp'];
    if(activeItem?.length>0 && activeItem[0]?.config){
      let config = JSON.parse(activeItem[0].config);
      if(config?.ass_type){
        acitveArr = config.ass_type;
      }
    }
    dispatch({
      type: SET_DATA,
      payload: {
        activeAssType: acitveArr,
      },
    })
    return acitveArr;
  }

  // 点击行切换
  const handleNodeItem = async (r) => {
    if(Number(r.id) !== Number(activeId)){
      changeActive(r.id,r.ip,r.old_ver,r.new_ver);
      dispatch({
        type: SET_DATA,
        payload: {
          tabsLoading: true,
          activeKey: 'risk',
        },
      });
      let activeArr = await judgeActiveItem(r.id);
      const hide = message.loading('loading...', 0);
      let askArr = [getRiskList(r.id)];
      activeArr.map((i)=>{
        switch (i){
            case 'mig_sys':
              askArr.push(getSysType(r.id));
              return true;
            case 'mig_hard':
              askArr.push(getHWList(r.id));
              return true;
            case 'mig_app':
              askArr.push(getAppList(r.id));
              return true;
            default: 
              return true;
        }
      })
      Promise.all(askArr).then((res) => {
        dispatch({
          type: SET_DATA,
          payload: {
            tabsLoading: false,
          },
        });
        hide();
      }).catch((error)=>{
        hide();
        console.log(error,'error')
      })
    }
  }

  const getAppList = async (id) => {
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
    try {
      const { code,data } = await queryAppList({id});
      if (code === 200) {
        dispatch({
          type: SET_DATA,
          payload: {
            appList: data?data:[],
          },
        });
        return true;
      }
      return false;
    } catch (e) {
      dispatch({
        type: SET_DATA,
        payload: {
          appList: [],
        },
      });
      return false;
    }
  }

  const getHWList = async (id) => {
    try {
      const { code,data } = await queryHardwareList({id});
      const {hard_result,hard_info} = data || {};
      if(hard_result?.length > 0){
        hard_result.forEach((item,index)=>{
          hard_result[index].id = index;
        })
      }
      if (code === 200) {
        dispatch({
          type: SET_DATA,
          payload: {
            hwInfo: hard_info?hard_info:[],
            hwList: hard_result?hard_result:[],
          },
        });
        return true;
      }
      return false;
    } catch (e) {
      dispatch({
        type: SET_DATA,
        payload: {
          hwInfo: [],
          hwList: [],
        },
      });
      return false;
    }
  }

  const getRiskList = async (id) => {
    try {
      const { code,data } = await queryRiskList({id});
      let num = 0;
      if(data?.length > 0){
        data.map((item,index)=>{
          data[index].id = index;
          if(data[index].flags !== null){
            num += 1;
          }
        })
      }else{
        num = -1;
      }
      if (code === 200) {
        dispatch({
          type: SET_DATA,
          payload: {
            riskList: data,
            isPassStatus: num > 0 ? 'review' : (num === 0 ? 'pass' : ''),
          },
        });
        return true;
      }
      return false;
    } catch (e) {
      dispatch({
        type: SET_DATA,
        payload: {
          riskList: [],
        },
      });
      return false;
    }
  }

  const getSysType = async (id) => {
    try {
      const { code,data } = await querySysType({id});
      if (code === 200) {
        let list = data?.length > 0
            ? data.filter((item) => {
                if (SYS_CONFIG_TYPE[item]) return item;
              })
            : [];
        dispatch({
          type: SET_DATA,
          payload: {
            sysType: list,
            activeSysType: list?.length>0?list[0]:''
          },
        });
        if(list?.length>0){
          getSysList(id,list[0])
        }
        return true;
      }
      return false;
    } catch (e) {
      dispatch({
        type: SET_DATA,
        payload: {
          sysType: [],
          activeSysType: '',
        },
      });
      return false;
    }
  }

  const getSysList = async (id,type) => {
    dispatch({
      type: SET_DATA,
      payload: {
        sysTableLoading: true,
      },
    });
    try {
      const { code,data } = await querySysList({id,type});
      if (code === 200) {
        dispatch({
          type: SET_DATA,
          payload: {
            sysTableList: data?data:[],
          },
        });
        return true;
      }
      return false;
    } catch (e) {
      dispatch({
        type: SET_DATA,
        payload: {
          sysTableList: [],
        },
      });
      return false;
    } finally {
      dispatch({
        type: SET_DATA,
        payload: {
          sysTableLoading: false,
        },
      });
    }
  }


  return (
    <div className='assess_nodeList'>
      <ProCard.Group bordered={false}>
        <ProCard>
          <Statistic
            title='已评估完成数'
            value={nodeList?.filter(item => item.status === 'success').length}
            valueStyle={{fontSize: 30}}
          />
        </ProCard>
        <ProCard>
          <Statistic
            title='未评估完成数'
            value={nodeList?.filter(item => item.status !== 'success').length}
            valueStyle={{fontSize: 30}}
          />
        </ProCard>
      </ProCard.Group>
      <Card
        bordered={false}
        title={<span>迁移节点</span>}
        headStyle={{backgroundColor: 'rgba(255,255,255,0.04)',marginBottom:'0'}}
        bodyStyle={{padding:'0',minHeight: 'calc(100vh - 285px)'}}
      >
        <Skeleton loading={loading}>
          <ProTable
            rowKey='id'
            tableLayout='fixed'
            size='small'
            showHeader={false}
            rowClassName={(i) => {if(String(i.id) === String(activeId)){return 'node-row-active'}else{ return 'node-row' }}}
            search={false}
            pagination={false}
            tableAlertRender={false}
            toolBarRender={false}
            options={false}
            columns={columns}
            dataSource={nodeList}
            onRow={(record, index) => {
              return {
                onClick: (e) => {
                  handleNodeItem(record)
                },
              }
            }}
          />
        </Skeleton>
      </Card>
    </div>
  );
}

export default NodeList;

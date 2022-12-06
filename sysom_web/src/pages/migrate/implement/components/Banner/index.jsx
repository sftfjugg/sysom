import React, { useContext, useEffect, useState } from 'react';
import { Statistic, Row, Col, Skeleton, message, Card, Select } from 'antd';
import { WrapperContext } from '../../containers';
import { SET_DATA } from '../../containers/constants';
import { 
  getBannerList,
  getNodesList,
  qyeryMachineInfo,
  qyeryLog,
  qyeryReport,
} from '../../../service';
import styles from './style.less';


const machineGroup = (props) => {
  const {
    dispatch,
    state: { loadingVisible, nodeTotal, abnormalNodeTotal, machineGroupsList, activeMachineGroupId },
  } = useContext(WrapperContext);
  
  useEffect(()=>{
    getGroupsList()
  },[])

  // 获取机器组
  const getGroupsList = async () => {
    dispatch({
      type: SET_DATA,
      payload: {
        loadingVisible: true,
      },
    });
    const {code, data} = await getBannerList();
    if (code === 200) {
      if(data && data.length !== 0){
        getMachineList(data[0].id);
        dispatch({
          type: SET_DATA,
          payload: {
            machineGroupsList: data,
            activeMachineGroupId: data[0].id,
          },
        });
      }else{
        getNoData()
      }
    }
    dispatch({
      type: SET_DATA,
      payload: {
        loadingVisible: false,
      },
    });
  }

  // 获取机器列表
  const getMachineList = async (myid) => {
    dispatch({
      type: SET_DATA,
      payload: {
        machineTableLoading: true,
      },
    });
    const {code, data} = await getNodesList({id:myid});
    if (code === 200) {
      if(data && data.length !== 0){
        handleMachineName(data[0]);
        machineListByCycle(myid)
        dispatch({
          type: SET_DATA,
          payload: {
            machineList: data,
            nodeTotal: data.length,
            abnormalNodeTotal: data.filter((i)=>i.status === "waiting").length,
          },
        });
      }else{
        getNoData()
      }
      dispatch({
        type: SET_DATA,
        payload: {
          machineTableLoading: false,
        },
      });
    }
  }

  // 数据置空
  const getNoData = () => {
    dispatch({
      type: SET_DATA,
      payload: {
        machineList: [],
        nodeTotal: 0,
        abnormalNodeTotal: 0,
        systemMessage: {},
        logtMessage: '',
        reportMessage: {},
        tableIp: '',
        tableIpVersion: '',
      },
    });
  }

  // 轮询机器列表
  const machineListByCycle = (myid) => {
    console.log(myid,"myid")
    const timer = setInterval(async () => {
      const {
        code,
        data,
      } = await getNodesList({ id: myid });
      if (code === 200) {
        if(data && data.length !== 0){
          dispatch({
            type: SET_DATA,
            payload: {
              machineList: data,
              nodeTotal: data.length,
              abnormalNodeTotal: data.filter((i)=>i.status === "waiting").length,
            },
          });
        }else{
          getNoData()
        }
      }
    }, 5000);
    return () => clearInterval(timer);
  }

  const handleMachineName = (r) => {
    dispatch({
      type: SET_DATA,
      payload: {
        machineDetailLoading: true,
      },
    });
    const hide = message.loading('loading...', 0);
    Promise.all([
      getMachineInfo(r.ip),
      getLog(r.ip),
      getReport(r.ip),
    ]).then((res) => {
      dispatch({
        type: SET_DATA,
        payload: {
          tableIp: r.ip,
          tableIpVersion: r.version ? `${r.ip} (${r.version})` : `${r.ip}`,
          machineDetailLoading: false,
        },
      });
      hide();
    }).catch((error)=>{
      hide();
      console.log(error,'error')
    })
  }
  
  const getMachineInfo = async (ip) => {
    try {
      const { code,data } = await qyeryMachineInfo({ ip });
      if (code === 200) {
        dispatch({
          type: SET_DATA,
          payload: {
            systemMessage: data ? data : {},
          },
        });
        return true;
      }
      return false;
    } catch (e) {
      dispatch({
        type: SET_DATA,
        payload: {
          systemMessage: {},
        },
      });
      return false;
    }
  }
  
  const getLog = async (ip) => {
    try {
      const { code,data } = await qyeryLog({ ip });
      if (code === 200) {
        dispatch({
          type: SET_DATA,
          payload: {
            logtMessage: data,
          },
        });
        return true;
      }
      return false;
    } catch (e) {
      dispatch({
        type: SET_DATA,
        payload: {
          logtMessage: '',
        },
      });
      return false;
    }
  }

  const getReport = async (ip) => {
    try {
      const { code,data } = await qyeryReport({ ip });
      if (code === 200) {
        dispatch({
          type: SET_DATA,
          payload: {
            reportMessage: data,
          },
        });
        return true;
      }
      return false;
    } catch (e) {
      dispatch({
        type: SET_DATA,
        payload: {
          reportMessage: {},
        },
      });
      return false;
    }
  }

  return (
    <div className={styles.banner}>
      <Skeleton loading={loadingVisible}>
        <Card 
          title={
            <div>
              {
                machineGroupsList && machineGroupsList.length !== 0 ?
                <Select
                  key="banner-select"
                  defaultValue={activeMachineGroupId}
                  style={{ width: 150 }}
                  dropdownStyle={{background:"#333"}}
                  bordered={false}
                  // open={true}
                  onChange={(key)=>getMachineList(key)}
                >
                  { machineGroupsList.map((item)=>{
                      return(
                        <Option key={item.id} value={item.id}>{item.cluster_name}</Option>
                      )
                    })
                  }
                </Select>
                :
                <div>暂无机器组</div>
              }
            </div>
          }
        >
          <Row>
            <Col span={8}>
              <Statistic
                title="机器总数："
                value={nodeTotal}
                valueStyle={{ color: 'rgba(255,255,255,0.85)', fontSize: 30 }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="待迁移机器数："
                value={abnormalNodeTotal}
                valueStyle={{ color: '#FF4D4F', fontSize: 30 }}
              />
            </Col>
          </Row>
        </Card>
      </Skeleton>
    </div>
  );
}
   

export default machineGroup;

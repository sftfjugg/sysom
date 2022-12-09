/* eslint-disable no-case-declarations */
import React, { Fragment, useContext, useEffect } from 'react';
import { Card, Tooltip, Skeleton, Modal, message, Menu, Progress, Button } from 'antd';
import ProTable, { TableDropdown } from '@ant-design/pro-table';
import { withRouter } from 'umi';

import { WrapperContext } from '../../containers';
import { SET_DATA } from '../../containers/constants';
import {
  qyeryMachineInfo,
  qyeryMigrateInfo,
  qyeryLog,
  operateMachine,
  getNodesList,
} from '../../../service';
import styles from './style.less';


export default withRouter(
  () => {
    const {
      dispatch,
      state: { machineList, nodeTotal, activeMachineGroupId, machineTableLoading, tableIp, tableIpVersion },
    } = useContext(WrapperContext);

    const columns = [
      {
        title: '机器 IP（系统版本）',
        dataIndex: 'ip',
        ellipsis: true,
        render: (t, r) => (
          <Tooltip trigger="hover" placement="topLeft" title={r.ip+' '+(r.old_ver ? `(${r.old_ver})` : '')}>
            <span style={{cursor:"pointer"}} onClick={()=>handleMachineName(r)}>{r.ip} {r.old_ver ? `(${r.old_ver})` : ''}</span>
          </Tooltip>
        ),
      },
      {
        title: '迁移状态',
        dataIndex: 'status',
        width: 80,
        filters: false,
        render: (t, r) => {
          switch (r.status){
              case 'waiting':
                return (
                  <Tooltip trigger="hover" placement="topLeft" title={r.detail ? r.detail : ''}>
                    <span style={{fontSize: 13,cursor: 'pointer',color: 'rgba(255,255,255,0.4)'}}>未迁移</span>
                  </Tooltip>
                );
              case 'running':
                return (
                  <Tooltip trigger="hover" placement="topLeft" title={r.detail ? r.detail : ''}>
                    <span style={{fontSize: 13,cursor: 'pointer',color: '#FCC00B'}}>运行中</span>
                  </Tooltip>
                );
              case 'pending':
                return (
                  <Tooltip trigger="hover" placement="topLeft" title={r.detail ? r.detail : ''}>
                    <span style={{fontSize: 13,cursor: 'pointer',color: '#177DDC'}}>就绪中</span>
                  </Tooltip>
                );
              case 'success':
                return (
                  <Tooltip trigger="hover" placement="topLeft" title={r.detail ? r.detail : ''}>
                    <span style={{fontSize: 13,cursor: 'pointer',color: '#52C41A'}}>成功</span>
                  </Tooltip>
                );
              case 'fail':
                return (
                  <Tooltip trigger="hover" placement="topLeft" title={r.detail ? r.detail : ''}>
                    <span style={{fontSize: 13,cursor: 'pointer',color: '#a61e25'}}>失败</span>
                  </Tooltip>
                );
              case 'unsupported':
                return (
                  <Tooltip trigger="hover" placement="topLeft" title={r.detail ? r.detail : ''}>
                    <span style={{fontSize: 13,cursor: 'pointer',color: '#a61e25'}}>不支持</span>
                  </Tooltip>
                );
              default: return ;

          }
        },
      },
      {
        title: '进度',
        dataIndex: 'rate',
        width: 110,
        filters: false,
        renderText: (_, r) => (
          <Progress
            percent={r.rate || 0}
            className={
              r.rate === 100
                ? styles.numGreen
                : r.rate > 0 && r.rate < 99
                ? styles.numRed
                : styles.numZero
            }
            size="small"
            steps={10}
            format={(percent) => `${percent}%`}
            strokeColor={r.rate === 100 ? '#52C41A' : '#FF4D4F'}
          />
        ),
      },
      {
        title: '操作',
        dataIndex: 'option',
        valueType: 'option',
        width: 30,
        fixed: 'right',
        render: (t, r) => {
          const menus = [
            {
              key: 'start',
              name: '迁移配置',
              disabled: Number(r.step) === 0 ? false : true,
            },
            {
              key: 'deploy',
              name: '环境准备',
              disabled: Number(r.step) === 1 ? false : true,
            },
            {
              key: 'backup',
              name: '系统备份',
              disabled: Number(r.step) === 2 ? false : true,
            },
            {
              key: 'ass',
              name: '迁移评估',
              disabled: Number(r.step) === 3 ? false : true,
            },
            {
              key: 'imp',
              name: '迁移实施',
              disabled: Number(r.step) === 4 ? false : true,
            },
            {
              key: 'reboot',
              name: '重启机器',
              disabled: Number(r.step) === 5 ? false : true,
            },
            {
              key: 'restore',
              name: '系统还原',
            },
            {
              key: 'restore2',
              name: '重置状态',
            },
          ];
          return (
            <>
              <TableDropdown
                onSelect={async (key, e) => {
                  switch (key) {
                      case 'start':
                        dispatch({
                          type: SET_DATA,
                          payload: {
                            startMigrateIp: r.ip,
                            allMoveVisible: true,
                          },
                        })
                        break;
                      case 'deploy':
                        showItemModal(r.ip,1,'环境准备')
                        break;
                      case 'backup':
                        showItemModal(r.ip,2,'系统备份')
                        break;
                      case 'ass':
                        showItemModal(r.ip,3,'迁移评估')
                        break;
                      case 'imp':
                        showItemModal(r.ip,4,'迁移实施')
                        break;
                      case 'reboot':
                        showItemModal(r.ip,5,'重启机器')
                        break;
                      case 'restore':
                        showItemModal(r.ip,101,'系统还原')
                        break;
                      case 'restore2':
                        showItemModal(r.ip,102,'重置状态')
                        break;
                      default:
                        break;
                  }
                }}
                menus={menus}
              />
            </>
          );
        },
      },
    ];

    useEffect(()=>{
      // 轮询机器列表
      const timer = setInterval(async () => {
        const {
          code,
          data,
        } = await getNodesList({ id: activeMachineGroupId });
        if (code === 200) {
          dispatch({
            type: SET_DATA,
            payload: {
              machineList: data ? data : [],
              nodeTotal: data ? data.length : 0,
              abnormalNodeTotal: data ? data.filter((i)=>i.status === "waiting").length : 0,
            },
          });
        }
      }, 5000);
      return () => clearInterval(timer);
    },[activeMachineGroupId])

    useEffect(()=>{
      // 轮询日志和报告
     const timer = setInterval(async () => {
     Promise.all([
       getLog(tableIp),
     ]).catch((error)=>{
      console.log(error,'error')
     })
   }, 5000);
   return () => clearInterval(timer);
   },[tableIp])

    const showItemModal = (ip,step,text) =>{
      Modal.confirm({
        title: (
          <span style={{ fontWeight: 'normal', fontSize: 14 }}>
            确定要{text}吗？
          </span>
        ),
        okText: '确定',
        cancelText: '取消',
        onOk: async () => {
          const optionHide = message.loading(`正在${text}机器...`, 0);
          try {
            const {code,msg} = await operateMachine({
              ip: [ip],
              step: Number(step),
            });
            if (code === 200) {
              try {
                const {
                  code: queryCode,
                  data: nodeList,
                } = await getNodesList({ id: activeMachineGroupId });
                if (queryCode === 200) {
                  message.success(`${text}成功`);
                  dispatch({
                    type: SET_DATA,
                    payload: {
                      machineList: nodeList,
                      nodeTotal: nodeList ? nodeList.length : 0,
                    },
                  });
                  return true;
                }
                return false;
              } catch (e) {
                console.log(`更新数据获取失败，错误信息：${e}`);
                return false;
              }
            }
            message.error(msg);
            return false;
          } catch (error) {
            return false;
          } finally {
            optionHide();
          }
        },
      });
    }

    const handleMachineName = async (r) => {
      dispatch({
        type: SET_DATA,
        payload: {
          machineDetailLoading: true,
        },
      });
      const hide = message.loading('loading...', 0);
      Promise.all([
        getMachineInfo(r.ip),
        getMigrateInfo(r.ip),
        getLog(r.ip),
      ]).then((res) => {
        dispatch({
          type: SET_DATA,
          payload: {
            tableIp: r.ip,
            tableIpVersion: r.old_ver ? `${r.ip} (${r.old_ver})` : `${r.ip}`,
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

    const getMigrateInfo = async (ip) => {
      try {
        const { code,data } = await qyeryMigrateInfo({ ip });
        if (code === 200) {
          dispatch({
            type: SET_DATA,
            payload: {
              migMessage: data ? data : {},
            },
          });
          return true;
        }
        return false;
      } catch (e) {
        dispatch({
          type: SET_DATA,
          payload: {
            migMessage: {},
          },
        });
        return false;
      }
    }
    
    const getLog = async (ip) => {
      try {
        const {code,data,msg} = await qyeryLog({ ip });
        if (code === 200) {
          dispatch({
            type: SET_DATA,
            payload: {
              logtMessage: data.ass_log ? data.ass_log : '',
              reportMessage: data.ass_report ? data.ass_report : '',
              impLogMessage: data.imp_log ? data.imp_log : '',
              impReportMessage: data.imp_report ? data.imp_report : '',
            },
          });
          return true;
        }
        message.error(msg);
        return false;
      } catch (e) {
        dispatch({
          type: SET_DATA,
          payload: {
            logtMessage: '',
            reportMessage: '',
            impLogMessage: '',
            impReportMessage: '',
          },
        });
        return false;
      }
    }

    return (
      <div className={styles.nodes}>
        <Card
          bordered={false}
          title={
            <span>
              <em>机器列表</em>
              <i>（ {nodeTotal}台 ）</i>
            </span>
          }
          extra={
            <>
              <Button
                style={{ marginRight: 20 }}
                type="primary"
                ghost
                onClick={() => {
                  dispatch({
                    type: SET_DATA,
                    payload: {
                      startMigrateIp: '',
                      allMoveVisible: true,
                    },
                  })
                }}
              >
                批量配置
              </Button>
            </>
          }
        >
          <Skeleton loading={machineTableLoading}>
            <ProTable
              rowKey="ip"
              tableLayout="fixed"
              size="small"
              rowClassName={() => 'node-row'}
              search={false}
              pagination={false}
              tableAlertRender={false}
              toolBarRender={false}
              options={false}
              columns={columns}
              dataSource={machineList}
              onRow={(r) => ({
              })}
            />
          </Skeleton>
        </Card>
      </div>
    );
  },
);

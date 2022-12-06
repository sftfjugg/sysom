/* eslint-disable no-case-declarations */
import React, { Fragment, useContext, useEffect } from 'react';
import { Card, Tooltip, Skeleton, Modal, message, Menu, Progress, Button } from 'antd';
import ProTable, { TableDropdown } from '@ant-design/pro-table';
import { withRouter } from 'umi';

import { WrapperContext } from '../../containers';
import { SET_DATA } from '../../containers/constants';
import {
  qyeryMachineInfo,
  qyeryLog,
  qyeryReport,
  rebootMachine,
  stopMigration,
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
          // <Tooltip trigger="hover" placement="topLeft" title={r.ip+' '+(r.version && `(${r.version})`)}>
            <span style={{cursor:"pointer"}} title={r.ip+' '+(r.version && `(${r.version})`)} onClick={()=>handleMachineName(r)}>{r.ip} {r.version ? `(${r.version})` : ''}</span>
          // </Tooltip>
        ),
      },
      {
        title: '迁移状态',
        dataIndex: 'status',
        width: 80,
        filters: false,
        valueEnum: {
          waiting: {
            text: <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>未迁移</span>,
          },
          running: {
            text: <span style={{ fontSize: 13, color: '#FCC00B' }}>迁移中</span>,
          },
          success: {
            text: <span style={{ fontSize: 13, color: '#52C41A' }}>迁移完</span>,
          },
          fail: {
            text: <span style={{ fontSize: 13, color: '#a61e25' }}>迁移失败</span>,
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
              name: '开始迁移',
              disabled: r.status === "success"?true:false,
            },
            {
              key: 'destroy',
              name: '停止迁移',
              disabled: r.status === "waiting"?false:true,
            },
            {
              key: 'reboot',
              name: '重启机器',
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
                    case 'destroy':
                      Modal.confirm({
                        title: (
                          <span style={{ fontWeight: 'normal', fontSize: 14 }}>
                            确定要停止迁移吗？
                          </span>
                        ),
                        okText: '确定',
                        cancelText: '取消',
                        onOk: async () => {
                          const destroyHide = message.loading('正在停止迁移...', 0);
                          try {
                            const { code } = await stopMigration({
                              ip: r.ip,
                            });
                            if (code === 200) {
                              try {
                                const {
                                  code: queryCode,
                                  data: nodeList,
                                } = await getNodesList({ id: activeMachineGroupId });
                                if (queryCode === 200) {
                                  message.success('停止迁移成功');
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
                            message.error('停止迁移失败');
                            return false;
                          } catch (error) {
                            return false;
                          } finally {
                            destroyHide();
                          }
                        },
                      });
                      break;
                    case 'reboot':
                      Modal.confirm({
                        title: (
                          <span style={{ fontWeight: 'normal', fontSize: 14 }}>
                            确定要重启机器吗？
                          </span>
                        ),
                        okText: '确定',
                        cancelText: '取消',
                        onOk: async () => {
                          const rebootHide = message.loading('正在重启机器...', 0);
                          try {
                            const { code } = await rebootMachine({
                              ip: r.ip,
                            });
                            if (code === 200) {
                              try {
                                const {
                                  code: queryCode,
                                  data: nodeList,
                                } = await getNodesList({ id: activeMachineGroupId });
                                if (queryCode === 200) {
                                  message.success('重启机器成功');
                                  console.log(nodeList,"nodeList")
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
                            message.error('重启机器失败');
                            return false;
                          } catch (error) {
                            return false;
                          } finally {
                            rebootHide();
                          }
                        },
                      });
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
       // 轮询日志和报告
      const timer = setInterval(async () => {
      Promise.all([
        getLog(tableIp),
        getReport(tableIp),
      ]).catch((error)=>{
        console.log(error,'error')
      })
    }, 5000);
    return () => clearInterval(timer);
    },[tableIp])

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
                批量迁移
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

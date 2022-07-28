import { PlusOutlined } from '@ant-design/icons';
import { Button, message, Popconfirm, Table, Space, notification, Select } from 'antd';
import { useState, useRef, useEffect } from 'react';
import { useIntl, FormattedMessage } from 'umi';
import { PageContainer } from '@ant-design/pro-layout';
import ProTable from '@ant-design/pro-table';
import ExportJsonExcel from 'js-export-excel';
import lodash from 'lodash';
import { getCluster, getHost, addHost, deleteHost, delBulkHandler, getHostName, updateHost, getHostIP } from '../service';
import BulkImport from '../components/BulkImport';
import HostModalForm from '../components/HostModalForm';

const { Option } = Select;

const HostField = {
  cluster: '所属集群',
  created_at: '创建时间',
  hostname: '主机别名',
  ip: '主机地址',
  port: '端口',
  username: '登录用户',
  description: '简介',
  client_deploy_cmd: '初始化命令',
  status: '状态',
  host_password: '主机密码',
};

const HostStatus = {
  0: 'running',
  1: 'error',
  2: 'offline',
};

const handleAddHost = async (fields) => {
  const hide = message.loading('正在添加');
  const token = localStorage.getItem('token');

  try {
    await addHost({ ...fields }, token);
    hide();
    message.success('添加成功');
    return true;
  } catch (error) {
    hide();
    return false;
  }
};

const handleUpdateHost = async (fields) => {
  const hide = message.loading('正在更新');
  const token = localStorage.getItem('token');

  try {
    let res = await updateHost({ ...fields }, token);
    hide();
    if (res.code == 200) {
      message.success('更新成功');
    } else {
      message.error(`更新失败：${res.message}`)
    }
    return true;
  } catch (error) {
    hide();
    return false;
  }
}

const handleDeleteHost = async (record) => {
  const hide = message.loading('正在删除');
  const token = localStorage.getItem('token');
  if (!record) return true;
  try {
    await deleteHost(record.id, token);
    hide();
    message.success('删除成功');
    return true;
  } catch (error) {
    hide();
    return false;
  }
};

const HostList = () => {
  const [hostModalFormVisible, setHostModalFormVisible] = useState(false);
  const [clusterList, setClusterList] = useState([]);
  /**
   * Cluster list map => 记录 cluster_id => 对应的 Cluster 在 clusterList 列表中的下标索引
   */
  const [clusterListMap, setClusterListMap] = useState({});
  const [hostnamelist, setHostnameList] = useState([]);
  const [hostiplist, setHostipList] = useState([]);
  const actionRef = useRef();
  const intl = useIntl();
  /**
   * HostModalForm 的模式
   * 0 => 添加主机模式
   * 1 => 编辑主机信息模式
   */
  const [hostModalFormModel, setHostModalFormModel] = useState(0);
  const [hostModalFormTitle, setHostModalFormTitle] = useState(intl.formatMessage({
    id: 'pages.hostTable.createForm.newHost',
    defaultMessage: 'New host',
  }));

  // 从服务器拉取最新的集群列表，并更新本地 state
  const updateCluster = () => {
    getCluster().then((res) => {
      setClusterList(res);
      // 更新 clusterListMap
      let newClusterListMap = {};
      for (let i = 0; i < res.length; i++) {
        newClusterListMap[res[i].value] = i;
      }

      setClusterListMap(newClusterListMap);
    });
  }

  useEffect(() => {
    // 页面加载或变更时拉取最新的集群列表
    updateCluster();
    getHostName().then((res) => {
      setHostnameList(res)
    })
	getHostIP().then((res) => {
      setHostipList(res)
    })
  }, [])

  const columns = [
    {
      title: <FormattedMessage id="pages.hostTable.cluster" defaultMessage="cluster" />,
      dataIndex: 'cluster',
      filters: true,
      onFilter: true,
      valueType: 'select',
      fieldProps: {
        options: clusterList,
      },
      renderFormItem: (items) => {
        let list = Array.from(items.fieldProps.options);
        const options = list.map((item) => {
          <Option value={item.label}>{item.label}</Option>
        })
        return (
          <Select
            key="searchselect"
            showSearch
            optionFilterProp="children"
            filterOption={(input, option) => {
              return option.label.includes(input)
            }}
            placeholder="请输入"
          >
            {options}
          </Select>
        )
      }
    },
    {
      title: <FormattedMessage id="pages.hostTable.hostname" defaultMessage="Hostname" />,
      dataIndex: 'hostname',
      filters: true,
      onFilter: true,
      valueType: 'select',
      fieldProps: {
        options: hostnamelist,
      },
      renderFormItem: (items) => {
        let list = Array.from(items.fieldProps.options);
        const options = list.map((item) => {
          <Option value={item.hostname}>{item.hostname}</Option>
        })
        return (
          <Select
            key="searchselect"
            showSearch
            optionFilterProp="children"
            filterOption={(input, option) => {
              return option.label.includes(input)
            }}
            placeholder="请输入"
          >
            {options}
          </Select>
        )
      }
    },
    {
      title: (
        <FormattedMessage
          id="pages.hostTable.ip"
          defaultMessage="ip"
        />
      ),
      dataIndex: 'ip',
	  filters: true,
      onFilter: true,
      valueType: 'select',
      fieldProps: {
        options: hostiplist,
      },
      renderFormItem: (items) => {
        let list = Array.from(items.fieldProps.options);
        const options = list.map((item) => {
          <Option value={item.label}>{item.label}</Option>
        })
        return (
          <Select
            key="searchselectip"
            showSearch
            optionFilterProp="children"
            filterOption={(input, option) => {
              return option.label.includes(input)
            }}
            placeholder="请输入"
          >
            {options}
          </Select>
        )
      }
    },
    {
      title: <FormattedMessage id="pages.hostTable.status" defaultMessage="Status" />,
      dataIndex: 'status',
      filters: true,
      onFilter: true,
      valueEnum: {
        0: {
          text: (
            <FormattedMessage id="pages.hostTable.status.running" defaultMessage="Running" />
          ),
          status: 'Success',
        },
        1: {
          text: (
            <FormattedMessage id="pages.hostTable.status.abnormal" defaultMessage="Abnormal" />
          ),
          status: 'Error',
        },
        2: {
          text: (
            <FormattedMessage id="pages.hostTable.status.offline" defaultMessage="Offline" />
          ),
          status: 'Default',
        },
      },
    },
    {
      title: (
        <FormattedMessage
          id="pages.hostTable.hostUpdatedAt"
          defaultMessage="Last scheduled time"
        />
      ),
      dataIndex: 'created_at',
      valueType: 'dateTime',
      hideInSearch: true,
    },
    {
      title: <FormattedMessage id="pages.hostTable.description" defaultMessage="Description" />,
      dataIndex: 'description',
      valueType: 'textarea',
      hideInSearch: true,
    },
    {
      title: <FormattedMessage id="pages.hostTable.hostOption" defaultMessage="Operating" />,
      key: 'option',
      dataIndex: 'option',
      valueType: 'option',
      render: (_, record) => [
        <span key='edit'>
          <a onClick={() => {
            // 触发编辑主机信息
            setHostModalFormTitle(intl.formatMessage({
              id: 'pages.hostTable.createForm.editHost',
              defaultMessage: 'Edit host',
            }));
            setHostModalFormModel(1);                     // 设置 HostModalForm 的模式为 “编辑主机信息模式”
            setHostModalFormVisible(true);                // 显示模态框
            hostModalFormRef.current.setFieldsValue({     // 将当前选中的主机信息填充到模态框表单中
              ...record,
              cluster: clusterList[clusterListMap[record.cluster]]
            });
          }}><FormattedMessage id="pages.hostTable.edit" defaultMessage="host delete" /></a>
        </span>,
        <span key='delete'>
          <Popconfirm title="是否要删除该主机?" onConfirm={async () => {
            await handleDeleteHost(record);
            actionRef.current?.reload();
          }}>
            <a><FormattedMessage id="pages.hostTable.delete" defaultMessage="host delete" /></a>
          </Popconfirm>
        </span>,
        <span key='terminal'>
          <a href={"/host/terminal/" + record.ip} target="_blank">
            终端
          </a>
        </span>
      ],
    },
  ];

  const onDeleteHandler = async (e) => {
    const selectDeleteHostList = lodash.cloneDeep(e);
    const host_id_list = selectDeleteHostList.map((item) => item['id']);
    const body = { host_id_list: host_id_list };
    const token = localStorage.getItem('token');
    await delBulkHandler(body, token)
      .then((res) => {
        if (res.code === 200) {
          notification.success({
            duration: 2,
            description: '操作成功',
            message: '操作',
          });
        } else {
          notification.warn({
            duration: 2,
            description: '操作失败',
            message: '操作'
          });
        }
      })
      .catch((e) => {
        notification.error({ duration: 2, description: e, message: '操作' });
      });
  };

  const onBulkExportHostHandler = async (e) => {
    const headerlist = [];
    const headerFilter = [];
    const newDataList = lodash.cloneDeep(e);

    if (newDataList.length === 0) {
      return false;
    }

    for (let i in newDataList[0]) {
      if (HostField[i]) {
        headerFilter.push(i);
        headerlist.push(HostField[i]);
      }
    }
    headerlist.push(HostField['host_password']);
    newDataList.map((item) => {
      item['status'] = HostStatus[item['status']];
      for (let i = 0; i < clusterList.length; i++) {
        if (item['cluster'] === clusterList[i]['value']) {
          item['cluster'] = clusterList[i]['label']
          break
        }
      }
    });

    const options = {};
    options.fileName = 'host';
    options.datas = [
      {
        sheetData: newDataList,
        sheetName: 'sheet',
        sheetFilter: headerFilter,
        sheetHeader: headerlist,
      },
    ];
    const excel = new ExportJsonExcel(options);
    excel.saveExcel();
  };

  const hostModalFormRef = useRef();

  return (
    <PageContainer>
      <ProTable
        headerTitle={intl.formatMessage({
          id: 'pages.hostTable.title',
          defaultMessage: 'Host admin',
        })}
        actionRef={actionRef}
        rowKey="id"
        search={{
          labelWidth: 120,
        }}
        toolBarRender={() => [
          <Button
            type="primary"
            key="primary"
            onClick={() => {
              setHostModalFormTitle(intl.formatMessage({
                id: 'pages.hostTable.createForm.newHost',
                defaultMessage: 'Edit host',
              }));
              setHostModalFormModel(0);   // 设置主机模态框的模式为 “添加主机模式”
              setHostModalFormVisible(true);   // 显示模态框
            }}
          >
            <PlusOutlined /> <FormattedMessage id="pages.hostTable.newHost" defaultMessage="New host" />
          </Button>,
          <BulkImport actionRef={actionRef} />,
        ]}
        request={getHost}
        columns={columns}
        rowSelection={{
          selections: [Table.SELECTION_ALL, Table.SELECTION_INVERT],
          defaultSelectedRowKeys: [1],
        }}
        tableAlertRender={({ selectedRowKeys, selectedRows, onCleanSelected }) => (
          <Space size={24}>
            <span>
              已选 {selectedRowKeys.length} 项
              <a style={{ marginLeft: 8 }} onClick={onCleanSelected}>
                取消选择
              </a>
            </span>
          </Space>
        )}
        tableAlertOptionRender={({ selectedRowKeys, selectedRows, onCleanSelected }) => {
          return (
            <Space size={16}>
              <a
                onClick={async () => {
                  await onDeleteHandler(selectedRows);
                  onCleanSelected();
                  actionRef.current?.reload();
                }}
              >
                批量删除
              </a>
              <a
                onClick={async () => {
                  await onBulkExportHostHandler(selectedRows);
                  onCleanSelected();
                }}
              >
                导出数据
              </a>
            </Space>
          );
        }}
      />
      {/* 用于添加主机和编辑主机信息的模态框 */}
      <HostModalForm
        ref={hostModalFormRef}
        title={hostModalFormTitle}
        model={hostModalFormModel}
        visible={hostModalFormVisible}
        onVisibleChange={setHostModalFormVisible}
        clusterList={clusterList}
        onFinish={async (value) => {
          let success = false;
          value['cluster'] = value.cluster.value;
          // 针对不同的模式，执行不同的网络请求
          if (value.model == 0) {
            // 添加主机
            success = await handleAddHost(value);
          } else {
            // 编辑主机信息
            success = await handleUpdateHost(value);
          }

          if (success) {
            setHostModalFormVisible(false);
            if (actionRef.current) {
              actionRef.current.reload();
            }
          }
        }}
      />
    </PageContainer>
  );
};

export default HostList;

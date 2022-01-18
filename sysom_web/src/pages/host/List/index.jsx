import { PlusOutlined } from '@ant-design/icons';
import { Button, message, Popconfirm } from 'antd';
import { useState, useRef } from 'react';
import { useIntl, FormattedMessage } from 'umi';
import { PageContainer } from '@ant-design/pro-layout';
import ProTable from '@ant-design/pro-table';
import { ModalForm, ProFormText, ProFormTextArea, ProFormSelect } from '@ant-design/pro-form';
import { getCluster, getHost, addHost, deleteHost } from '../service';
import Cluster from '../components/ClusterForm';

const handleAddHost = async (fields) => {
  const hide = message.loading('正在添加');
  const token = localStorage.getItem('token');

  try {
    await addHost({ ...fields}, token);
    hide();
    message.success('添加成功');
    return true;
  } catch (error) {
    hide();
    message.error('添加失败，排查原因后重试!');
    return false;
  }
};

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
    message.error('删除失败，排查原因后重试');
    return false;
  }
};

const HostList = () => {
  const [createModalVisible, handleModalVisible] = useState(false);
  const actionRef = useRef();
  const intl = useIntl();

  const columns = [
    {
      title: <FormattedMessage id="pages.hostTable.cluster" defaultMessage="cluster" />,
      dataIndex: 'h_type',
      filters: true,
      onFilter: true,
      valueType: 'select',
      request: getCluster,
    },
    {
      title: <FormattedMessage id="pages.hostTable.hostname" defaultMessage="Hostname" />,
      dataIndex: 'hostname',
      valueType: 'textarea',
    },
    {
      title: (
        <FormattedMessage
          id="pages.hostTable.ip"
          defaultMessage="ip"
        />
      ),
      dataIndex: 'ip',
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
        <span key='delete'>
        <Popconfirm title="是否要删除该主机?" onConfirm={ async () => {
            await handleDeleteHost(record);
            actionRef.current?.reload(); 
          }}>
          <a><FormattedMessage id="pages.hostTable.delete" defaultMessage="host delete" /></a>
        </Popconfirm>
        </span>,
        <span key='terminal'>
          <a href={"/host/terminal/" + record.id} target="_blank">
            终端
          </a>
        </span>
      ],
    },
  ];
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
          <Cluster/>,
          <Button
            type="primary"
            key="primary"
            onClick={() => {
              handleModalVisible(true);
            }}
          >
            <PlusOutlined /> <FormattedMessage id="pages.hostTable.newHost" defaultMessage="New host" />
          </Button>,
        ]}
        request={getHost}
        columns={columns}
      />
      <ModalForm
        title={intl.formatMessage({
          id: 'pages.hostTable.createForm.newHost',
          defaultMessage: 'New host',
        })}
        width="440px"
        visible={createModalVisible}
        onVisibleChange={handleModalVisible}
        onFinish={async (value) => {
          const success = await handleAddHost(value);

          if (success) {
            handleModalVisible(false);

            if (actionRef.current) {
              actionRef.current.reload();
            }
          }
        }}
      >
        <ProFormSelect
          label="选择集群"
          rules={[
            {
              required: true,
              message: (
                <FormattedMessage
                  id="pages.hostTable.cluster_required"
                  defaultMessage="Cluster is required"
                />
              ),
            },
          ]}
          width="md"
          name="h_type"
          request={getCluster}
          placeholder="请选择主机所属集群"
        />
        <ProFormText
          label="主机名称"
          rules={[
            {
              required: true,
              message: (
                <FormattedMessage
                  id="pages.hostTable.hostname_required"
                  defaultMessage="Host name is required"
                />
              ),
            },
          ]}
          width="md"
          name="hostname"
        />
        <ProFormText
          label="用户名称"
          rules={[
            {
              required: true,
              message: (
                <FormattedMessage
                  id="pages.hostTable.username_required"
                  defaultMessage="username is required"
                />
              ),
            },
          ]}
          width="md"
          name="username"
        />
        <ProFormText.Password
          label="用户密码"
          rules={[
            {
              required: true,
              message: (
                <FormattedMessage
                  id="pages.hostTable.password_required"
                  defaultMessage="password is required"
                />
              ),
            },
          ]}
          width="md"
          name="host_password"
        />
        <ProFormText
          label="IP地址"
          rules={[
            {
              required: true,
              message: (
                <FormattedMessage
                  id="pages.hostTable.ip_required"
                  defaultMessage="IP is required"
                />
              ),
            },
          ]}
          width="md"
          name="ip"
        />
        <ProFormText
          label="端口"
          rules={[
            {
              required: true,
              message: (
                <FormattedMessage
                  id="pages.hostTable.port_required"
                  defaultMessage="Port number is required"
                />
              ),
            },
          ]}
          width="md"
          name="port"
        />
        <ProFormTextArea label="备注信息" width="md" name="description" />
      </ModalForm>
    </PageContainer>
  );
};

export default HostList;

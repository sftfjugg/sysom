import { PageContainer } from '@ant-design/pro-layout';
import { Popconfirm, message } from 'antd';
import { useState, useRef, useEffect } from 'react';
import { useIntl, FormattedMessage } from 'umi';
import ProTable from '@ant-design/pro-table';
import { getClusterList, delCluster } from '../service';
import Cluster from '../components/ClusterForm';

const handleDelCluster = async (record) => {
    const hide = message.loading('正在删除');
    const token = localStorage.getItem('token');
    try {
        let res = await delCluster(record.id, token);
        hide();
        if (res.code == 200) {
            message.success('删除成功');
            return true;
        } else {
            message.error(`删除失败: ${res.message}`);
            return false;
        }
    } catch (error) {
        hide();
        return false;
    }
}
/**
 * 集群列表页面
 */
const ClusterList = () => {
    const clusterListTableActionRef = useRef();
    const intl = useIntl();

    const columns = [
        {
            title: <FormattedMessage id="pages.clusterTable.clusterName" defaultMessage="Cluster Name" />,
            dataIndex: 'cluster_name',
            valueType: 'textarea',
            hideInSearch: true,
        },
        {
            title: <FormattedMessage id="pages.clusterTable.hostCount" defaultMessage="Host count" />,
            dataIndex: 'hosts',
            valueType: 'textarea',
            hideInSearch: true,
            render: (_, record) => (
                <span>{record.hosts.length}</span>
            )
        },
        {
            title: (
                <FormattedMessage
                    id="pages.clusterTable.clusterDescription"
                    defaultMessage="Cluster description"
                />
            ),
            dataIndex: 'cluster_description',
            valueType: 'textarea',
            hideInSearch: true,
        },
        {
            title: (
                <FormattedMessage
                    id="pages.clusterTable.clusterCreatedAt"
                    defaultMessage="Created time"
                />
            ),
            dataIndex: 'created_at',
            valueType: 'dateTime',
            hideInSearch: true,
        },
        {
            title: <FormattedMessage id="pages.clusterTable.clusterOption" defaultMessage="Operating" />,
            key: 'option',
            dataIndex: 'option',
            valueType: 'option',
            render: (_, record) => [
                <span key='delete'>
                    <Popconfirm title="是否要删除该集群?" onConfirm={async () => {
                        if (record.hosts.length > 0) {
                            message.error(intl.formatMessage({
                                id: 'pages.clusterTable.notAllowToBeDelete',
                                defaultMessage: "Not allow to delete this cluster"
                            }))
                        } else {
                            await handleDelCluster(record);
                            clusterListTableActionRef.current?.reload();
                        }
                    }}>
                        <a><FormattedMessage id="pages.clusterTable.delete" defaultMessage="host delete" /></a>
                    </Popconfirm>
                </span>,
            ],
        },
    ]

    return (
        <PageContainer>
            <ProTable
                actionRef={clusterListTableActionRef}
                headerTitle={intl.formatMessage({
                    id: 'pages.clusterTable.title',
                    defaultMessage: 'Host admin',
                })}
                rowKey="id"
                search={false}
                request={getClusterList}
                toolBarRender={() => [
                    <Cluster onAddClusterSuccess={() => { clusterListTableActionRef.current.reload() }} />,
                ]}
                columns={columns}
            />
        </PageContainer>
    )
}

export default ClusterList;
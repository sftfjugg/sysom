import { PageContainer } from '@ant-design/pro-layout';
import { Popconfirm, Table, Space } from 'antd';
import { useState, useRef, useEffect } from 'react';
import { useIntl, FormattedMessage } from 'umi';
import ProTable from '@ant-design/pro-table';
import { getClusterList } from '../service';
import Cluster from '../components/ClusterForm';

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
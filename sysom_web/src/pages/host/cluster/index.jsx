import { PageContainer } from '@ant-design/pro-layout';
import { Popconfirm, message, Table, Space, notification } from 'antd';
import { useRef } from 'react';
import { useIntl, FormattedMessage } from 'umi';
import ProTable from '@ant-design/pro-table';
import { getClusterList, delCluster, batchAddCluster, batchDelCluster } from '../service';
import Cluster from '../components/ClusterForm';
import BulkImport from '../components/BulkImport';
import lodash from 'lodash';
import ExportJsonExcel from 'js-export-excel';

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

const handleBatchDeleteCluster = async (e) => {
    const selectDeleteHostList = lodash.cloneDeep(e);
    const cluster_id_list = selectDeleteHostList.map((item) => item['id']);
    const body = { cluster_id_list: cluster_id_list };
    const token = localStorage.getItem('token');
    await batchDelCluster(body, token)
        .then((res) => {
            if (res.code === 200) {
                if (res.data.fail_list && res.data.fail_list.length > 0) {
                    message.success(`批量删除成功${res.data.success_count}个，失败：${res.data.fail_list.length}个`)
                } else {
                    message.success("批量删除操作成功")
                }
            } else {
                message.warn("批量删除操作失败")
            }
        })
        .catch((e) => {
            notification.error({ duration: 2, description: e, message: '操作' });
        });
};

const ClusterField = {
    cluster_name: '集群名称',
    cluster_description: '集群描述',
    hosts: '主机数量',
    created_at: '创建时间',
};

/**
 * 批量导出
 * @param {} e 
 * @returns 
 */
const batchExportClusterHandler = async (e) => {
    const headerlist = [];
    const headerFilter = [];
    const newDataList = lodash.cloneDeep(e);

    if (newDataList.length === 0) {
        return false;
    }

    for (let i = 0; i < newDataList.length; i++) {
        newDataList[i].hosts = newDataList[i].hosts.length
    }

    for (let i in ClusterField) {
        if (ClusterField[i]) {
            headerFilter.push(i);
            headerlist.push(ClusterField[i]);
        }
    }

    const options = {};
    options.fileName = 'cluster';
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
                    <BulkImport uploadFun={batchAddCluster} templateUrl="/resource/集群导入模板.xls" successCallback={res => {
                        if (clusterListTableActionRef.current) {
                            clusterListTableActionRef.current.reload()
                        }
                        if (res.data.fail_list && res.data.fail_list.length > 0) {
                            message.success(`导入成功${res.data.success_count}个，导入失败：${res.data.fail_list.length}个`)
                        } else {
                            message.success("导入成功")
                        }
                    }} />,
                ]}
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
                                    await handleBatchDeleteCluster(selectedRows);
                                    onCleanSelected();
                                    clusterListTableActionRef.current?.reload();
                                }}
                            >
                                批量删除
                            </a>
                            <a
                                onClick={async () => {
                                    await batchExportClusterHandler(selectedRows);
                                    onCleanSelected();
                                }}
                            >
                                导出数据
                            </a>
                        </Space>
                    );
                }}
            />
        </PageContainer>
    )
}

export default ClusterList;
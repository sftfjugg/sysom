import ProTable from '@ant-design/pro-table';
import { FormattedMessage } from 'umi';
import { useRef } from 'react'
import { getHost } from '../../host/service';

/**
 * A Table components display host list
 * @param {*} props 
 * @returns 
 */
const ServerList = (props) => {
    const actionRef = useRef();
    const ServerListColumns = [
        {
            title: "机器HostName（IP）",
            dataIndex: 'ip',
            render: (dom, entity) => {
                return (
                    <a
                        onClick={() => {
                            props?.onClick?.(entity.ip)
                        }}
                    >
                        {dom}
                    </a>
                );
            },
        },
        {
            title: '状态',
            dataIndex: 'status',
            initialValue: 'all',
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
    ];

    return (
        <ProTable
            style={{ width: "100%" }}
            headerTitle="机器列表"
            actionRef={actionRef}
            request={getHost}
            cardBordered={true}
            columns={ServerListColumns}
            rowKey="id"
            pagination={{
                showQuickJumper: true,
                pageSize: 10,
            }}
            defaultSize="small"
            search={false}
            {...props}
        />
    );
}

export default ServerList
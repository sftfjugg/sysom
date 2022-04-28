import {  useRef } from 'react';
import { useIntl, FormattedMessage } from 'umi';
import { PageContainer } from '@ant-design/pro-layout';
import ProTable from '@ant-design/pro-table';
import { getAlarmList } from '../service';

const TaskList = () => {
  const actionRef = useRef();
  const intl = useIntl();

  const columns = [
    {
      title: <FormattedMessage id="pages.journal.alarm.collected_time" defaultMessage="collected_time" />,
      dataIndex: 'collected_time',
      valueType: 'dateTime',
      hideInSearch: true,
    },
    {
      title: <FormattedMessage id="pages.journal.alarm.level" defaultMessage="level" />,
      dataIndex: 'level',
      valueType: 'textarea',
      valueEnum: {
        '0': { text: 'info' },
        '1': { text: 'warning' },
        '2': { text: 'error' },
        '3': { text: 'success' },
      }
    },
    {
      title: <FormattedMessage id="pages.journal.alarm.noticelcon_type" defaultMessage="noticelcon_type" />,
      dataIndex: 'noticelcon_type',
      valueType: 'textarea',
      valueEnum: {
        '0': { text: 'notification' },
        '1': { text: 'warning' },
      }
    },
    {
      title: <FormattedMessage id="pages.journal.alarm.is_read" defaultMessage="is_read" />,
      dataIndex: 'is_read',
      hideInSearch: true,
      valueEnum: {
        "true": {
          text: (
            <FormattedMessage id="pages.journal.alarm.true" defaultMessage="True" />
          ),
          status: 'Success',
        },
        "false": {
          text: (
            <FormattedMessage id="pages.journal.alarm.false" defaultMessage="False" />
          ),
          status: 'Default',
        },
      },
    },
    {
      title: <FormattedMessage id="pages.journal.alarm.message" defaultMessage="message" />,
      dataIndex: 'message',
      valueType: 'textarea',
      hideInSearch: true
    },
  ];
  return (
    <PageContainer>
      <ProTable
        headerTitle={intl.formatMessage({
          id: 'pages.journal.audit.title',
          defaultMessage: 'Audit',
        })}
        actionRef={actionRef}
        rowKey="id"
        search={{
          labelWidth: 120,
        }}
        toolBarRender={() => [
        ]}
        request={getAlarmList}
        columns={columns}
      />
    </PageContainer>
  );
};

export default TaskList;

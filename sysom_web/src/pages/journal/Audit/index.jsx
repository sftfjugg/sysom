import {  useRef } from 'react';
import { useIntl, FormattedMessage } from 'umi';
import { PageContainer } from '@ant-design/pro-layout';
import ProTable from '@ant-design/pro-table';
import { getAudit } from '../service';

const AuditList = () => {
  const actionRef = useRef();
  const intl = useIntl();

  const columns = [
    {
      title: <FormattedMessage id="pages.journal.audit.created_at" defaultMessage="created_at" />,
      dataIndex: 'created_at',
      valueType: 'dateTime',
    },
    {
      title: <FormattedMessage id="pages.journal.audit.username" defaultMessage="username" />,
      dataIndex: 'username',
    },
    {
      title: <FormattedMessage id="pages.journal.audit.request_ip" defaultMessage="request_ip" />,
      dataIndex: 'request_ip',
      valueType: 'textarea',
    },
    {
      title: <FormattedMessage id="pages.journal.audit.request_url" defaultMessage="request_url" />,
      dataIndex: 'request_url',
      valueType: 'textarea',
    },
    {
      title: <FormattedMessage id="pages.journal.audit.request_method" defaultMessage="request_method" />,
      dataIndex: 'request_method',
      valueType: 'textarea',
    },
    {
      title: <FormattedMessage id="pages.journal.audit.response_status" defaultMessage="response_status" />,
      dataIndex: 'response_status',
      valueType: 'textarea',
    },
    {
      title: <FormattedMessage id="pages.journal.audit.request_option" defaultMessage="request_option" />,
      dataIndex: 'request_option',
      valueEnum: {
        'login': {
          text: (
            <FormattedMessage id="pages.journal.audit.login" defaultMessage="login" />
          ),
        },
        'action': {
          text: (
            <FormattedMessage id="pages.journal.audit.action" defaultMessage="action" />
          ),
        },
      },
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
        request={getAudit}
        columns={columns}
      />
    </PageContainer>
  );
};

export default AuditList;

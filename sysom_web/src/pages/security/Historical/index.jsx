import { useState, useEffect } from 'react';
import { useIntl, FormattedMessage } from 'umi';
import { Button, Col, Row } from 'antd'
import './hist.less'
import { histApi } from '../service'
import { PageContainer } from '@ant-design/pro-layout';
import ProTable from '@ant-design/pro-table';

function index(props) {
  const intl = useIntl();
  const columns = [
    {
      title: <FormattedMessage id="pages.security.Historical.id" defaultMessage="Serial number" />,
      key: "id",
      width: 80,
      align: "center",
      render: (txt, record, index) => index + 1,
    },
    {
      title: <FormattedMessage id="pages.security.Historical.cve_id" defaultMessage="cve ID" />,
      dataIndex: 'cve_id',
      key: 'cve_id',
      align: "center",
    },
    {
      title: <FormattedMessage id="pages.security.Historical.fixed_time" defaultMessage="Fixed Time" />,
      dataIndex: "fixed_time",
      key: "fixed_time",
      align: "center",
    },
    {
      title: <FormattedMessage id="pages.security.Historical.fix_user" defaultMessage="Repairer" />,
      dataIndex: "fix_user",
      key: "fix_user",
      align: "center",
    },
    {
      title: <FormattedMessage id="pages.security.Historical.vul_level" defaultMessage="Level" />,
      dataIndex: "vul_level",
      key: "vul_level",
      align: "center",
      render: (txt, record) => {
        if (record.vul_level == "high") {
          return <div><FormattedMessage id="pages.security.Historical.high_risk" defaultMessage="High" /></div>
        } else if (record.vul_level == "medium") {
          return <div><FormattedMessage id="pages.security.Historical.medium_risk" defaultMessage="Medium" /></div>
        } else if (record.vul_level == "critical") {
          return <div><FormattedMessage id="pages.security.Historical.severe_risk" defaultMessage="Severe" /></div>
        } else if (record.vul_level == "low") {
          return <div><FormattedMessage id="pages.security.Historical.low_risk" defaultMessage="Low" /></div>;
        } else if (record.vul_level == "") {
          return <div></div>;
        }
      },
    }, {
      title: <FormattedMessage id="pages.security.Historical.fix_status" defaultMessage="CVE Repair Status" />,
      dataIndex: "status",
      key: "status",
      align: "center",
      width: 150,
      render: (txt, record) => {
        if (record.status == "success") {
          return <div className="blue"></div>
        } else {
          return <div className="red"></div>
        }
      },
    },
    {
      title: <FormattedMessage id="pages.hostTable.hostOption" defaultMessage="Operating" />,
      align: "center",
      render: (txt, record, index) => {
        return (
          <div>
            <Button type="link" onClick={() => props.history.push(`/security/historicalist/${record.id}`)}>
              <FormattedMessage id="pages.security.Historical.details" defaultMessage="View Details" />
            </Button>
          </div>
        )
      }
    }
  ]
  return (
    <div>
      <PageContainer>
        <ProTable headerTitle={intl.formatMessage({
          id: 'pages.security.Historical.title',
          defaultMessage: 'Historical repair',
        })}
          request={histApi}
          search={false}
          rowKey="id"
          size="small"
          columns={columns}
        >
        </ProTable>
        <Row></Row>
        <Row>
          <Col className="err_Button">
            <Button type="primary" onClick={() => {
              props.history.go(-1);
            }}>
              <FormattedMessage id="pages.security.Historical.back" defaultMessage="Back" />
            </Button>
          </Col>
        </Row>
      </PageContainer>
    </div>
  );
}

export default index;
import { useState } from 'react';
import { FormattedMessage, } from 'umi';
import { Button, Row, Col } from 'antd'
import './historicalist.less'
import { PageContainer } from '@ant-design/pro-layout';
import { histidApi, } from '../service'
import ProTable from '@ant-design/pro-table';

function index(props) {
  const [cveId, setCveId] = useState('cve');
  const getHist = async () => {
    const res = await histidApi(props.match.params.id);
    console.log('res',res)
    setCveId(res.cve_id);
    return res;
  }

  const columns = [
    {
      title: <FormattedMessage id="pages.security.Historical.id" defaultMessage="Serial number" />,
      key: "id",
      width: 80,
      align: "center",
      render: (txt, record, index) => index + 1,
    },
    {
      title: <FormattedMessage id="pages.hostTable.hostname" defaultMessage="Hostname" />,
      dataIndex: 'hostname',
      key: 'hostname',
      align: "center",
    },
    {
      title: <FormattedMessage id="pages.hostTable.ip" defaultMessage="IP" />,
      dataIndex: "ip",
      key: "ip",
      align: "center",
    },
    {
      title: <FormattedMessage id="pages.journal.audit.username" defaultMessage="User" />,
      dataIndex: "created_by",
      key: "created_by",
      align: "center",
    },
    {
      title: <FormattedMessage id="pages.security.Historical.created_at" defaultMessage="Create Time" />,
      dataIndex: "created_at",
      key: "created_at",
      align: "center",
    },
    {
      title: <FormattedMessage id="pages.hostTable.status" defaultMessage="Host Status" />,
      dataIndex: "host_status",
      key: "host_status",
      align: "center",
      render: (txt, record) => {
        if (record.host_status === "running") {
          return <div className="numbersuccess">
            <FormattedMessage id="pages.hostTable.status.running" defaultMessage="Running" />
          </div>
        } else {
          return <div className="numbererr">
            <FormattedMessage id="pages.hostTable.status.offline" defaultMessage="Offline" />
          </div>
        }
      }
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
      filters: [
        {
          text:
            <FormattedMessage id="pages.security.Historical.success" defaultMessage="Success" />
          , value: 'success'
        },
        {
          text:
            <FormattedMessage id="pages.security.Historical.fail" defaultMessage="fail" />
          , value: 'fail'
        },

      ],
      onFilter: (value, record) => record.status.includes(value),
    },
    {
      title: <FormattedMessage id="pages.security.Historical.fix_details" defaultMessage="CVE Repair Details" />,
      align: "center",
      render: (txt, record, index) => {
        return (
          <div>
            <Button type="link" onClick={() => props.history.push(`/security/viewdetails/${props.match.params.id}/${record.hostname}`)}>
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
        <ProTable
          headerTitle={cveId}
          className="hisTable"
          search={false}
          size="small"
          rowKey="id"
          columns={columns}
          request={getHist}
        />
        <Row></Row>
        <Row>
          <Col className="err_Button">
            <Button type="primary" onClick={() => {
              props.history.go(-1)
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
import { PageContainer } from '@ant-design/pro-layout';
//import IframeResizer from 'iframe-resizer-react'
import ProTable from '@ant-design/pro-table';
import { Card, Statistic } from 'antd';
import { Space, Row, Col } from 'antd';
import { useIntl, useRequest, useParams, FormattedMessage } from 'umi';
import { useState } from 'react'
import { getHost } from '../Host/service';

const ServerList = (props) => {

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
      headerTitle = "机器列表"
      cardBordered = {true}
      columns = {ServerListColumns}
      dataSource = {props.data}
      loading = {props.loading}
      rowKey = "id"
      pagination={{
        showQuickJumper: true,
        pageSize:10,
      }}
      defaultSize = "small"
      search={false}
    />
  );
}

const GrafanaWrap = (props) => {
  return (
  <iframe
    src = {`http://127.0.0.1:3000/d/sysom-dashboard/sysom-dashboard?orgId=1&refresh=1m&var-node=${props.host}:9100&kiosk=tv`}
    width="100%"
    height="723"
    frameBorder="0"
  />
  )
}

const Dashboard = () => {
  const intl = useIntl();
  const { data, error, loading } = useRequest(getHost)
  const { host } = useParams()
  const [ hostIP, setHostIP ]= useState( host || "127.0.0.1" )
  
  return (
    <>
      <Row gutter={16} style={{ height: "100%" }}>

        {/*监控左侧面板*/}
        <Col span={6}>
          <Space direction="vertical" style={{ width: "100%" }}>
            <Row gutter={16}>
              <Card style={{ width: "100%" }}>
                <Row>
                  <Col span={12}>
                    <Statistic title="机器总数" value={data?.length}
                      valueStyle={{ fontSize: 30 }} />
                  </Col>
                  <Col span={12}>
                    <Statistic title="异常总数" value={data?.filter(item=>item.status==1).length}
                      valueStyle={{ color: "#FF4D4F", fontSize: 30 }} />
                  </Col>
                </Row>
              </Card>
            </Row>
            <Row gutter={16}>
                <ServerList data = {data} loading = {loading} onClick = {(ip) => setHostIP(ip)}/>
            </Row>
          </Space>
        </Col>

        {/*右侧Grafena面板*/}
        <Col span={18}>
          <GrafanaWrap host = {hostIP}/>
        </Col>
      </Row>
    </>
  );
};

export default Dashboard;

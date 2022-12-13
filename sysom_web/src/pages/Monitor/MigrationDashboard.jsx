import { Statistic } from 'antd';
import { useIntl, useRequest, useParams } from 'umi';
import { useState } from 'react'
import { getHost } from '../host/service';
import ProCard from '@ant-design/pro-card';
import ServerList from './components/ServerList';

const GrafanaWrap = (props) => {
  return (
    <iframe
      src = {`/grafana/d/migration-dashboard/migration-dashboard?orgId=1&refresh=5s&var-instance=${props.host}:9100&from=now-1h&to=now&kiosk=tv`}
      width="100%"
      frameBorder="0"
      style={{ marginLeft: "8px", height:"calc(100vh - 80px)" }}
    />
  )
}

const Dashboard = () => {
  const intl = useIntl();
  const { data, error, loading } = useRequest(getHost)
  const { host } = useParams()
  const [hostIP, setHostIP] = useState(host || "127.0.0.1")
  const [collapsed, setCollapsed] = useState(false)

  const onCollapsed = () => {
    setCollapsed(!collapsed);
  }

  return (
    <>
      <ProCard ghost gutter={0}>
        <ProCard colSpan={collapsed ? 0 : 5} direction="column" ghost>
          <ProCard.Group bordered>
            <ProCard>
              <Statistic title="机器总数" value={data?.length}
                valueStyle={{ fontSize: 30 }} />
            </ProCard>
            <ProCard>
              <Statistic title="异常总数" value={data?.filter(item => item.status == 1).length}
                valueStyle={{ color: "#FF4D4F", fontSize: 30 }} />
            </ProCard>
          </ProCard.Group>
          <ProCard.Divider style={{ margin: "8px" }} />
          <ServerList onClick={(ip) => setHostIP(ip)} onLoad={dataSource => {
            if (dataSource.length > 0 && !!dataSource[0].ip) {
                setHostIP(dataSource[0].ip)
            }
          }} />
        </ProCard>
        <ProCard onClick={onCollapsed} hoverable colSpan="25px"
          bodyStyle={{ padding: '5px 5px 5px 5px', textAlign: "center" }} >
          {collapsed ?
            <span>&gt;&gt;<br />展<br />开<br />实<br />例<br />面<br />板</span>
            : <span>&lt;&lt;<br />折<br />叠<br />实<br />例<br />面<br />板</span>
          }
        </ProCard>
        <GrafanaWrap host={hostIP} />
      </ProCard>
    </>
  );
};

export default Dashboard;

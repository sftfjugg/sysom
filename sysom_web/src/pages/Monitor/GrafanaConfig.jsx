import { useIntl, useRequest, useParams, FormattedMessage } from 'umi';
import { getHost } from '../host/service';


const GrafanaWrap = (props) => {
  return (
    <iframe
      src = {`/grafana/dashboards/`}
      width="100%"
      frameBorder="0"
      style={{ marginLeft: "8px", height:"calc(100vh - 80px)" }}
    />
  )
}

/**
 * Grafana 配置页面
 * @returns 
 */
const GrafanaConfig = () => {
  const intl = useIntl();
  const { data, error, loading } = useRequest(getHost)
  return (
    <GrafanaWrap />
  );
};

export default GrafanaConfig;

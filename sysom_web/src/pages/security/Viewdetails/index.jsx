import { useState, useEffect } from "react";
import { FormattedMessage } from 'umi';
import { Button, Row, Col } from "antd";
import "./Viewdetails.less";
import { viewApi, summaryApi } from "../service";
import { PageContainer } from "@ant-design/pro-layout";
import ProCard from "@ant-design/pro-card";

function index(props) {
  const [home, sethome] = useState("");
  const [reason, setreason] = useState("");
  const [Svisible, setSvisible] = useState(false);
  useEffect(async () => {
    const msg = await viewApi(
      props.match.params.id,
      props.match.params.homename
    );
    sethome(msg.data.hostname);
    if (msg.data.status == "fail") {
      setSvisible(false);
      setreason(msg.data.details);
    } else {
      setSvisible(true);
    }
  }, []);
  const fn = () => {
    props.history.push("/security/historical");
  };
  return (
    <div>
      <PageContainer>
        <ProCard className="card_result">
          <h3> <span>
            <FormattedMessage id="pages.hostTable.hostname" defaultMessage="Hostname" />
          </span> {home} </h3>
          {Svisible ?
            <p className="card_succ"><FormattedMessage id="pages.security.Historical.fix_success" defaultMessage="CVE repair is successful" />.</p>
            : <p className="card_err"><FormattedMessage id="pages.security.Historical.fix_fail" defaultMessage="CVE repair failed, the cause of failure is" />{reason}</p>}
        </ProCard>
        <Row></Row>
        <Row>
          <Col className="err_Button">
            <Button
              type="primary"
              onClick={() => {
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
import React, { useState, useEffect } from "react";
import { Card, Table, Button, Progress, Modal, Row, Col } from "antd";
import "./Viewdetails.less";
import { viewApi, summaryApi } from "../service";
import { PageContainer } from "@ant-design/pro-layout";
function index(props) {
  const [home, sethome] = useState("");
  const [reason, setreason] = useState("");
  const [Svisible, setSvisible] = useState(false);
  const [errvisible, seterrvisible] = useState(false);
  useEffect(async () => {
    const msg = await viewApi(
      props.match.params.id,
      props.match.params.homename
    );

    if (msg.data.status == "fail") {
      seterrvisible(true);
      sethome(msg.data.hostname);
      setreason(msg.data.details);
    } else {
      setSvisible(true);
      sethome(msg.data.hostname);
    }
  }, []);
  const [affectcount, setaffectcount] = useState(0);
  const [cvecount, setcvecount] = useState(0);
  const [higtcount, sethigtcount] = useState(0);
  useEffect(async () => {
    const msg = await summaryApi();
    setaffectcount(msg.affect);
    setcvecount(msg.cvecount);
    sethigtcount(msg.highcount);
  }, []);
  return (
    <div>
      <PageContainer>
        <Card>
          {affectcount}台主机存在被攻击风险，涉及CVE漏洞{cvecount}
          个，其中高危漏洞{higtcount}个，请尽快修复。
        </Card>

        {Svisible ? (
          <Card className="card_succ">
            <h3>
              <span>主机名称</span>
              {home}
            </h3>
            <p>CVE修复成功.</p>
          </Card>
        ) : null}
        {errvisible ? (
          <Card className="card_err">
            <h3>
              <span>主机名称</span>
              {home}
            </h3>

            <p>CVE修复失败，失败原因：{reason}</p>
          </Card>
        ) : null}

        <Row>
          <Col span={20}></Col>
          <Col className="err_Button" span={4}>
            {" "}
            <Button
              type="primary"
              onClick={() => {
                props.history.go(-1);
              }}
            >
              返回
            </Button>
          </Col>
        </Row>
      </PageContainer>
    </div>
  );
}

export default index;

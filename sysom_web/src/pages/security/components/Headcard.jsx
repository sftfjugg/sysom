import React,{useState,useEffect} from 'react';
import { Card, Button,Row,Col} from "antd";
import {summaryApi} from '../service'
import {SyncOutlined} from '@ant-design/icons';
import '../List/list.less'

function Headcard(param) {
 const [affectcount,setaffectcount]=useState(0);
 const [cvecount,setcvecount]=useState(0);
 const [higtcount,sethigtcount]=useState(0)

 useEffect(async() => {
  const   msg=await summaryApi();
  setaffectcount(msg.affect)
     setcvecount(msg.cvecount)
     sethigtcount(msg.highcount)
  }, []);

 

    
  return (
    <div>
         <Card> 
         <Row>
         <Col span={20}>
          <span>{affectcount}台主机存在被攻击风险，涉及CVE漏洞{cvecount}个，其中高危漏洞{higtcount}个，请尽快修复。</span> 
          {param.isShow?(<Button type="link"   onClick={param.paren}>历史修复</Button>):""} 
            {param.upData?(<Button type="link"  onClick={param.geng}>更新</Button>):""} 
          </Col>
           <Col span={4}>
           {param.quan?( < SyncOutlined className="Ooylined" style={{fontSize:'22px',}} spin  />):""} 
           </Col>
         </Row>
      </Card>
    </div>
  );
}

export default Headcard;
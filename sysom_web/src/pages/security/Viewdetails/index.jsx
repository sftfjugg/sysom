import React ,{useState,useEffect}from 'react';
import { Card, Table, Button, Progress ,Modal, Row, Col} from "antd";
import './Viewdetails.less'
import {viewApi} from '../products'
function index(props) {
  // console.log(props.match.params)
     const [home,sethome]=useState("")
   
     
     const [reason,setreason]=useState("")
     const [Svisible,setSvisible]=useState(false)
     const [errvisible,seterrvisible]=useState(false)
     useEffect(()=>{
      viewApi(props.match.params.id,props.match.params.homename).then(res=>{
        console.log(res)
        if(res.data.status=="fail"){
          seterrvisible(true)
          sethome(res.data.hostname)
          setreason(res.data.details)
        }else{
          setSvisible(true)
          sethome(res.data.hostname)
        }
       
      })
    },[])
  return (
    <div>
       <Card>
        200台主机存在被攻击风险，涉及CVE漏洞1000个，其中高危漏洞100个，请尽快修复。
      
      </Card>
     
      {Svisible?( <Card className="card_succ">
          <h3><span>主机名称</span>{home}</h3>
          <p>CVE修复成功.</p>
       </Card>):null}
     
    
      {errvisible?(  <Card className="card_err">
       <h3><span>主机名称</span>{home}</h3>
        
        <p>CVE修复失败，失败原因：{reason}</p>
       </Card>):null}
     
      <Row>
      <Col span={20}></Col>
      <Col  className="err_Button" span={4}> <Button type="primary">返回</Button></Col>
      </Row>
     
    </div>
  );
}

export default index;

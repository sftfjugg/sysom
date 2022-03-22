import React,{useState,useEffect} from 'react';
import { Card, Button} from "antd";
import {summaryApi} from '../service'


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
          <span>{affectcount}台主机存在被攻击风险，涉及CVE漏洞{cvecount}个，其中高危漏洞{higtcount}个，请尽快修复。</span> 
          {param.isShow?(<Button type="link"   onClick={param.paren}>历史修复</Button>):""} 
      </Card>
    </div>
  );
}

export default Headcard;

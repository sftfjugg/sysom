import React ,{useState,useEffect}from 'react';
import { Card, Table, Button,Progress,Row, Col} from "antd";
import './homelist.less'
import { PageContainer } from '@ant-design/pro-layout';

import {getOneById,manyApi} from '../service'
import Headcard from "../components/Headcard";
function index(props) {
  const [data,setdata]=useState([])
  const [lovodata,setlovodata]=useState([])
  const [total,setTotal]=useState(0)
  const [selectedRowKeys, setselectedRowKeys] = useState([]);
  const [selectedRows, setselectedRows] = useState([]);
  const [title,settitle]=useState("")
  const [vlue,setCount]=useState(0)

  useEffect(async()=>{
    const  msg=await  getOneById(props.match.params.id);
    setlovodata(msg.setlovodata)
    setdata(msg.setdata)
    settitle(msg.title)
  },[])
  const[succesvisible,setsuccesvisible]=useState(false);
  const [errvisible,seterrvisible]=useState(false)

  const fn = () => {
    props.history.push("/security/historical");
  };
  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedRowKeys, selectedRows) => {
      setselectedRowKeys(selectedRowKeys);
      setselectedRows(selectedRows);
    },
  };
  const columns=[
    
    {
      title:"软件名称",
      dataIndex:'name',
      key:'name'
    },
    {
      title:"严重程度",
      dataIndex:"vul_level",
      key:"vul_level",
     
    },
    {
      title:"修复版本",
      dataIndex:"fixed_version",
      key:"fixed_version",
    }
  ]
  const lnvohost=[
    {
      title: "序号",
      key: "id",
      width: 80,
      align: "center",
      render: (txt, record, index) => index + 1,
    },
  {
    title:"主机名称",
    dataIndex:'hostname',
    key:'hostname'
  },
  {
    title:"IP地址",
    dataIndex:"ip",
    key:"ip",
   },
   {
    title:"用户",
    dataIndex:"created_by",
    key:"created_by",
   },
   {
    title:"创建时间",
    dataIndex:"created_at",
    key:"created_at",
   },
   {
    title:"主机状态",
    dataIndex:"status",
    key:"status",
    render:(txt,record)=>{
      if(record.status==="running"){
        return <div className="numbersuccess">运行中</div>
      }else{
        return <div className="numbererr">离线</div>
      }
    }
   },{
    title:"操作",
    render:(txt,record,index)=>{
      return (
        <div>
            <Button type="link" onClick={async()=>{
                setsuccesvisible(true)
                seterrvisible(false)
               const  time =setInterval(()=>{
                  setCount(vlue=>vlue+1);
                 },2500)
              const  arry=[];
              const id=props.match.params.id
              arry.push({"cve_id":id, "hostname":[record.hostname ]})
            const msg=await manyApi({cve_id_list:arry});
             if(msg){
                setsuccesvisible(true)
                setCount(99);
                clearInterval(time)
              if(msg.message=="fix cve failed"){
                seterrvisible(true)
                setsuccesvisible(false);
                setCount(0);
              }else{
                 setTimeout(() => {
                  props.history.push("/security/list")                       
                 }, 1000);
               
              }
            }
         }}>修复</Button>
           
        </div>
      )
    }
  }
  ]

const  repair=async()=>{
  const  arry=[];
  const leght =selectedRows.length;
    
    if(leght>0){
      setsuccesvisible(true)
      seterrvisible(false) 
      const  time =setInterval(()=>{
        setCount(vlue=>vlue+1);
       
      },2500)
      const id=props.match.params.id
      for(let i = 0; i < leght; i++){
          arry.push({"cve_id":id, "hostname":[selectedRows[i].hostname ]})
      }
      const msg=await manyApi({cve_id_list:arry});
      if(msg){
              setsuccesvisible(true)
              setCount(99);
              clearInterval(time)
            if(msg.message=="fix cve failed"){
              seterrvisible(true)
              setsuccesvisible(false);
              setCount(0);
            }else{
               setTimeout(() => { 
                  props.history.push("/security/list")                       
                }, 1000);
            
            }
          }
        } 


}
  const paginationProps = {
    showSizeChanger: true,
    showQuickJumper: true,
    total: total, // 数据总数
    pageSizeOptions:	[10,20,50,100]	,
    defaultPageSize:20,
    // current: pageNum, // 当前页码
    showTotal: ((total,ranage) => `共 ${total} 条`),
    position:["bottomRight"],
    // size:"small"
  };
 return (

    <div>
      <PageContainer>
      <Headcard paren={fn} isShow={true} upData={false}/>
       <Card className="list-table"   title={title}>
    
         <Table size="small"  pagination={false} scroll={{ y: 100 }}  rowKey="fixed_version" columns={columns} dataSource={data}  />
       </Card>
       <Card title="涉及主机" className="lnvohost">
              <Table rowKey="hostname" size="small" rowSelection={rowSelection} pagination={ paginationProps} columns={lnvohost} dataSource={lovodata}> </Table>
              <Row>
              <Col span={13}> 
                {succesvisible?( <p>修复中< Progress width={40} percent={vlue} size="small" /></p>):null}
                {errvisible?(<p>恢复出错了，<Button type="link" size="small" onClick={()=>props.history.push('/security/historical')}>查看详情</Button></p>):null}
               </Col>
              <Col span={11}>
              <Row className="allbtn">
              <Col><Button type="primary" onClick={repair}>一键修复</Button></Col>
              <Col style={{'line-height':'58px'}}><Button onClick={()=>{ props.history.push("/security/list") }} style={{'margin-right':'10px'}}>取消</Button></Col>
              </Row>
              </Col>
              </Row>
      </Card>
     </PageContainer>
    </div>
  );
}

export default index;

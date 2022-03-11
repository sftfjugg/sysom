import React ,{useState,useEffect}from 'react';
import { Card, Table, Button,Progress,Row, Col} from "antd";
import './homelist.less'
import {getOneById,manyApi} from '../products'

function index(props) {
  const [data,setdata]=useState([])
  const [lovodata,setlovodata]=useState([])
  const [total,setTotal]=useState(0)
  const [selectedRowKeys, setselectedRowKeys] = useState([]);
  const [selectedRows, setselectedRows] = useState([]);
  
 
  useEffect(()=>{
    getOneById(props.match.params.id).then(res=>{
      setlovodata(res.data.hosts)
      setdata(res.data.software)
    })
  },[])
  const[succesvisible,setsuccesvisible]=useState(false);
  const [errvisible,seterrvisible]=useState(false)


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
        return <div className="numbersuccess">on</div>
      }else{
        return <div className="numbererr">off</div>
      }
    }
   },{
    title:"操作",
    render:(txt,record,index)=>{
      return (
        <div>
            <Button type="link" onClick={()=>{
              // console.log(record)
              const  arry=[];
              const id=props.match.params.id
              arry.push({"cve_id":id, "hostname":record.hostname })
              manyApi({cve_id_list:arry}).then((res)=>{
                console.log(res)
                if(res.message=="fix cve failed"){
                  seterrvisible(true)
                }else{
                  setsuccesvisible(true)
                  setTimeout(() => {
                    props.history.push("/security/list")                       
                   
                  }, 1000);
                }
              })
            }}>修复</Button>
           
        </div>
      )
    }
  }
  ]

const  repair=()=>{
  const  arry=[];
  const leght =selectedRows.length;
  const id=props.match.params.id
for(let i = 0; i < leght; i++){
    arry.push({"cve_id":id, "hostname":selectedRows[i].hostname })
}

  manyApi({cve_id_list:arry}).then((res)=>{
    console.log(res)
    if(res.message=="fix cve failed"){
      seterrvisible(true)
    }else{
      setsuccesvisible(true)
      setTimeout(() => {
        props.history.push("/security/list")                       
       
      }, 1000);
    }
  })
}
  const paginationProps = {
    showSizeChanger: true,
    showQuickJumper: true,
    total: total, // 数据总数
    pageSizeOptions:	[4,6,8]	,
    defaultPageSize:6,
    // current: pageNum, // 当前页码
    showTotal: ((total,ranage) => `共 ${total} 条`),
    position:["bottomLeft"],
    // size:"small"
  };
 return (

    <div>
       <Card className="home-heard">200台主机存在被攻击风险，涉及CVE漏洞1000个，其中高危漏洞100个，请尽快修复。
           <Button type="link" onClick={()=>props.history.push('/security/historical')}>历史修复</Button>
       </Card>
       <Card className="list-table"   title="cve-2021-2333">
    
         <Table size={'small'}  pagination={false} scroll={{ y: 100 }}  rowKey="fixed_version" columns={columns} dataSource={data}  />
       </Card>
       <Card title="涉及主机" className="lnvohost">
              <Table rowKey="hostname" rowSelection={rowSelection} pagination={ paginationProps} columns={lnvohost} dataSource={lovodata}> </Table>
              <Row>
              <Col span={15}> 
                {succesvisible?(< Progress width={150} percent={90} size="small" />):null}
                {errvisible?(<p>恢复出错了，<Button type="link" size="small" onClick={()=>props.history.push('/security/historical')}>查看详情</Button></p>):null}
               </Col>
             <Col span={7}></Col>
              <Col span={1}><Button >取消</Button></Col>
              <Col span={1}>  <Button type="primary" onClick={repair}>一键修复</Button></Col>
              </Row>
              
             
     </Card>
    </div>
  );
}

export default index;

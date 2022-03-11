import React,{useEffect,useState} from 'react';
import {Button,Card,Table} from 'antd'
import './historicalist.less'
import {histidApi} from '../products'


function index(props) {
  const [dataSource,setdataSource]=useState([])
  const [total,setTotal]=useState(0)
  useEffect(()=>{
    histidApi(props.match.params.id).then(res=>{
      console.log(res.data)
      setdataSource(res.data)
     
    })
  },[])
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
  const columns=[
    
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
    key:'hostname',
    align: "center",
  },
  {
    title:"IP地址",
    dataIndex:"ip",
    key:"ip",
    align: "center",
  },
  {
    title:"用户",
    dataIndex:"created_by",
    key:"created_by",
    align: "center",
  },
  {
    title:"创建时间",
    dataIndex:"created_at",
    key:"created_at",
    align: "center",
  },
  {
    title:"主机状态",
    dataIndex:"host_status",
    key:"host_status",
    align: "center",
    render:(txt,record)=>{
      if(record.host_status==="running"){
        return <div className="numbersuccess">on</div>
      }else{
        return <div className="numbererr">off</div>
      }
    }
  },{
    title:"CVE恢复状态",
    dataIndex:"status",
    key:"status",
    align: "center",
    width: 150,
    render:(txt,record)=>{
     
         if(record.status=="success"){
           return   <div className="blue"></div>
         }else{
            return  <div className="red"></div>
         }
    },
    filters: [
      { text: '成功', value: 'success' },
     { text: '失败', value: 'fail' },
     
   ],
   onFilter: (value, record) => record.status.includes(value),
  },
  {
    title:"操作",
    align: "center",
    render:(txt,record,index)=>{
      return (
        <div>
            <Button type="link" onClick={()=>props.history.push(`/security/viewdetails/${record.id}/${record.hostname}`)}>查看详情</Button>
           
        </div>
      )
    }
  }
  
]
  return (
    <div>
      <Card>200台主机存在被攻击风险，涉及CVE漏洞1000个，其中高危漏洞100个，请尽快修复。 </Card>
      <Card className="list-table"
      title="CVE-2021-2333">
    
     <Table className="hisTable" rowKey="id" columns={columns} dataSource={dataSource} pagination={ paginationProps}  />
    
     </Card>
    </div>
  );
}

export default index;

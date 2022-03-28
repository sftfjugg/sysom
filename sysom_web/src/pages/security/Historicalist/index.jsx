import React,{useEffect,useState} from 'react';
import {Button,Card,Table,Row,Col} from 'antd'
import './historicalist.less'
import { PageContainer } from '@ant-design/pro-layout';
import {histidApi,} from '../service'
import Headcard from "../components/Headcard";


function index(props) {
  const [dataSource,setdataSource]=useState([])
  const [total,setTotal]=useState(0)
  const [title,setTitle]=useState("")
  useEffect( async()=>{
    const  msg=await histidApi(props.match.params.id)
    setdataSource(msg.setdatasource)
    setTitle(msg.title)
   
  },[])
  const fn = () => {
    props.history.push("/security/historical");
  };

 

  const paginationProps = {
    showSizeChanger: true,
    showQuickJumper: true,
    total: total, // 数据总数
    pageSizeOptions:	[10,20,50,100],
    defaultPageSize:20,
    // current: pageNum, // 当前页码
    showTotal: ((total,ranage) => `共 ${total} 条`),
    position:["bottomRight"],
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
        return <div className="numbersuccess">运行中</div>
      }else{
        return <div className="numbererr">离线</div>
      }
    }
  },{
    title:"CVE修复状态",
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
    title:"CVE修复详情",
    align: "center",
    render:(txt,record,index)=>{
      return (
        <div>
            <Button type="link" onClick={()=>props.history.push(`/security/viewdetails/${props.match.params.id}/${record.hostname}`)}>查看详情</Button>
           
        </div>
      )
    }
  }
  
]
  return (
    <div>
      <PageContainer>
      <Headcard paren={fn} isShow={false}  upData={false}/>
      <Card className="list-table" title={title}>
         <Table className="hisTable" size="small" rowKey="id" columns={columns} dataSource={dataSource} pagination={ paginationProps}  />
      </Card>
     <Row>
      <Col span={20}></Col>
      <Col  className="err_Button" span={4}> <Button type="primary" onClick={()=>{
         props.history.go(-1)
      }}>返回</Button></Col>
      </Row>
     </PageContainer>
    </div>
  );
}

export default index;

import React ,{useState,useEffect}from 'react';
import {Button,Card,Table,Col,Row} from 'antd'
import './hist.less'
import {histApi} from '../service'
import { PageContainer } from '@ant-design/pro-layout';
 
function index(props) {
  const [dataSource,setdataSource]=useState([])
  const [total,setTotal]=useState(0)
  useEffect(async() => {
    const msg=await histApi()
     setdataSource(msg.data)
  }, []);
  const columns=[
    
      {
        title: "序号",
        key: "id",
        width: 80,
        align: "center",
        render: (txt, record, index) => index + 1,
      },
    {
      title:"cve编号",
      dataIndex:'cve_id',
      key:'cve_id',
      align: "center",
    },
    {
      title:"修复时间",
      dataIndex:"fixed_time",
      key:"fixed_time",
      align: "center",
    },
    {
      title:"修复者",
      dataIndex:"fix_user",
      key:"fix_user",
      align: "center",
    },
    {
      title:"漏洞等级",
      dataIndex:"vul_level",
      key:"vul_level",
      align: "center",
      render:(txt,record)=>{
     
        if(record.vul_level=="high"){
          return  <div>高危</div>
        }else if(record.vul_level=="medium"){
           return  <div>中危</div>
        }else if(record.vul_level=="critical"){
          return  <div>严重</div>
        }else if (record.vul_level == "low") {
          return <div>低危</div>;
        } else if (record.vul_level == "") {
          return <div></div>;
        }
   },
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

    },
    {
      title:"操作",
      align: "center",
      render:(txt,record,index)=>{
        return (
          <div>
              <Button type="link"  onClick={()=>props.history.push(`/security/historicalist/${record.id}`)}>查看详情</Button>
             
          </div>
        )
      }
    }
    
  ]
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
      <Card title="历史修复漏洞信息">
        <Table rowKey="id" size="small" columns={columns} dataSource={dataSource} pagination={ paginationProps}></Table>
      </Card>
      <Row>
      <Col span={20}></Col>
      <Col  className="err_Button" span={4}> <Button type="primary" onClick={()=>{
         props.history.push("/security/list")
      }}>返回</Button></Col>
      </Row>
      </PageContainer>
    </div>
  );
}

export default index;

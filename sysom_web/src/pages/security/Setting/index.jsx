import ProTable from '@ant-design/pro-table';
import {message, Popconfirm} from "antd";
import { useIntl, FormattedMessage,history, Link } from 'umi';
import React,{useState,useEffect,useRef} from 'react';
import ModalForm from "../components/DBModal";
import { getDBlist,deleteDB } from "../service"

export default function index() {
  const tableRef = useRef();
  const [isAdd,setIsAdd] = useState(true);

  const renderRemoveUser = (text,id) => (
    <Popconfirm key="popconfirm" title={`确认${text}吗?`} okText="是" cancelText="否" onConfirm={()=>{deleteDB(id).then((res)=>{if(res.code == 200 && res.success){
      message.success('删除成功');tableRef.current.reload();
    }})}}>
      <a>{text}</a>
    </Popconfirm>
  );
    const columns = [
        {
          title: '数据库名称',
          dataIndex: 'name',
          align: "center",
          hideInSearch: true,
        },
        {
          title: 'url',
          dataIndex: 'url',
          align: "center",
          hideInSearch: true
        },
        {
          title: '状态',
          dataIndex: 'status',
          align: "center",
          hideInSearch: true,
          valueEnum: {
            0: { text: '可连接', status: "Success" },
            1: { text: '不可连接', status: "Error" },
            2: { text: '尚未连接', status: "Default" },
          },
        },
        {
          title: <FormattedMessage id="pages.security.list.operation" defaultMessage="operation" />,
          dataIndex: "option",
          align: "center",
          valueType: "option",
          render: (_, record) => {
            // console.log('record')
            let record1 = {...record}
            record1.headers = JSON.stringify(record1.headers)
            record1.params = JSON.stringify(record1.params)
            record1.body = JSON.stringify(record1.body)
            record1.parser = JSON.stringify(record1.parser)
            return [
            <ModalForm isAdd={false} tableRefName={tableRef} rowData={JSON.parse(JSON.stringify(record1))} key="id" getDBlist={getDBlist} />,
            renderRemoveUser('删除',record.id)
          ]},
        },
    ];
    return (
        <div>
            <ProTable
            search={false}
              actionRef={tableRef}
              request={getDBlist}
              rowKey="id"
              toolbar={{
              actions: [
                  <ModalForm isAdd={true} getDBlist={getDBlist} tableRefName={tableRef} />
              ],
              }}
              columns={columns}
            ></ProTable>
        
        </div>
    )
}

import { useRef } from "react";
import ProTable from "@ant-design/pro-table";
import { getNetTable } from "../service";
import { Button } from "antd";

const DiagnoTableList = (props) => {
  const actionRef = useRef();
  
  const columns = [
    {
      title: "源虚拟机私网IP",
      dataIndex: "startip",
      hideInTable: true,
      valueType: "textarea"
    },
    {
      title: "源实例IP",
      dataIndex: "endip",
      hideInSearch: true,
      valueType: "textarea"
    },
    {
      title: "目标虚拟机私网IP",
      dataIndex: "endip",
      hideInTable: true,
      valueType: "textarea"
    },
    {
      title: "目标实例IP",
      dataIndex: "endip",
      hideInSearch: true,
      valueType: "textarea"
    },
    {
      title: "追踪包数",
      dataIndex: "packet",
      hideInTable: true,
      valueType: "progress",
    },
    {
      title: "间隔毫秒数",
      dataIndex: "ms",
      hideInTable: true,
      valueType: "progress",
    },
    {
      title: "报文协议",
      dataIndex: "agreement",
      hideInTable: true,
      valueType: "select",
      valueEnum: {
        icmp: { text: 'ICMP', status: 'icmp' },
        tcp: { text: 'TCP', status: 'tcp'}
      }
    },
    {
      title: "创建时间",
      dataIndex: "core_time",
      hideInSearch: true,
      valueType: "dateTime",
    },
    {
      title: "PingTraceId",
      dataIndex: "ping",
      hideInSearch: true,
      valueType: "textarea",
    },
    {
      title: "操作",
      dataIndex: "option",
      valueType: "option",
      render: (_, record) => [
        <a key="showDiagnose" onClick={()=>{
          props.onClick()
        }}>
          查看诊断结果
        </a>
      ],
    }
  ];

  
  return (
      <ProTable
        headerTitle={props.headerTitle}
        actionRef={actionRef}
        params={props.params}
        rowKey="id"
        request={getNetTable}
        columns={columns}
        pagination={props.pagination}
        pagination={{pageSize:5}}
        formRef={actionRef}
        search={
          {
            labelWidth: 120,
            optionRender:(Config, formProps, dom) => {
              return [
                <Button
                key="开始诊断"
                type="primary"
                onClick={()=>{
                  console.log(Config, formProps, dom,"000");
                }}
                >开始诊断</Button>,
              ]
            },
          }}
      />
  );
};

export default DiagnoTableList;

import React, { useRef } from "react";
import ProTable from "@ant-design/pro-table";
import { getIoTable } from "../service";
import { Button, Modal } from "antd";

const error = () => {
  Modal.error({
    title: '诊断失败',
    content: (
      <div>
        <div>错误码：{"诊断失败"}</div>
        <div>错误信息：{"timeout"}</div>
      </div>
    ),
  });
}

const DiagnoTableList = React.forwardRef((props, ref) => {
  console.log(props);
  const actionRef = useRef();

  const columns = [
    {
      title: "实例IP",
      dataIndex: "ip",
      valueType: "textarea",
    },
    {
      title: "诊断时长",
      dataIndex: "time",
      valueType: "textarea",
    },
    {
      title: "诊断阈值",
      dataIndex: "threshold",
      valueType: "textarea",
    },
    {
      title: "目标磁盘",
      dataIndex: "disk",
      valueType: "textarea",
    },
    {
      title: "诊断时间",
      dataIndex: "core_time",
      valueType: "dateTime",
    },
    {
      title: "IosDiagId",
      dataIndex: "ver",
      valueType: "textarea",
    },
    {
      title: "操作",
      dataIndex: "option",
      valueType: "option",
      render: (_, record) => [
        <a key="showDiagresults" onClick={()=>{
          props.onClick()
        }}>
          查看诊断结果
        </a>
      ],
    },
  ];
  return (
    <ProTable
      headerTitle={props.headerTitle}
      actionRef={ref}
      params={props.params}
      rowKey="id"
      request={getIoTable}
      columns={columns}
      pagination={props.pagination}
      search={false}
    />
  );
});

export default DiagnoTableList;

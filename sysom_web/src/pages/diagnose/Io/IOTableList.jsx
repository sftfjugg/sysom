import { useRef } from "react";
import ProTable from "@ant-design/pro-table";
import { getNetTable } from "../service";
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

const DiagnoTableList = (props) => {
  console.log(props);
  const actionRef = useRef();

  const columns = [
    {
      title: "主机名称",
      dataIndex: "hostname",
      valueType: "textarea",
    },
    {
      title: "诊断时长",
      dataIndex: "core_time",
      hideInTable: true,
      valueType: "progress",
    },
    {
      title: "诊断时间",
      dataIndex: "core_time",
      hideInSearch: true,
      valueType: "dateTime",
    },
    {
      title: "诊断阈值",
      dataIndex: "ver",
      hideInTable: true,
      valueType: "progress",
    },
    {
      title: "IosDiagId",
      dataIndex: "ver",
      hideInSearch: true,
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
      actionRef={actionRef}
      params={props.params}
      rowKey="id"
      request={getNetTable}
      columns={columns}
      pagination={props.pagination}
      pagination={{pageSize:5}}
      search={
        {
          optionRender:({searchText,resetText},{ form }) => {
            return [
              <Button
              key="开始诊断"
              type="primary"
              onClick={error}
              >开始诊断</Button>,
            ]
          },
        }}
    />
  );
};

export default DiagnoTableList;

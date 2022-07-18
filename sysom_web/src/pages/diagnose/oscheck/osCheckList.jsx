import React, { useRef } from "react";
import ProTable from "@ant-design/pro-table";
import { getTaskList } from "../service";

import { Button } from "antd";

const getOsCheckList = async () => {
  return await getTaskList({ service_name: "ossre" });
}


const DiagnoTableList = React.forwardRef((props, ref) => {


  const columns = [
    {
      title: "实例IP",
      dataIndex: "instance",
      valueType: "textarea"
    },
    {
      title: "创建时间",
      sortOrder: "descend",
      dataIndex: "created_at",
      valueType: "dateTime",
    },
    {
      title: "诊断ID",
      dataIndex: "task_id",
      valueType: "textarea",
    },
    {
      title: '状态',
      dataIndex: 'status',
      valueEnum: {
        Running: { text: '运行中', status: 'Processing' },
        Success: { text: '诊断完毕', status: 'Success' },
        Fail: { text: '异常', status: 'Error' },
      },
    },
    {
      title: "操作",
      dataIndex: "option",
      valueType: "option",
      render: (_, record) => {
        if (record.status == "Success") {
          return (
            <a key="showDiagnose" onClick={() => {
              props?.onClick?.(record)
            }}>查看诊断结果</a>
          )
        }
        else if (record.status == "Fail") {
          return (
            <a key="showError" onClick={() => {
              props?.onError?.(record)
            }}>查看出错信息</a>
          )
        }
        else {
          return (<span>暂无可用操作</span>);
        }
      },
    }
  ];

//     pagination={{ pageSize: 5 }}
  return (
    <ProTable
      headerTitle={props.headerTitle}
      actionRef={ref}
      params={props.params}
      rowKey="id"
      request={getOsCheckList}
      columns={columns}
      pagination={props.pagination}
 
      search={false}
    />
  );
});

export default DiagnoTableList;

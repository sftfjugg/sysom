import React from "react";
import ProTable from "@ant-design/pro-table";
import { useState, useRef, useImperativeHandle } from 'react';
import { getTaskList } from "../service";
import { useRequest } from 'umi';
import _ from "lodash";


const TaskList = React.forwardRef((props, ref) => {
  const actionRef = useRef([]);
  const [listData, SetListData] = useState([])

  const { loading, error, refresh } = useRequest(getTaskList, {
    defaultParams: { service_name: props.serviceName },
    onSuccess: (result, params) => {
      SetListData(result)
    },
  });

  useImperativeHandle(ref, () => ({
    refresh: refresh
  }));

  let columns = [
    {
      title: "诊断ID",
      dataIndex: "task_id",
      valueType: "textarea",
    },
    {
      title: "创建时间",
      dataIndex: "created_at",
      valueType: "dateTime",
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 150,
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
            <a key="showMemInfo" onClick={() => {
              props?.onClick?.(record)
            }}>查看诊断结果</a>
          )
        }
        else if (record.status == "Fail") {
          return (
            <a key="showMemError" onClick={() => {
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

  const FixField = ["created_at", "created_by", "id", "params", "service_name", "status", "task_id"]
  if (listData[0]) {
    let optionField = Object.keys(listData[0]).filter(i => !FixField.includes(i))
      .map(i => ({ title: i, dataIndex: i, valueType: "textarea", }))
    columns = optionField.concat(columns)
  }

  return (
    <ProTable
      options={{ reload: refresh }}
      loading={loading}
      rowKey="id"
      headerTitle={props.headerTitle || "诊断记录查看"}
      actionRef={ref}
      dataSource={listData}
      columns={columns}
      pagination={props.pagination || { pageSize: 5 }}
      search={props.search || false}
    />
  );
});

export default TaskList;

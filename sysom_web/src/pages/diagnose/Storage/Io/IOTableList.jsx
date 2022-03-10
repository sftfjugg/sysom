import React, { useRef } from "react";
import ProTable from "@ant-design/pro-table";
import { getTaskList } from "../../service";

function parseJsonString(str) {
  try {
    return JSON.parse(str.replace(/\'/g, "\""));
  }
  catch (e) {
    return {}
  }
}

const getIODiagList = async () => {
  try {
    let msg = await getTaskList({ service_name: "iosdiag_latency" });
    msg.data = msg.data.map((item) => ({ ...item, ...parseJsonString(item.params) }))
    return {
      data: msg.data.reverse(),
      success: true,
      total: msg.total,
    };
  } catch (e) {
    return { success: false }
  }
}

const IOTableList = React.forwardRef((props, ref) => {
  const actionRef = useRef();

  const columns = [
    {
      title: "实例IP",
      dataIndex: "实例IP",
      valueType: "textarea",
    },
    {
      title: "诊断时长",
      dataIndex: "诊断时长",
      valueType: "textarea",
    },
    {
      title: "时间阈值",
      dataIndex: "时间阈值",
      valueType: "textarea",
    },
    {
      title: "目标磁盘",
      dataIndex: "目标磁盘",
      valueType: "textarea",
    },
    {
      title: "诊断时间",
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
      width: 150,
      valueEnum: {
        Ready: { text: '运行中', status: 'Running' },
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
            <a key="showIODiagnose" onClick={() => {
              props?.onClick?.(record)
            }}>查看诊断结果</a>
          )
        }
        else if (record.status == "Fail") {
          return (
            <a key="showIOError" onClick={() => {
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
  const pagination=(props.pagination) ? props.pagination : {pageSize: 5}
  return (
    <ProTable
      headerTitle={props.headerTitle}
      actionRef={ref}
      params={props.params}
      rowKey="id"
      request={getIODiagList}
      columns={columns}
      pagination={pagination}
      search={false}
    />
  );
});

export default IOTableList;

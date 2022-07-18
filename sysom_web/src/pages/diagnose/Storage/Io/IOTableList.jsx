import React, { useRef } from "react";
import ProTable from "@ant-design/pro-table";
import { getTaskList } from "../../service";

const getIODiagList = async () => {
  try {
    let msg = await getTaskList({ service_name: "iosdiag_latency" });
    msg.data = msg.data.map((item) => ({ ...item, ...item.params}))
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
      dataIndex: "instance",
      valueType: "textarea",
    },
    {
      title: "诊断时长",
      dataIndex: "diag_time",
      valueType: "textarea",
    },
    {
      title: "时间阈值",
      dataIndex: "thresh",
      valueType: "textarea",
    },
    {
      title: "目标磁盘",
      dataIndex: "disk",
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

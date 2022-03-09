import React  from "react";
import ProTable from "@ant-design/pro-table";


const DiagnoTableList = React.forwardRef((props, ref) => {

  const columns = [
    {
      title: "检查项目",
      dataIndex: "item",
      valueType: "textarea",
      width: 200,
    },
    {
      title: '状态',
      dataIndex: 'level',
      width: 100,
      valueEnum: {
        none: { text: '正常', status: 'Success' },
        info: { text: '提示', status: 'Warning' },
        warning: { text: '告警', status: 'Warning' },
        error: { text: '一般错误', status: 'Error' },
        critical: { text: '严重错误', status: 'Error' },
        fatal: { text: '致命错误', status: 'Error' },
      },
    },
    {
      title: "检查结果",
      dataIndex: "summary",
      valueType: "textarea",
      ellipsis: true,
    },
    {
      title: "操作",
      dataIndex: "option",
      valueType: "option",
      width: 200,
      render: (_, record) => {
        if (record.level != "none") {
          return (
            <a key="showError" onClick={() => {
              props?.onRepair?.(record)
            }}>自动修复</a>
          )
        }
        else {
          return (<span></span>);
        }
      },
    }
  ];

  //  defaultExpandAllRows={true}
  return (
    <ProTable
      headerTitle={props.headerTitle}
      actionRef={ref}
      rowKey="key"
      dataSource={props.data}
      columns={columns}
      pagination={false}
      search={false}
    />
  );
});

export default DiagnoTableList;

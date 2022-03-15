import React, { useRef } from "react";
import ProTable from "@ant-design/pro-table";

const MarketMemoryTable = React.forwardRef((props, ref) => {
  const actionRef = useRef();
  const columns = [
    {
      title: "进程名",
      dataIndex: "comm",
      valueType: "textarea",
    },
    {
      title: "总内存",
      dataIndex: "total_mem",
      valueType: "textarea",
      renderText: (val) => `${val} KB`,
    },
    {
      title: "anon",
      dataIndex: "RssAnon",
      valueType: "textarea",
      renderText: (val) => `${val} KB`,
    },
    {
      title: 'file',
      dataIndex: 'RssFile',
      valueType: "textarea",
      renderText: (val) => `${val} KB`,
    },
    {
      title: "RssShmem",
      dataIndex: "RssShmem",
      valueType: "textarea",
      renderText: (val) => `${val} KB`,
    }
  ];
  const pagination=(props.pagination) ? props.pagination : {pageSize: 5}
  return (
      <ProTable
        headerTitle={props.subtitle}
        actionRef={ref}
        params={props.params}
        rowKey="pid"
        request={(params, sorter, filter) => {
          return Promise.resolve({
            data: props.data.taskMemTop,
            success: true,
          });
        }}
        columns={columns}
        pagination={pagination}
        search={false}
      />
  );
});

export default MarketMemoryTable;

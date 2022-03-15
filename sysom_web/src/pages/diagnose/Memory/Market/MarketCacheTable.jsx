import React, { useRef } from "react";
import ProTable from "@ant-design/pro-table";

const MarketCacheTable = React.forwardRef((props, ref) => {
  const actionRef = useRef();
  const columns = [
    {
      title: "文件名",
      dataIndex: "file",
      valueType: "textarea",
    },
    {
      title: "cached",
      dataIndex: "cached",
      valueType: "textarea",
      renderText: (val) => `${val} KB`,
    },
    {
      title: "进程",
      dataIndex: "task",
      renderText: (val) => `${val.toString()}`,
    }
  ];
  const pagination=(props.pagination) ? props.pagination : {pageSize: 5}
  return (
      <ProTable
        headerTitle={props.subtitle}
        actionRef={ref}
        params={props.params}
        rowKey="cached"
        request={(params, sorter, filter) => {
          return Promise.resolve({
            data: props.data.filecacheTop,
            success: true,
          });
        }}
        columns={columns}
        pagination={pagination}
        search={false}
      />
  );
});

export default MarketCacheTable;

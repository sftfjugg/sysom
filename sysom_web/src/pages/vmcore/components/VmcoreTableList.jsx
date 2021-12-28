import { useRef } from "react";
import ProTable from "@ant-design/pro-table";
import { getVmcore } from "../service";

const VmcoreTableList = (props) => {
  const actionRef = useRef();

  const columns = [
    {
      title: "主机名称",
      dataIndex: "hostname",
      valueType: "textarea",
    },
    {
      title: "IP",
      dataIndex: "ip",
      hideInSearch: true,
      valueType: "textarea",
    },
    {
      title: "宕机时间",
      dataIndex: "core_time",
      sorter: true,
      hideInSearch: true,
      valueType: "dateTime",
    },
    {
      title: "时间范围",
      dataIndex: "core_time",
      valueType: "dateRange",
      hideInTable: true,
      search: {
        transform: (value) => {
          return {
            startTime: value[0],
            endTime: value[1],
          };
        },
      },
    },
    {
      title: "内核版本",
      dataIndex: "ver",
      valueType: "texarea",
    },
    {
      title: "Vmcore",
      dataIndex: "vmcore_check",
      hideInSearch: true,
      valueEnum: {
        false: {
          text: "无",
          status: "Default",
        },
        true: {
          text: "有",
          status: "Success",
        },
      },
    },
    {
      title: "解决方案",
      dataIndex: "issue_check",
      hideInSearch: true,
      valueEnum: {
        false: {
          text: "无",
          status: "Default",
        },
        true: {
          text: "有",
          status: "Success",
        },
      },
    },
    {
      title: "宕机详情",
      dataIndex: "option",
      valueType: "option",
      render: (_, record) => [
        <a key="showDetail" href={"/vmcore/detail/" + record.id}>
          查看
        </a>,
      ],
    },
  ];
  let config = {
    request: getVmcore,
    params: props.params,
  };
  if (props.request) {
    config = {
      request: props.request,
      params: props.params,
      postData: props.postData,
    };
  }
  return (
    <ProTable
      headerTitle={props.headerTitle}
      actionRef={actionRef}
      rowKey="id"
      columns={columns}
      pagination={props.pagination}
      search={props.search}
      {...config}
    />
  );
};

export default VmcoreTableList;

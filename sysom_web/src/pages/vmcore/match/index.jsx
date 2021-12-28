import React, { useRef } from "react";
import { PageContainer } from "@ant-design/pro-layout";
import ProTable from "@ant-design/pro-table";
import { getVmcore } from "../service";
import TextArea from "antd/lib/input/TextArea";

const VmcoreMatch = () => {
  const actionRef = useRef();
  const columns = [
    {
      title: "主机名称",
      dataIndex: "hostname",
      valueType: "textarea",
      hideInSearch: true,
    },
    {
      title: "相似调用栈",
      dataIndex: "similar_dmesg",
      valueType: "textarea",
      colSize: 4,
      hideInTable: true,
      renderFormItem: (_, { type, defaultRender, formItemProps, fieldProps, ...rest }, form) => {
        const status = form.getFieldValue("state");
        if (status !== "open") {
          return <TextArea {...fieldProps} rows={8} />;
        }
        return defaultRender(_);
      },
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
      title: "内核版本",
      dataIndex: "ver",
      valueType: "texarea",
      hideInSearch: true,
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
      title: "相似度",
      dataIndex: "rate",
      hideInSearch: true,
      valueType: "textarea",
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
  return (
    <PageContainer>
      <ProTable
        headerTitle="宕机列表"
        actionRef={actionRef}
        rowKey="id"
        request={getVmcore}
        columns={columns}
        pagination={{ pageSize: 5 }}
      />
    </PageContainer>
  );
};
export default VmcoreMatch;

import React, { useState, useRef } from "react";
import { Button, message } from "antd";
import { useIntl } from "umi";
import moment from "moment";
import ProCard from "@ant-design/pro-card";
import ProDescriptions from "@ant-design/pro-descriptions";
import { PageContainer } from "@ant-design/pro-layout";
import { ModalForm, ProFormTextArea } from "@ant-design/pro-form";
import VmcoreTableList from "../components/VmcoreTableList";
import { getSolution, addIssue, getSimilarPanic, getVmcoreDetail } from "../service";

const { Divider } = ProCard;

const handleAddIssue = async (fields) => {
  const hide = message.loading("正在添加");

  try {
    await addIssue({ ...fields });
    hide();
    message.success("添加成功");
    return true;
  } catch (error) {
    hide();
    message.error("添加失败，排查原因后重试!");
    return false;
  }
};

const VmcoreDetail = (props) => {
  const [createModalIssue, handleModalIssue] = useState(false);
  const actionRef = useRef();
  const intl = useIntl();
  return (
    <PageContainer>
      <ProCard>
        <ModalForm
          title={intl.formatMessage({
            id: "pages.IssueTable.createIssue",
            defaultMessage: "New issue",
          })}
          visible={createModalIssue}
          onVisibleChange={handleModalIssue}
          onFinish={async (value) => {
            const success = await handleAddIssue({
              ...value,
              vmcore_id: props.match.params.id,
            });
            if (success) {
              handleModalIssue(false);
              actionRef.current?.reload();
            }
          }}
        >
          <ProFormTextArea label="解决方案" name="solution" />
        </ModalForm>
        <ProDescriptions
          actionRef={actionRef}
          title="解决方案"
          params={{ vmcore_id: props.match.params.id }}
          request={getSolution}
        >
          <ProDescriptions.Item dataIndex="solution">
            尚未录入
          </ProDescriptions.Item>
          <ProDescriptions.Item label="文本" valueType="option">
            <Button
              type="primary"
              onClick={() => {
                handleModalIssue(true);
              }}
              key="postSlution"
            >
              录入解决方案
            </Button>
            <Button
              type="primary"
              onClick={() => {
                actionRef.current?.reload();
              }}
              key="analyse"
            >
              在线分析Vmcore
            </Button>
          </ProDescriptions.Item>
        </ProDescriptions>
      </ProCard>
      <Divider />
      <VmcoreTableList
        headerTitle="一层调用栈相似宕机列表"
        pagination={{ pageSize: 5 }}
        params={{ vmcore_id: props.match.params.id, similar: 1 }}
        request={getSimilarPanic}
        postData={(data) => {
          return data?.calltrace_1;
        }}
        search={false}
      />
      <Divider />
      <VmcoreTableList
        headerTitle="二层调用栈相似宕机列表"
        pagination={{ pageSize: 5 }}
        params={{ vmcore_id: props.match.params.id, similar: 1 }}
        request={getSimilarPanic}
        postData={(data) => {
          return data?.calltrace_2;
        }}
        search={false}
      />
      <Divider />
      <VmcoreTableList
        headerTitle="三层调用栈相似宕机列表"
        pagination={{ pageSize: 5 }}
        params={{ vmcore_id: props.match.params.id, similar: 1 }}
        request={getSimilarPanic}
        postData={(data) => {
          return data?.calltrace_3;
        }}
        search={false}
      />
      <Divider />
      <ProCard>
        <ProDescriptions column={2} title="宕机详情" params={{ vmcore_id: props.match.params.id }} request={getVmcoreDetail}>
          <ProDescriptions.Item label="hostname" dataIndex="hostname"></ProDescriptions.Item>
          <ProDescriptions.Item label="IP" dataIndex="ip"></ProDescriptions.Item>
          <ProDescriptions.Item label="RIP" dataIndex="rip"></ProDescriptions.Item>
          <ProDescriptions.Item label="当前进程" dataIndex="comm"></ProDescriptions.Item>
          <ProDescriptions.Item label="内核版本" dataIndex="ver"></ProDescriptions.Item>
          <ProDescriptions.Item label="宕机时间" dataIndex="core_time" valueType="dateTime"> {moment().valueOf()} </ProDescriptions.Item>
          <ProDescriptions.Item span={2} label="calltrace" dataIndex="calltrace" valueType="textArea" ></ProDescriptions.Item>
        </ProDescriptions>
      </ProCard>
    </PageContainer>
  );
};
export default VmcoreDetail;

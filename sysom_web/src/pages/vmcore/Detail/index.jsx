import React, { useState, useRef } from "react";
import { Button, message, Descriptions } from "antd";
import { useIntl, useRequest } from "umi";
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
  const { data, error, loading } = useRequest(() => {
    return getVmcoreDetail({vmcore_id: props.match.params.id})
  })

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
              href={"/vmcore/analyse/" + data?.ip}
              target="_blank"
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
        <Descriptions column={2} title="宕机详情" >
          <Descriptions.Item label="hostname">{data?.hostname}</Descriptions.Item>
          <Descriptions.Item label="IP" >{data?.ip}</Descriptions.Item>
          <Descriptions.Item label="RIP" >{data?.func_name}</Descriptions.Item>
          <Descriptions.Item label="当前进程" >{data?.comm}</Descriptions.Item>
          <Descriptions.Item label="内核版本" >{data?.ver}</Descriptions.Item>
          <Descriptions.Item label="宕机时间" >{data?.core_time} </Descriptions.Item>
          <Descriptions.Item label="dmesg"  ><pre>{data?.dmesg}</pre></Descriptions.Item>
        </Descriptions>
      </ProCard>
    </PageContainer>
  );
};
export default VmcoreDetail;

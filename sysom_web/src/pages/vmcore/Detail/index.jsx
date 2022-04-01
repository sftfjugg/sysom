import React, { useState, useRef } from "react";
import { Button, message, Descriptions, Popover } from "antd";
import { Link, useIntl, useRequest, request } from "umi";
import ProCard from "@ant-design/pro-card";
import ProDescriptions from "@ant-design/pro-descriptions";
import { PageContainer } from "@ant-design/pro-layout";
import { ModalForm, ProFormTextArea } from "@ant-design/pro-form";
import VmcoreTableList from "../components/VmcoreTableList";
import { QuestionCircleOutlined } from "@ant-design/icons";
import {
  getSolution,
  addIssue,
  getSimilarPanic,
  getVmcoreDetail,
} from "../service";

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
    message.error("添加失败, 排查原因后重试!");
    return false;
  }
};

const VmcoreDetail = (props) => {
  const [createModalIssue, handleModalIssue] = useState(false);
  const actionRef = useRef();
  const intl = useIntl();
  const [similarPanicData, setSimilarPanicData] = useState(0);
  const { data, error, loading } = useRequest(() => {
    return getVmcoreDetail({ vmcore_id: props.match.params.id });
  });

  const { datalist } = useRequest(() => {
    return getVMcoreDetailList();
  });

  const getVMcoreDetailList = async () => {
    const msg = await request("/api/v1/vmcore/", {
      params: { vmcore_id: props.match.params.id, similar: 1 },
    });
    setSimilarPanicData({ rawData: msg.data });
  };

  const firstStackTips = (
    <div>
      <div>一层调用栈相似宕机列表，显示只匹配到一层调用栈相似的宕机，</div>
      <div>如果匹配到有二或三层调用栈相似，将不在此表格显示</div>
      <div>如无数据，将不显示此表格</div>
    </div>
  );
  const secondStackTips = (
    <div>
      <div>二层调用栈相似宕机列表，显示只匹配到二层调用栈相似的宕机，</div>
      <div>如果匹配到有三层调用栈相似，将不在此表格显示</div>
      <div>如无数据，将不显示此表格</div>
    </div>
  );
  const thirdStackTips = (
    <div>
      <div>三层调用栈相似宕机列表，显示只匹配到三层调用栈相似的宕机，</div>
      <div>如无数据，将不显示此表格</div>
    </div>
  );
  const issueTips = (
    <div>
      <div>如果发现解决此宕机的网址、分析过程或者补丁方案可直接录入，</div>
      <div>后续一样的宕机问题将会关联到同一个解决方案。</div>
    </div>
  );

  const HeaderTitleCommon = (props) => {
    return (
      <>
        {props.title}
        <Popover content={props.data}>
          <QuestionCircleOutlined />
        </Popover>
      </>
    );
  };

  const SimilarPanicTable = (props) => {
    if (props.calltraceLength > 0) {
      return (
        <VmcoreTableList
          headerTitle={[
            <HeaderTitleCommon
              title={props.title}
              data={props.tips}
              key={props.childKey}
            />,
          ]}
          pagination={{ pageSize: 5 }}
          params={props.params}
          request={props.request}
          postData={props.postData}
          search={false}
        />
      );
    } else {
      return (
        <ProCard>
          无
          <HeaderTitleCommon
            title={props.title}
            data={props.tips}
            key={props.childKey}
          />
        </ProCard>
      );
    }
  };

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
          title={[
            <HeaderTitleCommon
              title="解决方案"
              data={issueTips}
              key="issueTips"
            />,
          ]}
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
            <Button type="primary">
              <Link
                target="_blank"
                to={{
                  pathname: "/vmcore/analyse",
                  search: `kernel_version=${data?.ver}&vmcore_file=${data?.vmcore_file}`,
                }}
              >
                在线分析Vmcore
              </Link>
            </Button>
          </ProDescriptions.Item>
        </ProDescriptions>
      </ProCard>
      <Divider />
      <ProCard>
        <Descriptions column={2} title="宕机详情">
          <Descriptions.Item label="hostname">
            {data?.hostname}
          </Descriptions.Item>
          <Descriptions.Item label="IP">{data?.ip}</Descriptions.Item>
          <Descriptions.Item label="RIP">{data?.func_name}</Descriptions.Item>
          <Descriptions.Item label="当前进程">{data?.comm}</Descriptions.Item>
          <Descriptions.Item label="内核版本">{data?.ver}</Descriptions.Item>
          <Descriptions.Item label="宕机时间">
            {data?.core_time}{" "}
          </Descriptions.Item>
          <Descriptions.Item label="dmesg">
            <pre>{data?.dmesg}</pre>
          </Descriptions.Item>
        </Descriptions>
      </ProCard>
      <Divider />
      <SimilarPanicTable
        title="一层相似调用栈"
        childKey="similarCalltrace1"
        tips={firstStackTips}
        params={{ vmcore_id: props.match.params.id, similar: 1 }}
        request={getSimilarPanic}
        postData={(data) => {
          return data?.calltrace_1;
        }}
        calltraceLength={similarPanicData.rawData?.calltrace_1?.length}
      />
      <Divider />
      <SimilarPanicTable
        title="二层相似调用栈"
        childKey="similarCalltrace2"
        tips={secondStackTips}
        params={{ vmcore_id: props.match.params.id, similar: 1 }}
        request={getSimilarPanic}
        postData={(data) => {
          return data?.calltrace_2;
        }}
        calltraceLength={similarPanicData.rawData?.calltrace_2?.length}
      />
      <Divider />
      <SimilarPanicTable
        title="三层相似调用栈"
        childKey="similarCalltrace3"
        tips={thirdStackTips}
        params={{ vmcore_id: props.match.params.id, similar: 1 }}
        request={getSimilarPanic}
        postData={(data) => {
          return data?.calltrace_3;
        }}
        calltraceLength={similarPanicData.rawData?.calltrace_3?.length}
      />
    </PageContainer>
  );
};
export default VmcoreDetail;

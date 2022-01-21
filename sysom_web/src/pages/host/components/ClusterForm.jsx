import { Button, message } from "antd";
import { ModalForm, ProFormText } from "@ant-design/pro-form";
import { FormattedMessage } from 'umi';
import { PlusOutlined } from "@ant-design/icons";
import { addCluster } from "../service";

const handleAddCluster = async (fields) => {
  const hide = message.loading('正在创建');
  const token = localStorage.getItem('token');
  
  try {
    await addCluster({ ...fields}, token);
    hide();
    message.success('创建成功');
    return true;
  } catch (error) {
    hide()
    return false;
  }
};

const Cluster = () => {
  return (
    <ModalForm
      title="新建集群"
      trigger={
        <Button type="primary">
          <PlusOutlined />新建集群
        </Button>
      }
      submitter={{
        searchConfig: {
          submitText: "确认",
          resetText: "取消",
        },
      }}
      onFinish={async (values) => {
        await handleAddCluster(values);
        return true;
      }}
    >
      <ProFormText
        width="md"
        name="cluster_name"
        label="集群名称"
        placeholder="请输入集群名称"
        rules={[
          {
            required: true,
            message: (
              <FormattedMessage
                id="pages.hostTable.cluster_name_required"
                defaultMessage="Cluster name is required"
              />
            ),
          },
        ]}
      />
    </ModalForm>
  );
};
export default Cluster
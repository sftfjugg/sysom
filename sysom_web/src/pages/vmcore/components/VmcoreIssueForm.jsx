import { Button, message } from "antd";
import { ModalForm, ProFormTextArea } from "@ant-design/pro-form";
import { PlusOutlined } from "@ant-design/icons";
import { addIssue } from "../service"; 

const handleAddIssue = async (fields) => {
  const hide = message.loading("正在添加");

  try {
    await addIssue({ ...fields });
    hide();
    message.success("添加成功");
    return true;
  } catch (error) {
    hide();
    message.error("添加失败，请重试!");
    return false;
  }
};

const VmcoreIssue = () => {
  return (
    <ModalForm
      title="录入解决方案"
      trigger={
        <Button type="primary">
          <PlusOutlined />
          录入解决方案
        </Button>
      }
      submitter={{
        searchConfig: {
          submitText: "确认",
          resetText: "取消",
        },
      }}
      onFinish={async (value) => {
        await handleAddIssue(value);
        return true;
      }}
    >
      <ProFormTextArea label="解决方案"  name="solution" />
    </ModalForm>
  );
};
export default VmcoreIssue;

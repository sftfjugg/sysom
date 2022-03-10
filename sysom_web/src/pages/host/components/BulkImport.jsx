import { Button, message  } from "antd";
import ProForm, { ModalForm, ProFormText, ProFormUploadButton } from "@ant-design/pro-form";
import { FormattedMessage } from 'umi';
import { ImportOutlined } from "@ant-design/icons";
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

const BulkImport = () => {
  return (
    <ModalForm
      title="批量导入"
      width="440px"
      trigger={
        <Button type="primary">
          <ImportOutlined />批量导入
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
      <ProFormUploadButton
        name="upload"
        label="批量导入："
        // labelCol={ span: 4 }
        // wrapperCol={ span: 14 }
        max={2}
        fieldProps={{
          name: 'file',
        }}
        action="/upload.do"
        extra="导入excel文件"
      />
    </ModalForm>
  );
};
export default BulkImport
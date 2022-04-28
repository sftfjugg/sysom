import { Button, message } from "antd";
import { ModalForm, ProFormUploadButton } from "@ant-design/pro-form";
import { ImportOutlined } from "@ant-design/icons";
import { addBulkImport } from "../service";

const BulkImport = (props) => {
  const { actionRef } = props

  const handlerBulkImport = async (fileObj) => {
    const hide = message.loading("正在创建");
    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("file", fileObj);

    await addBulkImport(formData, token).then((res) => {
      message.success(res.message)

      if (actionRef.current) {
        actionRef.current.reload()
      }
    }).catch((e) => {
      message.error(e)
    })
  };

  return (
    <ModalForm
      title="批量导入"
      width="440px"
      trigger={
        <Button type="primary">
          <ImportOutlined />
          批量导入
        </Button>
      }
      submitter={{
        searchConfig: {
          submitText: "确认",
          resetText: "取消",
        },
      }}
      onFinish={async (values) => {
        const fileObj = values.file[0].originFileObj
        await handlerBulkImport(fileObj);
        return true;
      }}
    >
      <ProFormUploadButton
        accept=".xls, .xlsx"
        name="file"
        label="批量导入："
        max={2}
        extra="导入excel文件"
        beforeUpload={() => false}
        addonAfter={<a href="/resource/主机导入模板.xls">模板下载</a>}
      />
    </ModalForm>
  );
};
export default BulkImport;

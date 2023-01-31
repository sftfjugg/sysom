import { ProForm, ModalForm, ProFormText, ProFormTextArea, ProFormSelect } from '@ant-design/pro-form';
import { Button, Form, message } from 'antd';
import { postChangeKernelVersion, getKernelVersionList, getOSTypeList } from '../service'
/**
 * 修改内核版本表单组件
 */
const ReviseVersion = (record,refresh) => {
  return (
    <ModalForm
      title="修改内核版本配置"
      trigger={<a>修改</a>}
      submitter={{
        searchConfig: {
          submitText: '确认',
          resetText: '取消',
        },
      }}
      modalProps={{
        destroyOnClose: true,
        onCancel: () => console.log('取消'),
      }}
      autoFocusFirstInput
      onFinish={async (values) => {
        console.log(values,"0000");
        const data = {
          id: record.record.id,
          os_type: values.os_type,
          kernel_version: values.kernel_version,
          git_branch: values.git_branch,
          devel_link: values.devel_link,
          debuginfo_link: values.debuginfo_link
        }
        await postChangeKernelVersion(data).then(res=>{
          if(res.code === 200){
            getKernelVersionList();
            message.success('提交成功');
            location.reload();
          }
        });
        return true;
      }}
    >
      <ProFormText
        width="md"
        name="kernel_version"
        label="内核版本"
        tooltip={"请修改内核版本"}
        placeholder="请输入名称"
        initialValue={record.record.kernel_version}
      />
      <ProFormText width="md" name="os_type" label="操作系统类型" placeholder="输入操作系统类型" initialValue={record.record.os_type}/>
      <ProFormText width="md" name="git_branch" label="git标签" placeholder="请输入git标签" initialValue={record.record.git_branch}/>
      <ProFormText width="md" name="devel_link" label="devel链接" placeholder="请输入devel包链接" initialValue={record.record.devel_link} />
      <ProFormText width="md" name="debuginfo_link" label="debuginfo链接" placeholder="请输入debuginfo包链接" initialValue={record.record.debuginfo_link} />
    </ModalForm>
  );
  };
  export default ReviseVersion
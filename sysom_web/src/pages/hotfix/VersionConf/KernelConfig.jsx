import React, { useRef, useState, useEffect } from 'react';
import { useIntl, FormattedMessage } from 'umi';
import { PageContainer } from '@ant-design/pro-layout';
import ProTable from '@ant-design/pro-table';
import { Popconfirm, message, Upload, Button, Select, Form} from 'antd';
import { delOSType, delKernelVersion, getOSTypeList, getKernelVersionList, submitOSType, submitKernelVersion, postChangeKernelVersion } from '../service';
import { ProForm, ModalForm, ProFormText, ProFormTextArea, ProFormSelect } from '@ant-design/pro-form';
import VersionConfigForm from '../components/VersionConfigForm'
import ProCard from '@ant-design/pro-card';

const { Divider } = ProCard;

const handleDelKernelVersion = async (record) => {
  const hide = message.loading('正在删除');
  const token = localStorage.getItem('token');
  try {
      let res = await delKernelVersion(record.id, token);
      hide();
      if (res.code == 200) {
          message.success('删除成功');
          getKernelVersionList();
          return true;
      } else {
          message.error(`删除失败: ${res.message}`);
          return false;
      }
  } catch (error) {
      hide();
      return false;
  }
}

const VersionConfigList = React.forwardRef((props, ref) => {
  const versionlistRef = useRef();
  const intl = useIntl();
  const onPostTask = () => {
    versionlistRef.current.reload();
  }
 
  const columns = [
    {
      title: <FormattedMessage id="pages.hotfix.kernel_version" defaultMessage="kernel_version"/>,
      dataIndex: 'kernel_version',
      key: 'kernel_version',
      tooltip: "请全量输入该内核版本的版本名"
    },
    {
      title: <FormattedMessage id="pages.hotfix.os_type" defaultMessage="os_type"/>,
      dataIndex: 'os_type',
      key: 'os_type',
      tooltip: "这是该内核版本所属操作系统，请从上表中选择已配置的操作系统。如4.19.91-26.an8.x86_64属于anolis操作系统",
      hideInSearch: true,
    },
    {
      title: <FormattedMessage id="pages.hotfix.kernel_repo_branch" defaultMessage="repo_branch" />,
      dataIndex: 'source',
      valueType: 'input',
      tooltip: '该内核版本所在仓库的源码git标签(tag)或者分支(branch)'
    },
    {
      title: <FormattedMessage id="pages.hotfix.kernel_devel_location" defaultMessage="devel_location" />,
      dataIndex: 'devel_link',
      valueType: 'input',
      tooltip: '请输入该内核版本的devel包下载链接'
    },
    {
      title: <FormattedMessage id="pages.hotfix.kernel_debuginfo_location" defaultMessage="debuginfo_location" />,
      dataIndex: 'debuginfo_link',
      valueType: 'input',
      tooltip: '请输入该内核版本的debuginfo包下载链接'
    },
    {
      // This is Operation column
      title: <FormattedMessage id="pages.hotfix.operation" defaultMessage="Operating" />,
      key: 'option',
      dataIndex: 'option',
      valueType: 'option',
      render: (_, record) => [
          <span key='delete'>
              <Popconfirm title="是否要删除该内核版本?" onConfirm={async () => {
                  if (record.id == undefined) {
                      message.error(intl.formatMessage({
                          id: 'pages.hotfix.delete_hotfix_not_exist',
                          defaultMessage: "Not allow to delete this hotfix"
                      }))
                      console.log(intl.formatMessage({
                        id: 'pages.hotfix.delete_hotfix_not_exist',
                        defaultMessage: "Not allow to delete this hotfix"
                    }))
                  } else {
                      await handleDelKernelVersion(record);
                      versionlistRef.current.reload();
                  }
              }}>
                  <a><FormattedMessage id="pages.hotfix.delete" defaultMessage="hotfix delete" /></a>
              </Popconfirm>
          </span>,
          <span key='log'>
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
                const data = {
                  id: record.id,
                  os_type: values.os_type,
                  kernel_version: values.kernel_version,
                  source: values.source,
                  devel_link: values.devel_link,
                  debuginfo_link: values.debuginfo_link
                }
                await postChangeKernelVersion(data);
                message.success('提交成功');
                versionlistRef.current.reload();
                return true;
              }}
            >
              <ProFormText
                width="md"
                name="kernel_version"
                label="内核版本"
                tooltip={"请修改内核版本"}
                placeholder="请输入名称"
                initialValue={record.kernel_version}
              />
              <ProFormSelect width="md" options={props.OSTypedata.concat(props.data)} name="os_type" label="操作系统名" placeholder="输入操作系统类型" initialValue={record.os_type} />
              <ProFormText width="md" name="source" label="源码来源" placeholder="请输入源码来源" initialValue={record.source}/>
              <ProFormText width="md" name="devel_link" label="devel链接" placeholder="请输入devel包链接" initialValue={record.devel_link} />
              <ProFormText width="md" name="debuginfo_link" label="debuginfo链接" placeholder="请输入debuginfo包链接" initialValue={record.debuginfo_link} />
            </ModalForm>
          </span>
      ],
    }
  ];
  return (
    <>
      <VersionConfigForm onSuccess={onPostTask} optionlist={props.OSTypedata.concat(props.data)} />
      <Divider />
      <ProTable
        headerTitle={intl.formatMessage({
          id: 'pages.hotfix.title.versionconf',
          defaultMessage: 'kernel verion conf',
        })}
        search={false}
        actionRef={versionlistRef}
        rowKey="id"
        toolBarRender={() => [
        ]}
        request={getKernelVersionList}
        columns={columns}
      />
    </>
  );
});

export default VersionConfigList;
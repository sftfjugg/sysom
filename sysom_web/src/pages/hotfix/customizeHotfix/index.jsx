import {  useRef } from 'react';
import { useIntl, FormattedMessage } from 'umi';
import { PageContainer } from '@ant-design/pro-layout';
import ProTable from '@ant-design/pro-table';
import { Popconfirm, message, Upload, Button, Select, Form} from 'antd';
import { getHotfixList, delHotfix, downloadHotfixFile, normFile, uploadProps } from '../service';
import { UploadOutlined, DownloadOutlined } from '@ant-design/icons';

const handleDelHotfix = async (record) => {
  const hide = message.loading('正在删除');
  const token = localStorage.getItem('token');
  try {
      let res = await delHotfix(record.id, token);
      hide();
      if (res.code == 200) {
          message.success('删除成功');
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


const downloadHotfix = async (record) => {
  const res = await downloadHotfixFile(record.id);
  console.log(res)
  if (res) {
    const url = window.URL.createObjectURL(res.data);
    const link = document.getElementById('downloadDiv'); //创建a标签
    link.style.display = 'none';
    link.href = url; // 设置a标签路径
    link.download = res.response.headers.get('content-disposition').split("attachment;filename=")[1]; //设置文件名
    document.body.appendChild(link);
    link.click();
    URL.revokeObjectURL(link.href); // 释放 URL对象
    document.body.removeChild(link);
    console.log(res.response.headers.get('content-disposition').split("attachment;filename=")[1])
  }
}

const customizeHotfixList = () => {
  const actionRef = useRef();
  const intl = useIntl();

  const columns = [
    {
      title: <FormattedMessage id="pages.hotfix.os_type" defaultMessage="os_type"/>,
      dataIndex: 'os_type',
      key: 'os_type',
      dataIndex: 'os_type',
      hideInTable: true,
      hideInSearch: true,
      render: (_, record) => [ 
      ],
      renderFormItem: (item, _a, form) => {
        return  <Select defaultValue={"Anolis"}/>
      },
    },
    {
      title: <FormattedMessage id="pages.hotfix.kernel_version" defaultMessage="kernel_version" />,
      dataIndex: 'kernel_version',
      valueType: 'input',
      tooltip: "请输入您自定义的内核版本号，请全量输入"
    },
    {
      title: <FormattedMessage id="pages.hotfix.creator" defaultMessage="create_user" />,
      dataIndex: 'creator',
      valueType: 'message',
      hideInSearch: true,
    },
    {
      title: <FormattedMessage id="pages.hotfix.patch_name" defaultMessage="name" />,
      dataIndex: 'patch_name',
      valueType: 'input',
    },
    {
      title: <FormattedMessage id="pages.hotfix.kernel_repo_location" defaultMessage="repo_location" />,
      dataIndex: 'repo_location',
      valueType: 'input',
      hideInTable: true,
      tooltip: '请输入构建平台能够访问到的git仓库地址'
    },
    {
      title: <FormattedMessage id="pages.hotfix.kernel_repo_branch" defaultMessage="branch" />,
      dataIndex: 'branch',
      valueType: 'input',
      hideInTable: true,
      tooltip: '请输入该版本内核源码所在git分支'
    },
    {
      title: <FormattedMessage id="pages.hotfix.kernel_devel_location" defaultMessage="devel_location" />,
      dataIndex: 'devel_location',
      valueType: 'input',
      hideInTable: true,
      tooltip: '请输入该内核的devel包的下载链接'
    },
    {
      title: <FormattedMessage id="pages.hotfix.kernel_debuginfo_location" defaultMessage="debuginfo_location" />,
      dataIndex: 'debuginfo_location',
      valueType: 'input',
      hideInTable: true,
      tooltip: '请输入该内核的debuginfo包的下载链接'
    },
    {
      title: <FormattedMessage id="pages.hotfix.upload" defaultMessage="Upload" />,
      key: 'upload',
      dataIndex: 'upload',
      hideInTable: true,
      tooltip: '请上传需要制作热补丁的patch文件',
      render: (_, record) => [ 
      ],
      renderFormItem: (item, _a, form) => {
        return  <Form.Item name="patch" valuePropName="fileList" getValueFromEvent={normFile}>
                  <Upload {...uploadProps} name="file">
                    <Button icon={<UploadOutlined />}>Upload</Button>
                  </Upload>
                </Form.Item>
      },
    },
    {
      title: <FormattedMessage id="pages.hotfix.building_status" defaultMessage="building_status" />,
      dataIndex: 'building_status',
      hideInSearch: true,
      valueEnum: {
        0: { text: '等待构建' },
        1: { text: '正在构建' },
        2: { text: '构建失败' },
        3: { text: '构建成功' },
      },
    },
    {
      // This is Operation column
      title: <FormattedMessage id="pages.hotfix.operation" defaultMessage="Operating" />,
      key: 'option',
      dataIndex: 'option',
      valueType: 'option',
      render: (_, record) => [
          <span key='delete'>
              <Popconfirm title="是否要删除该热补丁?" onConfirm={async () => {
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
                      await handleDelHotfix(record);
                      actionRef.current?.reload();
                  }
              }}>
                  <a><FormattedMessage id="pages.hotfix.delete" defaultMessage="hotfix delete" /></a>
              </Popconfirm>
          </span>,
          <span key='log'>
            <a href={"/hotfix/hotfix_log/" + record.id} target="_blank">查看日志</a>
          </span>
      ],
    },
    {
      title: <FormattedMessage id="pages.hotfix.download" defaultMessage="Download" />,
      key: 'download',
      dataIndex: 'download',
      valueType: 'option',
      hideInSearch: true,
      render: (_, record) => [ 
        <Button 
        type="primary" disabled={record.building_status == 3 ? false : true}
        onClick={() => downloadHotfix(record)} 
        shape="circle" 
        icon={<DownloadOutlined />} />
      ]
    }
  ];
  return (
    <PageContainer>
      <ProTable
        headerTitle={intl.formatMessage({
          id: 'pages.hotfix.title',
          defaultMessage: 'List',
        })}
        actionRef={actionRef}
        rowKey="id"
        search={{
          labelWidth: 120,
          collapsed: false,
          collapseRender: false,
          optionRender: (searchConfig, formProps, dom) => [
            dom[0],
            <Button
              key="create" type="primary"
              onClick={() => {
                const values = searchConfig?.form?.getFieldsValue();
                submitHotfix(values);
                actionRef.current?.reload();
              }}
            >
              创建
            </Button>,
          ],
        }}
        toolBarRender={() => [
        ]}
        request={getHotfixList}
        columns={columns}
      />
    </PageContainer>
  );
};

export default customizeHotfixList;
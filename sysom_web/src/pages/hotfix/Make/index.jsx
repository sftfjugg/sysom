import {  useRef } from 'react';
import { useIntl, FormattedMessage } from 'umi';
import { PageContainer } from '@ant-design/pro-layout';
import ProTable from '@ant-design/pro-table';
import { Popconfirm, message, Switch, Upload, Button, Select, Form, Collapse} from 'antd';
import { getHotfixList, delHotfix, setFormal, uploadProps, normFile, createHotfix, downloadHotfixFile } from '../service';
import { UploadOutlined } from '@ant-design/icons';
import { DownloadOutlined } from '@ant-design/icons';

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

const changeFormal = (record) => {
  const token = localStorage.getItem('token');
  setFormal(record.id, token)
};

const submitHotfix = (params) => {
  const token = localStorage.getItem('token');
  createHotfix(token, params)
  console.log(params)
}

const downloadHotfix = async (record) => {
  const res = await downloadHotfixFile(record.id);
  if (res) {
    const url = window.URL.createObjectURL(res.data);
    const link = document.createElement('a'); //创建a标签
    link.style.display = 'none';
    link.href = url; // 设置a标签路径
    link.download = res.response.headers.get('content-disposition').split("attachment;filename=")[1]; //设置文件名， 也可以这种写法 （link.setAttribute('download', '名单列表.xls');
    document.body.appendChild(link);
    link.click();
    URL.revokeObjectURL(link.href); // 释放 URL对象
    document.body.removeChild(link);
    console.log(res.response.headers.get('content-disposition').split("attachment;filename=")[1])
  }
  console.log("downloadHotfixFile: ", record.id)
}

const HotfixList = () => {
  const actionRef = useRef();
  const intl = useIntl();

  const columns = [
    {
      title: <FormattedMessage id="pages.hotfix.created_at" defaultMessage="created_at" />,
      dataIndex: 'created_at',
      valueType: 'message',
      hideInSearch: true,
    },
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
        return  <Select 
        defaultValue={"Anolis"}
        options={[
          {
            value: 'centos',
            label: 'Centos',
          },
          {
            value: 'anolis',
            label: 'Anolis',
          }
        ]}
        />
      },
    },
    {
      title: <FormattedMessage id="pages.hotfix.kernel_version" defaultMessage="kernel_version" />,
      dataIndex: 'kernel_version',
      valueType: 'input',
      tooltip: '请输入全量内核版本名称，如：4.19.91-26.an8.x86_64'
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
      title: <FormattedMessage id="pages.hotfix.formal" defaultMessage="Formal" />,
      key: 'formal',
      dataIndex: 'formal',
      valueType: 'option',
      hideInSearch: true,
      tooltip: '转正式包后会在《热补丁列表》中展示，并且正式包不会被系统定期清理',
      render: (_, record) => [ 
        <Popconfirm title="转正式包后无法撤销，是否转正式包?" onConfirm={ async () => {
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
            if (record.building_status == 3){
              changeFormal(record);
              record.formal=1;
              actionRef.current?.reload();
            }else{
              message.error(intl.formatMessage({
                id: 'pages.hotfix.failed.formal',
                defaultMessage: "失败状态的热补丁不能转正式包"
            }))
          }
          }}} 
          onCancel={async () => { 
            if (record.formal == 0){
              record.formal=0;
            }
            }} >
          <Switch checkedChildren="是" unCheckedChildren="否" defaultChecked={record.formal} disabled={record.formal} checked={record.formal} />
        </Popconfirm>
      ]
    },
    {
      title: <FormattedMessage id="pages.hotfix.download" defaultMessage="Download" />,
      key: 'download',
      dataIndex: 'download',
      valueType: 'option',
      hideInSearch: true,
      render: (_, record) => [ 
        <Button type="primary" disabled={record.building_status == 3 ? false : true} onClick={() => downloadHotfix(record)} shape="circle" icon={<DownloadOutlined />} />
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

export default HotfixList;
import {  useRef } from 'react';
import { useIntl, FormattedMessage } from 'umi';
import { PageContainer } from '@ant-design/pro-layout';
import ProTable from '@ant-design/pro-table';
import { Popconfirm, message, Button, Select, DatePicker} from 'antd';
import { delHotfix, queryFormalHotfixList, downloadHotfixFile } from '../service';
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


const downloadHotfix = async (record) => {
  const res = await downloadHotfixFile(record.id);
  if (res) {
    const url = window.URL.createObjectURL(res.data);
    const link = document.createElement('a'); //创建a标签
    link.style.display = 'none';
    link.href = url; // 设置a标签路径
    link.download = res.response.headers.get('content-disposition').split("attachment;filename=")[1]; //设置文件名
    document.body.appendChild(link);
    link.click();
    URL.revokeObjectURL(link.href); // 释放 URL对象
    document.body.removeChild(link);
  }
}

const FormalHotfixList = () => {
  const actionRef = useRef();
  const intl = useIntl();

  const columns = [
    {
      title: <FormattedMessage id="pages.hotfix.created_at" defaultMessage="created_at" />,
      dataIndex: 'created_at',
      valueType: 'message',
      tooltip: '输入查询时间，将会返回该时间以前所有的正式包hotfix',
      renderFormItem: (item, _a, form) => {
        return <DatePicker/>
      }
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
        return  <Select defaultValue={"Anolis"}/>
      },
    },
    {
      title: <FormattedMessage id="pages.hotfix.kernel_version" defaultMessage="kernel_version" />,
      dataIndex: 'kernel_version',
      valueType: 'input',
    },
    {
      title: <FormattedMessage id="pages.hotfix.creator" defaultMessage="create_user" />,
      dataIndex: 'creator',
      valueType: 'message',
      hideInSearch: true,
    },
    {
      title: <FormattedMessage id="pages.hotfix.hotfix_name" defaultMessage="name" />,
      dataIndex: 'hotfix_name',
      valueType: 'input',
    },
    {
      title: <FormattedMessage id="pages.hotfix.patch_name" defaultMessage="name" />,
      dataIndex: 'patch_file',
      valueType: 'input',
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
        <Button type="primary" onClick={() => downloadHotfix(record)} shape="circle" icon={<DownloadOutlined />} />
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
        }}
        toolBarRender={() => [
        ]}
        request={queryFormalHotfixList}
        columns={columns}
      />
    </PageContainer>
  );
};

export default FormalHotfixList;
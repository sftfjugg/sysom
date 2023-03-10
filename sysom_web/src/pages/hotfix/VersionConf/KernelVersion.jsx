import React, { useRef, useState, useEffect } from 'react';
import { useIntl, FormattedMessage } from 'umi';
import { PageContainer } from '@ant-design/pro-layout';
import ProTable from '@ant-design/pro-table';
import { Popconfirm, message, Upload, Button, Select, Form, Switch} from 'antd';
import { delOSType, delKernelVersion, getOSTypeList, getKernelVersionList, submitOSType, submitKernelVersion, postChangeOsType } from '../service';
import { ProForm, ModalForm, ProFormText, ProFormTextArea, ProFormSelect } from '@ant-design/pro-form';
import { async } from '@antv/x6/lib/registry/marker/async';
import { PropertySafetyFilled } from '@ant-design/icons';
import KernelConfigForm from '../components/KernelConfigForm'
import ProCard from '@ant-design/pro-card';

const { Divider } = ProCard;

const handleDelOSType = async (record) => {
  const hide = message.loading('正在删除');
  const token = localStorage.getItem('token');
  try {
      let res = await delOSType(record.id, token);
      hide();
      if (res.code == 200) {
          message.success('删除成功');
          getOSTypeList();
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

const OSTypeConfigList = React.forwardRef((props, ref) => {
  const oslistRef = useRef();
  const intl = useIntl();
  const [count, setCount] = useState(0);
  useEffect(()=>{
    getOSTypeList();
  },[]);
  const onPostTask = () => {
    oslistRef.current.reload();
  }
  const columns = [
    {
      title: <FormattedMessage id="pages.hotfix.os_type" defaultMessage="os_type"/>,
      dataIndex: 'os_type',
      key: 'os_type',
      dataIndex: 'os_type',
      tooltip: '操作系统名，请为您该系列的操作系统类型命名'
    },
    {
      title: <FormattedMessage id="pages.hotfix.kernel_repo_git" defaultMessage="repo_location" />,
      dataIndex: 'source_repo',
      valueType: 'input',
      tooltip: '该操作系统类型的源码仓库地址',
    },
    {
      title: <FormattedMessage id="pages.hotfix.image" defaultMessage="image" />,
      dataIndex: 'image',
      valueType: 'input',
      tooltip: '输入该类操作系统构建热补丁时使用的镜像,如不填写则使用默认提供的Anolis镜像'
    },
    {
      title: <FormattedMessage id="pages.hotfix.operation" defaultMessage="Operating" />,
      key: 'option',
      dataIndex: 'option',
      valueType: 'option',
      render: (_, record) => [
          <span key='delete'>
              <Popconfirm title="是否要删除该类型?注意，删除类型会连带删除该类型关联的所有内核版本！" onConfirm={async () => {
                  if (record.id == undefined) {
                      message.error(intl.formatMessage({
                          id: 'pages.hotfix.delete_ostype_not_exist',
                          defaultMessage: "Not allow to delete this os type"
                      }))
                  } else {
                      await handleDelOSType(record);
                      oslistRef.current.reload();
                  }
              }}>
                  <a><FormattedMessage id="pages.hotfix.delete" defaultMessage="OS_type delete" /></a>
              </Popconfirm>
          </span>,
          <span key='change_ostype'>
              <ModalForm
              title="修改操作系统类型配置"
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
              onFinish={async (values) => {
                const data = {
                  id: record.id,
                  os_type_name: values.os_type_name,
                  git_repo_link: values.git_repo_link,
                  image: values.building_image
                }
                await postChangeOsType(data);
                message.success('提交成功');
                oslistRef.current.reload();
                return true;
              }}
            >
              <ProFormText
                width="md"
                name="os_type_name"
                label="操作系统类型"
                tooltip={"请输入新的操作系统类型"}
                placeholder="请输入名称"
                initialValue={record.os_type}
              />
              {
                record.src_pkg_mark === true ? 
                <ProFormText 
                  width="md" 
                  name="git_repo_link"
                  label="源码包地址" 
                  placeholder="请输入源码包地址"  
                  initialValue={record.source_repo}
                /> :
                <ProFormText 
                  width="md" 
                  name="git_repo_link"
                  label="源码git仓库地址" 
                  placeholder="请输入git仓库地址"  
                  initialValue={record.source_repo}
                />
              }
              
              <ProFormText
                width="md" 
                name="building_image" 
                label="构建镜像" 
                placeholder="请输入构建镜像"
                initialValue={record.image}
              />
            </ModalForm>
          </span>
      ],
    }
  ];
  return (
    <>
      <KernelConfigForm onSuccess={onPostTask} parentBack={props.parentCallback} />
      <Divider />
      <ProTable
        headerTitle={intl.formatMessage({
          id: 'pages.hotfix.title.os_type',
          defaultMessage: 'os_type conf',
        })}
        actionRef={oslistRef}
        rowKey="id"
        search={false}
        toolBarRender={() => [
        ]}
        request={getOSTypeList}
        columns={columns}
      />
    </>
  );
});

export default OSTypeConfigList;
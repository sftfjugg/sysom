import { ProForm, ModalForm, ProFormText, ProFormTextArea, ProFormSelect } from '@ant-design/pro-form';
import { useState } from 'react';
import { useImperativeHandle, useRef, forwardRef } from 'react';
import * as PropTypes from 'prop-types';
import { useIntl, FormattedMessage } from 'umi';
import { Button, Form, message } from 'antd';
import { postChangeOsType, getOSTypeList } from '../service'

/**
 * 修改操作系统类型表单组件
 */
const ReviseOSType = (record, refresh) => {
  return (
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
            id: record.record.id,
            os_type_name: values.os_type_name,
            git_repo_link: values.git_repo_link,
            image: values.building_image
          }
          await postChangeOsType(data).then(res=>{
            if(res.code === 200){
              getOSTypeList();
              message.success('提交成功');
              location.reload();
            }
          });
          return true;
        }}
      >
        <ProFormText
          width="md"
          name="os_type_name"
          label="操作系统类型"
          tooltip={"请输入新的操作系统类型"}
          placeholder="请输入名称"
          initialValue={record.record.os_type}
        />
        <ProFormText 
          width="md" 
          name="git_repo_link"
          label="源码git仓库地址" 
          placeholder="请输入git仓库地址"  
          initialValue={record.record.git_repo}
        />
        <ProFormText
          width="md" 
          name="building_image" 
          label="构建镜像" 
          placeholder="请输入构建镜像"
          initialValue={record.record.image}
        />
      </ModalForm>
  );
  };
  export default ReviseOSType
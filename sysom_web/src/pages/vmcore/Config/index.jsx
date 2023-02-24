import { PageContainer } from '@ant-design/pro-layout';
import ProForm, { ProFormSelect, ProFormText, ProFormDigit } from '@ant-design/pro-form';
import ProCard from '@ant-design/pro-card';
import { message, Button, Row, Col } from 'antd';
import { useRequest, FormattedMessage } from 'umi';
import { useState, useEffect, useRef } from 'react';
import { request } from 'umi';
import { postConfig, getConfig } from '../service'
import styles from "../vmcore.less";
import ConfigTopContent from './ConfigTopContent'
import { data } from 'browserslist';

const { Divider } = ProCard;

const VmcoreConfig = () => {
  const [count, setCount] = useState(0)
  const formRef = useRef();
  const { datalist } = useRequest(() => {
    return getVMcoreDetailList();
  });

  const getVMcoreDetailList = async () => {
    const msg = await request("/api/v1/vmcore/", {
      params: { get_config: 1 },
    });
    console.log(msg);
    if(msg.code === 200){
      setCount({ rawData: msg.data });
    }
  };

  const onListClick = async () => {
    // console.log("3333333333333",formRef.current.getFieldValue(['server_host']),formRef.current.getFieldValue(['mount_point']));
    const msg = await request("/api/v1/vmcore/vmcore_config_test/", {
      params: { 
        server_host: formRef.current.getFieldValue(['server_host']),
        mount_point: formRef.current.getFieldValue(['mount_point'])
      },
    });
    if(msg.code === 200){
      //formRef.current.resetFields('');
      message.success('连接测试成功！');
    }else{
      message.error('连接测试失败！');
    }
  }
  
  const { loading, error, run } = useRequest(postConfig, {
    manual: true,
    onSuccess: (result, params) => {
      // params.push({post_config:1});
      console.log(result, params,"121");
      formRef.current.resetFields('');
      getVMcoreDetailList();
    },
  });
  console.log(count);
  const formItemLayout = {
    labelCol: { span: 4 },
    wrapperCol: { span: 14 },
  }      
  return (
    <PageContainer>
      <ProCard title="当前配置：">
        {count.rawData && <ConfigTopContent data={count.rawData} />}

        <Divider className={styles.dividerpoint}/>
        
        <ProForm
          {...formItemLayout}
          onFinish={async (values) => {
            run(values)
          }}
          submitter={{
            submitButtonProps: {
              style: {
                display: 'none',
              },
            },
            resetButtonProps: {
              style: {
                display: 'none',
              },
            },
          }}
          formRef={formRef}
          layout={"horizontal"}
          autoFocusFirstInput
        >
          <ProFormText
            label="post_config"
            width="md"
            name="post_config"
            initialValue={1}
            hidden
          />

          <ProFormText
            label="仓库名"
            rules={[
              {
                required: true,
                message: (
                  <FormattedMessage
                    id="pages.configform.warehouse_required"
                    defaultMessage="warehouse is required"
                  />
                ),
              },
            ]}
            width="md"
            name="name"
            placeholder={"存储宕机vmcore的仓库名称"}
          />

          <ProFormText
            label="NFS服务器IP"
            rules={[
              {
                required: true,
                message: (
                  <FormattedMessage
                    id="pages.configform.NFSserverIP_required"
                    defaultMessage="NFS Server IP Address is required"
                  />
                ),
              },
            ]}
            width="md"
            name="server_host"
            placeholder={"NFS服务器的IP, 如:192.168.0.1"}
          />

          <ProFormText
            label="挂载目录"
            rules={[
              {
                required: true,
                message: (
                  <FormattedMessage
                    id="pages.configform.mount_required"
                    defaultMessage="Mount the directory is required"
                  />
                ),
              },
            ]}
            width="md"
            name="mount_point"
            placeholder={"NFS服务器共享目录"}
          />
          <ProFormText
            label="存储时长"
            width="md"
            name="days"
            placeholder={"vmcore存储时长(单位：天)"}
          />
          
          <Button type="primary" className={styles.configleft17} htmlType="button" onClick={() => onListClick()}>测试连接器</Button>
          <Button type="primary" className={styles.ml20} htmlType="submit" loading={loading}>保存配置</Button>
        </ProForm>
      </ProCard>
    </PageContainer>
  );
};

export default VmcoreConfig;

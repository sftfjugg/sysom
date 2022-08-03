import { PageContainer } from '@ant-design/pro-layout';
import ProForm, { ProFormSelect, ProFormText, ProFormDigit } from '@ant-design/pro-form';
import { message, Button, Row, Col, Descriptions } from 'antd';
import ProCard from "@ant-design/pro-card";

const VmcoreConfigTopCon = (props) => {
  console.log(props,"0000000000000");
  const formItemLayout = {
    labelCol: { span: 4 },
    wrapperCol: { span: 14 },
  }      
  return (
    <ProCard>
      <Descriptions column={1} contentStyle={{ color:'#999' }} labelStyle={{ textAlign: 'right', width:'15.5%', height:'30px',display:'block' }}>
        <Descriptions.Item label="仓库名">{props.data.name}</Descriptions.Item>
        <Descriptions.Item label="NFS服务器IP">{props.data.server_host}</Descriptions.Item>
        <Descriptions.Item label="挂载目录">{props.data.mount_point}</Descriptions.Item>
        <Descriptions.Item label="存储时长">{props.data.days}</Descriptions.Item>
      </Descriptions>
    </ProCard>
  );
};

export default VmcoreConfigTopCon;

import react, {useState,useEffect} from 'react';
import ProForm, {ProFormSelect, ProFormRadio, ProFormText } from '@ant-design/pro-form';
import {Button,message} from 'antd';
import {useRequest} from 'umi';
import ProCard from '@ant-design/pro-card';
import {queryAssessHost,queryStartAssess} from '../../../service'
import './StAssessmentForm.less';

export default (props) => {
  const [hostList,setHostList] = useState([]);
  // Repo配置选择项
  const [repoType, setRepoType] = useState(false);
  
  const initialValues = {
    repo_type: 'public',
    version: 'Anolis OS 8',
  };

  useEffect(()=>{
    getAssessHost();
  },[]);

  const getAssessHost = async () => {
    const {data} = await queryAssessHost();
    let arr = [];
    if(data?.length > 0){
      data.forEach((i)=>{
        arr.push({label: i.ip,value: i.ip})
      })
    }
    setHostList(arr);
  }

  const handleRepo = (e) => {
    if(e.target.value === "public"){
      setRepoType(false);
    }else if(e.target.value === "private"){
      setRepoType(true);
    }
  }

  // 开始评估的接口
  const { loading, error, run } = useRequest(queryStartAssess, {
    manual: true,
    onSuccess: (result, params) => {
      message.success('开始评估成功')
      // 开始评估成功后刷新列表
      props?.success();
    },
    onError:(data)=>{
      console.log('请求错误',error,)
    },
  });

    return (
      <ProCard>
        <ProForm
          onFinish={async (values) => {
            run(values);
          }}
          submitter={{
            submitButtonProps: {
              style: {
                display: "none",
              },
            },
            resetButtonProps: {
              style: {
                display: "none",
              },
            },
          }}
          layout={"horizontal"}
          autoFocusFirstInput
          initialValues={initialValues}
        >
          <ProForm.Group>
            <ProFormSelect
              name="ip"
              label="选择机器"
              width="md"
              options={hostList}
              fieldProps={{
                mode: "multiple",
              }}
              placeholder="请选择机器"
              rules={[
                { required: true, message: "机器不能为空", type: "array" },
              ]}
            />
            <ProFormSelect
              name="version"
              label="迁移版本"
              width="md"
              options={[
                {
                  label: "Anolis OS 8",
                  value: "Anolis OS 8",
                },
              ]}
              placeholder="请选择迁移版本"
              rules={[{ required: true, message: "迁移版本不能为空" }]}
            />
            <ProFormText
              name="ass_app"
              width='md'
              label="评估应用"
              placeholder="请输入评估应用"
            />
          </ProForm.Group>
          <ProForm.Group>
            <ProFormRadio.Group
              name="repo_type"
              label="Repo配置"
              // width='400px'
              options={[
                {
                  label: "公网地址",
                  value: "public",
                },
                {
                  label: "内网地址",
                  value: "private",
                },
              ]}
              onChange={handleRepo}
            />
            {repoType && (
              <ProFormText
                colProps={{ span: 24 }}
                name="repo_url"
                width='md'
                label=""
                placeholder="请选择内网地址"
              />
              // <Input
              //   colProps={{ span: 24 }}
              //   name="repo_url"
              //   label=""
              //   width="md"
              //   placeholder="请选择内网地址"
              // />
            )}
            <Button
              className="st_form_start"
              type="primary"
              htmlType="submit"
              // loading={loading}
            >
              开始评估
            </Button>
          </ProForm.Group>
        </ProForm>
      </ProCard>
    );
}

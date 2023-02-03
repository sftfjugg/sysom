import react, {useState,useEffect} from 'react';
import ProForm, {ProFormSelect, ProFormRadio, ProFormText, ProFormCheckbox} from '@ant-design/pro-form';
import {Button,message} from 'antd';
import {useRequest} from 'umi';
import ProCard from '@ant-design/pro-card';
import {queryAssessHost,queryStartAssess} from '../../../service'
// querySqlFile
import './StAssessmentForm.less';

export default (props) => {
  const [hostList,setHostList] = useState([]);
  const [sqlFileList,setSqlFileList] = useState([]);
  // Repo配置选择项
  const [repoType, setRepoType] = useState(false);
  // 评估应用是否展示
  const [appType, setAppType] = useState(false);
  
  const initialValues = {
    repo_type: 'public',
    version: 'Anolis OS 8',
    ass_type: ['mig_imp']
  };

  useEffect(()=>{
    getAssessHost();
    // getSqlFile();
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

  // const getSqlFile = async () => {
  //   const {data} = await querySqlFile();
  //   setSqlFileList(data?data:[]);
  // }

  const handleRepo = (e) => {
    if(e.target.value === "public"){
      setRepoType(false);
    }else if(e.target.value === "private"){
      setRepoType(true);
    }
  }

  const handleType = (e) => {
    let isShow = false;
    e?.length > 0 && e.forEach((i)=>{
      if(i === 'mig_app'){
        isShow = true;
      }
    });
    setAppType(isShow);
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
              width="sm"
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
              width="sm"
              options={[
                {
                  label: "Anolis OS 8",
                  value: "Anolis OS 8",
                },
              ]}
              placeholder="请选择迁移版本"
              rules={[{ required: true, message: "迁移版本不能为空" }]}
            />
            {/* <ProFormSelect
              name="sqlfile"
              label="数据文件"
              width="sm"
              options={sqlFileList}
              placeholder="请选择数据文件"
              rules={[{ required: true, message: "数据文件不能为空" }]}
            /> */}
            <ProFormRadio.Group
              name="repo_type"
              label="Repo配置"
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
                width='sm'
                label=''
                placeholder="请输内网地址"
              />
            )}
          </ProForm.Group>
          <ProForm.Group>
            <ProFormCheckbox.Group
              name="ass_type"
              label="选择评估"
              rules={[{ required: true, message: "评估不能为空" }]}
              onChange={handleType}
              options={[
                { label: '风险评估', value: 'mig_imp', disabled: true },
                { label: '系统评估', value: 'mig_sys' },
                { label: '硬件评估', value: 'mig_hard' },
                { label: '应用评估', value: 'mig_app' },
              ]}
            />
            {appType && (
              <ProFormText
                name="ass_app"
                width='sm'
                label=""
                placeholder="请输入评估应用"
              />
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

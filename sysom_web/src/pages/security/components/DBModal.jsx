import React,{useState,useRef} from 'react';
import {FormattedMessage} from 'umi';
import { Button, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import ProForm, { ModalForm, ProFormRadio, ProFormSelect, ProFormText, ProFormTextArea } from '@ant-design/pro-form';
import {isJSON} from "../utils/validateJSON";
import {addDB,testConnect,updateDB} from "../service"
import { set } from 'lodash';
export default function DBModal(props) {
    const [isBasic,setIsBasic] = useState(false);
    const [isLoading,setIsLoading] = useState(0);
    const [connResult,setConnResult] = useState({request:'wed'});
    const restFormRef = useRef();
    const restFormRef1 = useRef();
    const changeRadio = (e) => {
        if(e.target.value == 'BASIC'){
          setIsBasic(true);
        }else{
          setIsBasic(false);
        }
      };
      const checkUrl = async (rule,value) => {
        if(!/(ht|f)tp(s?)\:\/\/[a-zA-Z0-9][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{1,62})+\.?/.test(value)){
          return Promise.reject("请输入正确格式的域名");
        }else{
          return Promise.resolve();
        }
      };
      const checkHeaders = async (rule,value) => isJSON(value,'请求头')
      const checkParams = async (rule,value) => isJSON(value,'请求参数')
      const checkBody = async (rule,value) => isJSON(value,'请求体')
      const checkParser = async (rule,value) => isJSON(value,'解析格式配置')
    return (
        <ModalForm
        formRef={restFormRef}
        title={props.isAdd ? '新建漏洞数据库':'编辑漏洞数据库'}
        trigger={
          props.isAdd ? 
          <Button type="primary">
            <PlusOutlined />
            <FormattedMessage id="component.DBModal.create" defaultMessage="Create cve DB" />
          </Button>:<a style={{'display':props.rowData.is_edited ? 'inline' : 'none'}}>
          <FormattedMessage id="pages.hostTable.edit" defaultMessage="Edit" />
          </a>
        }
        submitter={{
          searchConfig: {
            submitText: '保存',
          },
          render: (prop, defaultDoms) => {
            return [
              
              

              <Button
                key="test"
                type="primary"
                onClick={()=>{
                  setIsLoading(1);
                  
                  let values1 = {...prop.form.getFieldsValue()};
                  if(values1.authorization_type == ''){
                    values1.authorization_body = null;
                  }
                values1.headers = eval("("+values1.headers+")")
                values1.params = eval("("+values1.params+")")
                values1.body = eval("("+values1.body+")")
                values1.parser = eval("("+values1.parser+")");
                 testConnect(values1).then((res)=>{if(res.code == 200 && res.success){
                  setConnResult(res.data)
                  res.data.request = decodeURIComponent(res.data.request)
                  res.data.status = decodeURIComponent(res.data.status)
                  restFormRef1.current?.setFieldsValue(res.data);
                  setIsLoading(2)
                }}).catch(()=>{
                  setIsLoading(0)
                  message.error('测试连接失败')
                })}}
                loading={isLoading==1}
              >
                测试连接
              </Button>,
              ...defaultDoms
            ];
          },
        }}
        autoFocusFirstInput
        modalProps={{
          onCancel: () => {
            restFormRef.current?.resetFields();
          },
        }}
        initialValues={props.rowData}
        onVisibleChange={(visible)=>{console.log('rowData',props);if(props.rowData.authorization_type == 'BASIC'){
          setIsBasic(true);
        }else{
          setIsBasic(false);
        }}}
        onFinish={async (values) => {
          let values1 = {...values};
          values1.headers = eval("("+values1.headers+")")
          values1.params = eval("("+values1.params+")")
          values1.body = eval("("+values1.body+")")
          values1.parser = eval("("+values1.parser+")")
          if(props.isAdd){

            addDB(values1).then((res)=>{
              if(res.code == 200 && res.success){
                message.success('保存成功');
                restFormRef.current?.resetFields();
                
                props.tableRefName.current.reload()
              }
            })
          }
          else{
            updateDB(values1,props.rowData.id).then(()=>{
              message.success('更新成功');
              props.tableRefName.current.reload()
            })
          }
          return true;
        }}
      >
        <ModalForm
        title=""
        formRef={restFormRef1}
        // initialValues={connResult}
        visible={isLoading==2}
        submitter={{
          searchConfig:{
            resetText: '返回'
          },
          submitButtonProps: {
            style: {
              display: 'none',
            },
          },
        }}
        modalProps={{
          onCancel: () => {
            setIsLoading(0);
          },
        }}
        width={600}
      >
        <ProFormTextArea
          width="xl"
          fieldProps={{autoSize:true}}
          name="request"
          label="请求消息"
        />

        <ProFormTextArea width="xl" name="status" label="请求返回状态" fieldProps={{autoSize:true}} />
      </ModalForm>
        <ProForm.Group>
          <ProFormText
            width="md"
            name="name"
            label="数据库名称"
            tooltip="最长为 24 位"
            placeholder="请输入数据库名称"
            rules={[{ required: true, message: '请输入数据库名称' }]}
          />
  
          <ProFormText width="md" name="description" label="描述" placeholder="请输入数据库描述" />
        </ProForm.Group>
        <ProForm.Group>
          <ProFormSelect
            allowClear={false}
            name="method"
            request={async () => [
              {
                value: 0,
                label: 'get',
              },
              {
                value: 1,
                label: 'post',
              },
            ]}
            width="xs"
            label="请求方式"
            rules={[{ required: true, message: '请选择请求方式' }]}
          />
          <ProFormText width="xl" name="url" label="请求url" rules={[{ required: true, validator: checkUrl, trigger: "blur" }]} />
        </ProForm.Group>
        <ProForm.Group>
            <ProFormTextArea
                width="md"
                name="headers"
                label="请求头headers"
                placeholder="请输入请求头"
                value={'{}'}
                rules={[{ required: false, validator: checkHeaders, trigger: "blur" }]}
            />
            <div>
            <ProFormRadio.Group
                name="authorization_type"
                label="认证方式"
                radioType="button"
                direction="vertical"
                value=""
                options={[
                    {
                      label: '无',
                      value: '',
                  },
                    {
                        label: 'BASIC',
                        value: 'BASIC',
                    },
                ]}
                onChange={changeRadio}
            />
              <ProForm.Group name="authorization_body" style={{display:isBasic?'inline':'none'}}>
                <ProFormText
                    width="xs"
                    name={['authorization_body','username']}
                    placeholder="username"
                />
                <ProFormText
                    width="xs"
                    name={['authorization_body','password']}
                    placeholder="password"
                />
              </ProForm.Group>
            </div>
        </ProForm.Group>
        <ProForm.Group>
            <ProFormTextArea
                width="md"
                name="params"
                label="请求参数params"
                placeholder="请输入请求参数"
                value={'{}'}
                rules={[{ required: false, validator: checkParams, trigger: "blur" }]}
            />
            <ProFormTextArea
                width="md"
                name="body"
                label="请求体body"
                placeholder="请输入请求体body"
                value={'{}'}
                rules={[{ required: false, validator: checkBody, trigger: "blur" }]}
            />
        </ProForm.Group>
          <ProForm.Group>
          <ProFormRadio.Group
                label="解析格式配置parser"
                radioType="button"
                direction="vertical"
                value="json"
                options={[
                    {
                      label: 'json',
                      value: 'json',
                  },
                    {
                        label: 'xml',
                        value: 'xml',
                    },
                ]}
            />
            <br/><br/>
          <ProFormTextArea
                width={688}
                name="parser"
                placeholder="请输入解析格式"
                value={'{}'}
                rules={[{ required: false, validator: checkParser, trigger: "blur" }]}
            />
            </ProForm.Group>
      </ModalForm>
    )
}
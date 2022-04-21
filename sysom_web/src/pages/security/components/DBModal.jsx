import React,{useState,useEffect,useRef} from 'react'
import { Button, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import ProForm, { ModalForm, ProFormRadio, ProFormSelect, ProFormText, ProFormTextArea } from '@ant-design/pro-form';

import {addDB,testConnect,updateDB} from "../service"
export default function DBModal(props) {
    const [isBasic,setIsBasic] = useState(false);
    const restFormRef = useRef();
  const formRef = useRef();
    const changeRadio = (e) => {
        // console.log('change',e,username.value)
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
    return (
        <ModalForm
        formRef={restFormRef}
                      title={props.isAdd ? '新建漏洞数据库':'编辑漏洞数据库'}
                      trigger={
                        props.isAdd ? 
                        <Button type="primary">
                          <PlusOutlined />
                          新建漏洞数据库
                        </Button>:<a>编辑</a>
                      }
                      submitter={{
                        searchConfig: {
                          submitText: '保存',
                        },
                        render: (props, defaultDoms) => {
                          return [
                            <Button
                              key="test"
                              type="primary"
                              onClick={()=>{testConnect(props.rowData).then((res)=>{if(res.code == 200 && success){
                                message.success('测试连接完成')
                              }})}}
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
                          console.log('run')
                          // setIsBasic(false);
                          // props.getDBlist()
                          // props.tableRefName.current.reload()
                          restFormRef.current?.resetFields();
                        },
                      }}
                      initialValues={props.rowData}
                      onVisibleChange={(visible)=>{console.log('rowData',props);}}
                      onFinish={async (values) => {
                        console.log('values');
                        if(props.isAdd){

                          addDB(values).then(()=>{
                            message.success('保存成功');
                            restFormRef.current?.resetFields();
                          })
                        }
                        else{
                          updateDB(values,props.rowData.id).then(()=>{
                            message.success('更新成功');
                          })
                        }
                        // props.getDBlist()
                        props.tableRefName.current.reload()
                        
                        return true;
                      }}
                      
                    >
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
                          // value={0}
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
                              // fieldProps={inputTextAreaProps}
                              // fieldProps={
                              //   (value) => {console.log('valu',value)}
                              // }
                              value={`{\n\t"Accept": "*/*"\n}`}
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
                              // fieldProps={inputTextAreaProps}
                              value={`{}`}
                          />
                          <ProFormTextArea
                              width="md"
                              name="body"
                              label="请求body"
                              placeholder="请输入请求body"
                              value={`{}`}
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
                              // fieldProps={inputTextAreaProps}
                              value={`{}`}
                          />
                          </ProForm.Group>
                    </ModalForm>
    )
}

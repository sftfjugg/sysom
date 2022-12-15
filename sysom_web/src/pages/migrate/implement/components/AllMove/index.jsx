/* eslint-disable prefer-promise-reject-errors */
import React, { useState, useContext, Fragment } from 'react';
import { Form, Input, Modal, Select, Button, Radio, message } from 'antd';
import { withRouter } from 'umi';

import { WrapperContext } from '../../containers';
import { SET_DATA } from '../../containers/constants';
import { getNodesList,BulkMigration } from '../../../service';

const { TextArea } = Input;
const { Option } = Select;
const { Item: FormItem } = Form;

export default withRouter(
  () => {
    const {
      dispatch,
      state: { allMoveVisible, machineList, startMigrateIp, activeMachineGroupId },
    } = useContext(WrapperContext);
    // Repo配置选择项
    const [repoType, setRepoType] = useState(false);
    // 备份配置选择项
    const [backupType, setBackupType] = useState(false);
    const [form] = Form.useForm();
    const initialValues = {
      kernel: 'ANCK',
      repo_type: 'public',
      version: 'Anolis OS 8',
      backup_type: 'no',
    };
    
    const handleAdd = async () => {
      form.validateFields().then(async (values) => {
        if (typeof values === 'undefined') return true;
        const hide = message.loading(`${startMigrateIp === '' ? "批量配置": '迁移配置'}中...`, 0);
        let params = {...values,step:0}
        if(startMigrateIp !== ""){
          params.ip = [startMigrateIp];
        }
        if(params.backup_type === 'no'){
          params.backup_type = '';
        }
        try {
          const {code,msg} = await BulkMigration(params);
          if (code === 200) {
            try {
              const {
                code: queryCode,
                data: nodeList,
              } = await getNodesList({ id: activeMachineGroupId });
              if (queryCode === 200) {
                message.success(`${startMigrateIp === '' ? "批量配置": '迁移配置'}成功`);
                dispatch({
                  type: SET_DATA,
                  payload: {
                    machineList: nodeList && nodeList.length !== 0 ? nodeList : [],
                    nodeTotal: nodeList ? nodeList.length : 0,
                    allMoveVisible: false,
                  },
                });
                return true;
              }
              return false;
            } catch (e) {
              console.log(`更新数据获取失败，错误信息：${e}`);
              return false;
            }
          }
          message.error(msg);
          return false;
        } catch (error) {
          return false;
        } finally {
          hide();
          setRepoType(false);
          setBackupType(false);
          form.resetFields();
        }
      })
      
    };
    
    const handleRepo = (e) => {
      if(e.target.value === "public"){
        setRepoType(false);
      }else if(e.target.value === "private"){
        setRepoType(true);
      }
    }

    const handleBackup = (e) => {
      if(e.target.value === "no"){
        setBackupType(false);
      }else if(e.target.value === "nfs"){
        setBackupType(true);
      }
    }

    return (
      <Modal
        wrapClassName="addModal"
        centered
        width={960}
        destroyOnClose
        afterClose={() => form.resetFields()}
        title={startMigrateIp === '' ? "批量配置": '迁移配置'}
        visible={allMoveVisible}
        onCancel={() => {
          dispatch({
            type: SET_DATA,
            payload: { allMoveVisible: false },
          });
        }}
        footer={[
          <Button
            key="back"
            onClick={() =>{
              form.resetFields();
              dispatch({
                type: SET_DATA,
                payload: { allMoveVisible: false },
              })
              setRepoType(false);
              setBackupType(false);
            }}
          >
            取消
          </Button>,
          <Button key="submit" type="primary" onClick={handleAdd}>
            确定
          </Button>,
        ]}
      >
        <Form
          layout="horizontal"
          form={form}
          initialValues={initialValues}
          labelCol={{
            span: 4,
          }}
          wrapperCol={{
            span: 18,
          }}
        >
          {
            startMigrateIp === '' ?
            <FormItem 
              name="ip" 
              label="选择机器"
              rules={[{ required: true, message: "机器不能为空" }]}
            >
              <Select placeholder="请选择机器" mode="multiple">
                {
                  machineList && machineList.map((item)=>{
                    return(
                      <Option key={item.ip}>{item.ip}</Option>
                    )
                  })
                }
              </Select>
            </FormItem>
            :
            <FormItem 
              name="ip" 
              label="选择机器"
              required
            >
              <Input value={startMigrateIp} defaultValue={startMigrateIp} disabled/>
            </FormItem>
          }
          <FormItem 
            name="version" 
            label="迁移版本" 
            rules={[{ required: true, message: "迁移版本不能为空" }]}
          >
            <Select placeholder="请选择要迁移的版本">
              {/* <Option key="Anolis OS 7">Anolis OS 7</Option> */}
              <Option key="Anolis OS 8">Anolis OS 8</Option>
            </Select>
          </FormItem>
          <FormItem 
            name="kernel" 
            label="选择内核" 
            rules={[{ required: true, message: "内核不能为空" }]}
          >
            <Radio.Group >
              <Radio value="ANCK">ANCK</Radio>
              {/* <Radio value="RHCK">RHCK</Radio> */}
            </Radio.Group>
          </FormItem>
          <FormItem 
            name="repo_type" 
            label="Repo配置" 
            rules={[{ required: true, message: "Repo配置不能为空" }]}
          >
            <Radio.Group onChange={handleRepo}>
              <Radio value="public">公网地址</Radio>
              <Radio value="private">内网地址</Radio>
            </Radio.Group>
          </FormItem>
          {
            repoType && 
            <FormItem name="repo_url" label colon={false}>
              <Input placeholder="请输入内网地址"/>
            </FormItem>
          }
          <FormItem 
            name="backup_type" 
            label="备份配置" 
            rules={[{ required: true, message: "备份配置不能为空" }]}
          >
            <Radio.Group onChange={handleBackup}>
              <Radio value="no">不备份</Radio>
              <Radio value="nfs">NFS备份</Radio>
            </Radio.Group>
          </FormItem>
          {
            backupType && 
            <Fragment>
              <FormItem name="backup_ip" label colon={false}>
                <Input placeholder="请输入NFS服务的IP地址"/>
              </FormItem>
              <FormItem name="backup_path" label colon={false}>
                <Input placeholder="请输入备份存放在NFS的目录"/>
              </FormItem>
              <FormItem name="backup_exclude" label colon={false}>
                <Input placeholder="请输入本机无需备份的目录"/>
              </FormItem>
            </Fragment>
          }
        </Form>
      </Modal>
    );
  },
);

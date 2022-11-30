/* eslint-disable prefer-promise-reject-errors */
import React, { useState, useContext } from 'react';
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
    const [form] = Form.useForm();
    const initialValues = {
      kernel: 'ANCK',
      repo_type: 'public',
      verson: 'Anolis OS 8',
    };
    
    const handleAdd = async () => {
      form.validateFields().then(async (values) => {
        if (typeof values === 'undefined') return true;
        const hide = message.loading('开始迁移中...', 0);
        let params = {...values}
        if(startMigrateIp !== ""){
          params.ip = [startMigrateIp];
        }
        try {
          const { code } = await BulkMigration(params);
          if (code === 200) {
            try {
              const {
                code: queryCode,
                data: nodeList,
              } = await getNodesList({ id: activeMachineGroupId });
              if (queryCode === 200) {
                message.success('开始迁移成功');
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
          message.error('开始迁移失败，请重试!');
          return false;
        } catch (error) {
          message.error(error);
          return false;
        } finally {
          hide();
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

    return (
      <Modal
        wrapClassName="addModal"
        centered
        width={960}
        destroyOnClose
        afterClose={() => form.resetFields()}
        title="批量迁移机器"
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
            name="verson" 
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
              <TextArea rows={3} placeholder="请输入内网地址" maxLength={150} />
            </FormItem>
          }
          <FormItem name="backup_pwd" label="备份路径">
            <TextArea rows={3} placeholder="请输入备份路径" maxLength={150} />
          </FormItem>
          <FormItem name="backup_dir" label="备份目录">
            <TextArea rows={3} placeholder="请输入备份目录" maxLength={150} />
          </FormItem>
        </Form>
      </Modal>
    );
  },
);

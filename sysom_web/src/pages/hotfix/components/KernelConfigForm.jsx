import ProForm, { ProFormText, ProFormSelect, ProFormSwitch } from '@ant-design/pro-form';
import React, { useRef, useState, useEffect } from 'react';
import { Button } from 'antd';
import { useRequest } from 'umi';
import ProCard from '@ant-design/pro-card';
import { postTask } from '../../diagnose/service'
import { submitOSType, getOSTypeList } from '../service'
import { Switch } from 'antd';

export default (props, ref) => {
    const kernelformRef = useRef();
    const [readonlyone, setReadonlyOne] = useState(false);
    const { loading, error, run } = useRequest(submitOSType, {
        manual: true,
        onSuccess: (result, params) => {
            kernelformRef.current.resetFields();
            props?.onSuccess?.(result, params);
            props.parentBack(params);
        },
    });

    const KernelConfigChange = (e) => {
        setReadonlyOne(e);
    }
    return (
        <ProCard>
            <ProForm
                onFinish={async (values) => {
                    run(values)
                }}
                formRef={kernelformRef}
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
                layout={"horizontal"}
                autoFocusFirstInput
            >
                <ProForm.Group>
                    <ProFormText
                        width="md"
                        name="os_type"
                        label="操作系统名"
                        tooltip="操作系统名，请为您该系列的操作系统类型命名"
                    />
                    {
                        readonlyone === true ?
                        <ProFormText
                            name="source_repo"
                            width="md"
                            tooltip="该操作系统类型的源码包仓库地址"
                            label="源码包地址"
                        /> : 
                        <ProFormText
                            name="source_repo"
                            width="md"
                            tooltip="该操作系统类型的git仓库地址"
                            label="源码git仓库地址"
                        />
                    }
                    <ProFormText
                        name="image"
                        width="md"
                        tooltip="输入该类操作系统构建热补丁时使用的镜像,如不填写则使用默认提供的Anolis镜像"
                        label="构建镜像"
                    />
                    <ProFormSwitch
                        style={{
                            marginBlockEnd: 16,
                        }}
                        name="src_pkg_mark"
                        initialValue={readonlyone}
                        label="使用源码包"
                        checked={readonlyone}
                        checkedChildren="是"
                        unCheckedChildren="否"
                        onChange={KernelConfigChange}
                    />
                    <Button type="primary" htmlType="submit" loading={loading}>添加</Button>
                </ProForm.Group>
            </ProForm>
        </ProCard>
    )
}

import ProForm, { ProFormText, ProFormSelect } from '@ant-design/pro-form';
import React, { useRef, useState, useEffect } from 'react';
import { Button } from 'antd';
import { useRequest } from 'umi';
import ProCard from '@ant-design/pro-card';
import { postTask } from '../../diagnose/service'
import { submitKernelVersion, getOSTypeList } from '../service'

export default (props) => {
    const formRef = useRef();
    const [veroptionList,setVerOptionList] = useState([]);
    const { loading, error, run } = useRequest(submitKernelVersion, {
        manual: true,
        onSuccess: (result, params) => {
            formRef?.form?.resetFields();
            props?.onSuccess?.(result, params);
        },
    });

    return (
        <ProCard>
            <ProForm
                onFinish={async (values) => {
                    run(values)
                }}
                formRef={formRef}
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
                    <ProFormSelect
                        width="xs"
                        options={props.optionlist}
                        name="os_type"
                        label="操作系统名"
                        tooltip="这是该内核版本所属操作系统，请从上表中选择已配置的操作系统。如4.19.91-26.an8.x86_64属于anolis操作系统"
                    />
                    <ProFormText
                        name="kernel_version"
                        width="md"
                        tooltip="请全量输入该内核版本的版本名"
                        label="内核版本"
                    />
                    <ProFormText
                        name="git_branch"
                        width="md"
                        tooltip="该内核版本所在仓库的源码git标签(tag)或者分支(branch)"
                        label="git标签/分支"
                    />
                    <ProFormText
                        name="devel_link"
                        width="md"
                        tooltip="请输入该内核版本的devel包下载链接"
                        label="devel链接"
                    />
                    <ProFormText
                        name="debuginfo_link"
                        width="md"
                        tooltip="请输入该内核版本的debuginfo包下载链接"
                        label="debuginfo链接"
                    />
                    <Button type="primary" htmlType="submit" loading={loading}>添加</Button>
                </ProForm.Group>
            </ProForm>
        </ProCard>
    )
}

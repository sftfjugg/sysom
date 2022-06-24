import ProForm, { ProFormText, } from '@ant-design/pro-form';
import { Button } from 'antd';
import { useRequest } from 'umi';
import ProCard from '@ant-design/pro-card';
import { postTask } from '../service'

export default (props) => {
    const { loading, error, run } = useRequest(postTask, {
        manual: true,
        onSuccess: (result, params) => {
            props?.onSuccess?.(result, params);
        },
    });

    return (

        <ProCard>
            <ProForm
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
                layout={"horizontal"}
                autoFocusFirstInput
            >
                <ProFormText
                    name={"service_name"}
                    initialValue={"ossre"}
                    hidden={true}
                />
                <ProForm.Group>
                    <ProFormText
                        name={"instance"}
                        width="md"
                        label="实例IP"
                    />
                    <Button type="primary" htmlType="submit" loading={loading}>开始诊断</Button>
                </ProForm.Group>
            </ProForm>
        </ProCard>
    )
}

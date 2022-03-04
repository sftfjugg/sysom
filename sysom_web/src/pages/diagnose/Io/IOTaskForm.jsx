import ProForm, { ProFormText, ProFormDigit } from '@ant-design/pro-form';
import { message, Button, Row, Col } from 'antd';
import { useRequest } from 'umi';
import ProCard from '@ant-design/pro-card';
import { postIOTask } from '../service'

export default (props) => {
    const { loading, error, run } = useRequest(postIOTask, {
        manual: true,
        onSuccess: (result, params) => {
            console.log(result, params);
            // props?.onSuccess?.(result, params)
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
                    initialValue={"pingtrace"}
                    hidden={true}
                />
                <ProForm.Group>
                    <ProFormText
                        name={"ip"}
                        width="md"
                        label="实例IP"
                    />

                    <ProFormDigit
                        name={"time"}
                        width="md"
                        label="诊断时长"
                        initialValue={10}
                    />

                    <ProFormDigit
                        name={"threshold"}
                        width="md"
                        label="诊断阈值"
                        initialValue={5000}
                    />

                    <ProFormText
                        name={"disk"}
                        width="md"
                        label="目标磁盘"
                        tooltip="如果为空，检测所有磁盘！"
                    />

                    <Button type="primary" htmlType="submit" loading={loading}>开始诊断</Button>
                </ProForm.Group>
            </ProForm>
        </ProCard>
    )
}
import ProForm, { ProFormText, ProFormDigit } from '@ant-design/pro-form';
import { Button } from 'antd';
import { useRequest } from 'umi';
import ProCard from '@ant-design/pro-card';
import { postTask } from '../../service'

export default (props) => {
    const { loading, error, run } = useRequest(postTask, {
        manual: true,
        onSuccess: (result, params) => {
            props?.onSuccess?.(result, params)
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
                    initialValue={"iosdiag_latency"}
                    hidden={true}
                />
                <ProForm.Group>
                    <ProFormText
                        name={"instance"}
                        width="md"
                        label="实例IP"
                    />

                    <ProFormDigit
                        name={"diag_time"}
                        width="md"
                        label="诊断时长"
                        tooltip="持续诊断时长，时间单位：s"
                        initialValue={10}
                    />

                    <ProFormDigit
                        name={"thresh"}
                        width="md"
                        label="时间阈值"
                        initialValue={5000}
                        tooltip="保留IO延迟大于设定时间阈值的IO（时间单位：ms）"
                    />

                    <ProFormText
                        name={"disk"}
                        width="md"
                        label="目标磁盘"
                        tooltip="如果为空, 检测所有磁盘!"
                    />

                    <Button type="primary" htmlType="submit" loading={loading}>开始诊断</Button>
                </ProForm.Group>
            </ProForm>
        </ProCard>
    )
}

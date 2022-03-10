import ProForm, { ProFormSelect, ProFormText, ProFormDigit } from '@ant-design/pro-form';
import { message, Button, Row, Col } from 'antd';
import { useRequest } from 'umi';
import ProCard from '@ant-design/pro-card';
import { postTask } from '../service'

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
                    initialValue={"pingtrace"}
                    hidden={true}
                />
                <ProForm.Group>
                    <ProFormText
                        name={"源实例IP"}
                        width="md"
                        label="源实例IP"
                    />

                    <ProFormText
                        name={"目标实例IP"}
                        width="md"
                        label="目标实例IP"
                    />

                    <ProFormDigit
                        name={"追踪包数"}
                        width="md"
                        label="追踪包数"
                        initialValue={100}
                    />

                    <ProFormDigit
                        name={"间隔毫秒数"}
                        width="md"
                        label="间隔毫秒数"
                        initialValue={1000}
                    />

                    <ProFormSelect
                        options={[
                            {
                                value: "TCP",
                                label: "TCP",
                            },
                            {
                                value: "UDP",
                                label: "UDP",
                            },
                            {
                                value: "ICMP",
                                label: "ICMP",
                            },
                        ]}
                        initialValue={"ICMP"}
                        name={"报文协议"}
                        width="md"
                        label="报文协议"
                    />

                    <Button type="primary" htmlType="submit" loading={loading}>开始诊断</Button>
                </ProForm.Group>
            </ProForm>
        </ProCard>
    )
}
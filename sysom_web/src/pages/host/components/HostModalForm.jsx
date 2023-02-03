import { ModalForm, ProFormText, ProFormTextArea, ProFormSelect } from '@ant-design/pro-form';
import { useState } from 'react';
import { useImperativeHandle, useRef, forwardRef } from 'react';
import * as PropTypes from 'prop-types';
import { useIntl, FormattedMessage } from 'umi';
const MODE_ADD_HOST = 0
const MODE_EDIT_HOST = 1

/**
 * 主机信息模态表单
 * 1. 功能一：用于实现主机添加
 * 2. 功能二：用于实现主机信息编辑
 * @param {*} props 
 *      props.mode => 模式:     0 => 添加主机
 *                              1 => 修改主机信息 
 *      props.titl => 模态框顶部的标题  
 *      props.visible => 模态框是否可见
 *      props.modalWidth => 模态框的宽度，默认为 440px
 *      props.clusterList => 集群列表
 *      props.onVisibleChange => 模态框可见性发生变动时触发
 *      props.onFinish => 表单提交时触发
 */
let HostModalForm = (props, ref) => {
    const {
        mode,
        title,
        visible,
        modalWidth,
        clusterList,
        onVisibleChange,
        onFinish
    } = props;

    const modalFormRef = useRef();
    const intl = useIntl();
    const [id, setId] = useState(-1);

    // https://zh-hans.reactjs.org/docs/hooks-reference.html#useimperativehandle
    // 设置一些暴露给外部调用的函数，外部可以通过ref的方式调用
    useImperativeHandle(ref, () => ({
        // 填充表单的值
        setFieldsValue: (values) => {
            setId(values.id);
            modalFormRef.current.setFieldsValue(values)
        },
        // getFieldValue: modalFormRef.getFieldValue,                  // 获取某个字段的值
        // getFieldsValue: modalFormRef.getFieldsValue,                // 获取表单的当前值
        // getFieldsFormatValue: modalFormRef.getFieldsFormatValue,    // 获取格式化之后所有数据
        // getFieldFormatValue: modalFormRef.getFieldFormatValue,      // 获取格式化之后的单个数据
        // validateFieldsReturnFormatValue: modalFormRef.validateFieldsReturnFormatValue,  // 校验字段后返回格式化之后的所有数据
    }));

    return (
        <ModalForm
            style={{
                margin: "auto"
            }}
            modalProps={{
                centered: true,
                bodyStyle: {
                    display: "flex",
                    alignItems: "center",
                    flexDirection: "column"
                }
            }}
            formRef={modalFormRef}
            title={title}
            width={modalWidth}
            visible={visible}
            onVisibleChange={onVisibleChange}
            onFinish={value => {
                onFinish({
                    mode: mode,
                    id: id,
                    ...value
                })
            }}
        >
            <ProFormSelect
                label="选择集群"
                rules={[
                    {
                        required: true,
                        message: (
                            <FormattedMessage
                                id="pages.hostTable.cluster_required"
                                defaultMessage="Cluster is required"
                            />
                        ),
                    },
                ]}
                showSearch
                fieldProps={{ labelInValue: true }}
                width="md"
                name="cluster"
                request={async () => clusterList}
                placeholder="请选择主机所属集群"
            />
            <ProFormText
                label="主机名称"
                rules={[
                    {
                        required: mode == MODE_ADD_HOST,
                        message: (
                            <FormattedMessage
                                id="pages.hostTable.hostname_required"
                                defaultMessage="Host name is required"
                            />
                        ),
                    },
                ]}
                width="md"
                name="hostname"
                disabled={mode == MODE_EDIT_HOST}
            />
            <ProFormText
                label="用户名称"
                initialValue={'root'}
                rules={[
                    {
                        required: mode == MODE_ADD_HOST,
                        message: (
                            <FormattedMessage
                                id="pages.hostTable.username_required"
                                defaultMessage="username is required"
                            />
                        ),
                    },
                ]}
                width="md"
                name="username"
                disabled={mode == MODE_EDIT_HOST}
            />
            <ProFormText.Password
                label="用户密码"
                rules={[
                    {
                        required: mode == MODE_ADD_HOST,
                        message: (
                            <FormattedMessage
                                id="pages.hostTable.password_required"
                                defaultMessage="password is required"
                            />
                        ),
                    },
                ]}
                width="md"
                name="host_password"
                disabled={mode == MODE_EDIT_HOST}
            />
            <ProFormText
                label="IP地址"
                rules={[
                    {
                        required: mode == MODE_ADD_HOST,
                        message: (
                            <FormattedMessage
                                id="pages.hostTable.ip_required"
                                defaultMessage="IP is required"
                            />
                        ),
                    },
                    {
                        pattern: /^(([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])$/, 
                        message: (
                            <FormattedMessage
                                id="pages.hostTable.ip_invalid"
                                defaultMessage="IP address is invalid!"
                            />
                        ),
                    }
                ]}
                width="md"
                name="ip"
                disabled={mode == MODE_EDIT_HOST}
            />
            <ProFormText
                label="端口"
                initialValue={'22'}
                rules={[
                    {
                        required: mode == MODE_ADD_HOST,
                        message: (
                            <FormattedMessage
                                id="pages.hostTable.port_required"
                                defaultMessage="Port number is required"
                            />
                        ),
                    },
                ]}
                width="md"
                name="port"
                disabled={mode == MODE_EDIT_HOST}
            />
            <ProFormTextArea label="备注信息" width="md" name="description" />
        </ModalForm>
    )
}

HostModalForm = forwardRef(HostModalForm);

HostModalForm.displayName = "HostModalForm";

HostModalForm.propTypes = {
    mode: PropTypes.number,
    title: PropTypes.string,
    visible: PropTypes.bool,
    modalWidth: PropTypes.string,
    clusterList: PropTypes.array,
    onVisibleChange: PropTypes.func,
    onFinish: PropTypes.func
}

// Props 参数默认值
HostModalForm.defaultProps = {
    mode: 0,
    title: "New host",
    visible: false,
    modalWidth: "440px",
    clusterList: [],
    onVisibleChange: () => { },
    onFinish: () => { },
}

export default HostModalForm;
import { ModalForm, ProFormText, ProFormTextArea, ProFormSelect } from '@ant-design/pro-form';
import { forwardRef } from 'react';
import * as PropTypes from 'prop-types';
import { useIntl } from 'umi';

/**
 * 诊断离线导入模态框
 * @param {*} props 
 *      props.visible => Whether current modal visible
 *      props.title => 模态框顶部的标题  
 *      props.modalWidth => 模态框的宽度，默认为 440px
 *      props.onVisibleChange => Invoke while visible change
 *      props.onFinish => Import successfully
 */
let OfflineImportModal = (props, ref) => {
    const {
        title,
        visible,
        modalWidth,
        onVisibleChange,
        onFinish
    } = props;

    const intl = useIntl();

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
            title={title}
            width={modalWidth}
            visible={visible}
            onVisibleChange={onVisibleChange}
            onFinish={value => {
                onFinish({
                    ...value
                })
            }}
        >
            <ProFormText
                label={
                    intl.formatMessage({
                        id: 'pages.diagnose.instance',
                        defaultMessage: 'instance',
                    })
                }
                width="md"
                name="instance"
                tooltip={
                    intl.formatMessage({
                        id: 'pages.diagnose.offline_import.instance_tip',
                        defaultMessage: 'Instance ID, used to distinguish between different nodes, the validity of the instance ID is not verified here.',
                    })
                }
                placeholder={
                    intl.formatMessage({
                        id: 'pages.diagnose.offline_import.instance_placeholder',
                        defaultMessage: 'Eg.：127.0.0.1',
                    })
                }
                allowClear
            />
            <ProFormTextArea
                label={
                    intl.formatMessage({
                        id: 'pages.diagnose.offline_log',
                        defaultMessage: 'Offline log',
                    })
                }
                width="md"
                name="offline_log"
                tooltip={
                    intl.formatMessage({
                        id: 'pages.diagnose.offline_import.offline_log_tip',
                        defaultMessage: 'The result of the execution of the diagnostic command on the node side',
                    })
                }
                allowClear
            />
        </ModalForm>
    )
}

OfflineImportModal = forwardRef(OfflineImportModal);

OfflineImportModal.displayName = "OfflineImportModal";

OfflineImportModal.propTypes = {
    title: PropTypes.string,
    visible: PropTypes.bool,
    modalWidth: PropTypes.string,
    onVisibleChange: PropTypes.func,
    onFinish: PropTypes.func
}

// Props 参数默认值
OfflineImportModal.defaultProps = {
    title: "离线导入诊断结果",
    visible: false,
    modalWidth: "440px",
    onVisibleChange: () => { },
    onFinish: () => { },
}

export default OfflineImportModal;
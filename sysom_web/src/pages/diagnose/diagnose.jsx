import { PageContainer } from '@ant-design/pro-layout';
import React, { useState, useRef, useEffect } from 'react';
import { request } from 'umi';
import { Modal, message } from 'antd';
import ProCard from '@ant-design/pro-card';
import TaskList from './components/TaskList';
import TaskForm from './components/TaskForm';
import Dashboard from './components/Dashboard';
import OfflineImportModal from './components/OfflineImportModal';
import { getTask, offlineImport } from './service'
import { useIntl } from 'umi';
import _ from "lodash";


const { Divider } = ProCard;

const Diagnose = (props) => {
    const refTaskList = useRef();
    const [pannelConfig, setPannelConfig] = useState();
    const [data, setData] = useState();
    const [offlineImportModalVisible, setOfflineImportModalVisible] = useState(false);
    const [offlineImportLoading, setOfflineImportLoading] = useState(false);
    const intl = useIntl();

    useEffect(() => {
        let urlslice = props.match.url.split("/")
        urlslice.splice(2, 0, "v1")
        request(`/resource${urlslice.join("/")}.json`).then((res) => {
            setPannelConfig(res)
        })
    }, [])

    const onListClick = async (record) => {
        const recorded = record;
        const msg = await getTask(record.task_id);

        setData({ ...msg, ...msg.result });

    }

    const onPostTask = () => {
        refTaskList.current.refresh();
    }

    const onError = async (record) => {
        const msg = await getTask(record.task_id);
        Modal.error({
            title: '诊断失败',
            content: (
                <div>
                    <div>错误信息: {msg.result}</div>
                </div>
            ),
        });
    }

    return (
        <PageContainer>
            {pannelConfig && <>
                <TaskForm
                    taskForm={pannelConfig.taskform}
                    serviceName={pannelConfig.servicename}
                    onSuccess={onPostTask}
                    onOfflineLoad={() => {
                        setOfflineImportModalVisible(true)
                    }}
                />

                <Divider />
                <TaskList serviceName={pannelConfig.servicename}
                    onClick={(record) => onListClick(record)}
                    onError={onError} ref={refTaskList} />
            </>
            }
            <Divider />
            {
                data && <Dashboard
                    variables={pannelConfig.variables}
                    serviceName={pannelConfig.servername}
                    pannels={pannelConfig.pannels}
                    datas={data} />

            }
            <OfflineImportModal
                title={
                    intl.formatMessage({
                        id: 'pages.diagnose.offline_import.title',
                        defaultMessage: 'Import offline log',
                    })
                }
                visible={offlineImportModalVisible}
                onVisibleChange={setOfflineImportModalVisible}
                modalWidth="440px"
                loading={offlineImportLoading}
                onFinish={async (value) => {
                    setOfflineImportLoading(true);
                    let res = await offlineImport({
                        ...value,
                        "service_name": pannelConfig.servicename
                    });
                    if (res.code == 200) {
                        message.success(
                            intl.formatMessage({
                                id: 'pages.diagnose.offline_import.success',
                                defaultMessage: 'Import success',
                            })
                        );
                        refTaskList.current.refresh();
                    } else {
                        message.error(`${intl.formatMessage({
                            id: 'pages.diagnose.offline_import.failed',
                            defaultMessage: 'Import failed',
                        })}：${res.message}`);
                    }
                    setOfflineImportLoading(false);
                    setOfflineImportModalVisible(false);
                }}
            />
        </PageContainer>
    );
};

export default Diagnose;

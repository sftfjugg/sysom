import { PageContainer } from '@ant-design/pro-layout';
import React, { useState, useRef, useEffect } from 'react';
import { request } from 'umi';
import { Modal } from 'antd';
import ProCard from '@ant-design/pro-card';
import TaskList from './components/TaskList';
import TaskForm from './components/TaskForm';
import Dashboard from './components/Dashboard';
import { getTask, _getTask } from './service'
import _ from "lodash";


const { Divider } = ProCard;

const Diagnose = (props) => {
    const refTaskList = useRef();
    const [pannelConfig, setPannelConfig] = useState();
    const [data, setData] = useState();

    useEffect(() => {
        request(`/resource${props.match.url}.json`).then((res) => {
            setPannelConfig(res)
        })
    }, [])

    const onListClick = async (record) => {
        const recorded = record;
        const msg = await _getTask(record.id);

        setData({ ...msg, ...msg.result });

    }

    const onPostTask = () => {
        refTaskList.current.refresh();
    }

    const onError = async (record) => {
        const msg = await getTask(record.id);
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
                    onSuccess={onPostTask} />

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
        </PageContainer>
    );
};

export default Diagnose;

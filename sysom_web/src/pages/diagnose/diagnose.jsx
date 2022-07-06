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


    const changeOldFormat = (msg) => {
        let datasources = {}
        datasources.id = msg.id
        datasources.created_at = msg.created_at
        datasources.task_id = msg.task_id
        datasources.service_name = msg.service_name
        datasources.dataMemEvent = {
            "data": [
                { "key": "内存利用率", "value": parseFloat(msg.result.event.util.toFixed(2)) },
                { "key": "内存泄漏检查", "value": msg.result.event.leak ? "正常" : "危险" },
                { "key": "Memcg泄漏检查", "value": msg.result.event.memcg ? "正常" : "危险" },
                { "key": "内存碎片化评估", "value": msg.result.event.memfrag ? "正常" : "危险" }
            ]
        }
        _.set(datasources, 'dataMemOverView.data',
            Object.entries(msg.result.memgraph).map(item => ({ key: item[0], value: item[1] })))
        _.set(datasources, 'dataKerMem.data',
            Object.entries(msg.result.kernel).map(item => ({ key: item[0], value: item[1] })))
        _.set(datasources, 'dataUserMem.data',
            Object.entries(msg.result.user).map(item => ({ key: item[0], value: item[1] })))
        _.set(datasources, 'dataCacheList.data', msg.result.filecacheTop.map(
            (item, i) => ({ key: i, 文件名: item.file, cached: item.cached, "进程": item.task.join(',') })))
        _.set(datasources, 'dataProcMemList.data', msg.result.taskMemTop.map(
            (item, i) => ({ key: i, 进程名: item.comm, 总内存: item.total_mem, RssAnon: item.RssAnon, RssFile: item.RssFile })))

        console.log("datasources", datasources)
        return datasources
    }

    const onListClick = async (record) => {
        const recorded = record;
        const msg = await _getTask(record.id);

        //目前仅仅支持内存大屏的数据格式旧数据格式转换，其他使用场合请直接使用新数据格式
        if (msg.params.service_name == "memgraph" && msg.result.event) {
            setData(changeOldFormat(msg));
        } else {
            setData({ ...msg, ...msg.result });
        }
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

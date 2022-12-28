import { PageContainer } from '@ant-design/pro-layout';
import React, { useState, useEffect } from 'react';
import { request } from 'umi';
import Dashboard from '../components/Dashboard';
import { getTask } from '../service'
import _ from "lodash";

const DiagnoseDetai = (props) => {
    const [pannelConfig, setPannelConfig] = useState({});
    const [data, setData] = useState();

    let taskId = props?.match?.params?.task_id;
    useEffect(async () => {
        if (!!taskId) {
            const taskResult = await getTask(taskId);
            const service_name = taskResult.service_name;

            const localesConfig = await request(`/resource/diagnose/v1/locales.json`)
            const dashboards = localesConfig.dashboard;
            let pannelJsonUrl = ""
            for (let k in dashboards) {
                if (k.endsWith(service_name)) {
                    pannelJsonUrl = `/resource/diagnose/v1${(k.split("menu.diagnose")[1].split(".")).join("/")}.json`
                    break
                }
            }
            if (!pannelJsonUrl) {
                return
            }
            let targetPannelConfig = await request(pannelJsonUrl)
            setPannelConfig(targetPannelConfig)
            setData({
                ...taskResult,
                ...taskResult.result
            })
        }

    }, [])

    return (
        <PageContainer title="诊断详情" subTitle={`(${taskId})`}>
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

export default DiagnoseDetai;

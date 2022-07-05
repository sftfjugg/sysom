import ProCard from '@ant-design/pro-card'
import ProForm, { ProFormSelect } from '@ant-design/pro-form';
import { useState } from 'react';
import { Modal } from 'antd';
import StatisticPannel from "./StatisticPannel"
import PieChartPannel from "./PieChartPannel"



const templateReplace = (template, Vars = []) => {
  Vars.forEach(item => {
    template = template.replace(new RegExp("\\${.*" + item.name + ".*\\}", "g"), item.value);
  });
  return template;
};

//parentData is for create local popup pannel  by parent pannel
const createPannel = (pannel, datas, globalVariables, showModalPannel, parentData = {},) => {
  const pannelMap = {
    stat: StatisticPannel,
    row: RowPannel,
    piechart: PieChartPannel,
  }

  const newPannel = {...pannel} 

  //globalVars has higher priority
  let pannelDataIndex = templateReplace(pannel.datasource, globalVariables)
  newPannel.title = templateReplace(pannel.title, globalVariables)

  //parentVariable
  const localVariables = Object.entries(parentData).map(i => ({ name: i[0], value: i[1] }))
  pannelDataIndex = templateReplace(pannelDataIndex, localVariables)
  newPannel.title = templateReplace(newPannel.title, localVariables)

  const data = datas[pannelDataIndex]?.data
  const PannelInst = pannelMap[pannel.type];
  return (
    <PannelInst key={pannel.key}
      configs={newPannel}
      data={data}
      datas={datas}
      globalVariables={globalVariables}
      showModalPannel={showModalPannel}
    />
  )
}

const RowPannel = (props) => {
  const configs = props.configs
  const datas = props.datas
  const globalVariables = props.globalVariables


  return (
    <ProCard title="卡片组展开" ghost gutter={16} collapsible>
      {
        configs.children.map(pannel => (
          <ProCard key={pannel.key} bodyStyle={{ padding: 0 }} bordered>
            {createPannel(pannel, datas, globalVariables)}
          </ProCard>
        ))}
    </ProCard>
  )
}

const VariableExtra = (props) => {
  const variableDesc = props.variableDesc;
  const datas = props.datas;

  return (
    <ProForm
      layout={"inline"}
      submitter={{
        resetButtonProps: { style: { display: "none" } },
        submitButtonProps: { style: { display: "none" } }
      }}
    >
      {
        variableDesc.map(item => {
          const option = datas[item.datasource].data.map(opt => ({ "value": opt.value, "label": opt.value }))
          return (
            < ProFormSelect
              // Don't work
              //fieldProps={{
              //  labelInValue: true
              //}}
              key={item.key}
              options={option}
              name={item.key}
              label={item.label}
              initialValue={datas[item.datasource].data[0]?.value}
              onChange={props.onChange(item.key)}
            />
          )
        })
      }
    </ProForm>
  );
};

const Dashboard = (props) => {
  const pannels = props.pannels;
  const datas = props.datas
  const variableDesc = props.variables

  let initialValiable = []
  variableDesc.forEach(varDesc => {
    if (datas[varDesc.datasource].data) {
      initialValiable.push({
        name: varDesc.key,
        value: datas[varDesc.datasource].data[0].value
      })
    }
  })

  const [globalVariables, setGlobalVariables] = useState(initialValiable)
  //I do not get the key for ProFormSelect onChange, even setting labelInValue,
  //so i use closure
  const valiableChange = (key) => {
    return (value) => {
      globalVariables.find(i => (i.name == key)).value = value
      setGlobalVariables([...globalVariables])
    }
  }

  const [pannelModal, setPannelModal] = useState({ visible: false });
  //parentData is for create local popup pannel  by parent pannel
  const showModalPannel = (pannel, parentData = {}) => {
    console.log("showModalPannel", parentData)
    const PopupModalPannel = createPannel(pannel, datas, globalVariables, showModalPannel,parentData)
    setPannelModal({ visible: true, pannel: PopupModalPannel });
  }
  const handleOk = () => {
    setPannelModal({ visible: false });
  };
  const handleCancel = () => {
    setPannelModal({ visible: false });
  };

  return (
    <>
      <ProCard title={<div>{`诊断结果 (TaskID: ${datas.task_id})`}</div>} ghost gutter={16}
        extra={<VariableExtra variableDesc={variableDesc} datas={datas} onChange={valiableChange} />}>
        {
          pannels.map(pannel => {
            const datasource = templateReplace(pannel.datasource, globalVariables)
            return createPannel(pannel, datas, globalVariables, showModalPannel)
          })
        }
      </ProCard>
      <Modal visible={pannelModal.visible}
        width={800}
        onOk={handleOk} onCancel={handleCancel}>
        {
          pannelModal.pannel
        }
      </Modal>
    </>
  )
}

export default Dashboard
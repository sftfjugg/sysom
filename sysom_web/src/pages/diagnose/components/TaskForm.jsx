import ProForm, { ProFormDigit, ProFormText, ProFormSelect } from '@ant-design/pro-form';
import { Button } from 'antd';
import ProCard from '@ant-design/pro-card';
import { useRequest } from 'umi';
import { postTask } from '../service';
import { useIntl } from 'umi';

const TaskFrom = (props) => {
  const taskForm = props.taskForm
  const serviceName = props.serviceName
  const intl = useIntl();

  const { loading, error, run } = useRequest(postTask, {
    manual: true,
    onSuccess: (result, params) => {
      props?.onSuccess?.(result, params)
    },
  });

  return (
    <ProCard>
      <ProForm
        onFinish={async (values) => { run(values) }}
        submitter={{
          submitButtonProps: { style: { display: 'none' } },
          resetButtonProps: { style: { display: 'none' } }
        }}
        layout={"horizontal"}
        autoFocusFirstInput
      >
        <ProFormText
          name={"service_name"}
          initialValue={serviceName}
          hidden={true}
        />
        <ProForm.Group>
          {
            taskForm?.map(formItem => {

              if (formItem.type == "text") {
                return (< ProFormText
                  key={formItem.name}
                  name={formItem.name}
                  label={formItem.label}
                  initialValue={formItem.initialValue}
                  tooltip={formItem.tooltips}
                />);
              } else if (formItem.type == "digit") {
                return (< ProFormDigit
                  key={formItem.name}
                  name={formItem.name}
                  label={formItem.label}
                  initialValue={formItem.initialValue}
                  tooltip={formItem.tooltips}
                />);
              } else if (formItem.type == "select") {
                return (
                  < ProFormSelect
                    key={formItem.name}
                    name={formItem.name}
                    label={formItem.label}
                    initialValue={formItem.initialValue}
                    tooltip={formItem.tooltips}
                    options={formItem.options}
                  />)
              }
            })
          }
          <Button type="primary" htmlType="submit" loading={loading}>开始诊断</Button>
          <Button type="primary" loading={loading} onClick={() => {
            props?.onOfflineLoad?.()
          }}>
            {
              intl.formatMessage({
                id: 'pages.diagnose.offline_import.btn',
                defaultMessage: 'Offline import',
              })
            }
          </Button>
        </ProForm.Group>
      </ProForm>
    </ProCard>
  )
}

export default TaskFrom
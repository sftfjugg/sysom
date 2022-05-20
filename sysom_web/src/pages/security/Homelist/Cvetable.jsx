import {  useRef ,useState} from 'react';
import { useIntl, FormattedMessage ,history} from 'umi';
import { Button,Modal,Progress,Card,Row,Col} from 'antd';
import ProCard from '@ant-design/pro-card';
import ProTable from '@ant-design/pro-table';
import "./homelist.less";
import {getOneById,manyApi} from '../service'

const Cvetable=(params)=> {
    const intl = useIntl();
    const  request=async()=>{
        const  msg=await  getOneById(params.id);
           msg.data = [...msg.setlovodata]
        return msg
    }
   const [succesvisible, setsuccesvisible] = useState(false);
    const [errvisible, seterrvisible] = useState(false);
    const [vlue,setCount]=useState(0)
    const [selectedRowKeys, setselectedRowKeys] = useState(0);
    const [selectedRows,setselectedRows]=useState(0)
    const rowSelection = {
        onChange: (selectedRowKeys,selectedRows) => {
        setselectedRowKeys(selectedRowKeys)
        setselectedRows(selectedRows)
      },
    };
    const columns=[
     {
        title: <FormattedMessage id="pages.security.list.index" defaultMessage="index" />,
        dataIndex: 'index',
        align: "center",
        hideInSearch: true,
        render: (txt, record, index) => index + 1,
     },
    {
        title:<FormattedMessage id="pages.security.Homelist.hostname" defaultMessage="hostname" />,
        dataIndex:'hostname',
    },
    {
        title:<FormattedMessage id="pages.security.Homelist.ip" defaultMessage="ip" />,
        dataIndex:"ip",
    },
    {
        title:<FormattedMessage id="pages.security.Homelist.created_by" defaultMessage="created_by" />,
        dataIndex:"created_by",
    },
    {
        title:<FormattedMessage id="pages.security.Homelist.created_at" defaultMessage="created_at" />,
        dataIndex:"created_at",
    },
    {
        title:<FormattedMessage id="pages.security.Homelist.status" defaultMessage="status" />,
        dataIndex:"status",
        align: "center",
        render: (txt, record) => {
            if (record.status === "running") {
              return <div className="numbersuccess">
                <FormattedMessage id="pages.hostTable.status.running" defaultMessage="Running" />
              </div>
            } else if(record.status === "offline"){
              return <div className="numbererr">
                <FormattedMessage id="pages.hostTable.status.offline" defaultMessage="Offline" />
              </div>
            }else{
                return <div className="numbererr">
                <FormattedMessage id="pages.hostTable.status.abnormal" defaultMessage="Offline" />
              </div>
            }
          }
    },
    {
    title: <FormattedMessage id="pages.security.list.operation" defaultMessage="operation" />,
    dataIndex: "option",
    align: "center",
    valueType: "option",
    render: (_, record) => [
            <a key="showDetail" onClick={async()=>{
                setflags(true)
                    setsuccesvisible(true)
                    seterrvisible(false)
                const  time =setInterval(()=>{
                      setCount(vlue=>vlue+1);
                    },2500)
                const  arry=[];
                const id=params.id
                arry.push({"cve_id":id, "hostname":[record.hostname ]})
                const msg=await manyApi({cve_id_list:arry});
                if(msg){
                    setsuccesvisible(true)
                    setCount(99);
                    clearInterval(time)
                if(msg.message=="fix cve failed"){
                    seterrvisible(true)
                    setsuccesvisible(false);
                    setCount(0);
                } else {
                    // 成功后弹出建议重启服务提示框
                    setsuccesvisible(false);
                    Modal.info({
                        title: intl.formatMessage({
                            id: 'pages.security.notification.fix.success',
                            // 系统漏洞已修复
                            defaultMessage: 'System vulnerability has been fixed',
                        }),
                        content: intl.formatMessage({
                            id: 'pages.security.notification.fix.success.content',
                            // 如您正在运行漏洞涉及到的服务，建议您重启相关服务使漏洞修复生效
                            defaultMessage: ('If you are running the service affected by the vulnerability,' +
                                ' please restart the service to make the vulnerability fix effective.'
                            ),
                        }),
                        onOk() {
                            history.push('/security/list');
                        },
                        onCancel() {
                            history.push('/security/list');
                        },
                    });
                }
            }
            }}>
        {<FormattedMessage id="pages.security.list.repair" defaultMessage="repair" />}
    </a>,
    ],
    },
]
    const  repair=async()=>{
        setflags(true)
    const  arry=[];
    const leght =selectedRows.length;
    if(leght>0){
        setsuccesvisible(true)
        seterrvisible(false)
        const  time =setInterval(()=>{
        setCount(vlue=>vlue+1);

        },2500)
        const id=params.id;
        arry.push({"cve_id":id, "hostname":[selectedRows[0].hostname ]})
        for(let i = 1; i < leght; i++){
            arry[0].hostname.push(selectedRows[i].hostname)
        }
        const msg=await manyApi({cve_id_list:arry});
        if(msg){
                setsuccesvisible(true)
                setCount(99);
                clearInterval(time)
            if(msg.message=="fix cve failed"){
                seterrvisible(true)
                setsuccesvisible(false);
                setCount(0);
            } else {
                // 成功后弹出建议重启服务提示框
                setsuccesvisible(false);
                Modal.info({
                    title: intl.formatMessage({
                        id: 'pages.security.notification.fix.success',
                        // 系统漏洞已修复
                        defaultMessage: 'System vulnerability has been fixed',
                    }),
                    content: intl.formatMessage({
                        id: 'pages.security.notification.fix.success.content',
                        // 如您正在运行漏洞涉及到的服务，建议您重启相关服务使漏洞修复生效
                        defaultMessage: ('If you are running the service affected by the vulnerability,' +
                            ' please restart the service to make the vulnerability fix effective.'
                        ),
                    }),
                    onOk() {
                        history.push('/security/list');
                    },
                    onCancel() {
                        history.push('/security/list');
                    },
                });
            }
            }
        }


    }
    const [flags,setflags]=useState(false)
    const cancel=()=>{
        history.goBack();
    }
  return (
    <>
     <ProTable
       rowKey="hostname"
       columns={columns}
       search={false}
       request={request}
       rowSelection={rowSelection}
      />
      <ProCard>
     <Row>
        <Col span={13}>
        {succesvisible?( <div>修复中< Progress width={40} percent={vlue} size="small" /></div>):null}
        {errvisible?(<div>修复出错了，<Button type="link" size="small" href={"/security/historical" }>查看详情</Button></div>):null}
        </Col>
        <Col span={11}>
              <Row className="allbtn">
              <Col><Button type="primary" onClick={repair}>一键修复</Button></Col>
              <Col style={{lineHeight:'58px'}}><Button disabled={flags} onClick={cancel} style={{marginRight:'10px'}}>返回</Button></Col>
              </Row>
              </Col>
    </Row>
      </ProCard>

    </>
  );
}

export default Cvetable;

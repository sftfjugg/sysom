import {  useRef ,useState} from 'react';
import { useIntl, FormattedMessage } from 'umi';
import ProCard from '@ant-design/pro-card';
import { PageContainer } from '@ant-design/pro-layout';
import { Button,Modal,Progress} from 'antd';
import ProTable from '@ant-design/pro-table';
import Restoration from "../components/restoration"
import ListCard from '../components/ListCard'
import "./list.less";
import { listApi, manyApi } from "../service";

const { Divider } = ProCard;
const List=(props)=> {

  const actionRef = useRef();
  const intl = useIntl();
  const fn = () => {
    props.history.push("/security/historical");
  };
  const [selectedRowKeys, setselectedRowKeys] = useState(0);
  const [selectedRows,setselectedRows]=useState(0)
  const rowSelection = {
      onChange: (selectedRowKeys,selectedRows) => {
      setselectedRowKeys(selectedRowKeys)
      setselectedRows(selectedRows)
    },
  };
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [succesvisible, setsuccesvisible] = useState(false);
  const [errvisible, seterrvisible] = useState(false);
  const [vlue, setCount] = useState(0);

  
  const showModal = () => {
   const leght = selectedRows.length;
   if (leght > 0) {
      setIsModalVisible(true);
    }
  };
  const handleOk = async () => {
    const time = setInterval(() => {
      setCount((vlue) => vlue + 1);
    }, 4500);
    setIsModalVisible(false);
    setsuccesvisible(true);
    const arry = [];
    const leght = selectedRows.length;
    for (let i = 0; i < leght; i++) {
      arry.push({
        cve_id: selectedRows[i].cve_id,
        hostname: selectedRows[i].hosts,
      });
    }
  const msg = await manyApi({ cve_id_list: arry });
    if (msg) {
      setIsModalVisible(false);
      setsuccesvisible(true);
      setCount(99);
      clearInterval(time);
      if (msg.message == "fix cve failed") {
        seterrvisible(true);
        setsuccesvisible(false);
      } else {
        setTimeout(() => {
          props.history.push("/security");
        }, 1000);
      }
    }
  };
  const handleCancel = () => {
    setIsModalVisible(false);
  };
  
  const columns = [
    {
      title: <FormattedMessage id="pages.security.list.index" defaultMessage="index" />,
      dataIndex: 'index',
      align: "center",
      hideInSearch: true,
      render: (txt, record, index) => index + 1,
    },
    {
      title: <FormattedMessage id="pages.security.list.cve_id" defaultMessage="cve_id" />,
      dataIndex: 'cve_id',
      align: "center",
      hideInSearch: true
    },
    {
      title: <FormattedMessage id="pages.security.list.pub_time" defaultMessage="pub_time" />,
      dataIndex: 'pub_time',
      valueType: 'dateTime',
      align: "center",
      hideInSearch: true,
      sorter: (a, b) => a.pub_time - b.pub_time,
    },
    {
      title: <FormattedMessage id="pages.security.list.vul_level" defaultMessage="vul_level" />,
      dataIndex: 'vul_level',
      align: "center",
      filters: true,
      onFilter: true,
      hideInSearch: true,
      valueEnum: {
        high: {
          text: (
            <FormattedMessage id="pages.security.list.high" defaultMessage="high" />
          ),
        },
        medium: {
          text: (
            <FormattedMessage id="pages.security.list.medium" defaultMessage="medium" />
          ),
         },
         critical: {
          text: (
            <FormattedMessage id="pages.security.list.critical" defaultMessage="critical" />
          ),
        },
        low: {
          text: (
            <FormattedMessage id="pages.security.list.low" defaultMessage="low" />
          ),
        },
      },
    },
 
    {
      title: <FormattedMessage id="pages.security.list.hosts" defaultMessage="hosts" />,
      dataIndex: 'hosts',
      width: "20%",
      align: "center",
      valueType: 'select',
      hideInSearch: true,
      onCell: () => {
        return {
          style: {
            maxWidth: 260,
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
            cursor: "pointer",
          },
        };
      },
      render: (_,record,text) => (
        <span placement="topLeft" title={record.hosts.toString()} >
            {record.hosts.toString()}
        </span>
      ),
    },
    {
      title: <FormattedMessage id="pages.security.list.operation" defaultMessage="operation" />,
      dataIndex: "option",
      align: "center",
      valueType: "option",
      render: (_, record) => [
        <a key="showDetail"  href={"/security/homelist/" + record.cve_id}>
          {<FormattedMessage id="pages.security.list.repair" defaultMessage="repair" />}
        </a>,
      ],
    },
   
    
  ];
  return (
    <div> 
     <PageContainer>
       <ListCard />
       <Divider />
      <ProTable  rowKey="cve_id"  columns={columns} search={false} request={listApi}   
       toolBarRender={() => [
            <Restoration paren={fn}/>,
            <Button type="primary"  key="primary" onClick={showModal}>
              {<FormattedMessage id="pages.security.list.repair" defaultMessage="repair" />}
              </Button>
            ]}
        rowSelection={rowSelection}
       />
         
          <Modal width={320}  visible={isModalVisible} onOk={handleOk} onCancel={handleCancel} centered={true}>
               <p className="stop">
                  {<FormattedMessage id="pages.security.list.confirm" defaultMessage="confirm" />}
                  </p>
          </Modal>
          <Modal width={320} visible={succesvisible} footer={null} centered={true}
          >
              <p> {<FormattedMessage id="pages.security.list.re" defaultMessage="re" />}</p>
            <Progress percent={vlue} size="small" />
          </Modal>
          <Modal width={320} visible={errvisible} footer={null} centered={true}>
            <p> {<FormattedMessage id="pages.security.list.error" defaultMessage="error" />}
              <Button type="link" size="small"
                onClick={() => props.history.push("/security/historical")}
              >
               {<FormattedMessage id="pages.security.list.details" defaultMessage="details" />}
              </Button>
            </p>
          </Modal>
    </PageContainer>
       
    </div>
  );
}

export default List;

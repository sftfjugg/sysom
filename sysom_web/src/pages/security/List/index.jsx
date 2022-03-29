import React, { useState, useEffect, useRef } from "react";
import { Card, Table, Button, Progress, Modal, Tooltip, message } from "antd";
import "./list.less";
import { listApi, manyApi, summaryApi } from "../service";
import { PageContainer } from "@ant-design/pro-layout";
import Headcard from "../components/Headcard";

function List(props) {
  // console.log(props)
  const [data, setdata] = useState([]);

  useEffect(async () => {
    const msg = await listApi();

    setdata(msg.data);
  }, []);

  const fn = () => {
    props.history.push("/security/historical");
  };
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [succesvisible, setsuccesvisible] = useState(false);
  const [errvisible, seterrvisible] = useState(false);
  const [vlue, setCount] = useState(0);
  const [huan,sethuan]=useState(false)
  
  const showModal = () => {
    const leght = selectedRows.length;
    if (leght > 0) {
      setIsModalVisible(true);
    }
  };
  const handleOk = async () => {
    const time = setInterval(() => {
      setCount((vlue) => vlue + 1);
    }, 2500);
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
  const geng=()=>{
    sethuan(true)
  }

  const columns = [
    {
      title: "序号",
      key: "index",
      width: 80,
      align: "center",

      render: (txt, record, index) => index + 1,
    },
    {
      title: "编号",
      dataIndex: "cve_id",
      key: "cve_id",
      align: "center",
    },
    {
      title: "发布时间",
      dataIndex: "pub_time",
      key: "pub_time",
      align: "center",
      sorter: (a, b) => a.pub_time.length - b.pub_time.length,
    },
    {
      title: "漏洞等级",
      dataIndex: "vul_level",
      key: "vul_level",
      align: "center",
      render: (txt, record) => {
        if (record.vul_level == "high") {
          return <div>高危</div>;
        } else if (record.vul_level == "medium") {
          return <div>中危</div>;
        } else if (record.vul_level == "critical") {
          return <div>严重</div>;
        } else if (record.vul_level == "low") {
          return <div>低危</div>;
        } else if (record.vul_level == "") {
          return <div></div>;
        }
      },
      filters: [
        { text: "严重", value: "critical" },
        { text: "高危", value: "high" },
        { text: "中危", value: "medium" },
        { text: "低危", value: "low" },
      ],
      onFilter: (value, record) => record.vul_level.includes(value),
    },
    {
      width: "20%",
      title: "涉及主机",
      align: "center",
      dataIndex: "hosts",
      key: "hosts",
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
      render: (text) => (
        <span placement="topLeft" title={text}>
          {text.toString()}
        </span>
      ),
    },
    {
      title: "操作",
      align: "center",
      render: (txt, record, index) => {
        return (
          <div>
            <Button
              type="link"
              onClick={() =>
                props.history.push(`/security/homelist/${record.cve_id}`)
              }
            >
              {" "}
              修复{" "}
            </Button>
          </div>
        );
      },
    },
  ];
  const [selectedRowKeys, setselectedRowKeys] = useState(0);
  const [selectedRows, setselectedRows] = useState(0);
  const [total, setTotal] = useState(0);
  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedRowKeys, selectedRows) => {
      setselectedRowKeys(selectedRowKeys);
      setselectedRows(selectedRows);
    },
  };
  const paginationProps = {
    showSizeChanger: true,
    showQuickJumper: true,
    total: total, // 数据总数
    pageSizeOptions: [10, 20, 50, 100],
    defaultPageSize: 20,
    // current: pageNum, // 当前页码
    showTotal: (total, ranage) => `共 ${total} 条`,
    position: ["bottomRight"],
    // size:"small"
  };
  return (
    <div>
      <PageContainer>
        <Headcard paren={fn} isShow={true} geng={geng} quan={huan}/>
        <Card
          className="list-table"
          extra={
            <Button type="primary" size="small" onClick={showModal}>
              修复
            </Button>
          }
        >
          <Table
            rowSelection={rowSelection}
            rowKey="cve_id"
            columns={columns}
            dataSource={data}
            size="small"
            pagination={paginationProps}
          />
          <Modal
            width={320}
            visible={isModalVisible}
            onOk={handleOk}
            onCancel={handleCancel}
            centered={true}
          >
            <p className="stop">确定修复吗</p>
          </Modal>
          <Modal
            width={320}
            visible={succesvisible}
            footer={null}
            centered={true}
          >
            <p> 正在修复中...</p>
            <Progress percent={vlue} size="small" />
          </Modal>
          <Modal width={320} visible={errvisible} footer={null} centered={true}>
            <p>
              恢复出错了，
              <Button
                type="link"
                size="small"
                onClick={() => props.history.push("/security/historical")}
              >
                查看详情
              </Button>
            </p>
          </Modal>
        </Card>
      </PageContainer>
    </div>
  );
}

export default List;

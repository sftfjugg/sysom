import React, {useState,useEffect} from 'react';
import ProTable from '@ant-design/pro-table';
import {PauseOutlined, RedoOutlined,FileTextOutlined} from "@ant-design/icons";
import {queryStopAssess, queryRetryAssess,queryDeleteAssess} from '../../../service';
import {Progress, Button, Modal, message, Tooltip} from 'antd';
import './AssessList.less';


const AssessList = React.forwardRef((props, ref) => {
  const {assessList,getList} = props;
  const [loading,setLoading] = useState(true);

  useEffect(()=>{
    new Promise(async(resolve) => {
      await getList();
      resolve();
    }).then(()=>{
      setLoading(false);
    });
    // 轮询评估记录
    const timer = setInterval(async () => {
      Promise.all([
        getList()
      ]).catch((error)=>{
        console.log(error,'error')
      })
    }, 5000);
    return () => clearInterval(timer);
  },[])

  const columns = [
    {
      title: '机器名称',
      dataIndex: 'hostname',
    },
    {
      title: 'IP',
      dataIndex: 'ip',
    },
    {
      title: '源操作系统',
      dataIndex: 'old_ver',
    },
    {
      title: '目标操作系统',
      dataIndex: 'new_ver',
    },
    {
      title: '评估进度',
      dataIndex: 'rate',
      filters: false,
      renderText: (_, r) => (
        <Progress
          percent={r.rate || 0}
          className={
            r.rate === 100
              ? 'numGreen'
              : r.rate > 0 && r.rate < 99
              ? 'numRed'
              : 'numZero'
          }
          size='small'
          steps={10}
          format={(percent) => `${percent}%`}
          strokeColor={r.rate === 100 ? '#52C41A' : (r.rate > 0 && r.rate < 99 ? '#FF4D4F' : '#999999')}
        />
      ),
    },
    {
      title: '评估状态',
      dataIndex: 'status',
      render: (t, r) => {
        switch (r.status){
            case 'running':
              return (
                <Tooltip trigger="hover" placement="topLeft" title={r.detail ? r.detail : ''}>
                  <span style={{fontSize: 13,cursor: 'pointer',color: '#FCC00B'}}>评估中</span>
                </Tooltip>
              );
            case 'success':
              return (
                <Tooltip trigger="hover" placement="topLeft" title={r.detail ? r.detail : ''}>
                  <span style={{fontSize: 13,cursor: 'pointer',color: '#52C41A'}}>评估完成</span>
                </Tooltip>
              );
            case 'fail':
              return (
                <Tooltip trigger="hover" placement="topLeft" title={r.detail ? r.detail : ''}>
                  <span style={{fontSize: 13,cursor: 'pointer',color: '#FF4D4F'}}>评估失败</span>
                </Tooltip>
              );
            case 'stop':
              return (
                <Tooltip trigger="hover" placement="topLeft" title={r.detail ? r.detail : ''}>
                  <span style={{fontSize: 13,cursor: 'pointer',color: '#FF4D4F'}}>评估停止</span>
                </Tooltip>
              );
            default: return r.status;
        }
      },
    },
    {
      title: '评估时间',
      dataIndex: 'created_at',
    },
    // 评估中：可以停止，其他不能；不能重试，其他能。
    {
      title: '操作',
      dataIndex: 'option',
      valueType: 'option',
      width: 300,
      render: (_, record) => (
        <div className='option'>
          <Button type='text' className='optionBtn' disabled={record.status==='running'?false:true} onClick={() => onStop(record.id)}>
            <PauseOutlined />
            <span>停止</span>
          </Button>
          <Button type='text' className='optionBtn' disabled={record.status==='running'?true:false} onClick={() => onRetry(record.id)}>
            <RedoOutlined />
            <span>重试</span>
          </Button>
          <Button type='text' className='optionBtn' disabled={record.status==='running'?true:false} onClick={() => onDelete(record.id)}>
            <FileTextOutlined />
            <span style={{marginLeft: '8px'}}>删除</span>
          </Button>
          <Button type='text' className='optionBtn'>
            <a key={record.id} href={'/migrate/report/'+record.id+'?ip='+record.ip+'&old_ver='+record.old_ver+'&new_ver='+record.new_ver}>
              <FileTextOutlined />
              <span style={{marginLeft: '8px'}}>查看报告</span>
            </a>
          </Button>
        </div>
      ),
    }
  ];

  const onStop = (id) => {
    Modal.confirm({
      title: (
        <span style={{ fontWeight: 'normal', fontSize: 14 }}>
          确定要停止吗？
        </span>
      ),
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        const destroyHide = message.loading('正在停止...', 0);
        try {
          const { code, msg } = await queryStopAssess({
            id,
          });
          if (code === 200) {
            getList();
            message.success('停止成功');
            return true;
          }
          message.error(msg);
          return false;
        } catch (error) {
          console.log(error,'error')
          return false;
        } finally {
          destroyHide();
        }
      },
    });
  }

  const onRetry = (id) => {
    Modal.confirm({
      title: (
        <span style={{ fontWeight: 'normal', fontSize: 14 }}>
          确定要重试吗？
        </span>
      ),
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        const destroyHide = message.loading('正在重试...', 0);
        try {
          const { code, msg } = await queryRetryAssess({id});
          if (code === 200) {
            getList();
            message.success('重试成功');
            return true;
          }
          message.error(msg);
          return false;
        } catch (error) {
          console.log(error,'error')
          return false;
        } finally {
          destroyHide();
        }
      },
    });
  }

  const onDelete = (id) => {
    Modal.confirm({
      title: (
        <span style={{ fontWeight: 'normal', fontSize: 14 }}>
          确定要删除吗？
        </span>
      ),
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        const destroyHide = message.loading('正在删除...', 0);
        try {
          const { code, msg } = await queryDeleteAssess({id});
          if (code === 200) {
            getList();
            message.success('删除成功');
            return true;
          }
          message.error(msg);
          return false;
        } catch (error) {
          console.log(error,'error')
          return false;
        } finally {
          destroyHide();
        }
      },
    });
  }

  return (
    <ProTable
      tableClassName='assessList'
      headerTitle={props.headerTitle}
      actionRef={ref}
      params={props.params}
      rowKey='id'
      dataSource={assessList}
      columns={columns}
      pagination={props.pagination}
      search={false}
      loading={loading}
    />
  );
});

export default AssessList;

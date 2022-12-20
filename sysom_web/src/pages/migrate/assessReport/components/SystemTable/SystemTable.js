import React, {useContext} from 'react';
import ProTable from '@ant-design/pro-table';
import ProCard from '@ant-design/pro-card';
import {Skeleton} from 'antd';
import { WrapperContext } from '../../containers';
import './SystemTable.less';
import {assessColumns} from '../../../utils';



const SystemTable = (props, ref) => {
  const {
    dispatch,
    state: {sysTableList,sysTableLoading},
  } = useContext(WrapperContext);
  const {type} = props;
  const SYS_TABLE_TITLE = {
    key: type,
    symbol_name: type,
    ko_name: type,
    name: type,
    cmd: type,
    // : '源操作系统',
    // value_y: '目标操作系统',
    metric: '一致度',
    source: '分类'
  }

  const showColumnTitle = (data) => {
    if(data.search('_x') !== -1){
      return '源操作系统'
    }else if(data.search('_y') !== -1){
      return '目标操作系统'
    }else{
      return false;
    }
  }

  const getcolumns = (list) => {
    let column = [];
    if(list && list.length > 0){
      let keys = Object.keys(list[0]);
      let arr = keys.filter((item)=>item !== 'result' && item !== 'metric');
      arr.forEach((item)=>{
        column.push({
          title: SYS_TABLE_TITLE[item]?SYS_TABLE_TITLE[item]:(showColumnTitle(item)?showColumnTitle(item):item),
          dataIndex: item,
          ellipsis: true,
        })
      })
    }
    column.push(assessColumns('评估结果','result',150))
    return column;
  }
  

  const showExtra = (data) => {
    if(data?.length > 0){
      let diff = data.filter((i)=>i.result==='diff');
      let less = data.filter((i)=>i.result==='less');
      return (
        <div className='sys-extra'>
          <div>共{data.length}项</div>｜
          <div>变更{diff?diff.length:0}</div>｜
          <div>缺失{less?less.length:0}</div>
        </div>
      )
    }
  }

  return (
    <Skeleton loading={sysTableLoading}>
      <ProCard
        headStyle={{padding: '0'}}
        bodyStyle={{padding: '0'}}
        extra={showExtra(sysTableList)}
      >
        <ProTable
          rowKey='key'
          dataSource={sysTableList}
          columns={getcolumns(sysTableList)}
          toolBarRender={false}
          search={false}
        />
      </ProCard>
    </Skeleton>
  );
};

export default SystemTable;

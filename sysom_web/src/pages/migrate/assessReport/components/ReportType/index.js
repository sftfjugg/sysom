import React,{useContext} from 'react';
import ProCard from '@ant-design/pro-card';
import { ReactComponent as UploadIcon } from '@/pages/migrate/static/upload.svg';
import { ReactComponent as DownLoadIcon } from '@/pages/migrate/static/download.svg';
import { WrapperContext } from '../../containers';
import './index.less';

export default (props)=>{
  const {
    state: {activeIp,activeOld,activeNew},
  } = useContext(WrapperContext);

  const {title} = props;

  return (
    <ProCard
      bodyStyle={{paddingTop:'40px',background:'#000'}}
    >
      <div className="ass_report_content_title">
        {title}
        <span>{activeIp}</span>
      </div>
      <div className="ass_report_content_ver">
        <div><UploadIcon style={{ marginRight: 6 }} />源操作系统：{activeOld}</div>
        <div><DownLoadIcon style={{ marginRight: 6 }} />目标操作系统：{activeNew} </div>
      </div>
    </ProCard>
  )
}


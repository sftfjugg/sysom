import {  useRef, useState, useEffect } from 'react';
import { useIntl, FormattedMessage } from 'umi';
import { PageContainer } from '@ant-design/pro-layout';
import { delOSType, delKernelVersion, getOSTypeList, getKernelVersionList, submitOSType, submitKernelVersion } from '../service';
import OSTypeConfigList from './KernelVersion'; 
import VersionConfigList from './KernelConfig'; 

const KernelVersionConfigList = () => {
  const actionRef = useRef();
  const refNetListTable = useRef();
  const intl = useIntl();
  const [dataostype, setDataOsType] = useState([]);
  const [dataoptionlist, setDataOptionList] = useState([]);
  
  const callback = (count) => {
    const dr = [{label: count[0].os_type, value: count[0].os_type}];
    setDataOsType(dr)
  }

  useEffect(()=>{
    DataOptionList();
  },[]);

  const DataOptionList = async ()=>{
      const {data} = await getOSTypeList();
      let arr = [];
      if(data?.length > 0){
          data.forEach((i)=>{
              arr.push({label: i.os_type,value: i.os_type})
          })
      }
      setDataOptionList({arr:arr});
  }

  return (
    <PageContainer>
      <OSTypeConfigList parentCallback={callback} ref={refNetListTable} />
      <br/>
      <VersionConfigList OSTypedata={dataostype} ref={refNetListTable} data={dataoptionlist.arr} />
    </PageContainer>
  );
};

export default KernelVersionConfigList; 
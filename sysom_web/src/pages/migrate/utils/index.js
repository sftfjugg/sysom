const getUrlParams = (paraName) => {
  const url = decodeURI(document.location.toString());
  const arrObj = url.split("?");
  if (arrObj.length > 1) {
    const arrPara = arrObj[1].split("&");
    let arr;
    for (let i = 0; i < arrPara.length; i++) {
      arr = arrPara[i].split("=");
      if (arr != null && arr[0] == paraName) {
        return arr[1];
      }
    }
    return null;
  } else {
    return "";
  }
};

const assessColumns = (name,data,width) => {
  return {
    title: name,
    dataIndex: data,
    width: width?width:'',
    filters: true,
    onFilter: true,
    valueEnum: {
      less: {
        text: <span style={{fontSize: 13}}>缺失</span>,
        status: false,
      },
      diff: {
        text: <span style={{fontSize: 13}}>差异（需人工检查）</span>,
        status: false,
      },
      same: {
        text: <span style={{fontSize: 13}}>相同</span>,
        status: false,
      },
      more: {
        text: <span style={{fontSize: 13}}>新增</span>,
        status: false,
      },
      compatible: {
        text: <span style={{fontSize: 13}}>兼容</span>,
        status: false,
      },
      incompatible: {
        text: <span style={{fontSize: 13}}>不兼容</span>,
        status: false,
      },
    },
    render: ((_,record)=>{
      switch (record && record.result){
          case 'diff':
            return (
              <div style={{fontSize: 13, display:'flex',alignItems:'center'}}>
                <i style={{background: '#D89614',height: '6px',width:'6px',borderRadius:'3px',marginRight:'7px'}}></i>
                <span>差异</span>
              </div>
            );
          case 'less':
            return (
              <div style={{fontSize: 13, display:'flex',alignItems:'center'}}>
                <i style={{background: '#A61D24',height: '6px',width:'6px',borderRadius:'3px',marginRight:'7px'}}></i>
                <span>缺失</span>
              </div>
            );
          case 'more':
            return (
              <div style={{fontSize: 13, display:'flex',alignItems:'center'}}>
                <i style={{background: '#177DDC',height: '6px',width:'6px',borderRadius:'3px',marginRight:'7px'}}></i>
                <span>新增</span>
              </div>
            );
          case 'same':
            return (
              <div style={{fontSize: 13, display:'flex',alignItems:'center'}}>
                <i style={{background: '#49AA19',height: '6px',width:'6px',borderRadius:'3px',marginRight:'7px'}}></i>
                <span>相同</span>
              </div>
            );
          case 'compatible':
            return (
              <div style={{fontSize: 13, display:'flex',alignItems:'center'}}>
                <i style={{background: '#49AA19',height: '6px',width:'6px',borderRadius:'3px',marginRight:'7px'}}></i>
                <span>兼容</span>
              </div>
            );
          case 'incompatible':
            return (
              <div style={{fontSize: 13, display:'flex',alignItems:'center'}}>
                <i style={{background: '#A61D24',height: '6px',width:'6px',borderRadius:'3px',marginRight:'7px'}}></i>
                <span>不兼容</span>
              </div>
            );
          default: return record.result;
      }
    }),
  }
}

const SYS_CONFIG_TYPE = {
  os_env: '环境变量',
  os_service: '系统服务',
  os_syscmd: '系统命令',
  kolist: '内核模块',
  kconfig: '内核静态配置',
  kcmdline: '内核启动参数',
  kparams: '内核动态配置',
  kabi: 'KABI',
  ksyscall: '系统调用',
}

const HARDWARE_TYPE = {
  Manufacturer: '生产商',
  'Product Name': '产品名',
  Version: '版本号',
  'Serial Number': '串号',
  Architecture: 'CPU架构',
  'Model name': 'CPU型号',
}

export {getUrlParams,assessColumns,SYS_CONFIG_TYPE,HARDWARE_TYPE}

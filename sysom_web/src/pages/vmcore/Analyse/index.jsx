import WebConsole from '@/components/WebConsole';

const VmcoreAnalyse = (props) => {
  const userId = localStorage.getItem('userId');
  console.log(props)
  return (
    <WebConsole title='Vmcore在线分析' host_ip={props.match.params.ip}  user_id={userId} />
  )
};

export default VmcoreAnalyse

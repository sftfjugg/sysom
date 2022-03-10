import WebConsole from '@/components/WebConsole';

const VmcoreAnalyse = (props) => {
  const userId = localStorage.getItem('userId');
  return (
    <WebConsole title='Vmcore在线分析' kernel_version={props.location.query.kernel_version} vmcore_file = {props.location.query.vmcore_file}  user_id={userId} />
  )
};

export default VmcoreAnalyse

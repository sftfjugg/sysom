import WebConsole from '@/components/WebConsole';

const Terminal = (props) => {
  const userId = localStorage.getItem('userId');
  return (
    <WebConsole title='在线终端' host_ip={props.match.params.ip}  user_id={userId} />
  )
};

export default Terminal

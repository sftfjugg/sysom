import WebConsole from '@/pages/host/components/WebConsole'

const VmcoreAnalyse = (props) => {
  const userId = localStorage.getItem('userId');
  return (
    <>
      <WebConsole id={props.match.params.id}  user_id={userId}  />
    </>
  )
};

export default VmcoreAnalyse

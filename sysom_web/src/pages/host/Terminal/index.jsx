import WebConsole from '@/pages/host/components/WebConsole'

const Terminal = (props) => {
  const userId = localStorage.getItem('userId');
  return (
    <>
      <WebConsole id={props.match.params.id}  user_id={userId} />
    </>
  )
};

export default Terminal

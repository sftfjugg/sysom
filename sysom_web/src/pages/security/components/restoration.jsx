import { Button, message  } from "antd";

const  restoration=(param)=> {
    // console.log(param)
  return (
    <div>
       <Button  type="primary"  key="primary"  onClick={param.paren}>历史修复</Button>
    </div>
  );
}

export default restoration;

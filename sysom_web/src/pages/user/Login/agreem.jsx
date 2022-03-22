import React,{useState} from 'react';
import  {Button,Modal,Card} from 'antd'
import './index.less';
function agreem() {
    const [isModalVisible, setIsModalVisible] = useState(false);

    const showModal = () => {
      setIsModalVisible(true);
    };
  
   
  
    const handleCancel = () => {
      setIsModalVisible(false);
    };
  return (
    <div>
      <div className="none">
      我已仔细阅读并同意
         <Button type="link" size={'small'} onClick={showModal}>
        《最终用户许可协议》
      </Button>
      </div>
      <Modal  visible={isModalVisible}  onCancel={handleCancel}  footer={null} width={1000} height={20}>
          <Card className="Popup-crad" > 

         </Card>


      </Modal>

    </div>
  );
}

export default agreem;

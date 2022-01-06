import { PageContainer } from '@ant-design/pro-layout';
import ProCard from '@ant-design/pro-card';
import VmcoreTableList from '../components/VmcoreTableList';
import VmcoreCard from '../components/VmcoreCard';
import { getVmcore } from "../service";

const { Divider } = ProCard;

const VmcoreList = () => {
  return (
    <PageContainer>
      <VmcoreCard />
      <Divider />
      <VmcoreTableList headerTitle="宕机列表" search={true} request={getVmcore} />
    </PageContainer>
  );
};

export default VmcoreList;

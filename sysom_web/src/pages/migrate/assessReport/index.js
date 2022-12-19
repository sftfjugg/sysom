import React, {useState} from 'react';
import ProCard from '@ant-design/pro-card';
import "./index.less";
import Wrapper from './containers';
import NodeList from './components/NodeList';
import AssessTabs from './components/AssessTabs';

const {Divider} = ProCard;

const report = (props) => {
  const [collapsed, setCollapsed] = useState(false);
  const id = props.match.params.id;

  return (
    <div className="assess_container">
      <Wrapper>
        <ProCard ghost gutter={0}>
          <ProCard
            hoverable
            colSpan="25px"
            bodyStyle={{ padding: '5px', textAlign: "center" }}
            onClick={()=>{setCollapsed(!collapsed)}}
          >
            {collapsed ?
              <span>&gt;&gt;<br />展<br />开</span>
              : <span>&lt;&lt;<br />折<br />叠</span>
            }
          </ProCard>
          <ProCard colSpan={collapsed ? 0 : 5} ghost direction="column">
            <NodeList id={id}/>
          </ProCard>
          <Divider />
          <ProCard colSpan={collapsed ? 23 : 18} ghost direction='column'>
            <AssessTabs />
          </ProCard>
        </ProCard>
      </Wrapper>
    </div>
  );
}

export default report;

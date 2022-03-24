import { Row, Col, Statistic } from 'antd';
import { useState } from 'react';
import RcResizeObserver from 'rc-resize-observer';
import PieCharts from '../../components/PieCharts'
import ProCard from '@ant-design/pro-card';

export default (props) => {
  const [responsive, setResponsive] = useState(false);

  const dataRVsDTask = [
    {
      type: "Uninterrupt Task",
      value: props.data.result["uninterrupt load"].length
    }, {
      type: "Running Task",
      value: props.data.result["running load"].length
    }
  ];

  const dataRunningTask = props.data.result["running load"].map(item => ({
    type: item.task,
    value: item.weight
  }))

  var dataUninterruptTask = props.data.result["uninterrupt load"].map(item => ({
    type: item.task,
    value: item.weight
  }))

/* Testing Data
  dataUninterruptTask = [{
    type: 'processA',
    value: 100,
    stack: "load_calc_func+0x57/0x130\nkthread+0xf5/0x130\nret_from_fork+0x1f/0x30\n"
  }, {
    type: 'proccessB',
    value: 100,
    stack: "load_calc_func+0x57/0x130\nkthread+0xf5/0x130\nret_from_fork+0x1f/0x30\n"
  }]
  */

  const customTooltips = (title, items) => {

    if (items.length) {
      return (
        <>
          <h5 style={{ marginTop: 16, color: items[0].color }}>{`任务 ${items[0].name} 的调用栈:`}</h5>
          <p
            style={{ whiteSpace: "pre-line", lineHeight: "16px", marginBottom: 16 }}
            className="g2-tooltip-list-item-value">
            {items[0].data.stack}
          </p>
        </>
      );
    }
  }

  return (
    <RcResizeObserver
      key="resize-observer"
      onResize={(offset) => {
        setResponsive(offset.width < 596);
      }}
    >
      <Row>
        <Col span={8}>
          <PieCharts data={dataRVsDTask} title="R/D状态进程数量" />
        </Col>
        <Col span={8}>
          {dataUninterruptTask.length == 0 ?
            <ProCard title="D状态负载影响度" layout="center" style={{ height: "100%" }}>
              <Statistic value={"系统目前健康，无D状态进程"} valueStyle={{ color: "green" }} />
            </ProCard>
            : <PieCharts data={dataUninterruptTask} customTooltips={customTooltips} title="D状态负载影响度" />
          }

        </Col>
        <Col span={8}>
          <PieCharts data={dataRunningTask} title="R状态负载影响度" />
        </Col>
      </Row>
    </RcResizeObserver>
  );
}
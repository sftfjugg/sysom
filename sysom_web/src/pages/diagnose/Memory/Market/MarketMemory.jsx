import { Row, Col } from 'antd';
import { useState } from 'react';
import RcResizeObserver from 'rc-resize-observer';
import PieCharts from '../../components/PieCharts'

export default (props) => {
  const [responsive, setResponsive] = useState(false);
  return (
    <RcResizeObserver
      key="resize-observer"
      onResize={(offset) => {
        setResponsive(offset.width < 596);
      }}
    >
      <Row>
        <Col span={8}>
          <PieCharts data={props.memgraph} title="内存总览" />
        </Col>
        <Col span={8}>
          <PieCharts data={props.kernel} title="内核内存" />
        </Col>
        <Col span={8}>
          <PieCharts data={props.user} title="用户态内存" />
        </Col>
      </Row>
    </RcResizeObserver>
  );
}
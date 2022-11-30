import React, { useRef, useState, useEffect } from 'react';
import { Row, Col } from "antd";
// import { connect } from 'dva';
import "./index.less";
import Wrapper from './containers';
import Banner from './components/Banner';
import Nodes from './components/Nodes';
import Message from './components/Message';
import AllMoveModel from './components/AllMove';

const migrate = (props) => {
  
  return (
    <div className="container">
      <Wrapper>
        <Row gutter={[16, 16]}>
          <Col span={8}>
            <Row gutter={[16, 16]} style={{ marginBottom: 15 }}>
              <Col span={24}>
                <Banner />
              </Col>
            </Row>
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Nodes />
              </Col>
            </Row>
          </Col>
          <Col span={16} style={{ overflow: 'auto' }}>
            <Message />
          </Col>
        </Row>
        <AllMoveModel />
      </Wrapper>
    </div>
  );
}

export default migrate;

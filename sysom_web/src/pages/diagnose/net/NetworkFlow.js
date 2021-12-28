import { useState} from 'react';
import { Popover, Modal, Button } from 'antd';
import MetricShow from '../components/MetricShow'
import ProCard from '@ant-design/pro-card';
import { Line } from '@ant-design/charts';

const FlowPopover = (props) => {
    const [isModalVisible, setIsModalVisible] = useState(false);
    const showModal = () => {
        setIsModalVisible(true);
    };
    const handleOk = () => {
        setIsModalVisible(false);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
    };

    const metric = props.data.seq.reduce((metric, item) => {
        metric.push({
            x: item.meta.seq,
            y: item.delays.filter((item) => item.delay === props.tips?.delay)[0].ts
        }); return metric
    }, [])

    const lineChartConfig = {
        data: metric,
        xField: "x",
        yField: "y",

        slider: {
          start: 0,
          end: 1,
        },
      };

    const content = (
        <div>
            <span>Max：{props.tips?.max}</span><br />
            <span>Min：{props.tips?.min}</span><br />
            <span>Avg：{props.tips?.avg} </span><br />
            <a onClick={showModal}>查看详细信息</a>
        </div>
    );
    return (
        <>
            <Popover content={content}>
                {props.children}
            </Popover>
            <Modal title={props.tips.delay + "阶段时延分析"} visible={isModalVisible}
                onOk={handleOk} onCancel={handleCancel}>
                <Line {...lineChartConfig} />
            </Modal>
        </>
    )
}

const NetworkFlow = (props) => {
    const stats = props.data.stat.stage.reduce((stats, item) => {
        stats[item.delay] = item
        return stats
    }, {})

    return (
        <ProCard title="时延分析">
            <svg
                height="600px"
                width="100%"
            >
                <defs >
                    <marker
                        fill="#6699ff"
                        id="arrow"
                        markerHeight="12"
                        markerUnits="strokeWidth"
                        markerWidth="12"
                        orient="auto"
                        refX="6"
                        refY="6"
                        viewBox="0 0 12 12"
                    >
                        <path d="M2,2 L10,6 L2,10 L6,6 L2,2"></path>
                    </marker>
                </defs>
                <text style={{fontSize: 20}} fill="#FFFFFF" x="220" y="60">
                    发送端
                </text>
                <text style={{fontSize: 20}} fill="#FFFFFF" x="920" y="60">
                    接收端
                </text>
                <text style={{fontSize: 20}} fill="#FFFFFF" x="30" y="80">
                    用户态
                </text>
                <text style={{fontSize: 20}} fill="#FFFFFF" x="30" y="220">
                    内核态
                </text>
                <text style={{fontSize: 20}} fill="#FFFFFF" x="30" y="400">
                    MOC
                </text>
                <text style={{fontSize: 20}} fill="#FFFFFF" x="1150" y="80">
                    用户态
                </text>
                <text style={{fontSize: 20}} fill="#FFFFFF" x="1150" y="220">
                    内核态
                </text>
                <text style={{fontSize: 20}} fill="#FFFFFF" x="1150" y="400">
                    MOC
                </text>
                <polyline
                    fill="none"
                    markerEnd="url(#arrow)"
                    points="200,100 200,500 1000,500 1000,160 900,160 900,450 300,450 300,100"
                    stroke="#d9d9d9"
                    strokeWidth="2"
                ></polyline>
                <line
                    stroke="#5F9DCE"
                    strokeDasharray="3 2"
                    strokeWidth="2"
                    x1="100"
                    x2="400"
                    y1="144"
                    y2="144"
                ></line>
                <line
                    stroke="#5F9DCE"
                    strokeDasharray="3 2"
                    strokeWidth="2"
                    x1="100"
                    x2="400"
                    y1="330"
                    y2="330"
                ></line>
                <line
                    stroke="#5F9DCE"
                    strokeDasharray="3 2"
                    strokeWidth="2"
                    x1="100"
                    x2="400"
                    y1="440"
                    y2="440"
                ></line>
                <line
                    stroke="#5F9DCE"
                    strokeDasharray="3 2"
                    strokeWidth="2"
                    x1="1100"
                    x2="800"
                    y1="140"
                    y2="140"
                ></line>
                <line
                    stroke="#5F9DCE"
                    strokeDasharray="3 2"
                    strokeWidth="2"
                    x1="1100"
                    x2="800"
                    y1="330"
                    y2="330"
                ></line>
                <line
                    stroke="#5F9DCE"
                    strokeDasharray="3 2"
                    strokeWidth="2"
                    x1="1100"
                    x2="800"
                    y1="440"
                    y2="440"
                ></line>

                <polyline
                    fill="none"
                    strokeWidth="2"
                    points="200,120 200,240"
                    stroke="#42B236"
                ></polyline>
                <polyline
                    fill="none"
                    strokeWidth="2"
                    points="200,240 200,300"
                    stroke="#42B236"
                ></polyline>
                <polyline
                    fill="none"
                    strokeWidth="2"
                    points="200,300 200,350"
                    stroke="#d9d9d9"
                ></polyline>
                <polyline
                    fill="none"
                    strokeWidth="2"
                    points="200,350 200,420"
                    stroke="#d9d9d9"
                ></polyline>
                <polyline
                    fill="none"
                    strokeWidth="2"
                    points="200,420 200,500 1000,500 1000,420"
                    stroke="#42B236"
                ></polyline>
                <polyline
                    fill="none"
                    strokeWidth="2"
                    points="1000,420 1000,350"
                    stroke="#d9d9d9"
                ></polyline>
                <polyline
                    fill="none"
                    strokeWidth="2"
                    points="1000,350 1000,160 950,160"
                    stroke="#d9d9d9"
                ></polyline>
                <polyline
                    fill="none"
                    strokeWidth="2"
                    points="950,160 900,160 900,280"
                    stroke="#42B236"
                ></polyline>
                <polyline
                    fill="none"
                    strokeWidth="2"
                    points="900,280 900,350"
                    stroke="#d9d9d9"
                ></polyline>
                <polyline
                    fill="none"
                    strokeWidth="2"
                    points="900,350 900,420"
                    stroke="#d9d9d9"
                ></polyline>
                <polyline
                    fill="none"
                    strokeWidth="2"
                    points="900,420 900,450 300,450 300,420"
                    stroke="#42B236"
                ></polyline>
                <polyline
                    fill="none"
                    strokeWidth="2"
                    points="300,420 300,350"
                    stroke="#d9d9d9"
                ></polyline>
                <polyline
                    fill="none"
                    strokeWidth="2"
                    points="300,350 300,280"
                    stroke="#d9d9d9"
                ></polyline>
                <polyline
                    fill="none"
                    strokeWidth="2"
                    points="300,280 300,200"
                    stroke="#42B236"
                ></polyline>
                <polyline
                    fill="none"
                    strokeWidth="2"
                    points="300,200 300,160"
                    stroke="#42B236"
                ></polyline>
                <polyline
                    fill="none"
                    strokeWidth="2"
                    points="300,160 300,120"
                    stroke="#42B236"
                ></polyline>
                <circle
                    fill="#5F9DCE"
                    r="3"
                    stroke="#6699ff"
                    strokeWidth="2"
                    cx="200"
                    cy="120"
                ></circle>
                <circle
                    fill="#5F9DCE"
                    r="3"
                    stroke="#6699ff"
                    strokeWidth="2"
                    cx="200"
                    cy="240"
                ></circle>
                <circle
                    fill="#5F9DCE"
                    r="3"
                    stroke="#6699ff"
                    strokeWidth="2"
                    cx="200"
                    cy="300"
                ></circle>
                <circle
                    fill="#5F9DCE"
                    r="3"
                    stroke="#6699ff"
                    strokeWidth="2"
                    cx="200"
                    cy="350"
                ></circle>
                <circle
                    fill="#5F9DCE"
                    r="3"
                    stroke="#6699ff"
                    strokeWidth="2"
                    cx="200"
                    cy="420"
                ></circle>
                <circle
                    fill="#5F9DCE"
                    r="3"
                    stroke="#6699ff"
                    strokeWidth="2"
                    cx="1000"
                    cy="420"
                ></circle>
                <circle
                    fill="#5F9DCE"
                    r="3"
                    stroke="#6699ff"
                    strokeWidth="2"
                    cx="1000"
                    cy="350"
                ></circle>
                <circle
                    fill="#5F9DCE"
                    r="3"
                    stroke="#6699ff"
                    strokeWidth="2"
                    cx="950"
                    cy="160"
                ></circle>
                <circle
                    fill="#5F9DCE"
                    r="3"
                    stroke="#6699ff"
                    strokeWidth="2"
                    cx="900"
                    cy="280"
                ></circle>
                <circle
                    fill="#5F9DCE"
                    r="3"
                    stroke="#6699ff"
                    strokeWidth="2"
                    cx="900"
                    cy="350"
                ></circle>
                <circle
                    fill="#5F9DCE"
                    r="3"
                    stroke="#6699ff"
                    strokeWidth="2"
                    cx="900"
                    cy="420"
                ></circle>
                <circle
                    fill="#5F9DCE"
                    r="3"
                    stroke="#6699ff"
                    strokeWidth="2"
                    cx="300"
                    cy="420"
                ></circle>
                <circle
                    fill="#5F9DCE"
                    r="3"
                    stroke="#6699ff"
                    strokeWidth="2"
                    cx="300"
                    cy="350"
                ></circle>
                <circle
                    fill="#5F9DCE"
                    r="3"
                    stroke="#6699ff"
                    strokeWidth="2"
                    cx="300"
                    cy="280"
                ></circle>
                <circle
                    fill="#5F9DCE"
                    r="3"
                    stroke="#6699ff"
                    strokeWidth="2"
                    cx="300"
                    cy="200"
                ></circle>
                <circle
                    fill="#5F9DCE"
                    r="3"
                    stroke="#6699ff"
                    strokeWidth="2"
                    cx="300"
                    cy="160"
                ></circle>
                <circle
                    fill="#5F9DCE"
                    r="3"
                    stroke="#6699ff"
                    strokeWidth="2"
                    cx="200"
                    cy="240"
                ></circle>
                <circle
                    fill="#5F9DCE"
                    r="3"
                    stroke="#6699ff"
                    strokeWidth="2"
                    cx="200"
                    cy="300"
                ></circle>
                <circle
                    fill="#5F9DCE"
                    r="3"
                    stroke="#6699ff"
                    strokeWidth="2"
                    cx="200"
                    cy="350"
                ></circle>
                <circle
                    fill="#5F9DCE"
                    r="3"
                    stroke="#6699ff"
                    strokeWidth="2"
                    cx="200"
                    cy="420"
                ></circle>
                <circle
                    fill="#5F9DCE"
                    r="3"
                    stroke="#6699ff"
                    strokeWidth="2"
                    cx="1000"
                    cy="420"
                ></circle>
                <circle
                    fill="#5F9DCE"
                    r="3"
                    stroke="#6699ff"
                    strokeWidth="2"
                    cx="1000"
                    cy="350"

                ></circle>
                <circle
                    fill="#5F9DCE"
                    r="3"
                    stroke="#6699ff"
                    strokeWidth="2"
                    cx="950"
                    cy="160"
                ></circle>
                <circle
                    fill="#5F9DCE"
                    r="3"
                    stroke="#6699ff"
                    strokeWidth="2"
                    cx="900"
                    cy="280"

                ></circle>
                <circle
                    fill="#5F9DCE"
                    r="3"
                    stroke="#6699ff"
                    strokeWidth="2"
                    cx="900"
                    cy="350"
                ></circle>
                <circle
                    fill="#5F9DCE"
                    r="3"
                    stroke="#6699ff"
                    strokeWidth="2"
                    cx="900"
                    cy="420"
                ></circle>
                <circle
                    fill="#5F9DCE"
                    r="3"
                    stroke="#6699ff"
                    strokeWidth="2"
                    cx="300"
                    cy="420"
                ></circle>
                <circle
                    fill="#5F9DCE"
                    r="3"
                    stroke="#6699ff"
                    strokeWidth="2"
                    cx="300"
                    cy="350"
                ></circle>
                <circle
                    fill="#5F9DCE"
                    r="3"
                    stroke="#6699ff"
                    strokeWidth="2"
                    cx="300"
                    cy="280"
                ></circle>
                <circle
                    fill="#5F9DCE"
                    r="3"
                    stroke="#6699ff"
                    strokeWidth="2"
                    cx="300"
                    cy="200"
                ></circle>
                <circle
                    fill="#5F9DCE"
                    r="3"
                    stroke="#6699ff"
                    strokeWidth="2"
                    cx="300"
                    cy="160"

                ></circle>
                <circle
                    fill="#5F9DCE"
                    r="3"
                    stroke="#6699ff"
                    strokeWidth="2"
                    cx="300"
                    cy="120"
                ></circle>
                <FlowPopover tips={stats.l_tx_kern} data={props.data}>
                    <text
                        style={{ fontSize: 14 }}
                        fill="#FFFFFF"
                        x="130"
                        y="180"
                    >
                        内核驻留
                    </text>
                </FlowPopover>
                <FlowPopover tips={stats.l_tx_qdisc} data={props.data}>
                    <text
                        style={{ fontSize: 14 }}
                        fill="#FFFFFF"
                        x="130"
                        y="270"
                    >
                        qdisc排队
                    </text>
                </FlowPopover>
                <text
                    style={{ fontSize: 14 }}
                    fill="#FFFFFF"
                    x="110"
                    y="325"
                >
                    virtio ring驻留
                </text>

                <text
                    style={{ fontSize: 14 }}
                    fill="#FFFFFF"
                    x="120"
                    y="385"
                >
                    moc卡驻留
                </text>
                <FlowPopover tips={stats.l_tx_outlink} data={props.data}>
                    <text
                        style={{ fontSize: 14 }}
                        fill="#FFFFFF"
                        x="600"
                        y="520"
                    >
                        外部链路
                    </text>
                </FlowPopover>
                <text
                    style={{ fontSize: 14 }}
                    fill="#FFFFFF"
                    x="1010"
                    y="385"
                >
                    moc卡驻留
                </text>

                <text
                    style={{ fontSize: 14 }}
                    fill="#FFFFFF"
                    x="1010"
                    y="230"
                >
                    virtio ring及内核驻留
                </text>
                <FlowPopover tips={stats.r_tx_kern} data={props.data}>
                    <text
                        style={{ fontSize: 14 }}
                        fill="#FFFFFF"
                        x="820"
                        y="215"
                    >
                        内核驻留
                    </text>
                </FlowPopover>
                <text
                    style={{ fontSize: 14 }}
                    fill="#FFFFFF"
                    x="800"
                    y="315"
                >
                    virtio ring驻留
                </text>

                <text
                    style={{ fontSize: 14 }}
                    fill="#FFFFFF"
                    x="820"
                    y="385"
                >
                    moc卡驻留
                </text>
                <FlowPopover tips={stats.l_rx_inlink} data={props.data}>
                    <text
                        style={{ fontSize: 14 }}
                        fill="#FFFFFF"
                        x="600"
                        y="440"
                    >
                        外部链路
                    </text>
                </FlowPopover>
                <text
                    style={{ fontSize: 14 }}
                    fill="#FFFFFF"
                    x="310"
                    y="385"
                >
                    moc卡驻留
                </text>

                <text
                    style={{ fontSize: 14 }}
                    fill="#FFFFFF"
                    x="310"
                    y="315"
                >
                    virtio ring驻留
                </text>

                <FlowPopover tips={stats.l_rx_kern} data={props.data}>
                    <text
                        style={{ fontSize: 14 }}
                        fill="#FFFFFF"
                        x="310"
                        y="240"
                    >
                        内核驻留
                    </text>
                </FlowPopover>
                <FlowPopover tips={stats.l_rx_task_waking} data={props.data}>
                    <text
                        style={{ fontSize: 14 }}
                        fill="#FFFFFF"
                        x="310"
                        y="180"
                    >
                        进程唤醒
                    </text>
                </FlowPopover>
                <FlowPopover tips={stats.l_rx_task_queue} data={props.data}>
                    <text
                        style={{ fontSize: 14 }}
                        fill="#FFFFFF"
                        x="310"
                        y="140"
                    >
                        进程排队
                    </text>
                </FlowPopover>
            </svg>
        </ProCard>
    )
}

export default NetworkFlow;
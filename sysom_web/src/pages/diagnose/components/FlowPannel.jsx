import { Graph } from '@antv/x6'
import '@antv/x6-react-shape'
import React, { useEffect } from 'react'
import ProCard from '@ant-design/pro-card'
import { Empty, Typography, Tooltip } from 'antd';
import styles from './FlowPannel.less'

const { Text } = Typography;

class FlowNode extends React.Component {
    shouldComponentUpdate() {
        const node = this.props.node
        if (node) {
            if (node.hasChanged()) {
                return true
            }
        }
        return false
    }

    componentDidMount() {
        const node = this.props.node
        node.resize(this.wrapper.offsetWidth, this.wrapper.offsetHeight)
    }
    setWrapperRef = el => {
        this.wrapper = el;
    };

    render() {
        return (
            <div
                ref={this.setWrapperRef}
                className={styles.flowNode}
            >
                <Tooltip title={this.props.node.prop('tips')}>
                    <div className={styles.flowHead}>
                        {this.props.node.prop('id')}
                    </div>
                </Tooltip>
                <div className={`${styles.flowBody} ${this.props.node.prop('level') == "Error" ? styles.Error
                    : this.props.node.prop('level') == "Warning" ? styles.Warning : styles.Info}`}
                >
                    <div className={styles.flowContentTitle}>
                        {this.props.node.prop('value')}
                    </div>
                    <div className={styles.flowContent}>
                        {this.props.node.prop('text')}
                    </div>
                </div>
            </div>
        )
    }
}

Graph.registerNode('flow-node', {
    inherit: 'react-shape',
    component: <FlowNode />
})


const FlowPannelPannel = (props) => {
    const ref = React.useRef(null)
    const configs = props.configs
    const datas = props.datas
    const showModalPannel = props.showModalPannel
    const data = props.data
    let graph = null

    useEffect(() => {
        if (data && configs.flowconfigs) {
            graph = new Graph({
                container: ref.current,
                height: 400,
                autoResize: true,
            });

            //提供简单的左右布局和网格布局。 antv的布局类在这里使用不方便。 因此，我们的NODE节点是宽度和高度自适应的， 
            //但是antv的布局引擎需要宽度和高度已知的情况下才能进行布局。
            graph.on("resize", (size) => {
                if (ref.current) {
   
                    const nodes = graph.getNodes();
                    const viewWidth = ref.current.clientWidth;

                    if (configs.flowconfigs?.layout?.type === "linear") {
                        const nodesTotalWidth = nodes.reduce((totalWidth, node) => totalWidth + node.size().width, 0);
                        const margin = Math.max((viewWidth - nodesTotalWidth) / (nodes.length + 1), 24);

                        nodes.reduce((x, node) => {
                            node.position(x, node.position().y);
                            return x + node.size().width + margin;
                        }, margin);

                    } else if (configs.flowconfigs?.layout?.type === "grid") {
                        const gridWidth = viewWidth / (configs.flowconfigs?.layout?.cols || 1)
                        const gridHeights = nodes.reduce((gridHeights, node) => {
                            const row = node.prop("row") || 0;
                            gridHeights[row] = Math.max((gridHeights[row] || 0), node.size().height) + 16; //margin
                            return gridHeights;
                        }, []);
                        nodes.forEach((node) => {
                            const x = (node.prop("col") || 0) * gridWidth + (gridWidth - node.size().width) / 2;
                            const rowHeight  = gridHeights[node.prop("row") || 0];
                            const y = (node.prop("row") || 0) * rowHeight + (rowHeight - node.size().height) / 2;
                            node.position(x, y);
                        })
                    }
                    //根据调整后的内容， 调整画布高度
                    graph.fitToContent()
                }
            })

            graph.on('node:click', ({ e, x, y, node, view }) => {
                console.log("node:click")
                if (configs?.links?.defalut?.pannel)
                    showModalPannel(configs.links.defalut.pannel, node.data)
            })

            configs.flowconfigs.nodes = configs.flowconfigs.nodes.map(node => {
                const nodeData = data?.find((i) => i.key == node.id)
                return { ...node, ...nodeData, shape: 'flow-node', data: nodeData }
            })
            data && graph.fromJSON(configs.flowconfigs)
        }

    }, [configs.flowconfigs, data])

    return (
        <ProCard title={configs.title} style={{ marginTop: 16 }} bordered collapsible>
            {
                data ?
                    <div style={{ display: "flex" }}>
                        <div ref={ref} style={{ flex: 1 }}></div>
                    </div>
                    : <Empty style={{ marginBottom: 20 }} image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={
                            <div>Datasource  <Text type="danger"> {configs?.datasource} </Text> no data</div>
                        } />
            }
            {
                !configs.flowconfigs && <Empty style={{ marginBottom: 20 }} image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                        <div>flowconfigs missing</div>
                    } />
            }
        </ProCard>
    )
}

export default FlowPannelPannel
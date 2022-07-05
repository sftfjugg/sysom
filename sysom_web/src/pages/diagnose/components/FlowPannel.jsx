import { Graph, Shape } from '@antv/x6'
import React, { useEffect } from 'react'
import ProCard from '@ant-design/pro-card'
import _, { find } from "lodash";

const FlowPannelPannel = (props) => {
    const ref = React.useRef(null)
    const configs = props.configs
    const datas = props.datas
    const showModalPannel = props.showModalPannel
    const data = props.data
    let graph = null

    useEffect(() => {
        if (!graph) {
            graph = new Graph({
                container: ref.current,
                width: 800,
                height: 400,
                connecting: {
                    router: {
                        name: 'manhattan',
                        args: {
                            padding: 1,
                        },
                    },
                    connector: {
                        name: 'rounded',
                        args: {
                            radius: 8,
                        },
                    },
                    anchor: 'center',
                    //connectionPoint: 'anchor',
                    allowBlank: false,
                    snap: {
                        radius: 20,
                    },

                },
            });
        }

        Shape.Rect.config(
            {
                width: 220,
                height: 60,
                attrs: {
                    body: {
                        stroke: '#5F95FF',
                        strokeWidth: 1,
                        fill: 'rgba(95,149,255,0.05)',
                        cursor: 'pointer',
                        refWidth: 1,
                        refHeight: 1,
                    },
                    image: {
                        'xlink:href':
                            'https://gw.alipayobjects.com/zos/antfincdn/FLrTNDvlna/antv.png',
                        width: 16,
                        height: 16,
                        x: 12,
                        y: 12,
                    },
                    title: {
                        text: 'Node',
                        refX: 40,
                        refY: 14,
                        fill: '#FFFFFF',
                        fontSize: 12,
                        'text-anchor': 'start',
                    },
                    value: {
                        text: '',
                        refX: '100%',
                        x: -10, 
                        refY: 14,
                        fill: '#FFFFFF',
                        fontSize: 12,
                        'text-anchor': 'end',
                    },
                    text: {
                        text: '',
                        refX: '50%',
                        refY: 48,
                        fontSize: 12,
                        fill: '#FFFFFF',
                        'text-anchor': 'middle',
                    },
                },
                markup: [
                    {
                        tagName: 'rect',
                        selector: 'body',
                    },
                    {
                        tagName: 'image',
                        selector: 'image',
                    },
                    {
                        tagName: 'text',
                        selector: 'title',
                    },
                    {
                        tagName: 'text',
                        selector: 'value',
                    },
                    {
                        tagName: 'text',
                        selector: 'text',
                    },
                ],

                ports: {
                    items: [
                        { group: 'top', id: 'top' },
                        { group: 'right', id: 'right' },
                        { group: 'bottom', id: 'bottom' },
                        { group: 'left', id: 'left' },
                    ],
                    groups: {
                        top: {
                            position: { name: 'top' },
                            attrs: {
                                circle: {
                                    r: 4,
                                    magnet: true,
                                    stroke: '#31d0c6',
                                    strokeWidth: 2,
                                    fill: '#fff',
                                    style: { visibility: 'hidden' },
                                },
                            },
                            zIndex: 10,
                        },
                        right: {
                            position: { name: 'right' },
                            attrs: {
                                circle: {
                                    r: 4,
                                    magnet: true,
                                    stroke: '#31d0c6',
                                    strokeWidth: 2,
                                    fill: '#fff',
                                    style: { visibility: 'hidden' },
                                },
                            },
                            zIndex: 10,
                        },
                        bottom: {
                            position: { name: 'bottom' },
                            attrs: {
                                circle: {
                                    r: 4,
                                    magnet: true,
                                    stroke: '#31d0c6',
                                    strokeWidth: 2,
                                    fill: '#fff',
                                    style: { visibility: 'hidden' },
                                },
                            },
                            zIndex: 10,
                        },
                        left: {
                            position: { name: 'left' },
                            attrs: {
                                circle: {
                                    r: 4,
                                    magnet: true,
                                    stroke: '#31d0c6',
                                    strokeWidth: 2,
                                    fill: '#fff',
                                    style: { visibility: 'hidden' },
                                },
                            },
                            zIndex: 10,
                        },
                    },
                },

                propHooks(metadata) {
                    const { value, title, text, ...others } = metadata
                    if (title) {
                        _.set(others, 'attrs.title.text', title);
                    }
                    if (value) {
                        _.set(others, 'attrs.value.text', value);
                    }
                    if (text) {
                        _.set(others, 'attrs.text.text', text);
                    }
                    return others
                }
            }
        )
        graph.on('node:click', ({ e, x, y, node, view }) => {
            if (configs?.links?.defalut?.pannel)
                showModalPannel(configs.links.defalut.pannel, node.data)
        })
    }, [configs.flowconfigs])

    useEffect(() => {
        configs.flowconfigs.nodes = configs.flowconfigs.nodes.map(node => {
            const nodeData = data.find((i) => i.key == node.id)
            return { ...node, ...nodeData, data: nodeData }
        })
        graph.fromJSON(configs.flowconfigs)
    }, [configs.flowconfigs, data])

    return (
        <ProCard title={configs.title} style={{ marginTop: 16 }} bordered collapsible>
            <div ref={ref}></div>
        </ProCard>
    )
}

export default FlowPannelPannel
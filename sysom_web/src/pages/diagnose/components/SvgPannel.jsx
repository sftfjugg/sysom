import ProCard from '@ant-design/pro-card';
import React  from 'react';
import ReactDOM from 'react-dom'

class SmartIFrame extends React.Component {
    render() {
        return <iframe src={this.props.src}
            scrolling="no"
            frameBorder={0}

            onLoad={e => setTimeout(() => {
                const obj = ReactDOM.findDOMNode(this);
                obj.style.height = obj.contentWindow.document.body.scrollHeight + 'px';
                obj.style.width = obj.contentWindow.document.body.scrollWidth + 'px';
            }, 50)} />
    }
}

const SvgPannel = (props) => {
    const configs = props.configs
    const data = props.data
    return (
        data[0]?.value?
        <ProCard  style={{ marginTop: 16 }} title={configs.title} layout="center" bordered collapsible>
            <div style={{ textAlign: 'center', width: '100%' }}>
                <SmartIFrame src={data[0]?.value} />
            </div>
        </ProCard>
        :<div></div>
    )
}

export default SvgPannel
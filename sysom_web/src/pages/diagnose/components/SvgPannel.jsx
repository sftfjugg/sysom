import ProCard from '@ant-design/pro-card';
import React, {useState, useEffect}  from 'react';

const SvgPannel = (props) => {
    const configs = props.configs;
    const data = props.data;
    const [imgSize, setImgSize] = useState({
        "width": 0,
        "height": 0
    });
    let base64_encoded_svg = "";
    if (!!data && data.length > 0 && !!data[0].value) {
        let svg_text = data[0].value
        base64_encoded_svg = `data:image/svg+xml;base64,${Buffer.from(svg_text.trim()).toString("base64")}`
        useEffect(() => {
            // Use one Image to get the width/height of svg
            let img = new Image();
            img.src = base64_encoded_svg;
            img.onload = () => {
                setImgSize({
                    width: img.width,
                    height: img.height
                })
            }
        }, []);
    }
    const {
        width,
        height
    } = imgSize
    return (
        data[0]?.value?
        <ProCard  style={{ marginTop: 16 }} title={configs.title} layout="center" bordered collapsible>
            <div style={{ textAlign: 'center', width: '100%' }}>
                <iframe src={base64_encoded_svg} width={width} height={height}/>
            </div>
        </ProCard>
        :<div></div>
    )
}

export default SvgPannel
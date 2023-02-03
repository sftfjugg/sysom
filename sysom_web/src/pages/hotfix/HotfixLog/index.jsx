import { getHotfixLog } from '../service';
import { useState, useEffect } from 'react';

import './index.less'

const HotfixLog = (props) => {
    const [data, setData] = useState();
    const hotFixID = props.match.params.id

    useEffect(() => {
        getHotfixLog(hotFixID).then(res => {
           setData(res.data)
        })
    }, [])

    return (
    <div className='HotfixLog'>
        {data}
    </div>
    );
};

export default HotfixLog
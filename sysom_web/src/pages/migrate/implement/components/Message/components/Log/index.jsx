import React, { useContext } from 'react';
import { Skeleton, Empty } from 'antd';
import { WrapperContext } from '../../../../containers';
import './index.less';

export default (props) => {
  const {data} = props;
  const {
    state: { machineDetailLoading },
  } = useContext(WrapperContext);
  return (
    <div className='log-container'>
      <Skeleton loading={machineDetailLoading}>
        {data ? (
          <pre style={{ color: 'rgba(255,255,255,0.65)' }}>{data}</pre>
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ marginTop: 100 }} />
        )}
      </Skeleton>
    </div>
  );
};

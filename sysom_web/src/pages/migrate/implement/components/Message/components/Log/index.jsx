import React, { useContext } from 'react';
import { Skeleton, Empty } from 'antd';
import { WrapperContext } from '../../../../containers';

export default () => {
  const {
    state: { machineDetailLoading, logtMessage },
  } = useContext(WrapperContext);
  return (
    <div style={{ height: 'calc(100vh - 48px)', overflow: 'scroll' }}>
      <Skeleton loading={machineDetailLoading}>
        {logtMessage ? (
          <pre style={{ color: 'rgba(255,255,255,0.65)' }}>{logtMessage}</pre>
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ marginTop: 100 }} />
        )}
      </Skeleton>
    </div>
  );
};

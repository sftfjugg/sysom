import * as types from './constants';

// 全量数据变化的处理逻辑 reducer函数
export default (state, { type, payload }) => {
  switch (type) {
    case types.SET_DATA:
      return {
        ...state,
        ...payload,
      };
    default:
      return state;
  }
};

// store.ts
export default {
    //有多个文件时命名空间不能重复
    namespace: 'store',
    //state中保存状态
    state: {
      male: 20,
      female: [],
      count: 0
    },
    //reducers对比vuex的mutations，用于同步修改
    reducers: {
      addMale(state: { [propName: string]: any }, action: { [propName: string]: any }) {
        //注意：state.male必须通过这种方式修改，通过push方式会导致页面不更新
        state.male = action.payload;
        // state.count++
        return { ...state }
      },
      addFemale(state: { [propName: string]: any }, action: { [propName: string]: any }) {
        state.female = [...state.female, action.payload]
        state.count++
        return { ...state }
      },
    }
  }
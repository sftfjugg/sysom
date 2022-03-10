import { PageLoading } from '@ant-design/pro-layout';
import { history } from 'umi';
import { extend } from 'umi-request';
import RightContent from '@/components/RightContent';
import Footer from '@/components/Footer';
import { currentUser as queryCurrentUser } from './pages/user/Login/service';
import { message } from 'antd';
const loginPath = '/user/login';

const errorHandler = function(error) {
  if (error.response) {
    if (typeof(error.data.message) == "object"){
      message.error(Object.values(error.data.message))
    }
    else {
      message.error(error.data.message);
    }
  } else {
    message.error(error.message);
  }
  throw error;
};

export const request = {
  errorHandler,
}

/** 获取用户信息比较慢的时候会展示一个 loading */
export const initialStateConfig = {
  loading: <PageLoading />,
};
/**
 * @see  https://umijs.org/zh-CN/plugins/plugin-initial-state
 * */

export async function getInitialState() {
  const fetchUserInfo = async (userId, token) => {
    try {
      const msg = await queryCurrentUser(userId, token);
      if (msg.code === 400) {
        history.push(loginPath);
        return undefined;
      }
      const userInfo = {avatar: 'https://gw.alipayobjects.com/zos/antfincdn/XAosXuNZyF/BiazfanxmamNRoxxVxka.png', ...msg.data};
      return userInfo;
    } catch (error) {
      history.push(loginPath);
    }

    return undefined;
  }; // 如果是登录页面，不执行

  if (history.location.pathname !== loginPath) {
    const userId = localStorage.getItem('userId');
    const token = localStorage.getItem('token');
    const currentUser = await fetchUserInfo(userId, token);
    return {
      fetchUserInfo,
      currentUser,
      settings: {},
    };
  }

  return {
    fetchUserInfo,
    settings: {},
  };
} // ProLayout 支持的api https://procomponents.ant.design/components/layout

export const layout = ({ initialState }) => {
  return {
    rightContentRender: () => <RightContent />,
    disableContentMargin: false,
    waterMarkProps: {
      content: initialState?.currentUser?.username,
    },
    footerRender: () => <Footer />,
    onPageChange: () => {
      const { location } = history; // 如果没有登录，重定向到 login

      if (!initialState?.currentUser && location.pathname !== loginPath) {
        history.push(loginPath);
      }
    },
    menuHeaderRender: undefined,
    ...initialState?.settings,
  };
};

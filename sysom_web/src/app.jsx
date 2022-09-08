import { PageLoading } from '@ant-design/pro-layout';
import { history, addLocale, request as requestURL } from 'umi';
import { extend } from 'umi-request';
import _, { find } from "lodash";
import RightContent from '@/components/RightContent';
import Footer from '@/components/Footer';
import { currentUser as queryCurrentUser } from './pages/user/Login/service';
import { message } from 'antd';
const loginPath = '/user/login';

const errorHandler = function (error) {
  if (error.response) {
    if (typeof (error.data.message) == "object") {
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
      const userInfo = { avatar: 'https://gw.alipayobjects.com/zos/antfincdn/XAosXuNZyF/BiazfanxmamNRoxxVxka.png', ...msg.data };
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


let extraGrafanaRoutes = [];
let extraDiagnoseRoute = [];

function customizer(objValue, srcValue) {
  if (_.isArray(objValue)) {
    return objValue.concat(srcValue);
  }
}

export function patchRoutes({ routes }) {
  //Insert the grafana dashboard item to monitor memu. 
  routes.find((item) => item.path == "/").routes.find((item) => item.name == "monitor")
    .routes.splice(-1, 0, ...extraGrafanaRoutes)

  //Find the array of diagonse's children. ex: io, net, memory
  let diagnose = routes.find((item) => item.path == "/")
    .routes.find(item => item.name == "diagnose")

  // Add forder
  extraDiagnoseRoute.map(item => {
    if (!_.keyBy(diagnose.routes, 'path')[item.path]) {
      // Add forder if not exist
      diagnose.routes = diagnose.routes.concat({
        ...item,
        routes: []
      })
    }
  })

  //Add The extraDiagnoseRoute in it.
  diagnose.routes.map(item => {
    const new_routes = _.keyBy(extraDiagnoseRoute, 'path')[item.path]?.routes
    if (item.routes && new_routes) {
      item.routes = item.routes.concat(new_routes);
    }
    if (!item.routes && new_routes) {
      item.routes = new_routes
    }
  })
}

import grafanaDash from './pages/Monitor/grafana'
import diagnose from './pages/diagnose/diagnose';

export function render(oldRender) {
  //Add Grafana dashboard dynamically
  requestURL('/grafana/api/search')
    .then((res) => {
      //Tranfrom from grafana folder&dashboard list to antd route tree.
      extraGrafanaRoutes = res.filter((i) => i.type == "dash-folder")
        .map((folder) => {
          //Add the title to locales to aviod initl FormattedMessage warning in antd core.
          addLocale('zh-CN', { [`menu.monitor.${folder.title}`]: folder.title })
          return {
            path: `/monitor/${folder.uid}`,
            name: folder.title,
            routes: res.filter((i) => i.type == "dash-db" && i.folderId == folder.id)
              .map((dash) => {
                addLocale('zh-CN', { [`menu.monitor.${folder.title}.${dash.title}`]: dash.title })
                return {
                  name: dash.title,
                  path: `/monitor/${folder.uid}${dash.url}`,
                  component: grafanaDash
                }
              })
          }
        })
      oldRender();
    })
    .catch(err => {
      message.error("Grafana doesn't work!")
    })

  //Add diagnose dashboard dynamically
  requestURL('/resource/diagnose/locales.json').then((res) => {
    addLocale('zh-CN', res.folder)
    addLocale('zh-CN', res.dashboard)
    Object.entries(res.dashboard).map(item => {
      let configPath = item[0].split('.')
      configPath.shift()

      let path = []
      path.push({
        path: `/${configPath.join('/')}`,
        name: configPath.pop(),
        f_: `/${configPath.join('/')}`,
        component: diagnose
      })

      let currentExtraDiagnoseRoute = _.chain(path).groupBy('f_').toPairs()
        .map(Item => _.merge(_.zipObject(["path", "routes"], Item), { "name": Item[0].split('/').pop() }))
        .value();
      let route_item = _.keyBy(extraDiagnoseRoute, 'path')[currentExtraDiagnoseRoute[0].path]
      if (!!route_item) {
        route_item.routes = route_item.routes.concat(currentExtraDiagnoseRoute[0].routes)
      } else {
        extraDiagnoseRoute = extraDiagnoseRoute.concat(currentExtraDiagnoseRoute)
      }
    })
    oldRender();
  })
}

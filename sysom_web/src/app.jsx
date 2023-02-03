import { PageLoading } from '@ant-design/pro-layout';
import { history, addLocale, request as requestURL } from 'umi';
import _ from "lodash";
import RightContent from '@/components/RightContent';
import Footer from '@/components/Footer';
import { currentUser as queryCurrentUser } from './pages/user/Login/service';
import { message } from 'antd';
const loginPath = '/user/login';

const noNeedLoginRoutes = [
  "/user/login",
  "/diagnose/detail"
]

const isNeedLogin = function(path) {
  return !noNeedLoginRoutes.find(item => path.startsWith(item))
}

const errorHandler = function (error) {
  if (error.response) {
    if (typeof (error.data.message) == "object") {
      message.error(Object.values(error.data.message))
    }
    else {
      if (error.data.message) {
        message.error(error.data.message);
      } else if (error.data.msg) {
        message.error(error.data.msg);
      }
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
      if (msg.code !== 200) {
        // history.push(loginPath);
        return undefined;
      }
      const userInfo = { avatar: 'https://gw.alipayobjects.com/zos/antfincdn/XAosXuNZyF/BiazfanxmamNRoxxVxka.png', ...msg.data };
      return userInfo;
    } catch (error) {
      // history.push(loginPath);
    }

    return undefined;
  }; // 如果是登录页面，不执行

  if (isNeedLogin(history.location.pathname)) {
    const userId = localStorage.getItem('userId');
    const token = localStorage.getItem('token');
    if (!token || !userId) {
      history.push(loginPath)
    } else {
      const currentUser = await fetchUserInfo(userId, token);
      return {
        fetchUserInfo,
        currentUser,
        settings: {},
      };
    }
  }
  return {
    fetchUserInfo,
    settings: {},
  };
} // ProLayout 支持的api https://procomponents.ant.design/components/layout

// https://procomponents.ant.design/components/layout/#%E5%92%8C-umi-%E4%B8%80%E8%B5%B7%E4%BD%BF%E7%94%A8
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

      if (!initialState?.currentUser && isNeedLogin(location.pathname)) {
        history.push(loginPath);
      }
    },
    menuHeaderRender: undefined,
    ...initialState?.settings,
  };
};


let extraGrafanaRoutes = [];
let extraDiagnoseRoute = [];
// Saved menu_name -> service_name
// @see menuName => config/routes.js
// @see servierName => /api/v1/services/list
let menuNameMapServiceName = {
  user: "sysom_api",
  welcome: "sysom_api",
  host: "sysom_api",
  journal: "sysom_api",
  monitor: "sysom_monitor",
  vmcore: "sysom_vmcore",
  diagnose: "sysom_diagnosis",
  migtaion: "sysom_migration",
  security: "sysom_vul",
}
let enable_services = [];

function customizer(objValue, srcValue) {
  if (_.isArray(objValue)) {
    return objValue.concat(srcValue);
  }
}

export function patchRoutes({ routes }) {
  //Insert the grafana dashboard item to monitor memu. 
  routes.find((item) => item.path == "/").routes.find((item) => item.name == "monitor")
    .routes.splice(-1, 0, ...extraGrafanaRoutes)

  if (enable_services.length > 0) {
    let rootPath = routes.find((item) => item.path == "/")
    for (let i = 0; i < rootPath.routes.length; i++) {
      if (!!rootPath.routes[i].name && !!menuNameMapServiceName[rootPath.routes[i].name]) {
        if (!enable_services.find(v => v == menuNameMapServiceName[rootPath.routes[i].name])) {
          rootPath.routes[i].disabled = true
          rootPath.routes[i].hideChildrenInMenu = true
        }
      }
    }
  }

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
      return Promise.resolve()
    })
    .catch(err => {
      message.error("Grafana doesn't work!")
      return Promise.resolve()
    })
    .then(() => {
      return requestURL('/resource/diagnose/v1/locales.json')
    })
    .then((res) => {
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
      // Request services list, used to disable not running services
      return requestURL("/api/v1/services/")
    })
    .then(res => {
      if (res.code == 200) {
        for (let i = 0; i < res.data.length; i++) {
          enable_services.push(res.data[i].service_name);
        }
      }
      oldRender();
    })
    .catch(err => {
      console.log(err);
      oldRender();
    })
}

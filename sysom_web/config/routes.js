export default [
  {
    path: '/user',
    layout: false,
    routes: [
      {
        path: '/user',
        routes: [
          {
            name: 'login',
            path: '/user/login',
            component: './user/Login',
          },
        ],
      },
      {
        component: './404',
      },
    ],
  },
  {
    path: '/welcome',
    name: 'welcome',
    layout: false,
    component: './Welcome',
  },
  {
    path: '/host',
    name: 'host',
    component: './Host',
  },
  {
    path: '/monitor',
    name: 'monitor',
    routes: [
      {
        path: '/monitor',
        redirect: '/monitor/dashboard',
      },
      {
        path: 'dashboard',
        name: 'dashboard',
        hideInBreadcrumb:true,
        component: './monitor/SystemDashboard',
      },
      {
        path: 'dashboard/:host?',
        component: './monitor/SystemDashboard',
      },
      {
        component: './404',
      },
    ],
  },
  {
    path: '/vmcore',
    name: 'vmcore',
    routes: [
      {
        path: '/vmcore',
        redirect: '/vmcore/list',
      },
      {
        path: '/vmcore/list',
        name: 'list',
        component: './vmcore/list',
      },
      {
        path: '/vmcore/detail/:id?',
        component: './vmcore/Detail',
      },
      {
        path: '/vmcore/match',
        name: 'match',
        component: './vmcore/match',
      },
      {
        path: '/vmcore/analyse',
        name: 'analyse',
        component: './vmcore/analyse',
      },
    ],
  },
  {
    path: '/diagnose',
    name: 'diagnose',
    routes: [
      {
        path: '/diagnose',
        redirect: '/diagnose/io',
      },
      {
        path: '/diagnose/io',
        name: 'io',
        component: './diagnose/io',
      },
      {
        path: '/diagnose/net',
        name: 'net',
        component: './diagnose/net',
      },
    ],
  },
  {
    path: '/',
    redirect: '/welcome',
  },
  {
    component: './404',
  },
];

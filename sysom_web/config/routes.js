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
    routes: [
      {
        path: '/host',
        redirect: '/host/list',
      },
      {
        path: '/host/list',
        name: 'list',
        component: './host/List',
      },
      {
        path: '/host/terminal/:ip?',
        component: './host/Terminal',
      }
    ],
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
        component: './Monitor/SystemDashboard',
      },
      {
        path: 'dashboard/:host?',
        component: './Monitor/SystemDashboard',
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
        component: './vmcore/List',
      },
      {
        path: '/vmcore/detail/:id?',
        component: './vmcore/Detail',
      },
      {
        path: '/vmcore/match',
        name: 'match',
        component: './vmcore/Match',
      },
      {
        path: '/vmcore/analyse',
        component: './vmcore/Analyse',
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
        component: './diagnose/Io',
      },
      {
        path: '/diagnose/net',
        name: 'net',
        component: './diagnose/Net',
      },
    ],
  },
  {
    path: '/journal',
    name: 'journal',
    routes: [
      {
        path: '/journal',
        redirect: '/journal/audit',
      },
      {
        path: '/journal/audit',
        name: 'audit',
        component: './journal/Audit',
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

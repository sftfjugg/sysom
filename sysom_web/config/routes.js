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
        path: '/host/cluster',
        name: 'cluster',
        component: './host/cluster',
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
        hideInBreadcrumb: true,
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
        redirect: '/diagnose/oscheck',
      },
      {
        path: '/diagnose/oscheck',
        name: 'oscheck',
        component: './diagnose/oscheck',
      },
      {
        path: '/diagnose/cpu',
        name: 'cpu',
        routes: [
          {
            path: '/diagnose/cpu',
            redirect: '/diagnose/cpu/loadtask',
          },
          {
            path: '/diagnose/cpu/loadtask',
            name: 'loadtask',
            component: './diagnose/cpu/loadtask',
          }
        ]
      },
      {
        path: '/diagnose/storage',
        name: 'storage',
        routes: [
          {
            path: '/diagnose/storage',
            redirect: '/diagnose/storage/io',
          },
          {
            path: '/diagnose/storage/io',
            name: 'io',
            component: './diagnose/Storage/Io',
          }
        ]
      },
      {
        path: '/diagnose/net',
        name: 'net',
        routes: [
          {
            path: '/diagnose/net',
            redirect: '/diagnose/net/network',
          },
          {
            path: '/diagnose/net/network',
            name: 'network',
            component: './diagnose/Net/Network',
          }
        ]
      },
      {
        path: '/diagnose/memory',
        name: 'memory',
        routes: [
          {
            path: '/diagnose/memory',
            redirect: '/diagnose/memory/memgraph',
          }
        ]
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
      {
        path: '/journal/task',
        name: 'task',
        component: './journal/Task',
      },
      {
        path: '/journal/alarm',
        name: 'alarm',
        component: './journal/Alarm',
      },
    ],
  },
  {
    path: '/security',
    name: 'security',
    routes: [
      {
        path: '/security',
        redirect: '/security/list',
      },
      {
        path: '/security/list',
        name: 'list',
        component: './security/List',
      },
      {
        path: '/security/homelist/:id?',
        component: './security/Homelist',
      },
      {
        path: '/security/historical',
        component: './security/Historical',
      },
      {
        path: '/security/historicalist/:id?',
        component: './security/Historicalist',
      },
      {
        path: '/security/viewdetails/:id?/:homename?',
        component: './security/Viewdetails',
      },
      {
        path: '/security/setting',
        component: './security/Setting',
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

import { Layout, Carousel, Menu } from 'antd';
import { useIntl } from 'umi';
import AvatarDrop from './../components/RightContent'
import styles from './Welcome.less';

const { SubMenu } = Menu;
const { Header, Content } = Layout;

const imgBanner = [
  {key:1,banner:"#1a2933",title:"主机管理",urls:'/host',des:""},
  {key:2,banner:"#1a2933",title:"宕机分析",urls:'/vmcore',des:""},
  {key:4,banner:"#1a2933",title:"监控中心",urls:'/monitor',des:""},
  {key:3,banner:"#1a2933",title:"诊断中心",urls:'/diagnose',des:""},
]

const Welcome = () => {
  const intl = useIntl();
  return (
    <Layout className="layout">
      <Header className={styles.header}>
        <div className={styles.logo}>
          系统运维平台
        </div>
        <Menu className={styles.menuCenter} selectedKeys='home' mode="horizontal">
          <Menu.Item key="home"><a href="/">首页</a></Menu.Item>
          <Menu.Item key="host"><a href="/host">主机管理</a></Menu.Item>
          <SubMenu key="monitor" title="监控中心">
            <Menu.Item key="dashboard"><a href="/monitor/dashboard">系统监控</a></Menu.Item>
          </SubMenu>
          <SubMenu key="vmcore" title="宕机分析">
            <Menu.Item key="vmlist"><a href="/vmcore/list">宕机列表</a></Menu.Item>
            <Menu.Item key="vmmatch"><a href="/vmcore/match">宕机匹配</a></Menu.Item>
          </SubMenu>
          <SubMenu key="diagnose" title="诊断中心">
            <Menu.Item key="io"><a href="/diagnose/io">IO延时诊断</a></Menu.Item>
            <Menu.Item key="net"><a href="/diagnose/net">网络诊断</a></Menu.Item>
          </SubMenu>
          <SubMenu key="journal" title="日志中心">
            <Menu.Item key="audit"><a href="/journal/audit">审计日志</a></Menu.Item>
          </SubMenu>
        </Menu>
        <div className={styles.avatarRight}>
          <AvatarDrop/>
        </div>
      </Header>
      <Content>
        <Carousel autoplay className={styles.bannercar}>
          {
            imgBanner.map(item => (
              <div className={styles.banner} key={item.key}>
                <div className={styles.title}>
                  <h3>{item.title}</h3>
                  <a href={item.urls}>点击进入</a>
                </div>
                <div className={styles.img} style={{backgroundColor: item.banner}}></div>
              </div>
            ))
          }
        </Carousel>
      </Content>
    </Layout>
  );
};

export default Welcome;

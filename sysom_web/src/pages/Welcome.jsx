import { Layout, Carousel, Menu } from 'antd';
import { useIntl, FormattedMessage } from 'umi';
import AvatarDrop from './../components/RightContent'
import styles from './Welcome.less';
import Footer from '@/components/Footer';

const { SubMenu } = Menu;
const { Header, Content } = Layout;

const imgBanner = [
  {key:1,banner:"#1a2933",title:"主机管理",urls:'/host',des:""},
  {key:2,banner:"#1a2933",title:"宕机中心",urls:'/vmcore',des:""},
  {key:4,banner:"#1a2933",title:"监控中心",urls:'/monitor',des:""},
  {key:3,banner:"#1a2933",title:"诊断中心",urls:'/diagnose',des:""},
  {key:5,banner:"#1a2933",title:"安全中心",urls:'/security',des:""},
  {key:5,banner:"#1a2933",title:"热补丁中心",urls:'/hotfix',des:""},
]

const Welcome = () => {
  const intl = useIntl();
  return (
    <Layout className="layout">
      <Header className={styles.header}>
        <div className={styles.logo}>
          <FormattedMessage id="pages.layouts.userLayout.title" />
        </div>
        <Menu className={styles.menuCenter} selectedKeys='home' mode="horizontal">
          <Menu.Item key="home"><a href="/"><FormattedMessage id="menu.welcome" /></a></Menu.Item>
          <SubMenu key="host" title={intl.formatMessage({
            id: "menu.host",
          })}>
            <Menu.Item key="hostlist"><a href="/host/list"><FormattedMessage id="menu.host.list" /></a></Menu.Item>
            <Menu.Item key="cluster"><a href="/host/cluster"><FormattedMessage id="menu.host.cluster" /></a></Menu.Item>
          </SubMenu>
          <SubMenu key="migrate" title={intl.formatMessage({
            id: "menu.migrate",
          })}>
            <Menu.Item key="assess"><a href="/migrate/assess"><FormattedMessage id="menu.migrate.assess" /></a></Menu.Item>
            <Menu.Item key="implement"><a href="/migrate/implement"><FormattedMessage id="menu.migrate.implement" /></a></Menu.Item>
          </SubMenu>
          <SubMenu key="monitor" title={intl.formatMessage({
            id: "menu.monitor",
          })}>
            <Menu.Item key="dashboard"><a href="/monitor/dashboard"><FormattedMessage id="menu.monitor.dashboard" /></a></Menu.Item>
            <Menu.Item key="migration"><a href="/monitor/migration"><FormattedMessage id="menu.monitor.migration" /></a></Menu.Item>
          </SubMenu>
          <SubMenu key="vmcore" title={intl.formatMessage({
            id: "menu.vmcore",
          })}>
            <Menu.Item key="vmlist"><a href="/vmcore/list"><FormattedMessage id="menu.vmcore.list" /></a></Menu.Item>
            <Menu.Item key="vmmatch"><a href="/vmcore/match"><FormattedMessage id="menu.vmcore.match" /></a></Menu.Item>
            <Menu.Item key="vmconfig"><a href="/vmcore/config"><FormattedMessage id="menu.vmcore.config" /></a></Menu.Item>
          </SubMenu>
          <SubMenu key="diagnose" title={intl.formatMessage({
            id: "menu.diagnose",
          })}>
            <Menu.Item key="oscheck"><a href="/diagnose/oscheck"><FormattedMessage id="menu.diagnose.oscheck" /></a></Menu.Item>
            <SubMenu key="cpu" title={intl.formatMessage({
              id: "menu.diagnose.cpu",
            })}>
              <Menu.Item key="schedmoni"><a href="/diagnose/cpu/schedmoni"><FormattedMessage id="menu.diagnose.cpu.schedmoni" /></a></Menu.Item>
              <Menu.Item key="loadtask"><a href="/diagnose/cpu/loadtask"><FormattedMessage id="menu.diagnose.cpu.loadtask" /></a></Menu.Item>
            </SubMenu>
            <SubMenu key="storage" title={intl.formatMessage({
              id: "menu.diagnose.storage",
            })}>
              <Menu.Item key="iolatency"><a href="/diagnose/storage/iolatency"><FormattedMessage id="menu.diagnose.storage.iolatency" /></a></Menu.Item>
              <Menu.Item key="iofsstat"><a href="/diagnose/storage/iofsstat"><FormattedMessage id="menu.diagnose.storage.iofsstat" /></a></Menu.Item>
              <Menu.Item key="iohang"><a href="/diagnose/storage/iohang"><FormattedMessage id="menu.diagnose.storage.iohang" /></a></Menu.Item>
            </SubMenu>
            <SubMenu key="net" title={intl.formatMessage({
              id: "menu.diagnose.net",
            })}>
              <Menu.Item key="network"><a href="/diagnose/net/network"><FormattedMessage id="menu.diagnose.net.network" /></a></Menu.Item>
              <Menu.Item key="packetdrop"><a href="/diagnose/net/packetdrop"><FormattedMessage id="menu.diagnose.net.packetdrop" /></a></Menu.Item>
              <Menu.Item key="jitter"><a href="/diagnose/net/jitter"><FormattedMessage id="menu.diagnose.net.jitter" /></a></Menu.Item>
              <Menu.Item key="retran"><a href="/diagnose/net/retran"><FormattedMessage id="menu.diagnose.net.retran" /></a></Menu.Item>
              <Menu.Item key="pingtrace"><a href="/diagnose/net/pingtrace"><FormattedMessage id="menu.diagnose.net.pingtrace" /></a></Menu.Item>
            </SubMenu>
            <SubMenu key="memory" title={intl.formatMessage({
              id: "menu.diagnose.memory",
            })}>
              <Menu.Item key="memgraph"><a href="/diagnose/memory/memgraph"><FormattedMessage id="menu.diagnose.memory.memgraph" /></a></Menu.Item>
              <Menu.Item key="filecache"><a href="/diagnose/memory/filecache"><FormattedMessage id="menu.diagnose.memory.filecache" /></a></Menu.Item>
              <Menu.Item key="oomcheck"><a href="/diagnose/memory/oomcheck"><FormattedMessage id="menu.diagnose.memory.oomcheck" /></a></Menu.Item>
            </SubMenu>
            <SubMenu key="custom" title={intl.formatMessage({
              id: "menu.diagnose.custom",
            })}>
              <Menu.Item key="command"><a href="/diagnose/memory/command"><FormattedMessage id="menu.diagnose.custom.command" /></a></Menu.Item>
            </SubMenu>
          </SubMenu>
          <SubMenu key="security" title={intl.formatMessage({
            id: "menu.security",
          })}>
            <Menu.Item key="List"><a href="/security/List"><FormattedMessage id="menu.security.list" /></a></Menu.Item>
          </SubMenu>
          <SubMenu key="hotfix" title="热补丁中心">
            <Menu.Item key="FormalList"><a href='/hotfix/formal_hotfix'>热补丁列表</a></Menu.Item>
            <Menu.Item key="List"><a href="/hotfix/make">热补丁制作</a></Menu.Item>
            <Menu.Item key="List"><a href="/hotfix/verion_config">自定义内核版本配置</a></Menu.Item>
          </SubMenu>
          <SubMenu key="journal" title={intl.formatMessage({
            id: "menu.journal",
          })}>
            <Menu.Item key="audit"><a href="/journal/audit"><FormattedMessage id="menu.journal.audit" /></a></Menu.Item>
            <Menu.Item key="task"><a href="/journal/task"><FormattedMessage id="menu.journal.task" /></a></Menu.Item>
            <Menu.Item key="alarm"><a href="/journal/alarm"><FormattedMessage id="menu.journal.alarm" /></a></Menu.Item>
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
                  <a href={item.urls}><FormattedMessage id="pages.click.enter" /></a>
                </div>
                <div className={styles.img} style={{backgroundColor: item.banner}}></div>
              </div>
            ))
          }
        </Carousel>
      </Content>
      <div style={{
        width: "100%",
        height: '12px'
      }}/>
      <Footer/>
    </Layout>
  );
};

export default Welcome;

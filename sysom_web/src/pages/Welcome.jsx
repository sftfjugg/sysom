import { Layout, Carousel, Menu } from 'antd';
import { useIntl, FormattedMessage } from 'umi';
import AvatarDrop from './../components/RightContent'
import styles from './Welcome.less';
import Footer from '@/components/Footer';

const { SubMenu } = Menu;
const { Header, Content } = Layout;

const imgBanner = [
  {key:1,banner:"#1a2933",title:"主机管理",urls:'/home',des:""},
  {key:2,banner:"#1a2933",title:"宕机中心",urls:'/home',des:""},
  {key:4,banner:"#1a2933",title:"监控中心",urls:'/home',des:""},
  {key:3,banner:"#1a2933",title:"诊断中心",urls:'/home',des:""},
  {key:5,banner:"#1a2933",title:"安全中心",urls:'/home',des:""},
  {key:6,banner:"#1a2933",title:"热补丁中心",urls:'/home',des:""},
]

const Welcome = () => {
  const intl = useIntl();
  return (
    <Layout className="layout">
      <Header className={styles.header}>
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

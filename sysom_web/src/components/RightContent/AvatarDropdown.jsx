import React, { useCallback } from 'react';
import { LogoutOutlined, SettingOutlined, UserOutlined } from '@ant-design/icons';
import { Avatar, Menu, Spin, Button, message } from 'antd';
import { history, useModel, FormattedMessage, setLocale, getLocale, request } from 'umi';
import { stringify } from 'querystring';
import HeaderDropdown from '../HeaderDropdown';
import styles from './index.less';

/* 
用户注销接口
*/
export async function logout(){
    const token = localStorage.getItem('token');
    return await request('/api/v1/logout/', {
        method: 'GET',
        headers: {
            'Authorization': token,
        },
    });
};


/**
 * 退出登录，并且将当前的 url 保存
 */
const loginOut = async () => {
  const { query = {}, search, pathname } = history.location;
  const { redirect } = query; // Note: There may be security issues, please note

  if (window.location.pathname !== '/user/login' && !redirect) {
    history.replace({
      pathname: '/user/login',
      search: stringify({
        redirect: pathname + search,
      }),
    });
  }
};

const AvatarDropdown = ({ menu }) => {
  const { initialState, setInitialState } = useModel('@@initialState');
  const onMenuClick = useCallback(
    (event) => {
      const { key } = event;
      if (key === 'logout') {
        logout().then(( res ) => {
          if (res.code === 200) {
            setInitialState((s) => ({ ...s, currentUser: undefined }));
            message.success(res.message)
            localStorage.removeItem('userId');
            localStorage.removeItem('token');
            loginOut();
          }
        })
        return;
      }
      history.push(`/account/${key}`);
    },
    [setInitialState],
  );
  const loading = (
    <span className={`${styles.action} ${styles.account}`}>
      <Spin
        size="small"
        style={{
          marginLeft: 8,
          marginRight: 8,
        }}
      />
    </span>
  );

  if (!initialState) {
    return loading;
  }

  const { currentUser } = initialState;

  if (!currentUser || !currentUser.username) {
    return loading;
  }

  const menuHeaderDropdown = (
    <Menu className={styles.menu} selectedKeys={[]} onClick={onMenuClick}>
      {currentUser.is_admin && (
        <Menu.Item key="center">
          <UserOutlined />
          用户中心
        </Menu.Item>
      )}
      {menu && (
        <Menu.Item key="settings">
          <SettingOutlined />
          个人设置
        </Menu.Item>
      )}
      {menu && <Menu.Divider />}

      <Menu.Item key="logout">
        <LogoutOutlined />
        退出登录
      </Menu.Item>
    </Menu>
  );
  const changLang = () => {
    const locale = getLocale();
    console.log(locale);
    if (!locale || locale === 'zh-CN') {
      setLocale('en-US');
    } else {
      setLocale('zh-CN');
    }
  };
  return (
    <>
      <div style={{ float: 'left', }}>
        <Button
        size="small"
        // ghost={theme === 'dark'}
        style={{
          margin: '0 8px',
        }}
        onClick={() => {
          changLang();
        }}
      >
        <FormattedMessage id="pages.language" defaultMessage="中文" />
      </Button>
      </div>
      <HeaderDropdown overlay={menuHeaderDropdown}>
        <span className={`${styles.action} ${styles.account}`}>
          <Avatar size="small" className={styles.avatar} src={currentUser.avatar} alt="avatar" />
          <span className={`${styles.name} anticon`}>{currentUser.username}</span>
        </span>
      </HeaderDropdown>
    </>
  );
};

export default AvatarDropdown;

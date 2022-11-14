import {
  LockOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Alert, message, Tabs } from 'antd';
import { useState } from 'react';
import { ProFormText, LoginForm ,ProFormCheckbox} from '@ant-design/pro-form';
import { useIntl, history, FormattedMessage, useModel } from 'umi';
import Footer from '@/components/Footer';
import { login, ChangePassword } from './service';
import styles from './index.less';
import Agreem from "./agreem"

const LoginMessage = ({ content }) => (
  <Alert
    style={{
      marginBottom: 24,
    }}
    message={content}
    type="error"
    showIcon
  />
);

const Login = () => {
  const [userLoginState, setUserLoginState] = useState({});
  const [userPasswordState, setUserPasswordState] = useState({});
  const [type, setType] = useState('account','password');
  // const [passtype, setPassType] = useState('password');
  const { initialState, setInitialState } = useModel('@@initialState');
  const intl = useIntl();

  const fetchUserInfo = async (userId, token) => {
    const userInfo = await initialState?.fetchUserInfo?.(userId, token);

    if (userInfo) {
      await setInitialState((s) => ({ ...s, currentUser: userInfo }));
    }
  };

  // console.log(type,"pppppp");
  // console.log(passtype,"bbbbb");

  const handleSubmit = async (values) => {
    // console.log(values,type,"pppppa");
    if(type==="account"){
      try {
        // 登录
        const msg = await login({ ...values, type });
        // console.log(msg,type,values,"qqqqqqqqqqqqqkil");
  
        if (msg.code === 200) {
          const defaultLoginSuccessMessage = intl.formatMessage({
            id: 'pages.login.success',
            defaultMessage: '登录成功！',
          });
          const userId = msg.data.id;
          const token = msg.data.token
          localStorage.setItem('userId', userId);
          localStorage.setItem('token', token);
          message.success(defaultLoginSuccessMessage);
          await fetchUserInfo(userId, token);
  
          if (!history) return;
          const { query } = history.location;
          const { redirect } = query;
          history.push(redirect || '/');
          return;
        }
  
        console.log(msg); // 如果失败去设置用户错误信息
  
        setUserLoginState(msg);
      } catch (error) {
        const defaultLoginFailureMessage = intl.formatMessage({
          id: 'pages.login.failure',
          defaultMessage: '登录失败，请重试！',
        });
        message.error(defaultLoginFailureMessage);
      }
    }else if(type==="password"){
      // console.log(type,values,"lllllllllllll");
      try {
        // 密码修改
        const msg = await ChangePassword({ ...values, type });
        // console.log(msg,type,values,"lllllllllllll");

        if (msg.code === 200) {
          const defaultLoginSuccessMessage = intl.formatMessage({
            id: 'pages.changepassword.success',
            defaultMessage: '密码修改成功！',
          });
          message.success(defaultLoginSuccessMessage);

          // if (!history) return;
          // const { query } = history.location;
          // const { redirect } = query;
          // history.push(redirect || '/');
          history.push('/');
          return;
        }

        // console.log(msg); // 如果失败去设置用户错误信息

        setUserPasswordState(msg);
      } catch (error) {
        // message.error("111");
        // const defaultLoginFailureMessage = intl.formatMessage({
        //   id: 'pages.password.failure',
        //   defaultMessage: '密码修改失败，请重试！',
        // });
        // message.error(defaultLoginFailureMessage);
      }
    }
    
  };

  const { status, type: loginType } = userLoginState;
  // const { status, passtype: passwordType } = userPasswordState;
  // console.log(type,"pppppp");
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <LoginForm
          title="系统运维平台"
          subTitle={intl.formatMessage({
            id: 'pages.layouts.userLayout.title',
          })}
          initialValues={{
            autoLogin: true,
          }}
          onFinish={async (values) => {
            await handleSubmit(values);
          }}
        >
          <Tabs activeKey={type} onChange={setType}>
            <Tabs.TabPane
              key="account"
              tab={intl.formatMessage({
                id: 'pages.login.accountLogin.tab',
                defaultMessage: '账户密码登录',
              })}
            />
            <Tabs.TabPane
              key="password"
              tab={intl.formatMessage({
                id: 'pages.login.passwordLogin.tab',
                defaultMessage: '账户密码修改',
              })}
            />
          </Tabs>

          {status === 'error' && loginType === 'account' && (
            <LoginMessage
              content={intl.formatMessage({
                id: 'pages.login.accountLogin.errorMessage',
                defaultMessage: '账户或密码错误(admin/123456)',
              })}
            />
          )}
          {type === 'account' && (
            <>
              <ProFormText
                name="username"
                fieldProps={{
                  size: 'large',
                  prefix: <UserOutlined className={styles.prefixIcon} />,
                }}
                placeholder={intl.formatMessage({
                  id: 'pages.login.username.placeholder',
                  defaultMessage: '用户名: admin or user',
                })}
                rules={[
                  {
                    required: true,
                    message: (
                      <FormattedMessage
                        id="pages.login.username.required"
                        defaultMessage="请输入用户名!"
                      />
                    ),
                  },
                ]}
              />
              <ProFormText.Password
                name="password"
                fieldProps={{
                  size: 'large',
                  prefix: <LockOutlined className={styles.prefixIcon} />,
                }}
                placeholder={intl.formatMessage({
                  id: 'pages.login.password.placeholder',
                  defaultMessage: '密码: 123456',
                })}
                rules={[
                  {
                    required: true,
                    message: (
                      <FormattedMessage
                        id="pages.login.password.required"
                        defaultMessage="请输入密码！"
                      />
                    ),
                  },
                ]}
              />
               <ProFormCheckbox  name="agreement"
                  valuePropName="checked"
                  rules={[
                    {
                      validator: (_, value) =>
                        value ? Promise.resolve() : Promise.reject(new Error('请先勾选同意后再进行登录')),
                    },
                     ]}>
                    <div className="read"><Agreem/>  </div> 
  
               </ProFormCheckbox>
            </>
          )}

          {type === 'password' && (
            <>
              <ProFormText
                name="username"
                fieldProps={{
                  size: 'large',
                  prefix: <UserOutlined className={styles.prefixIcon} />,
                }}
                placeholder={intl.formatMessage({
                  id: 'pages.login.username.placeholder',
                  defaultMessage: '用户名: admin or user',
                })}
                rules={[
                  {
                    required: true,
                    message: (
                      <FormattedMessage
                        id="pages.login.username.required"
                        defaultMessage="请输入用户名!"
                      />
                    ),
                  },
                ]}
              />
              <ProFormText.Password
                name="row_password"
                fieldProps={{
                  size: 'large',
                  prefix: <LockOutlined className={styles.prefixIcon} />,
                }}
                placeholder={intl.formatMessage({
                  id: 'pages.login.row_password.placeholder',
                  defaultMessage: '请输入原始密码！',
                })}
                rules={[
                  {
                    required: true,
                    message: (
                      <FormattedMessage
                        id="pages.login.row_password.required"
                        defaultMessage="请输入原始密码！"
                      />
                    ),
                  },
                ]}
              />
              <ProFormText.Password
                name="new_password"
                fieldProps={{
                  size: 'large',
                  prefix: <LockOutlined className={styles.prefixIcon} />,
                }}
                placeholder={intl.formatMessage({
                  id: 'pages.login.new_password.placeholder',
                  defaultMessage: '请输入新密码！',
                })}
                rules={[
                  {
                    required: true,
                    message: (
                      <FormattedMessage
                        id="pages.login.new_password.required"
                        defaultMessage="请输入新密码！"
                      />
                    ),
                  },
                ]}
              />
              <ProFormText.Password
                name="new_password_again"
                fieldProps={{
                  size: 'large',
                  prefix: <LockOutlined className={styles.prefixIcon} />,
                }}
                placeholder={intl.formatMessage({
                  id: 'pages.login.new_password_again.placeholder',
                  defaultMessage: '请再次输入新密码！',
                })}
                rules={[
                  {
                    required: true,
                    message: (
                      <FormattedMessage
                        id="pages.login.new_password_again.required"
                        defaultMessage="请再次输入新密码！"
                      />
                    ),
                  },
                ]}
              />
            </>
          )}

        </LoginForm>
      </div>
      <Footer />
    </div>
  );
};

export default Login;

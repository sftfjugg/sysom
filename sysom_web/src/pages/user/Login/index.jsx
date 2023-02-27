import { LockOutlined, UserOutlined, ExclamationCircleFilled } from "@ant-design/icons";
import { Alert, message, Tabs, Button, Modal } from "antd";
import { useState, useRef } from "react";
import { ProFormText, LoginForm, ProFormCheckbox } from "@ant-design/pro-form";
import { useIntl, history, FormattedMessage, useModel } from "umi";
import Footer from "@/components/Footer";
import { login, ChangePassword } from "./service";
import styles from "./index.less";
import Agreem from "./agreem";

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
  const formRef = useRef();
  const passwordReg = /^(?![A-Za-z]+$)(?![A-Z\d]+$)(?![A-Z\W]+$)(?![a-z\d]+$)(?![a-z\W]+$)(?![\d\W]+$)\S{8,}$/
  const [userLoginState, setUserLoginState] = useState({});
  const [type, setType] = useState("account", "password");
  const { initialState, setInitialState } = useModel("@@initialState");
  const intl = useIntl();

  /* 跳转到主页或者重定向到历史页面 */
  const ToIndexOrRedirectHistory = () => {
    const { query } = history.location;
    const { redirect } = query;
    history.push(redirect || "/welcome");
    return;
  }

/* 
  提示用户是否需要修改密码，提升密码复杂度
*/
const IsChangePassword = () => {
  Modal.confirm({
    title: '是否要修改默认密码?',
    icon: <ExclamationCircleFilled />,
    okText: '修改',
    cancelText: '忽略',
    onCancel () {
      ToIndexOrRedirectHistory();
    },
    onOk () {
      setType('password')
    }
  })
}

  const fetchUserInfo = async (userId, token) => {
    const userInfo = await initialState?.fetchUserInfo?.(userId, token);

    if (userInfo) {
      await setInitialState((s) => ({ ...s, currentUser: userInfo }));
    }
  };

  const loginHandle = async () => {
    formRef.current
      ?.validateFieldsReturnFormatValue?.()
      .then(async (values) => {
        try {
          const res = await login({ ...values, type });
          const userId = res.data.id;
          const token = res.data.token;
          localStorage.setItem("userId", userId);
          localStorage.setItem("token", token);
          message.success("登录成功");
          await fetchUserInfo(userId, token);

          if (!passwordReg.test(values.password)) { IsChangePassword(); return; }
          if (!history) return;
          ToIndexOrRedirectHistory();
          // setUserLoginState(res);
          return;
        } catch (e) {
          console.log(e);
        }
      });
  };

  const reSetPasswordHandler = async () => {
    formRef.current
      ?.validateFieldsReturnFormatValue?.()
      .then(async (values) => {
        try {
          await ChangePassword({ ...values });
          message.success("密码修改成功");
          formRef?.current?.resetFields([
            "username",
            "row_password",
            "new_password",
            "new_password_again",
          ]);
          const userId = localStorage.getItem('userId')
          if (!userId) { 
            setType("account");
          } else {
            ToIndexOrRedirectHistory();
          }
          
        } catch (e) {
          console.log(e);
        }
      });
  };

  const { status, type: loginType } = userLoginState;
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <LoginForm
          title={intl.formatMessage({
            id: "pages.layouts.userLayout.title",
          })}
          subTitle={intl.formatMessage({
            id: "pages.layouts.userLayout.title",
          })}
          formRef={formRef}
          initialValues={{
            agreement: true,
          }}
          onKeyDown={async e =>{
            if (e.key === "Enter") {
              const params = formRef.current.getFieldsValue();
              if (type === "account") {
                await loginHandle(params);
              } else {
                await reSetPasswordHandler(params);
              }
            }
          }}
          onFinish={async (values) => {
            await handleSubmit(values);
          }}
          submitter={{
            render: (props, doms) => {
              const mod =
                type === "account" ? (
                  <Button
                    onClick={async () => {
                      await loginHandle(props);
                    }}
                    block={true}
                    type="primary"
                  >
                    <FormattedMessage id="pages.login" />
                  </Button>
                ) : (
                  <Button
                    onClick={async () => {
                      await reSetPasswordHandler(props);
                    }}
                    block={true}
                    type="primary"
                  >
                    <FormattedMessage id="pages.changepassword" />
                  </Button>
                );
              return [mod];
            },
          }}
        >
          <Tabs activeKey={type} onChange={setType}>
            <Tabs.TabPane
              key="account"
              tab={intl.formatMessage({
                id: "pages.login.accountLogin.tab",
                defaultMessage: "账户密码登录",
              })}
            />
            <Tabs.TabPane
              key="password"
              tab={intl.formatMessage({
                id: "pages.login.passwordLogin.tab",
                defaultMessage: "账户密码修改",
              })}
            />
          </Tabs>

          {status === "error" && loginType === "account" && (
            <LoginMessage
              content={intl.formatMessage({
                id: "pages.login.accountLogin.errorMessage",
                defaultMessage: "账户或密码错误(admin/123456)",
              })}
            />
          )}
          {type === "account" && (
            <>
              <ProFormText
                name="username"
                fieldProps={{
                  size: "large",
                  prefix: <UserOutlined className={styles.prefixIcon} />,
                }}
                placeholder={intl.formatMessage({
                  id: "pages.login.username.placeholder",
                  defaultMessage: "用户名: admin or user",
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
                  size: "large",
                  prefix: <LockOutlined className={styles.prefixIcon} />,
                }}
                placeholder={intl.formatMessage({
                  id: "pages.login.password.placeholder",
                  defaultMessage: "密码: 123456",
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
              <ProFormCheckbox
                name="agreement"
                valuePropName="checked"
                rules={[
                  {
                    validator: (_, value) =>
                      value
                        ? Promise.resolve()
                        : Promise.reject(new Error("请先勾选同意后再进行登录")),
                  },
                ]}
              >
                <div className="read">
                  <Agreem />
                </div>
              </ProFormCheckbox>
            </>
          )}

          {type === "password" && (
            <>
              <ProFormText
                name="username"
                fieldProps={{
                  size: "large",
                  prefix: <UserOutlined className={styles.prefixIcon} />,
                }}
                placeholder={intl.formatMessage({
                  id: "pages.login.username.placeholder",
                  defaultMessage: "用户名: admin or user",
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
                  size: "large",
                  prefix: <LockOutlined className={styles.prefixIcon} />,
                }}
                placeholder={intl.formatMessage({
                  id: "pages.login.row_password.placeholder",
                  defaultMessage: "请输入原始密码！",
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
                  }
                ]}
              />
              <ProFormText.Password
                name="new_password"
                fieldProps={{
                  size: "large",
                  prefix: <LockOutlined className={styles.prefixIcon} />,
                }}
                placeholder={intl.formatMessage({
                  id: "pages.login.new_password.placeholder",
                  defaultMessage: "请输入新密码！",
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
                  },{
                    pattern: passwordReg,
                    message: '密码至少8位, 包括数字、大小写字母和特殊字符三种及以上'
                  }
                ]}
              />
              <ProFormText.Password
                name="new_password_again"
                fieldProps={{
                  size: "large",
                  prefix: <LockOutlined className={styles.prefixIcon} />,
                }}
                placeholder={intl.formatMessage({
                  id: "pages.login.new_password_again.placeholder",
                  defaultMessage: "请再次输入新密码！",
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
                  },{
                    pattern: passwordReg,
                    message: '密码至少8位, 包括数字、大小写字母和特殊字符三种及以上'
                  },({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('new_password') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('两次密码不同'));
                    },
                  }),
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

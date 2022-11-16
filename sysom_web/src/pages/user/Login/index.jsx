import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { Alert, message, Tabs, Button } from "antd";
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
  const [userLoginState, setUserLoginState] = useState({});
  const [type, setType] = useState("account", "password");
  const { initialState, setInitialState } = useModel("@@initialState");
  const intl = useIntl();

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

          if (!history) return;
          const { query } = history.location;
          const { redirect } = query;
          history.push(redirect || "/welcome");
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
          setType("account");
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
          title="系统运维平台"
          subTitle={intl.formatMessage({
            id: "pages.layouts.userLayout.title",
          })}
          formRef={formRef}
          initialValues={{
            agreement: true,
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
                    登录
                  </Button>
                ) : (
                  <Button
                    onClick={async () => {
                      await reSetPasswordHandler(props);
                    }}
                    block={true}
                    type="primary"
                  >
                    修改密码
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
                  },
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
                  },
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

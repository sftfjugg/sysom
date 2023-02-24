import { Button, Popconfirm, message } from "antd";
import { resetPassword } from "../service";

const resetPasswordHandler = async (data) => {
  try {
    const result = await resetPassword(data);
    if (result.code === 200) {
      message.success(result.message)
    } else{
      message.error(result.message)
    }
  } catch (error) {
    console.log(error);
  }
};

const ResetPassword = (props) => {
  const { currentUser, record } = props;
  // 判断当前用户是不是admin用户
  if (!record || record.username === "admin") {
    return (
      <Button type="link" disabled>
        重置密码
      </Button>
    );
  }
  if (currentUser?.username === record?.username) {
    return (
      <Button type="link" disabled>
        重置密码
      </Button>
    );
  }
  return (
    <Popconfirm
      title="是否要重置密码？(默认密码: 123456)"
      okText="确定"
      cancelText="取消"
      onConfirm={async () => {
        await resetPasswordHandler({pk: record.id})
      }}
    >
      <Button type="link">重置密码</Button>
    </Popconfirm>
  );
};

export default ResetPassword;

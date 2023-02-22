import { message, Button, Checkbox, Modal } from "antd";
import { delAccount } from "../service";
import { FormattedMessage } from "umi";

const { confirm } = Modal;

const handleDelAccount = async (record) => {
  const hide = message.loading(
    <FormattedMessage id="pages.account.deleting" defaultMessage="Deleting" />
  );
  try {
    let res = await delAccount(record.id);
    hide();
    if (res.code === 200) {
      message.success(
        <FormattedMessage
          id="pages.account.delete_success"
          defaultMessage="delete success"
        />
      );
      return true;
    } else {
      message.error(`删除失败: ${res.message}`);
      return false;
    }
  } catch (error) {
    hide();
    return false;
  }
};

const DeletePrompt = (props) => {
  return (
    <>
      <p>确定删除该账号？</p>
      <p>
        <Checkbox>该用户下有{props.count}台机器, 是否需要一并删除?</Checkbox>
      </p>
    </>
  );
};

const DeleteAccount = (props) => {
  const { record, currentUser } = props;
  // 判断当前用户是不是admin用户
  if (!record || record.username === "admin") {
    return (
      <Button type="link" disabled>
        <FormattedMessage id="pages.account.delete" defaultMessage="delete" />
      </Button>
    );
  }

  // 判断该条数据是否为当前用户, 当前用户不能对自身进行编辑
  if (currentUser?.username === record?.username) {
    return (
      <Button type="link" disabled>
        <FormattedMessage id="pages.account.delete" defaultMessage="delete" />
      </Button>
    );
  }

  const showDeleteConfirm = () => {
    confirm({
      content: <DeletePrompt count={record.host_count} />,
      okText: "删除",
      cancelText: "我再想想",
      onOk: async () => {
        await handleDelAccount(record);
        props.onAddAcountSuccess();
      }
    });
  };
  return (
    <Button type="link" onClick={showDeleteConfirm}>
      <FormattedMessage id="pages.account.delete" defaultMessage="delete" />
    </Button>
  );
};

export default DeleteAccount;

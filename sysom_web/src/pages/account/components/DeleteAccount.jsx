import { Popconfirm, message, Button } from "antd";
import { delAccount } from "../service";
import { FormattedMessage } from "umi";

const handleDelAccount = async (record) => {
  const hide = message.loading(
    <FormattedMessage id="pages.account.deleting" defaultMessage="Deleting" />
  );
  try {
    let res = await delAccount(record.id);
    hide();
    if (res.code === 200) {
      message.success(<FormattedMessage id="pages.account.delete_success" defaultMessage="delete success" />);
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
  return (
    <>
      <Popconfirm
        title={
          <FormattedMessage
            id="pages.account.is_delete_account"
            defaultMessage="Is Delete Account?"
          />
        }
        okText={
          <FormattedMessage id="pages.account.yes" defaultMessage="yes" />
        }
        cancelText={
          <FormattedMessage
            id="pages.account.think"
            defaultMessage="I think it over"
          />
        }
        onConfirm={async () => {
          await handleDelAccount(record);
          props.onAddAcountSuccess();
        }}
      >
        <Button type="link">
          <FormattedMessage id="pages.account.delete" defaultMessage="delete" />
        </Button>
      </Popconfirm>
    </>
  );
};

export default DeleteAccount;

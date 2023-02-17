import { useRef } from "react";
import { Button } from "antd";
import {
  ModalForm,
  ProFormText,
  ProFormSwitch,
  ProFormTextArea,
} from "@ant-design/pro-form";
import { FormattedMessage } from "umi";
import { updateAccount } from "../service";

const editAccountHandler = async (id, body) => {
  try {
    const result = await updateAccount(id, body);
    if (result.code === 200) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    return false;
  }
};

const EditAccountModal = (props) => {
  const { record, currentUser } = props;

  // 判断当前用户是不是admin用户
  if (!record || record.username === "admin") {
    return (
      <Button type="link" disabled>
        <FormattedMessage id="pages.account.edit" defaultMessage="edit" />
      </Button>
    );
  }

  // 判断该条数据是否为当前用户, 当前用户不能对自身进行编辑
  if (currentUser?.username === record?.username) {
    return (
      <Button type="link" disabled>
        <FormattedMessage id="pages.account.edit" defaultMessage="edit" />
      </Button>
    );
  }

  const editAccountFormRef = useRef();
  return (
    <ModalForm
      title={
        <FormattedMessage
          id="pages.account.edit_modal_title"
          defaultMessage="Edit Account Info"
        />
      }
      trigger={
        <Button type="link">
          <FormattedMessage id="pages.account.edit" defaultMessage="edit" />
        </Button>
      }
      width={500}
      formRef={editAccountFormRef}
      initialValues={{
        username: record.username,
        is_admin: record.is_admin,
        description: record.description,
      }}
      onFinish={async (value) => {
        const r = await editAccountHandler(record.id, value);
        if (r) {
          props.onAddAcountSuccess();
        }
        return r;
      }}
    >
      <ProFormText
        name="username"
        label={
          <FormattedMessage
            id="pages.account.username"
            defaultMessage="username"
          />
        }
        placeholder={
          <FormattedMessage
            id="pages.account.input_username"
            defaultMessage="place input username"
          />
        }
        rules={[
          {
            required: true,
            message: (
              <FormattedMessage
                id="pages.account.required_username"
                defaultMessage="required username"
              />
            ),
          },
        ]}
      ></ProFormText>
      <ProFormSwitch
        name="is_admin"
        label={
          <FormattedMessage
            id="pages.account.is_admin"
            defaultMessage="is admin"
          />
        }
      />
      <ProFormSwitch
        name="allow_login"
        label={
          <FormattedMessage
            id="pages.account.allow_login"
            defaultMessage="allow login"
          />
        }
      />
      <ProFormTextArea
        name="description"
        label={
          <FormattedMessage
            id="pages.account.description"
            defaultMessage="description"
          />
        }
        placeholder={
          <FormattedMessage
            id="pages.account.input_description"
            defaultMessage="input description"
          />
        }
      />
    </ModalForm>
  );
};

export default EditAccountModal;

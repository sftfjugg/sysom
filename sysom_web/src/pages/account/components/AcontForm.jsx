import { useRef } from "react";
import { PlusOutlined } from "@ant-design/icons";
import { Button, message } from "antd";
import { FormattedMessage } from "umi";
import {
  ModalForm,
  ProFormText,
  ProFormTextArea,
  ProFormSwitch,
} from "@ant-design/pro-form";

import { addAccount } from "../service";


const addAccountHandler = async (vul) => {
  try {
    const result = await addAccount(vul);
    if (result.code === 200) {
      message.success(
        <FormattedMessage
          id="pages.account.create_success"
          defaultMessage="create success"
        />
      );
      return true;
    } else {
      return false;
    }
  } catch (error) {
    return false;
  }
};

const AccountForm = (prop) => {
  const accountFormRef = useRef();

  return (
    <ModalForm
      title={
        <FormattedMessage
          id="pages.account.create_account_modal"
          defaultMessage="Create Account Modal"
        />
      }
      width={500}
      formRef={accountFormRef}
      trigger={
        <Button type="primary">
          <PlusOutlined />
          <FormattedMessage
            id="pages.account.add_account"
            defaultMessage="Add Account"
          />
        </Button>
      }
      onFinish={async (value) => {
        const b = await addAccountHandler(value, accountFormRef);
        if (b) {
          accountFormRef.current?.resetFields();
          prop.onAddAcountSuccess();
        }
        return b;
      }}
      initialValues={{
        password: "123456",
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
                defaultMessage="required username!"
              />
            ),
          },
        ]}
      ></ProFormText>
      <ProFormText.Password
        name="password"
        label={
          <FormattedMessage
            id="pages.account.password"
            defaultMessage="password"
          />
        }
        placeholder={
          <FormattedMessage
            id="pages.account.input_password"
            defaultMessage="place input password"
          />
        }
        rules={[
          {
            required: true,
            message: (
              <FormattedMessage
                id="pages.account.required_password"
                defaultMessage="required password!"
              />
            ),
          },
        ]}
      ></ProFormText.Password>
      <ProFormSwitch
        name="is_admin"
        label={
          <FormattedMessage
            id="pages.account.is_admin"
            defaultMessage="is admin"
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

export default AccountForm;

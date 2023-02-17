import { PageContainer } from "@ant-design/pro-layout";
import ProTable from "@ant-design/pro-table";
import { useRef } from "react";
import { FormattedMessage, useModel } from "umi";
import { Switch } from "antd";

import { getAccountList } from "../service";
import AccountForm from "../components/AcontForm";
import EditAccountModal from "../components/EditAccountModal";
import DeleteAccount from "../components/DeleteAccount";

const CustomSwitch = (props) => {
  return <Switch checked={props.isAdmin} disabled size="small" />;
};

const UserList = () => {
  const accountListTableActionRef = useRef();
  const { initialState } = useModel("@@initialState");
  const { currentUser } = initialState;

  const columns = [
    {
      title: (
        <FormattedMessage
          id="pages.account.username"
          defaultMessage="UserName"
        />
      ),
      dataIndex: "username",
      valueType: "textarea",
    },
    {
      title: (
        <FormattedMessage
          id="pages.account.is_admin"
          defaultMessage="Is Admin"
        />
      ),
      dataIndex: "is_admin",
      // valueType: 'switch',
      hideInSearch: true,
      render: (_, record) => [
        <CustomSwitch isAdmin={record.is_admin} key={record.id} />,
      ],
    },
    {
      title: (
        <FormattedMessage
          id="pages.account.allow_login"
          defaultMessage="AllowLogin"
        />
      ),
      dataIndex: "allow_login",
      hideInSearch: true,
      render: (_, record) => [
        <CustomSwitch isAdmin={record.allow_login} key={record.id} />,
      ],
    },
    {
      title: (
        <FormattedMessage
          id="pages.account.account_create_time"
          defaultMessage="createTime"
        />
      ),
      dataIndex: "created_at",
      valueType: "dateTime",
      hideInSearch: true,
    },
    {
      title: (
        <FormattedMessage
          id="pages.account.description"
          defaultMessage="Description"
        />
      ),
      dataIndex: "description",
      hideInSearch: true,
    },
    {
      title: (
        <FormattedMessage id="pages.account.action" defaultMessage="Action" />
      ),
      key: "option",
      dataIndex: "option",
      valueType: "option",
      render: (_, record) => [
        <EditAccountModal
          onAddAcountSuccess={() => {
            accountListTableActionRef.current?.reload();
          }}
          currentUser={currentUser}
          record={record}
          key="edit"
        />,
        <DeleteAccount
          key="delete"
          record={record}
          currentUser={currentUser}
          onAddAcountSuccess={() => {
            accountListTableActionRef.current?.reload();
          }}
        />,
      ],
    },
  ];
  return (
    <div>
      <PageContainer>
        <ProTable
          headerTitle={
            <FormattedMessage
              id="pages.account.account_list"
              defaultMessage="Account List"
            />
          }
          rowKey="id"
          actionRef={accountListTableActionRef}
          columns={columns}
          request={getAccountList}
          toolBarRender={() => [
            <AccountForm
              onAddAcountSuccess={() => {
                accountListTableActionRef.current?.reload();
              }}
            />,
          ]}
        />
      </PageContainer>
    </div>
  );
};

export default UserList;

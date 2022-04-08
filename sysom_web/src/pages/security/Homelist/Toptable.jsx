import { useRef, useState } from "react";
import { useIntl, FormattedMessage } from "umi";
import ProTable from "@ant-design/pro-table";
import {getOneById} from '../service'
import "./homelist.less";


const Toptable = (params) => {
    console.log(params.id)

const  request=async()=>{
    const  msg=await  getOneById(params.id);
       msg.data = [...msg.setdata]
    return msg
}

    const columns=[
    
        {
          title:<FormattedMessage id="pages.security.Homelist.name" defaultMessage="name" />,
          dataIndex:'name',
          align: "center",
        },
        {
          title:<FormattedMessage id="pages.security.Homelist.vul_level" defaultMessage="vul_level" />,
          dataIndex:"vul_level",
          key:"vul_level",
         
        },
        {
          title:<FormattedMessage id="pages.security.Homelist.fixed_version" defaultMessage="fixed_version" />,
          dataIndex:"fixed_version",
          key:"fixed_version",
        }
      ]
  return (
    <div>
      <ProTable
        columns={columns}
        search={false}
        scroll={{ y: 200 }} 
         rowKey="fixed_version"
         request={request}
         headerTitle={params.id}
         pagination={false}
       />
    </div>
  );
};

export default Toptable;

import ProCard from '@ant-design/pro-card';
import ProTable from "@ant-design/pro-table";
import fieldModifier from "./fieldModifier"

const TablePannel = (props) => {
  const configs = props.configs
  const data = props.data

  //table background color render
  const bgColorRender = (text, record) => {
    //console.log("bgColorRender", record)

    const [value, color] = fieldModifier(configs.fieldConfig, text, record, data)
    return {
      props: {
        style: { background: color }
      },
      children: <div>{value}</div>
    }
  }

  let columns = Object.keys(data[0]).map((key) => ({
    title: key,
    dataIndex: key,
    render: bgColorRender
  }))

  //filter reserve keyword
  const keyword = ["key", "children"]
  columns = columns.filter((col) => !keyword.includes(col.title))

  return (
    <ProCard
      title={configs.title}
      style={{ marginTop: 16, }} bordered collapsible
      bodyStyle={{ padding: 0 }}
    >
      <ProTable
        options={false}
        dataSource={data}
        columns={columns}
        search={false}
        style={{ marginTop: 16 }}
        bordered
        collapsible
      />
    </ProCard>
  )
}

//    headerTitle={configs.title}

export default TablePannel
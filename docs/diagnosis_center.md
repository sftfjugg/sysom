# SysOM 诊断中心开发规范

# 1. 整体描述

前后端的联系规范整体来说分为两大部分，均为JSON格式化。 

1. 前端版面控制规范:  主要用于版面的布局、呈现和数据绑定描述。 
2. 后端数据返回规范：数据部分为诊断的返回数据。主要用于版面的实际填充。

# 2. 后端数据返回规范

我们先描述数据的返回规范，后面的的版面描述的时候， 容易对应。 数据统一按数据表的格式返回。 每个版面的图标数据都有对应的数据表提供数据。 

## 2.1诊断数据列表

全部同类面板类型数据的拉取接口为：**http://<域名>/api/v1/tasks/?service_name=<类型>**。数据呈现的接口推荐为表格， 用于点击对应的行后， 拉取的定ID的诊断详情详情。进行数据的渲染。 

<类型>： 为SysOM的支持的诊断类型。 目前支持的类型有：

- - memgraph：内存大盘

| 字段名  | 值           | 说明                                                         | 例子                                                         |
| ------- | ------------ | ------------------------------------------------------------ | ------------------------------------------------------------ |
| code    | 200          | HTTP的返回码：200：网站返回正常                              | 200                                                          |
| data    | [{诊断记录}] | 诊断记录列表， 列表内每个记录为一条的诊断诊断列表数据。 数据宜采用表格的方式进行渲染 | [{id: 4, created_at: "2022-07-07 10:37:46", task_id: "D7LSiKVj", status: "Success",…},…] |
| success | true         | 固定返回true。                                               | true                                                         |
| total   | <数值>       | data所包含的中记录数                                         |                                                              |

诊断记录（data字段）详情：

| 字段名     | 值                                 | 说明                                                         | 例子                                                 |
| ---------- | ---------------------------------- | ------------------------------------------------------------ | ---------------------------------------------------- |
| id         | <数值>                             | 诊断ID：该任务记录的ID， 后续拉取诊断详情需要使用            | 15                                                   |
| task_id    | <字符串>                           | 任务ID：目前没有实际用途，只供界面显示                       | "D7LSiKVj"                                           |
| created_at | <字符串>                           | 任务的创建时间                                               | "2022-07-07 10:37:46"                                |
| params     | [{请求报单参数}]                   | 该诊断任务新建的时候的参数。 具体的数据格式请参照 1.2.3      | {service_name: 'memgraph', instance: '172.16.139.8'} |
| status     | <"Running" \| "Success" \| "Fail"> | Running:  诊断运行中Success: 诊断完毕Fail: 诊断异常前端可以采用友好的方式进行展示。 | "Running"                                            |

## 2.2 诊断数据详情

单个诊断数据的详情拉取接口为：**http://<域名>/api/v1/tasks/<诊断ID>/**。诊断数据详情的格式基本与诊断数据列表一致， 差异是详情接口只返回一个诊断ID的数据， 并且带上诊断的返回结果（result字段）

| 字段名  | 值             | 说明                                                         | 例子                                                         |
| ------- | -------------- | ------------------------------------------------------------ | ------------------------------------------------------------ |
| code    | 200            | HTTP的返回码：200：网站返回正常                              |                                                              |
| data    | {诊断详细记录} | 诊断详细记录， 为诊断显示页面的渲染数据。数据需要根据3.1.2节 规定进行模板化渲染。 | {id: 5, created_at: "2022-07-07 10:47:36", task_id: "pnbOT799", status: "Success",…} |
| success | true           | 固定返回true。                                               |                                                              |
| total   | <数值>         | data所包含的中记录数                                         |                                                              |

诊断详细记录（data字段）详情：

| 字段名     | 值                                 | 说明                                                         | 例子                                                   |
| ---------- | ---------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------ |
| id         | <数值>                             | 诊断ID：该任务记录的ID， 后续拉取诊断详情需要使用            | 15                                                     |
| task_id    | <字符串>                           | 任务ID：目前没有实际用途，只供界面显示                       | "D7LSiKVj"                                             |
| created_at | <字符串>                           | 任务的创建时间                                               | "2022-07-07 10:37:46"                                  |
| params     | [{请求报单参数}]                   | 该诊断任务新建的时候的参数。 具体的数据格式请参照 1.2.3      | { service_name: 'memgraph', instance: '172.16.139.8' } |
| result     | [{诊断请求结果}]                   | 该诊断任务的执行结果。 有2.3节进行描述                       | {dataset1: {…}, dataset2: {…}, …}                      |
| status     | <"Running" \| "Success" \| "Fail"> | Running:  诊断运行中Success: 诊断完毕Fail: 诊断异常前端可以采用友好的方式进行展示。 | "Running"                                              |

## 2.3 诊断请求结果

具体后端以及节点点诊断的返回结果，数据的格式以类表格的数据格式进行返回。 每个"表格"具有独立的数据ID， 版面的呈现通过数据ID与具体的数据进行绑定。

```json
{
  <数据ID>: {
    "data": [
      {<列名>:<值>, <列名>:<值>, <列名>:<值> , ...},
      ...
    ]
  }
  ...
}
```

| 字段名 | 值               | 说明                                        | 例子       |
| ------ | ---------------- | ------------------------------------------- | ---------- |
| 数据ID | <字符串>         | 该数据的唯一ID， 用于进行后续与界面的绑定   | "dataset1" |
| 列名   | <字符串>         | 同一"表格"行中的某一列的列名，列名不能重复  | "col1"     |
| 值     | <字符串 \| 数值> | 该行该列的数值。 支持字符串和数字化两种类型 | 56         |

```json
{
  "dataset1": {
    "data": [
      {"col1": 1, "col2":2, "col3":3},
      {"col1": 4, "col2":5, "col3":6},
    ]
    "dataset2": {
      "data": [
        {"col1": "data1", "col2":2, "col3":"data3"},
        {"col1": "data4", "col2":5, "col3":"data6"},
      ]
    }
  }
}
```

### 3.3.1列名特殊约定

为了方便列名与界面的绑定， 减少数据的关联描述。 某些列名保留用于默认用途。包括：

| 字段名   | 类型             | 说明                                                         | 例子                                                         |
| -------- | ---------------- | ------------------------------------------------------------ | ------------------------------------------------------------ |
| key      | <字符串>         | 在表格里， 作为该行数据的问题一标识在分类的数据， 例如饼图里， 作为分类的类别 | "col1"                                                       |
| value    | <字符串 \| 数值> | 作为数据的值，默认出现在统计表， 饼图里。也是后续进行数据的分类的目标字段。 | "56                                                          |
| time     | <字符串>         | 在时序数据图中， 作为X坐标出现。 为时间的格式。              | "2022-07-07 10:37:46"                                        |
| color    | <字符串>         | 默认该列的颜色， 如果面板有单独配置，颜色会被面板配置覆盖。  | "red"                                                        |
| children | <object>         | 级联数据，目前仅用于可折叠的表格                             | "data": [{          "col1": 1,          "col2":2,          "children":{              {"col1": 3, "col2":4,}          }    }] |

# 3. 前端版面控制规范

## 3.1 前端面板整体模型

一个完整的页面如下：

![img](https://intranetproxy.alipay.com/skylark/lark/0/2022/png/126169/1657177185053-ea5bd635-15cc-438d-8eca-0663c5e0be4c.png)

前端每个页面都由独立的一个JSON文件进行控制， 上述呈现仅供产考，最终的呈现风格和实现框架，有前端人员自我把控。JSON按目录结构存放， 目录结构也可以在前端用于诊断整体功能菜单的生成。 版面的拉取路径为：http://<域名>/resource/diagnose/<目录>/<版面描述文件>。 页面的模型文件可用于：

- 前端页面人员理解， 并由前端人员进行页面的硬编码，实现对应功能
- 不使用硬编码，前端人员根据规范实现动态渲染框架，框架根据页面的描述自动化渲染对应的页面 

目前可用的版面文件有：

- http://<域名>/resource/diagnose/memory/memgraph.json

同时提供了页面菜单的中文翻译文件。 路径在http://<域名>/resource/diagnose/locales.json。 分了目录部分可非目录部分。将在4章对服务器上的目录结构进行补充。 例如：

```json
{
    "folder": {
        "menu.diagnose.memory": "内存诊断中心"
    },
    "dashboard": {
        "menu.diagnose.memory.memgraph": "内存大盘"
    }
}
```

| 字段名      | 值           | 说明                                                         | 例子                                                         |
| ----------- | ------------ | ------------------------------------------------------------ | ------------------------------------------------------------ |
| servicename | <字符串>     | 该诊断页面对应的诊断服务名称，和文件名同名                   | "memgraph"                                                   |
| taskform    | [{任务参数}] | 诊断责任发起的任务参数描述。                                 | [{type: "text", name: "instance", initialValue: "", label: "实例IP",…}] |
| pannels     | [{<面板>}]   | 页面里所有版面的面本， 一个版面为一个基本呈现单位，例如一个表格或一个饼图。 | pannels:[{   "key": "procMemList",              "type": "table",              "title": "进程内存排序",             "datasource": "dataProcMemList"         }] |
| variables   | [{变量描述}] | 诊断页面变量描述， 前端呈现的方式为下拉框。客户进行下拉选择后， 页面将根据客户选择的情况， 响应的调整个面板的数据。 目前支持使用变量的地方为模板的标题和数据域。**「可选项」** | "variables": [ {      "key":"disk",      "label":"磁盘",      "datasource":"disks"  }], |

### 3.1.1 taskform 任务参数详情

目前仅仅支持文本框， 数字框，下拉框三种输入类型

| 字段名       | 值                                         | 说明                                             | 例子                                                         |
| ------------ | ------------------------------------------ | ------------------------------------------------ | ------------------------------------------------------------ |
| type         | <"text" \| "digit" \| "select">            | text：文本输入框 digit：数字输入框 select:选择框 | "text"                                                       |
| name         | <字符串>                                   | 表单元素的name字段， 也机是发送给后端的字段KEY   | "instance"                                                   |
| label        | <字符串>                                   | 前端显示的名称                                   | "实例"                                                       |
| initialValue | <字符串 \| 数值>                           | 输入框初始值「可选项」                           | 50                                                           |
| tooltips     | <字符串>                                   | 选项的tooltip，用于帮组使用人了解这个字段        | "请输入实例的IP"                                             |
| options      | [{ "value":<字符串>,"label":<字符串>},...] | 当type为选择框是，可选择的范围。                 | [{ "value":"TCP", "label":"TCP" },  { "value":"UDP", "label":"UDP", },  { "value":"ICMP", "label":"ICMP" }], |

### 3.1.2 pannels面板 详请

每一个面板都有独立的下属描述符独立进行描述， 默认在统一页面内， 面板之上而下进行排列， 如果需要横向排解多个面板， 侧需要先插叙row面板， row面板仅供布局使用， 目标面板作为row面板的children。

| 字段名      | 值                                                           | 说明                                                         | 例子                                                         |
| ----------- | ------------------------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------ |
| key         | <字符串>                                                     | 面板的唯一ID， 在统一页面内不允许重复。                      | "procMemList"                                                |
| type        | < "stat" \|"piechart" \|"table"  \|"timeseries" \|"svg" \| "flow"  \| "row" > | 任务面板类型stat:统计面板， 用于统计性的信息呈现 piechart: 饼图面板 table: 表格面板，支持树状折叠 timeseries：时间序列面板， 其实为曲线图 svg：SVG图片展示面板 flow: 流程图展示面板 row: 横向布局面板 | [{type: "text", name: "instance", initialValue: "", label: "实例IP",…}] |
| datasource  | <字符串>                                                     | 自定该面板所使用的数据ID。  数据源支持模板替换。例如"dataset${datesetID}"的设定， datesetID可以根据页面变量datesetID自动给该面板选择不同的数据用于动态呈现。  如果此时客户在界面上选择的datesetID想为1， 侧最终选择的数据集为dataset1。详情见3.1.3 | "dataset1"                                                   |
| title       | <字符串>                                                     | 面板的标题，标题支持模板替换。使用例如"数据面板${varName}" 的描述。 在呈现是自动根据全局变量进行替换。详情见3.1.3 | "数据面板1"                                                  |
| fieldConfig | 见下面的代码区                                               | 「可选字段」由于代码多个字段都是固定的， 因为不逐级展开， 只针对特定字段进行解读。 匹配原则： <key>：字符串， 如果数据源的值为文本， 当文本匹配<key>后命中规则 <threshold>: 数值， 如果数据的值为数值型， 当该数值大于<threshold>时匹配对应的规则。渲染原则： <color>: 颜色字段， 采用标准的WEB颜色规范，如:"red"、 "#FFFFFF"。标明数据中数据集中满足条件条件后所使用的颜色。<text>: 字符串，标明数据中数据集中满足条件条件的替换文本<unit>: 字符串，当数据为数值类型时，在前端显示时，自动在后面添加这个字符串，作为数据单位出现。 |                                                              |
| link        | "links": { <field>:{Link配置}, ... }                         | 「可选字段」<field> 所依附的数据列名，用户在对应的数据列说呈现的元素上点击时，执行对应的动作。如果field设定为defalut， 说明改动作依附在数据行上， 数据行对应的所有界面元素都执行该点击动作。 Link配置请看下表。 |                                                              |
| children    | [{面板}]                                                     | 「面板专用字段」row面板专用， 在下面描述的面板， 将在同一行呈现，平分屏幕宽度。 |                                                              |
| flowconfigs | nodes: [    { ... },    ... ], edges: [    { ... },    ... ] | 「面板专用字段」流程图专用配置， 具体的配置项，在流程图介绍章节具体描述。 |                                                              |

| 字段名 | 值                 | 说明                                                         | 例子 |
| ------ | ------------------ | ------------------------------------------------------------ | ---- |
| type   | <"pannel"\|"link"> | pannel: 弹出模式面板 link：跳掉指定的链接                    |      |
| name   | <字符串>           | 除popup类型外，显示下界面上的名称                            |      |
| pannel | {面板}             | pannel专用，嵌套面板配置，面板的配置与3.1.2描述完全一致。注意项：在弹出的面板中， 进行模板变量替换是， 除了要进行全局的变量替换外， 还要跟句当前的数据行的数据进行替换。 例如定义了一下的签到模板配置pannel: {     "key":"procPopup",      "type":"timeseries",     "title":"${col1}的详细数据",     "datasource":"dataTimeSeries" },如果当前的数据行包含col1这一列， 并且值为"disk"。则弹出面板的最终标题为“disk的详细数据” |      |
| link   | <URL>              | 「暂定标准」标准超链接， 链接的产生带上服务名称+任务ID+面板Key+本行数据行数据。如：http://test.com/?serverName=XX&id=XX&pannelKey=XXrow1=XX&row2=XXX |      |

```json
"fieldConfig": {
  "mappings": [{
    "type":"value", 
    "options": {
        <key>: {"color":<color>，text:<text>},
        ...
     }
  }],
  "thresholds": {
    "mode":"absolute",
    "steps": [
      {
        "color":<color>,
        "value":<threshold>
      }
      ...
    ]
  },
  "unit":<unit>
}
```

### 3.1.3 variables 页面全局变量详情

页面的全局变量是一个可选项， 供页面的用户做出一定的数据源选择权利。 录入一趟诊断可以诊断主机上所有的磁盘， 但用户在查看诊断结果是， 可以选出特定的、关心的磁盘。目前模板替换仅支持面板的标题和数据源。 请看考3.1.2的字段说明。

| 字段名     | 值       | 说明                                                         | 例子               |
| ---------- | -------- | ------------------------------------------------------------ | ------------------ |
| key        | <字符串> | 变量的标识，用于进行模板替换是作为唯一标识， 见3.1.2 中的datesetID例子 | "datesetID"        |
| label      | <字符串> | 页面显示的字符串                                             | "磁盘"             |
| datasource | <字符串> | 变量使用的数据集. 数据集使用如下的固定格式 { "key":<数字>, "value":<字符串> } | "dataset_var_disk" |

## 3.2 各类面板的数据映射关系

### 3.2.1 统计面板

统计面板可以显示摘要性的信息， 数据的每一行映射到一个摘要， 摘要按列排列。每一个摘要使用Key作为子标题， value作为再要的主体内容。下面案例同时展示了fieldConfig的使用。

![img](https://intranetproxy.alipay.com/skylark/lark/0/2022/png/126169/1657189549525-b2d7793b-3e4a-40ef-bc79-f0c1963a6b9e.png)

```json
{
  "key": "statDemo",
  "type": "stat",
  "title": "面板标题（对应pannel title字段）",
  "datasource": "stat_dataset",
  "fieldConfig": {
    "mappings": [{
      "type": "value", 
      "options": {
        "正常": { "color": "blue" },
        "危险": { "color": "red", },
        "success": { "color": "green", "text": "成功" }
      }
    }],
    "thresholds": {
      "mode": "absolute",
      "steps": [
        { "color": "red", "value": 5 },
        { "color": "green", "value": 0 }
      ]
    },
    "unit": "%"
  }
}
"stat_dataset": {
  "data": [
    { "key": "数据第一行（带color thresholds）", "value": 5.3 },
    { "key": "数据第二行（带color mapping）", "value": "正常" },
    { "key": "数据第三行（带color mapping）", "value": "危险" },
    { "key": "数据第四行（带text mapping）", "value": "success" }
  ]
},
```

### 3.2.2 饼图面板

面板使用key列作为系列的字段。 value作为对应的值。

![img](https://intranetproxy.alipay.com/skylark/lark/0/2022/png/126169/1657190559930-f7dd0ebe-909f-4248-b29b-ccb123fa8164.png)

```json
{
  "key": "pieChartDemo",
  "type": "piechart",
  "title": "标题对应title字段",
  "datasource": "pieChartDataSet"
}
"pieChartDataSet": {
  "data": [
    { "key": "系列1", "value": 1 },
    { "key": "系列2", "value": 2 },
    { "key": "系列3", "value": 5 },
    { "key": "系列4", "value": 2 }
  ]
}
```

### 3.2.3 表格面板

下面的表格展示带折叠、以及fieldConfig染色的综合表格应用。表格根据数据的列名自动生成表格的列名。 表格数据需要提供key字段作为行数据的标识。

![img](https://intranetproxy.alipay.com/skylark/lark/0/2022/png/126169/1657191623668-43015e11-5b91-454c-90f0-c207a6931776.png)

```json
{
  "key": "TableDemo",
  "type": "table",
  "title": "表格DEMO",
  "datasource": "tableDataset",
  "fieldConfig": {
    "thresholds": {
      "mode": "absolute",
      "steps": [
        { "color": "red", "value": 1000 },
        { "color": "green", "value": 0 }
      ]
    },
    "unit": "KB"
  }
}
"tableDataset": {
  "data": [
    {
      "key": 0, "第一列": "父第一行", "第二列": 200, "第三列": "300",
      children: [
        { "key": 1, "第一列": "子第一行", "第二列": "500", "第三列": "600"},
        { "key": 2, "第一列": "子第二行", "第二列": "800", "第三列": "900" }
      ]
    },
    { "key": 3, "第一列": "父第二行", "第二列": 1100, "第三列": "1120" }
  ]
}
```

### 3.2.4 时序图面板

数据的Time列作为X坐标。数据的其他列均作为不同系列的数据。 列名为数据系列名。

![img](https://intranetproxy.alipay.com/skylark/lark/0/2022/png/126169/1657192065874-7d939ff9-3c60-40a5-ad01-1eb99e022f4a.png)

```json
    {
      "key": "timeseriesdemo",
      "type": "timeseries",
      "title": "时序图面板示例",
      "datasource": "TimeSeriesDataSet"
    },
    "TimeSeriesDataSet": {
      "data": [
        { "time": "2022-06-29 10:01:40", "webserver1": 33, "webserver2": 44, "webserver3": 20 },
        { "time": "2022-06-29 10:02:40", "webserver1": 29, "webserver2": 50, "webserver3": 21 },
        { "time": "2022-06-29 10:03:40", "webserver1": 10, "webserver2": 60, "webserver3": 22 },
        { "time": "2022-06-29 10:04:40", "webserver1": 20, "webserver2": 55, "webserver3": 23 },
        { "time": "2022-06-29 10:05:40", "webserver1": 33, "webserver2": 30, "webserver3": 30 },
        { "time": "2022-06-29 10:06:40", "webserver1": 35, "webserver2": 20, "webserver3": 31 },
        { "time": "2022-06-29 10:07:40", "webserver1": 40, "webserver2": 10, "webserver3": 40 },
        { "time": "2022-06-29 10:08:40", "webserver1": 80, "webserver2": 35, "webserver3": 41 },
        { "time": "2022-06-29 10:09:40", "webserver1": 60, "webserver2": 60, "webserver3": 50 },
        { "time": "2022-06-29 10:10:40", "webserver1": 67, "webserver2": 70, "webserver3": 60 },
        { "time": "2022-06-29 10:11:40", "webserver1": 50, "webserver2": 65, "webserver3": 30 },
        { "time": "2022-06-29 10:12:40", "webserver1": 40, "webserver2": 44, "webserver3": 44 },
        { "time": "2022-06-29 10:13:40", "webserver1": 30, "webserver2": 33, "webserver3": 20 },
        { "time": "2022-06-29 10:14:40", "webserver1": 20, "webserver2": 10, "webserver3": 10 },
        { "time": "2022-06-29 10:15:40", "webserver1": 33, "webserver2": 44, "webserver3": 20 },
        { "time": "2022-06-29 10:16:40", "webserver1": 29, "webserver2": 50, "webserver3": 21 },
        { "time": "2022-06-29 10:17:40", "webserver1": 10, "webserver2": 60, "webserver3": 22 },
        { "time": "2022-06-29 10:18:40", "webserver1": 20, "webserver2": 55, "webserver3": 23 },
        { "time": "2022-06-29 10:19:40", "webserver1": 33, "webserver2": 30, "webserver3": 30 },
        { "time": "2022-06-29 10:20:40", "webserver1": 35, "webserver2": 20, "webserver3": 31 },
        { "time": "2022-06-29 10:21:40", "webserver1": 40, "webserver2": 10, "webserver3": 40 },
        { "time": "2022-06-29 10:22:40", "webserver1": 80, "webserver2": 35, "webserver3": 41 },
        { "time": "2022-06-29 10:23:40", "webserver1": 60, "webserver2": 60, "webserver3": 50 },
        { "time": "2022-06-29 10:24:40", "webserver1": 67, "webserver2": 70, "webserver3": 60 },
        { "time": "2022-06-29 10:25:40", "webserver1": 50, "webserver2": 65, "webserver3": 30 },
        { "time": "2022-06-29 10:26:40", "webserver1": 40, "webserver2": 44, "webserver3": 44 },
        { "time": "2022-06-29 10:27:40", "webserver1": 30, "webserver2": 33, "webserver3": 20 },
        { "time": "2022-06-29 10:28:40", "webserver1": 20, "webserver2": 10, "webserver3": 10 }
      ]
    },
```

### 3.2.5 SVG图展示面板

目前的使用场合为调度的火焰图展示。 

![img](https://intranetproxy.alipay.com/skylark/lark/0/2022/png/126169/1657192251752-e3a8e0a9-b7a2-4d4a-8a92-3e2e91937e16.png)

```json
{
  "key": "火焰图",
  "type": "svg",
  "title": "调度火焰图",
  "datasource": "svgdata"
}
"svgdata": {
  "data": [
    { "key": 0, "value": "/api/v1/tasks/<task_id>/svg/" },
  ]
}
"framegrap":"XXXXX"
```

### 3.2.6 流程图展示面板

流程图的总体设计采用的AntV的X6引擎。 在进行页面模型JSON对流程图进行定性。 用数据集进行填充。

NODE规定:目前NODE节点仅仅支持一种样式。 已经把大量参与作为默认值写入AntV的节点默认配置。 如果你需要重新开发， 或者采用其他的流程图框架 ，请根据实际的情况进行默认配置，提供相类似的节点模型。 节点接受三个参数。模型与数据集通过模型的ID与数据集的KEY字段进行匹配。三个参数分别为

- Title 显示在左上角
- value 显示在右上角
- text 显示在节点下部

NODE连接点规定：在NODE内部的展示位置请看下图。 每个节点有五个箭头的链接点， NODE整体作为一个， 外包络的上下左右分别各有一个。



![img](https://intranetproxy.alipay.com/skylark/lark/0/2022/png/126169/1657192986806-f40b3585-d859-49d1-b3a5-55a0afb6124f.png)

模型的描述由flowconfigs字段进行配置， 分别需要配置节点（nodes）与边（edges）

节点部分的模型控制参数有：

- - id: 节点ID，用于边的关联以及填充数据的关联 
  - x: 节点的左上角X坐标
  - y: 节点的左上角Y坐标
  - width: 「可选」节点的宽度
  - height: 「可选」节点高度

边的模型控制参数有：

- - source：边的起点
  - target：变得中点。如果需要制定连点到外包络的上下左右， 侧使用{ cell: '位置展示', port: 'top' }方式。

下面的例子， 我们给每一个节点编写的一个弹出的pannel， 再用户点击节点时，显示这个节点的详细数据。

```json
{
  "key": "flowchart",
  "type": "flow",
  "title": "flow测试",
  "flowconfigs": {
    nodes: [
      { id: '内核驻留', x: 40, y: 40, },
      { id: '位置展示', x: 40, y: 200, },
    ],
    edges: [
      { source: '内核驻留', target: { cell: '位置展示', port: 'top' } },
    ]
  },
  "datasource": "dataFlow",
  "links": {
    defalut: {
      type: "popup",
      name: "popup",
      pannel: {
        "key": "procPopup",
        "type": "timeseries",
        "title": "${key}的详细数据",
        "datasource": "dataTimeSeries"
      }
    }
  }
}
"dataFlow": {
  "data": [
    { "key": "内核驻留", "title": "内核驻留", "text": "Max:350 AVA:300 Min:100" },
    { "key": "位置展示", "title": "Title位置", "value": "value位置", "text": "text位置" },
  ]
}
```

### 3.2.7 布局面板

布局满足主要用与把屏幕的一行进行等分，分别放入不同的横排页面。 本身不显示数据。

![img](https://intranetproxy.alipay.com/skylark/lark/0/2022/png/126169/1657194515464-39325df4-a1be-40e7-9b06-c897a7b57143.png)

```json
{
  "key": "pieRow",
  "type": "row",
  "title": "测试行",
  "datasource": "",
  "children": [
    {
      "key": "pieChartDemo",
      "type": "piechart",
      "title": "标题对应title字段",
      "datasource": "pieChartDataSet"
    },
    {
      "key": "pieChartDemo2",
      "type": "piechart",
      "title": "内核内存",
      "datasource": "dataKerMem"
    },
    {
      "key": "pieChartDemo3",
      "type": "piechart",
      "title": "用户态内存",
      "datasource": "dataUserMem"
    },
  ]
}
```

#  4  版面布局文件后台目录规范「只需功能提供者关注」

对于版面布局的模型文件， 在服务器内目录结构如下：

```plain
源码路径：
sysom_web/public/resource/
└── diagnose
    ├── cpu
    ├── io
    ├── locales.json
    ├── memory
    │   └── memgraph.json
    └── net
    
服务器路径：
/usr/local/sysom/server/target/sysom_web/resource/diagnose/
```

1. 在对应的子系统目录内存新建对应的模型（json）文件：<serviceName>.json。serviceName为这个功能的功能名， 并出现在最后网页的URL路径里。 请谨慎命名。
2. 在locales.json的dashboard章节，添加中文翻译内容。subsystem与目录名对应， 目前服务器已经预先建好了cpu、io、memory、net四个目录。

```json
{
  "folder": {
    "menu.diagnose.memory": "内存诊断中心",
    "menu.diagnose.io": "内存诊断中心",
    "menu.diagnose.net": "内存诊断中心",
    "menu.diagnose.cpu": "内存诊断中心"
  },
  "dashboard": {
    "menu.diagnose.memory.memgraph": "内存大盘"
    "menu.diagnose.<subsystem>.<serviceName>": "内存大盘"   <---- 新添加一行
  }
}
```
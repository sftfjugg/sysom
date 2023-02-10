import { useRequest } from 'umi';
import { Spin } from 'antd';
import ProCard from '@ant-design/pro-card';
import { Column, Bar, Line } from '@ant-design/plots';
import CycleLineLable from "./CycleLineLable"
import { getHomeData } from "./service"
import ArcLable from './ArcLable';
import DashLable from './DashLable';
import CveLable from './CveLable';


const Home = (props) => {
  const { data, error, loading } = useRequest(getHomeData);

  if (loading)
    return <Spin tip="Loading..."></Spin>

  if (error)
    return <div> 数据加载出错， 请检查后台返回</div>

  const baseconfig = {
    xField: 'date',
    yField: 'value',
    height: 120,
    autoFit: false,
    xAxis: {
      label: { autoHide: false, },
      line: { style: { stroke: "#ffffff" } }
    },
    maxColumnWidth: 8,
    dodgePadding: 2,
    columnStyle: { radius: [20, 20, 0, 0], fill: 'l(270) 0:#39E1CF  1:#1E80F1' },
    yAxis: {
      label: null,
      grid: { line: { style: { stroke: "#2c2c2c" } } },
      line: { style: { stroke: "#ffffff" } }
    },
  };

  const NumbersOfMachinesTrendsConfig = { ...baseconfig, data: data.numberOfPhysicalMachines }
  const kernelVersionStatisticsConfig = {
    ...baseconfig, xField: 'version', data: data.kernelVersionStatistics,
    columnStyle: { radius: [20, 20, 0, 0], fill: 'l(270) 0:#D55E6E  1:#E1B276' }
  }
  const userNumbersTrendsConfig = { ...baseconfig, data: data.userNumbersTrends }
  const logsTrendsConfig = {
    ...baseconfig, data: data.logsTrends, pattern: {
      type: 'line',
      cfg: {
        backgroundColor: "#1E80F1",
        rotation: 0,
        lineWidth: 4,
        strokeOpacity: 1,
        stroke: "black",
        spacing: 10
      }
    }
  }
  const cpuAndMemUtilizationConfig = {
    data: [...data.cpuUtilization.map(i => ({ ...i, type: "cpu" })), ...data.memoryUtilization.map(i => ({ ...i, type: "mem" }))],
    xField: 'value',
    yField: 'date',
    seriesField: 'type',
    isGroup: true,
    barStyle: { radius: [3, 3, 0, 0] },
    maxBarWidth: 5,
    yAxis: { label: { autoHide: false } },
    xAxis: { tickCount: 10, grid: { line: { style: { stroke: "#2c2c2c" } } } },
    height: 200,
  };
  const diskUtilizationConfig = { ...baseconfig, data: data.diskUtilization }
  const networkUtilizationConfig = { ...baseconfig, data: data.networkUtilization }
  const securityOperationsTrendsConfig = {
    data: data.securityOperationsTrends,
    xField: 'date',
    yField: 'value',
    height: 160,
    seriesField: 'type',
    yAxis: {
      grid: { line: { style: { stroke: "#2c2c2c" } } }
    },
    legend: {
      position: 'top',
    },
    smooth: true,
  }
  const carshTrendsConfig = { ...baseconfig, isGroup: true, seriesField: 'version', data: data.carshTrends, columnStyle: null }


  return (
    <>
      <ProCard style={{ flexGrow: 1 }} bodyStyle={{ flexGrow: 1 }} gutter={8} ghost>
        <ProCard style={{ height: "100%" }} direction="column" gutter={[0, 8]} ghost>
          <ProCard title="主机中心" subTitle="主机概述" >
            {/*饼图*/}
            <div style={{ display: "flex" }}>
              <div style={{ flexBasis: "20%" }}>
                <ArcLable arcs={[{ startAngle: 0, endAngle: 270, color: "#222B4F" }]} value={data.hostOverview.numberOfClusters} title="集群数" />
              </div>
              <div style={{ flexBasis: "20%" }}>
                <ArcLable arcs={[{ startAngle: -150, endAngle: 120, color: "#222B4F" }]} value={data.hostOverview.numberOfHosts} title="主机数" />
              </div>
              <div style={{ flexBasis: "20%" }}>
                <ArcLable arcs={[{ startAngle: -225, endAngle: 45, color: "#222B4F" }]} value={data.hostOverview.numberOfOnlineMachines} title="在线机器数" />
              </div>
              <div style={{ flexBasis: "20%" }}>
                <ArcLable arcs={[{ startAngle: -180, endAngle: 90, color: "#222B4F" }]} value={data.hostOverview.numberOfOfflineMachines} title="离线机器数" />
              </div>
              <div style={{ flexBasis: "20%" }}>
                <ArcLable arcs={[{ startAngle: -270, endAngle: 0, color: "#222B4F" }]} warning value={data.hostOverview.numberOfAbnormalMachines} title="异常机器数" />
              </div>
            </div>

            {/*分割线*/}
            <div style={{ width: "100%", height: "5px", background: "black", borderRadius: "10px" }}></div>

            {/*柱状图*/}

            <div style={{ display: "flex" }}>
              <div style={{ flexBasis: "50%", marginRight: "8px" }}>
                <div style={{ display: "flex", marginTop: "16px", marginBottom: "8px" }}>
                  <div style={{ marginRight: "8px" }}>物理机数 </div>
                  <div style={{ fontSize: "xx-small", color: "#1E80F1", borderStyle: "solid", borderRadius: "10px", borderColor: "#1E80F1" }}> 近三个月</div>
                </div>
                <Column {...NumbersOfMachinesTrendsConfig} />
              </div>
              <div style={{ flexBasis: "50%", marginLeft: "8px" }}>
                <div style={{ marginTop: "16px", marginBottom: "8px" }}>内核版本分布 </div>
                <Column {...kernelVersionStatisticsConfig} />
              </div>
            </div>

          </ProCard>
          <ProCard title="日志中心" subTitle="日志概述" >
            <div>日记中心用于记录用户登录登出等操作，可协助您完成用户行为审计</div>
            <div style={{ display: "flex", justifyContent: "space-around" }}>
              <div style={{ width: "100px", maxWidth: "160px", display: "flex", alignItems: "center", flex: "auto", margin: "16px 40px 16px 0px" }}>
                <div style={{ writingMode: "vertical-lr", margin: "8px", paddingTop: "8px", borderRadius: "10px", paddingBottom: "8px", background: "#2C2C2C" }} >日记条数</div>
                <CycleLineLable value={data.logOverview.numberOfLogs} />
              </div>
              <div style={{ width: "100px", maxWidth: "160px", display: "flex", alignItems: "center", flex: "auto" }}>
                <div style={{ writingMode: "vertical-lr", margin: "8px", paddingTop: "8px", borderRadius: "10px", paddingBottom: "8px", background: "#2C2C2C" }} >用户总数</div>
                <CycleLineLable value={data.logOverview.totalNumberOfUsers} />
              </div>
              <div style={{ width: "100px", maxWidth: "160px", display: "flex", alignItems: "center", flex: "auto", margin: "16px 0px 16px 40px" }}>
                <div style={{ writingMode: "vertical-lr", margin: "8px", paddingTop: "8px", borderRadius: "10px", paddingBottom: "8px", background: "#2C2C2C" }} >异常日记</div>
                <CycleLineLable value={data.logOverview.numberOfAbnormalLogs} warning />
              </div>
            </div>

            {/*分割线*/}
            <div style={{ width: "100%", height: "5px", background: "black", borderRadius: "10px" }}></div>

            {/*柱状图*/}
            <div style={{ display: "flex" }}>
              <div style={{ flexBasis: "50%", marginRight: "8px" }}>
                <div style={{ display: "flex", marginTop: "16px", marginBottom: "8px" }}>
                  <div style={{ marginRight: "8px" }}>用户数据趋势图</div>
                  <div style={{ fontSize: "xx-small", color: "#1E80F1", borderStyle: "solid", borderRadius: "10px", borderColor: "#1E80F1" }}> 近三个月</div>
                </div>
                <Column {...userNumbersTrendsConfig} />
              </div>
              <div style={{ flexBasis: "50%", marginLeft: "8px" }}>
                <div style={{ display: "flex", marginTop: "16px", marginBottom: "8px" }}>
                  <div style={{ marginRight: "8px" }}>日记条数趋势图</div>
                  <div style={{ fontSize: "xx-small", color: "#1E80F1", borderStyle: "solid", borderRadius: "10px", borderColor: "#1E80F1" }}> 近三个月</div>
                </div>
                <Column {...logsTrendsConfig} />
              </div>
            </div>
          </ProCard>
        </ProCard>
        <ProCard title="资源中心" subTitle="资源概述">
          <div style={{ display: "flex" }}>
            <div style={{ flexBasis: "25%", margin: "4px" }}>
              <ArcLable subArcColor={"#222B4F"} value={data.resourceOverview.totalNumberOfCPUs} title="CPU总数" />
            </div>
            <div style={{ flexBasis: "25%", margin: "4px" }}>
              <ArcLable subArcColor={"#222B4F"} value={data.resourceOverview.totalMemory} title="内存总数" />
            </div>
            <div style={{ flexBasis: "25%", margin: "4px" }}>
              <ArcLable subArcColor={"#222B4F"} value={data.resourceOverview.totalDiskSize} title="磁盘总大小" />
            </div>
            <div style={{ flexBasis: "25%", margin: "4px" }}>
              <ArcLable subArcColor={"#432F2A"} value={data.resourceOverview.totalNetworkBandwidth} title="网卡总带宽" />
            </div>
          </div>

          {/*分割线*/}
          <div style={{ width: "100%", height: "5px", background: "black", borderRadius: "10px" }}></div>

          {/*仪表盘*/}
          <div style={{ margin: "8px 0px" }}>资源利用率</div>
          <div style={{ display: "flex", justifyContent: "space-around" }}>
            <div style={{ width: "100px", maxWidth: "160px", display: "flex", alignItems: "center", flex: "auto", marginRight: "16px" }}>
              <DashLable value={data.resourceUtilization.cpuUtilization} title="CPU利用率" />
            </div>
            <div style={{ width: "100px", maxWidth: "160px", display: "flex", alignItems: "center", flex: "auto", marginRight: "16px" }}>
              <DashLable value={data.resourceUtilization.memoryUtilization} title="内存利用率" />
            </div>
            <div style={{ width: "100px", maxWidth: "160px", display: "flex", alignItems: "center", flex: "auto", marginRight: "16px" }}>
              <DashLable value={data.resourceUtilization.diskUtilization} title="磁盘利用率" />
            </div>
            <div style={{ width: "100px", maxWidth: "160px", display: "flex", alignItems: "center", flex: "auto" }}>
              <DashLable value={data.resourceUtilization.networkUtilization} title="网络利用率" />
            </div>
          </div>
          <div style={{ display: "flex", marginTop: "16px", marginBottom: "8px" }}>
            <div style={{ marginRight: "8px" }}>CPU/内存利用率</div>
            <div style={{ fontSize: "xx-small", color: "#1E80F1", borderStyle: "solid", borderRadius: "10px", borderColor: "#1E80F1" }}> 近三个月</div>
          </div>
          <div >
            <Bar {...cpuAndMemUtilizationConfig} />
          </div>
          <div style={{ display: "flex" }}>
            <div style={{ flexBasis: "50%", marginRight: "8px" }}>
              <div style={{ display: "flex", marginTop: "20px", marginBottom: "8px" }}>
                <div style={{ marginRight: "8px" }}>网络利用率</div>
                <div style={{ fontSize: "xx-small", color: "#1E80F1", borderStyle: "solid", borderRadius: "10px", borderColor: "#1E80F1" }}> 近三个月</div>
              </div>
              <Column {...networkUtilizationConfig} />
            </div>
            <div style={{ flexBasis: "50%", marginLeft: "8px" }}>
              <div style={{ display: "flex", marginTop: "16px", marginBottom: "8px" }}>
                <div style={{ marginRight: "8px" }}>磁盘利用率</div>
                <div style={{ fontSize: "xx-small", color: "#1E80F1", borderStyle: "solid", borderRadius: "10px", borderColor: "#1E80F1" }}> 近三个月</div>
              </div>
              <Column {...diskUtilizationConfig} />
            </div>
          </div>

        </ProCard>
        <ProCard direction="column" gutter={[0, 8]} ghost>
          <ProCard title="安全中心" subTitle="安全概述" >
            <div style={{ display: "flex", justifyContent: "space-around" }}>
              <div style={{ flexBasis: "25%", margin: "4px" }}>
                <ArcLable withLine textColor="#39E1CF" value={data.CVEOverview.safetyRating.score}
                  subValue={data.CVEOverview.safetyRating.type} title="安全评分" />
              </div>
              <div style={{ display: "flex", marginTop: "24px" }}>
                <div><CveLable /></div>
                <div style={{ textAlign: "center", marginRight: "12px" }}>
                  <div style={{ display: "flex", marginBottom: "12px" }}>
                    <div>
                      <div style={{ fontSize: "xx-small", }}>
                        紧急
                      </div>
                      <div style={{ textAlign: "center", width: "3em", fontSize: "xx-small", margin: "4px", color: "#1E80F1", borderStyle: "solid", borderRadius: "2px", borderColor: "#1E80F1" }}>
                        {data.CVEOverview.CVETobeFixed.Critical}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: "xx-small", }}>
                        高危
                      </div>
                      <div style={{ textAlign: "center", width: "3em", fontSize: "xx-small", margin: "4px", color: "#1E80F1", borderStyle: "solid", borderRadius: "2px", borderColor: "#1E80F1" }}>
                        {data.CVEOverview.CVETobeFixed.Important}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: "xx-small", }}>
                        中危
                      </div>
                      <div style={{ textAlign: "center", width: "3em", fontSize: "xx-small", margin: "4px", color: "#1E80F1", borderStyle: "solid", borderRadius: "2px", borderColor: "#1E80F1" }}>
                        {data.CVEOverview.CVETobeFixed.Moderate}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: "xx-small", }}>
                        低危
                      </div>
                      <div style={{ textAlign: "center", width: "3em", fontSize: "xx-small", margin: "4px", color: "#1E80F1", borderStyle: "solid", borderRadius: "2px", borderColor: "#1E80F1" }}>
                        {data.CVEOverview.CVETobeFixed.Low}
                      </div>
                    </div>
                  </div>
                  <span> 待修复漏洞</span>
                </div>

                <div style={{ textAlign: "center" }}>
                  <div style={{ display: "flex", marginBottom: "12px" }}>
                    <div>
                      <div style={{ fontSize: "xx-small", marginRight: "2px" }}>
                        紧急
                      </div>
                      <div style={{ textAlign: "center", width: "3em", fontSize: "xx-small", margin: "4px", color: "#1E80F1", borderStyle: "solid", borderRadius: "2px", borderColor: "#1E80F1" }}>
                        {data.CVEOverview.CVETobeFixed.Critical}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: "xx-small", marginRight: "2px" }}>
                        高危
                      </div>
                      <div style={{ textAlign: "center", width: "3em", fontSize: "xx-small", margin: "4px", color: "#1E80F1", borderStyle: "solid", borderRadius: "2px", borderColor: "#1E80F1" }}>
                        {data.CVEOverview.CVETobeFixed.Important}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: "xx-small", marginRight: "2px" }}>
                        中危
                      </div>
                      <div style={{ textAlign: "center", width: "3em", fontSize: "xx-small", margin: "4px", color: "#1E80F1", borderStyle: "solid", borderRadius: "2px", borderColor: "#1E80F1" }}>
                        {data.CVEOverview.CVETobeFixed.Moderate}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: "xx-small", marginRight: "2px" }}>
                        低危
                      </div>
                      <div style={{ textAlign: "center", width: "3em", fontSize: "xx-small", margin: "4px", color: "#1E80F1", borderStyle: "solid", borderRadius: "2px", borderColor: "#1E80F1" }}>
                        {data.CVEOverview.CVETobeFixed.Low}
                      </div>
                    </div>
                  </div>
                  <span > 历史修复漏洞</span>
                </div>
              </div>

            </div>
            <div style={{ display: "flex", marginTop: "16px", marginBottom: "8px" }}>
              <div style={{ marginRight: "8px" }}>安全运营趋势</div>
              <div style={{ fontSize: "xx-small", color: "#1E80F1", borderStyle: "solid", borderRadius: "10px", borderColor: "#1E80F1" }}> 近三个月</div>
            </div>
            <Line {...securityOperationsTrendsConfig} />
          </ProCard>
          <ProCard style={{ height: "100%" }} title="宕机中心" subTitle="宕机概述" >
            <div style={{ display: "flex", justifyContent: "space-around" }}>
              <div style={{ writingMode: "vertical-lr", margin: "8px", paddingTop: "8px", borderRadius: "10px", paddingBottom: "8px", background: "#2C2C2C" }} >核心指标</div>
              <div style={{ flexBasis: "20%" }}>
                <ArcLable arcs={[{ startAngle: -150, endAngle: 120, color: "#222B4F" }]} warning value={data.CarshOverview.monthlyCrashTimes} title="近30天宕机数" />
              </div>
              <div style={{ flexBasis: "20%" }}>
                <ArcLable arcs={[{ startAngle: -225, endAngle: 45, color: "#222B4F" }]} warning value={data.CarshOverview.weeklyCrashTimes} title="近7天宕机数" />
              </div>
              <div style={{ flexBasis: "20%" }}>
                <ArcLable arcs={[{ startAngle: -180, endAngle: 90, color: "#222B4F" }]} warning value={data.CarshOverview.monthlyCrashRate} title="月宕机率" />
              </div>
              <div style={{ flexBasis: "20%" }}>
                <ArcLable arcs={[{ startAngle: -270, endAngle: 0, color: "#222B4F" }]} warning value={data.CarshOverview.weeklyCrashRate} title="日宕机率" />
              </div>
            </div>

            <div style={{ display: "flex", marginTop: "16px", marginBottom: "8px" }}>
              <div style={{ marginRight: "8px" }}>宕机趋势</div>
              <div style={{ fontSize: "xx-small", color: "#1E80F1", borderStyle: "solid", borderRadius: "10px", borderColor: "#1E80F1" }}> 近三个月</div>
            </div>
            <Column {...carshTrendsConfig} />

          </ProCard>
        </ProCard>
      </ProCard>

    </>
  );
};

export default Home;

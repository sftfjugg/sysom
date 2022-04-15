import { ArrowRightOutlined } from "@ant-design/icons";
import ProForm, { ProFormSelect } from "@ant-design/pro-form";
import { useState } from "react";
import ProCard from "@ant-design/pro-card";
import RcResizeObserver from "rc-resize-observer";
import styles from "../../diagnose.less";

const DiagTitle = (props) => {
  const opt = [];
  const option = props.dataSour.filter((item, index) => {
    opt.push({
      value: index,
      label: item.diskname,
    });
  });

  return (
    <ProForm
      initialValues={{
        name: opt[0].label,
        useMode: opt[0].value,
      }}
      className={styles.cipan}
      submitter={{
        resetButtonProps: {
          style: {
            display: "none",
          },
        },
        submitButtonProps: {
          style: {
            display: "none",
          },
        },
      }}
    >
      <ProFormSelect
        onChange= {props.diskChange}
        options={opt}
        width="sm"
        name="useMode"
      />
    </ProForm>
  );
};

const DiagExtra = (props) => {
  return (
    <>
      <div className={styles.titname}>诊断ID: </div>
      <div className={styles.titneir}>{props.dataSour.task_id}</div>
      <div className={styles.titname}>诊断时间: </div>
      <div className={styles.titneir}>{props.dataSour.created_at}</div>
    </>
  );
};

export default (props) => {
  const [responsive, setResponsive] = useState(false);

  //Find the index of The longest delay
  const { maxIdx } = props.data[props.diskIdx].delays.reduce((max, currentValue, currentIndex) => {
    return (parseFloat(currentValue.percent) < max.maxVal) ? max :
      { maxVal: parseFloat(currentValue.percent), maxIdx: currentIndex }
  }, { maxVal: -1, maxIdx: -1 })

  const tooltips = {
    "诊断链路": "IO在一个生命周期中，先后经历OS内核IO通用块层软件 —> OS内核磁盘驱动软件 —> 磁盘本身 —> OS内核中IO消亡流程",
    "os(block)": "指IO在OS内核通用块层部分的耗时（时间单位：us）",
    "os(driver)": "指IO在OS内核磁盘驱动部分的耗时（时间单位：us）",
    "disk": "指IO在硬件磁盘侧的耗时（时间单位：us）",
    "os(complete)": "指IO在OS内核中，IO消亡流程的耗时（时间单位：us）"
  }

  return (
    <RcResizeObserver
      key="resize-observer"
      onResize={(offset) => {
        setResponsive(offset.width < 596);
      }}
    >
      <ProCard
        title={[<DiagTitle dataSour={props.data} diskChange={props.diskChange} key="diagtitle" />]}
        extra={[<DiagExtra dataSour={props.recorded} key="diagextra" />]}
        split={responsive ? "horizontal" : "vertical"}
        headerBordered
      >
        <ProCard title="诊断链路" tooltip={tooltips["诊断链路"]} gutter={8}>
          {props.data[props.diskIdx].delays.map((item, index) => {
            const length = props.data[props.diskIdx].delays.length
            return (
              <ProCard key={index + "wl"}>
                <ProCard
                  colSpan={{ md: 20 }}
                  key={index}
                  title={item.component}
                  tooltip={tooltips[item.component]}
                  headStyle={{ justifyContent: 'center' }}
                  bodyStyle={index == maxIdx ? { backgroundColor: "#CC0033" } : {}}
                  layout="center"
                  bordered
                  headerBordered
                  direction="column"
                >
                  <div className={styles.ioDeleyPercentage}>
                    {item.percent}
                  </div>
                  <div>Max: {item.max}</div>
                  <div>AVG: {item.avg}</div>
                  <div>MIN: {item.min}</div>
                </ProCard>
                {index !== (length - 1) ? (
                  <ProCard
                    colSpan={{ md: 4 }}
                    layout="center"
                    className={styles.arrow}
                    direction="column"
                  >
                    <ArrowRightOutlined className={styles.iconcard} />
                  </ProCard>
                ) : (
                  <></>
                )}
              </ProCard>
            );
          })}
        </ProCard>
      </ProCard>
    </RcResizeObserver>
  );
};

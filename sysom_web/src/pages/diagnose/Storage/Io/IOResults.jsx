import { ArrowRightOutlined } from "@ant-design/icons";
import ProForm, { ProFormSelect } from "@ant-design/pro-form";
import { useState } from "react";
import { useModel } from "umi";
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
  const { count, handleCount } = useModel("diagnose", (model) => ({
    count: model.count,
    handleCount: model.handleCount,
  }));

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
        onChange={(val) => handleCount(val)}
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
  const { count, handleCount } = useModel("diagnose", (model) => ({
    count: model.count,
    handleCount: model.handleCount,
  }));

  //Find the index of The longest delay
  const { maxIdx } = props.data[count].delays.reduce((max, currentValue, currentIndex) => {
    return (parseFloat(currentValue.percent) < max.maxVal) ? max :
      { maxVal: parseFloat(currentValue.percent), maxIdx: currentIndex }
  }, { maxVal: -1, maxIdx: -1 })

  return (
    <RcResizeObserver
      key="resize-observer"
      onResize={(offset) => {
        setResponsive(offset.width < 596);
      }}
    >
      <ProCard
        title={[<DiagTitle dataSour={props.data} key="diagtitle" />]}
        extra={[<DiagExtra dataSour={props.recorded} key="diagextra" />]}
        split={responsive ? "horizontal" : "vertical"}
        headerBordered
      >
        <ProCard title="诊断链路" gutter={8}>
          {props.data[count].delays.map((item, index) => {
            const length = props.data[count].delays.length
            return (
              <ProCard key={index + "wl"}>
                <ProCard
                  colSpan={{ md: 20 }}
                  key={index}
                  title={item.component}
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

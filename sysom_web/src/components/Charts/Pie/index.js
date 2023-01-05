import React, { useEffect } from 'react';
import * as echarts from 'echarts/core';
import {
  TooltipComponent,
  GridComponent,
  LegendComponent,
  ToolboxComponent,
} from 'echarts/components';
import {
  PieChart
} from 'echarts/charts';
import {
  CanvasRenderer
} from 'echarts/renderers';

echarts.use(
  [TooltipComponent, GridComponent, PieChart, CanvasRenderer,LegendComponent,ToolboxComponent]
);

function PieCharts({id, width, height, padding, radius, options}) {
  let myChart;
  useEffect(() => {
    if (!myChart) {
      myChart = echarts.init(document.getElementById(id));
    }
    myChart.clear();
    const option = {
      tooltip : {
        show: false,
        trigger: 'item',
      },
      legend: {
        orient: 'vertical',
        x: '70%',
        y: 'center',
        icon: 'circle',
        itemWidth: 8,
        itemHeight: 8,
        borderWidth: 0,
        borderColor: 'transform',
        textStyle: {
          color: 'rgba(255,255,255,0.65)', // 图例文字颜色
        },
        // itemGap: 10,
        formatter: function(name){
          let target;
          for(let i=0;i<options.length;i++){
            if(options[i].name===name){
              target=options[i].value
            }
          }
          let arr=[name+' ｜ '+(target?target:'0')]
          return arr;
        },
      },
      series: [
        {
          type: 'pie',
          radius: radius || ['50%', '70%'],
          avoidLabelOverlap: false,
          label: {
            show: false,
            position: 'center',
            color: '#fff',
            formatter: '{b}\n{d}%',
          },
          color: options.map((i)=>i.color),
          grid: {
            left: '100px',
            right: '20px',
            containLaabel: true
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 16,
              fontWeight: 'normal'
            }
          },
          itemStyle: {
            borderRadius: 0,
            borderColor: 'transform',
            borderWidth: 1.5,
          },
          labelLine: {
            show: false
          },
          data: options,
        }
      ]
    };
    myChart.setOption(option);
  }, [options]);

  return (
    <div id={id} style={{ width: width || '100%', height: height || '100%', boxSizing: 'border-box', padding: padding || '0', }}>
    </div>
  );
}

export default PieCharts;

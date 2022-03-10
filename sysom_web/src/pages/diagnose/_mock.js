import { parse } from "url";

const waitTime = (time = 100) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, time);
  });
};

function getRandIP() {
  let ip = [];
  for (let i = 0; i < 3; i++) {
    ip = ip + Math.floor(Math.random() * 256) + ".";
  }
  ip = ip + Math.floor(Math.random() * 256);
  return ip;
}

const genList = (current, pageSize) => {
  const tableListDataSource = [];

  for (let i = 0; i < pageSize; i += 1) {
    const index = (current - 1) * 10 + i;
    const name = Math.random().toString(36).slice(-6);
    const packet = Math.ceil(Math.random() * 10);
    const threshold = Math.ceil(Math.random() * 10);
    const ms = Math.ceil(Math.random() * 100);
    const time = Math.random() * 100;
    const items = ["icmp","tcp"];
    const agreement = items[Math.floor(Math.random() * items.length)];
    tableListDataSource.push({
      id: index,
      name: name,
      hostname: "host-" + name,
      ip: getRandIP(),
      startip: getRandIP(),
      endip: getRandIP(),
      packet: packet,
      ms: ms,
      time: packet,
      disk: "",
      threshold: threshold,
      agreement: agreement,
      core_time: new Date(),
      ver: "3.10.0-327.ali2008." + name + ".alios7.x86_64",
      ping: "pt-" + name + "bm",
      vmcore_file: Boolean(Math.round(Math.random())),
      issue_id: Boolean(Math.round(Math.random())),
      vmcore_link: "http://127.0.0.1:8000/api/v1/vmcore/detail/" + name,
      rate: Math.random() * 99,
    });
  }

  tableListDataSource.reverse();
  return tableListDataSource;
};

let tableListDataSource = genList(1, 100);

async function getIoTable(req, res, u) {
  let realUrl = u;

  if (
    !realUrl ||
    Object.prototype.toString.call(realUrl) !== "[object String]"
  ) {
    realUrl = req.url;
  }

  const { current = 1, pageSize = 10 } = req.query;
  const params = parse(realUrl, true).query;
  let dataSource = tableListDataSource;

  if (params.sorter) {
    const sorter = JSON.parse(params.sorter);
    dataSource = dataSource.sort((prev, next) => {
      let sortNumber = 0;
      Object.keys(sorter).forEach((key) => {
        if (sorter[key] === "descend") {
          if (prev[key] - next[key] > 0) {
            sortNumber += -1;
          } else {
            sortNumber += 1;
          }

          return;
        }

        if (prev[key] - next[key] > 0) {
          sortNumber += 1;
        } else {
          sortNumber += -1;
        }
      });
      return sortNumber;
    });
  }

  if (params.filter) {
    const filter = JSON.parse(params.filter);

    if (Object.keys(filter).length > 0) {
      dataSource = dataSource.filter((item) => {
        return Object.keys(filter).some((key) => {
          if (!filter[key]) {
            return true;
          }

          if (filter[key].includes(`${item[key]}`)) {
            return true;
          }

          return false;
        });
      });
    }
  }

  if (params.hostname) {
    dataSource = dataSource.filter((data) =>
      data.hostname.includes(params.hostname || "")
    );
  }

  if (params.similar == 1) {
    dataSource = dataSource.filter((data) =>
      data.ip.includes(params.vmcore_id || "")
    );
  }

  let finalPageSize = 10;

  if (params.pageSize) {
    finalPageSize = parseInt(`${params.pageSize}`, 10);
  }
  const length = dataSource.length;
  dataSource = [...dataSource].slice(
    (current - 1) * pageSize,
    current * pageSize
  );

  const result = {
    data: dataSource,
    total: length,
    success: true,
    pageSize: finalPageSize,
    current: parseInt(`${params.currentPage}`, 10) || 1,
  };
  return res.json(result);
}

async function getMetric(req, res, u) {
  let realUrl = u;

  if (
    !realUrl ||
    Object.prototype.toString.call(realUrl) !== "[object String]"
  ) {
    realUrl = req.url;
  }

  const dataSource = {
    "stat": {
        "packet_num": [
            {
                "num": 100, 
                "name": "send_num"
            }, 
            {
                "num": 100, 
                "name": "reply_num"
            }, 
            {
                "num": 0, 
                "name": "lost_num"
            }
        ], 
        "stage": [
            {
                "delay": "total", 
                "max": 293, 
                "avg": 97, 
                "min": 82
            }, 
            {
                "delay": "l_tx_kern", 
                "max": 25, 
                "avg": 7, 
                "min": 5
            }, 
            {
                "delay": "l_tx_qdisc", 
                "max": 16, 
                "avg": 3, 
                "min": 2
            }, 
            {
                "delay": "l_tx_outlink", 
                "max": -1, 
                "avg": -1, 
                "min": -1
            }, 
            {
                "delay": "r_tx_kern", 
                "max": 25, 
                "avg": 7, 
                "min": 5
            }, 
            {
                "delay": "r_rx_kern", 
                "max": -1, 
                "avg": -1, 
                "min": -1
            }, 
            {
                "delay": "l_rx_inlink", 
                "max": 13, 
                "avg": 1, 
                "min": 0
            }, 
            {
                "delay": "l_rx_kern", 
                "max": 16, 
                "avg": 2, 
                "min": 2
            }, 
            {
                "delay": "l_rx_task_waking", 
                "max": 5, 
                "avg": 2, 
                "min": 1
            }, 
            {
                "delay": "l_rx_task_queue", 
                "max": 11, 
                "avg": 6, 
                "min": 6
            }, 
            {
                "delay": "l_rx_softirq", 
                "max": 15, 
                "avg": 2, 
                "min": 2
            }, 
            {
                "delay": "l_tx_moc", 
                "max": -1, 
                "avg": -1, 
                "min": -1
            }, 
            {
                "delay": "l_rx_moc", 
                "max": -1, 
                "avg": -1, 
                "min": -1
            }, 
            {
                "delay": "r_tx_moc", 
                "max": -1, 
                "avg": -1, 
                "min": -1
            }, 
            {
                "delay": "r_rx_moc", 
                "max": -1, 
                "avg": -1, 
                "min": -1
            }, 
            {
                "delay": "l_tx_ring", 
                "max": -1, 
                "avg": -1, 
                "min": -1
            }, 
            {
                "delay": "l_rx_ring", 
                "max": -1, 
                "avg": -1, 
                "min": -1
            }, 
            {
                "delay": "r_tx_ring", 
                "max": -1, 
                "avg": -1, 
                "min": -1
            }, 
            {
                "delay": "r_rx_ring", 
                "max": -1, 
                "avg": -1, 
                "min": -1
            }, 
            {
                "delay": "r_rx_ringkern", 
                "max": -1, 
                "avg": -1, 
                "min": -1
            }, 
            {
                "delay": "l_tx_merged_kern", 
                "max": 34, 
                "avg": 10, 
                "min": 7
            }, 
            {
                "delay": "l_tx_merged_ring", 
                "max": -1, 
                "avg": -1, 
                "min": -1
            }, 
            {
                "delay": "l_tx_merged_moc", 
                "max": -1, 
                "avg": -1, 
                "min": -1
            }, 
            {
                "delay": "l_tx_merged_outlink", 
                "max": -1, 
                "avg": -1, 
                "min": -1
            }, 
            {
                "delay": "r_rx_merged_moc", 
                "max": -1, 
                "avg": -1, 
                "min": -1
            }, 
            {
                "delay": "r_rx_merged_ring", 
                "max": -1, 
                "avg": -1, 
                "min": -1
            }, 
            {
                "delay": "r_tx_merged_kern", 
                "max": 25, 
                "avg": 7, 
                "min": 5
            }, 
            {
                "delay": "r_rx_merged_kern", 
                "max": -1, 
                "avg": -1, 
                "min": -1
            }, 
            {
                "delay": "r_tx_merged_ring", 
                "max": -1, 
                "avg": -1, 
                "min": -1
            }, 
            {
                "delay": "r_tx_merged_moc", 
                "max": -1, 
                "avg": -1, 
                "min": -1
            }, 
            {
                "delay": "l_rx_merged_inlink", 
                "max": 13, 
                "avg": 1, 
                "min": 0
            }, 
            {
                "delay": "l_rx_merged_moc", 
                "max": -1, 
                "avg": -1, 
                "min": -1
            }, 
            {
                "delay": "l_rx_merged_ring", 
                "max": -1, 
                "avg": -1, 
                "min": -1
            }, 
            {
                "delay": "l_rx_merged_kern", 
                "max": 25, 
                "avg": 11, 
                "min": 10
            }
        ]
    }, 
    "seq": [
        {
            "delays": [
                {
                    "delay": "total", 
                    "ts": 293
                }, 
                {
                    "delay": "l_tx_kern", 
                    "ts": 25
                }, 
                {
                    "delay": "l_tx_qdisc", 
                    "ts": 9
                }, 
                {
                    "delay": "l_tx_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_kern", 
                    "ts": 25
                }, 
                {
                    "delay": "r_rx_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_inlink", 
                    "ts": 0
                }, 
                {
                    "delay": "l_rx_kern", 
                    "ts": 10
                }, 
                {
                    "delay": "l_rx_task_waking", 
                    "ts": 5
                }, 
                {
                    "delay": "l_rx_task_queue", 
                    "ts": 10
                }, 
                {
                    "delay": "l_rx_softirq", 
                    "ts": 6
                }, 
                {
                    "delay": "l_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ringkern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_kern", 
                    "ts": 34
                }, 
                {
                    "delay": "l_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_kern", 
                    "ts": 25
                }, 
                {
                    "delay": "r_rx_merged_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_inlink", 
                    "ts": 0
                }, 
                {
                    "delay": "l_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_kern", 
                    "ts": 25
                }
            ], 
            "meta": {
                "start_ns": 11766201510775919, 
                "seq": 1
            }, 
            "points": [
                {
                    "ts": 2286087031, 
                    "point": "l_tx_user"
                }, 
                {
                    "ts": 2286087056, 
                    "point": "l_tx_devqueue"
                }, 
                {
                    "ts": 2286087065, 
                    "point": "l_tx_devout"
                }, 
                {
                    "ts": 1656996764, 
                    "point": "r_rx_icmprcv"
                }, 
                {
                    "ts": 1656996789, 
                    "point": "r_tx_devout"
                }, 
                {
                    "ts": 2286087299, 
                    "point": "l_rx_iprcv"
                }, 
                {
                    "ts": 2286087309, 
                    "point": "l_rx_skdataready"
                }, 
                {
                    "ts": 2286087314, 
                    "point": "l_rx_wakeup"
                }, 
                {
                    "ts": 2286087324, 
                    "point": "l_rx_user"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_devrcv"
                }, 
                {
                    "ts": 2286087293, 
                    "point": "l_rx_softirq"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_mac"
                }
            ]
        }, 
        {
            "delays": [
                {
                    "delay": "total", 
                    "ts": 107
                }, 
                {
                    "delay": "l_tx_kern", 
                    "ts": 10
                }, 
                {
                    "delay": "l_tx_qdisc", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_kern", 
                    "ts": 9
                }, 
                {
                    "delay": "r_rx_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_inlink", 
                    "ts": 0
                }, 
                {
                    "delay": "l_rx_kern", 
                    "ts": 3
                }, 
                {
                    "delay": "l_rx_task_waking", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_task_queue", 
                    "ts": 7
                }, 
                {
                    "delay": "l_rx_softirq", 
                    "ts": 2
                }, 
                {
                    "delay": "l_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ringkern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_kern", 
                    "ts": 13
                }, 
                {
                    "delay": "l_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_kern", 
                    "ts": 9
                }, 
                {
                    "delay": "r_rx_merged_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_inlink", 
                    "ts": 0
                }, 
                {
                    "delay": "l_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_kern", 
                    "ts": 12
                }
            ], 
            "meta": {
                "start_ns": 11766201523285527, 
                "seq": 2
            }, 
            "points": [
                {
                    "ts": 2286099541, 
                    "point": "l_tx_user"
                }, 
                {
                    "ts": 2286099551, 
                    "point": "l_tx_devqueue"
                }, 
                {
                    "ts": 2286099554, 
                    "point": "l_tx_devout"
                }, 
                {
                    "ts": 1657009175, 
                    "point": "r_rx_icmprcv"
                }, 
                {
                    "ts": 1657009184, 
                    "point": "r_tx_devout"
                }, 
                {
                    "ts": 2286099636, 
                    "point": "l_rx_iprcv"
                }, 
                {
                    "ts": 2286099639, 
                    "point": "l_rx_skdataready"
                }, 
                {
                    "ts": 2286099641, 
                    "point": "l_rx_wakeup"
                }, 
                {
                    "ts": 2286099648, 
                    "point": "l_rx_user"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_devrcv"
                }, 
                {
                    "ts": 2286099634, 
                    "point": "l_rx_softirq"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_mac"
                }
            ]
        }, 
        {
            "delays": [
                {
                    "delay": "total", 
                    "ts": 95
                }, 
                {
                    "delay": "l_tx_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "l_tx_qdisc", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "r_rx_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_inlink", 
                    "ts": 0
                }, 
                {
                    "delay": "l_rx_kern", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_task_waking", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_task_queue", 
                    "ts": 7
                }, 
                {
                    "delay": "l_rx_softirq", 
                    "ts": 2
                }, 
                {
                    "delay": "l_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ringkern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_kern", 
                    "ts": 9
                }, 
                {
                    "delay": "l_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "r_rx_merged_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_inlink", 
                    "ts": 0
                }, 
                {
                    "delay": "l_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_kern", 
                    "ts": 11
                }
            ], 
            "meta": {
                "start_ns": 11766201535613691, 
                "seq": 3
            }, 
            "points": [
                {
                    "ts": 2286111869, 
                    "point": "l_tx_user"
                }, 
                {
                    "ts": 2286111875, 
                    "point": "l_tx_devqueue"
                }, 
                {
                    "ts": 2286111878, 
                    "point": "l_tx_devout"
                }, 
                {
                    "ts": 1657021495, 
                    "point": "r_rx_icmprcv"
                }, 
                {
                    "ts": 1657021501, 
                    "point": "r_tx_devout"
                }, 
                {
                    "ts": 2286111953, 
                    "point": "l_rx_iprcv"
                }, 
                {
                    "ts": 2286111955, 
                    "point": "l_rx_skdataready"
                }, 
                {
                    "ts": 2286111957, 
                    "point": "l_rx_wakeup"
                }, 
                {
                    "ts": 2286111964, 
                    "point": "l_rx_user"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_devrcv"
                }, 
                {
                    "ts": 2286111951, 
                    "point": "l_rx_softirq"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_mac"
                }
            ]
        }, 
        {
            "delays": [
                {
                    "delay": "total", 
                    "ts": 99
                }, 
                {
                    "delay": "l_tx_kern", 
                    "ts": 8
                }, 
                {
                    "delay": "l_tx_qdisc", 
                    "ts": 4
                }, 
                {
                    "delay": "l_tx_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_kern", 
                    "ts": 11
                }, 
                {
                    "delay": "r_rx_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_inlink", 
                    "ts": 1
                }, 
                {
                    "delay": "l_rx_kern", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_task_waking", 
                    "ts": 3
                }, 
                {
                    "delay": "l_rx_task_queue", 
                    "ts": 7
                }, 
                {
                    "delay": "l_rx_softirq", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ringkern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_kern", 
                    "ts": 12
                }, 
                {
                    "delay": "l_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_kern", 
                    "ts": 11
                }, 
                {
                    "delay": "r_rx_merged_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_inlink", 
                    "ts": 1
                }, 
                {
                    "delay": "l_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_kern", 
                    "ts": 12
                }
            ], 
            "meta": {
                "start_ns": 11766201547929039, 
                "seq": 4
            }, 
            "points": [
                {
                    "ts": 2286124185, 
                    "point": "l_tx_user"
                }, 
                {
                    "ts": 2286124193, 
                    "point": "l_tx_devqueue"
                }, 
                {
                    "ts": 2286124197, 
                    "point": "l_tx_devout"
                }, 
                {
                    "ts": 1657033808, 
                    "point": "r_rx_icmprcv"
                }, 
                {
                    "ts": 1657033819, 
                    "point": "r_tx_devout"
                }, 
                {
                    "ts": 2286124272, 
                    "point": "l_rx_iprcv"
                }, 
                {
                    "ts": 2286124274, 
                    "point": "l_rx_skdataready"
                }, 
                {
                    "ts": 2286124277, 
                    "point": "l_rx_wakeup"
                }, 
                {
                    "ts": 2286124284, 
                    "point": "l_rx_user"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_devrcv"
                }, 
                {
                    "ts": 2286124269, 
                    "point": "l_rx_softirq"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_mac"
                }
            ]
        }, 
        {
            "delays": [
                {
                    "delay": "total", 
                    "ts": 95
                }, 
                {
                    "delay": "l_tx_kern", 
                    "ts": 7
                }, 
                {
                    "delay": "l_tx_qdisc", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "r_rx_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_inlink", 
                    "ts": 0
                }, 
                {
                    "delay": "l_rx_kern", 
                    "ts": 3
                }, 
                {
                    "delay": "l_rx_task_waking", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_task_queue", 
                    "ts": 6
                }, 
                {
                    "delay": "l_rx_softirq", 
                    "ts": 2
                }, 
                {
                    "delay": "l_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ringkern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_kern", 
                    "ts": 10
                }, 
                {
                    "delay": "l_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "r_rx_merged_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_inlink", 
                    "ts": 0
                }, 
                {
                    "delay": "l_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_kern", 
                    "ts": 11
                }
            ], 
            "meta": {
                "start_ns": 11766201560248755, 
                "seq": 5
            }, 
            "points": [
                {
                    "ts": 2286136504, 
                    "point": "l_tx_user"
                }, 
                {
                    "ts": 2286136511, 
                    "point": "l_tx_devqueue"
                }, 
                {
                    "ts": 2286136514, 
                    "point": "l_tx_devout"
                }, 
                {
                    "ts": 1657046130, 
                    "point": "r_rx_icmprcv"
                }, 
                {
                    "ts": 1657046136, 
                    "point": "r_tx_devout"
                }, 
                {
                    "ts": 2286136588, 
                    "point": "l_rx_iprcv"
                }, 
                {
                    "ts": 2286136591, 
                    "point": "l_rx_skdataready"
                }, 
                {
                    "ts": 2286136593, 
                    "point": "l_rx_wakeup"
                }, 
                {
                    "ts": 2286136599, 
                    "point": "l_rx_user"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_devrcv"
                }, 
                {
                    "ts": 2286136586, 
                    "point": "l_rx_softirq"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_mac"
                }
            ]
        }, 
        {
            "delays": [
                {
                    "delay": "total", 
                    "ts": 98
                }, 
                {
                    "delay": "l_tx_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "l_tx_qdisc", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_kern", 
                    "ts": 9
                }, 
                {
                    "delay": "r_rx_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_inlink", 
                    "ts": 1
                }, 
                {
                    "delay": "l_rx_kern", 
                    "ts": 3
                }, 
                {
                    "delay": "l_rx_task_waking", 
                    "ts": 1
                }, 
                {
                    "delay": "l_rx_task_queue", 
                    "ts": 7
                }, 
                {
                    "delay": "l_rx_softirq", 
                    "ts": 4
                }, 
                {
                    "delay": "l_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ringkern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_kern", 
                    "ts": 9
                }, 
                {
                    "delay": "l_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_kern", 
                    "ts": 9
                }, 
                {
                    "delay": "r_rx_merged_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_inlink", 
                    "ts": 1
                }, 
                {
                    "delay": "l_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_kern", 
                    "ts": 11
                }
            ], 
            "meta": {
                "start_ns": 11766201572560933, 
                "seq": 6
            }, 
            "points": [
                {
                    "ts": 2286148816, 
                    "point": "l_tx_user"
                }, 
                {
                    "ts": 2286148822, 
                    "point": "l_tx_devqueue"
                }, 
                {
                    "ts": 2286148825, 
                    "point": "l_tx_devout"
                }, 
                {
                    "ts": 1657058441, 
                    "point": "r_rx_icmprcv"
                }, 
                {
                    "ts": 1657058450, 
                    "point": "r_tx_devout"
                }, 
                {
                    "ts": 2286148903, 
                    "point": "l_rx_iprcv"
                }, 
                {
                    "ts": 2286148906, 
                    "point": "l_rx_skdataready"
                }, 
                {
                    "ts": 2286148907, 
                    "point": "l_rx_wakeup"
                }, 
                {
                    "ts": 2286148914, 
                    "point": "l_rx_user"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_devrcv"
                }, 
                {
                    "ts": 2286148899, 
                    "point": "l_rx_softirq"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_mac"
                }
            ]
        }, 
        {
            "delays": [
                {
                    "delay": "total", 
                    "ts": 86
                }, 
                {
                    "delay": "l_tx_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "l_tx_qdisc", 
                    "ts": 2
                }, 
                {
                    "delay": "l_tx_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "r_rx_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_inlink", 
                    "ts": 0
                }, 
                {
                    "delay": "l_rx_kern", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_task_waking", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_task_queue", 
                    "ts": 6
                }, 
                {
                    "delay": "l_rx_softirq", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ringkern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_kern", 
                    "ts": 8
                }, 
                {
                    "delay": "l_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "r_rx_merged_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_inlink", 
                    "ts": 0
                }, 
                {
                    "delay": "l_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_kern", 
                    "ts": 10
                }
            ], 
            "meta": {
                "start_ns": 11766201584875304, 
                "seq": 7
            }, 
            "points": [
                {
                    "ts": 2286161131, 
                    "point": "l_tx_user"
                }, 
                {
                    "ts": 2286161137, 
                    "point": "l_tx_devqueue"
                }, 
                {
                    "ts": 2286161139, 
                    "point": "l_tx_devout"
                }, 
                {
                    "ts": 1657070749, 
                    "point": "r_rx_icmprcv"
                }, 
                {
                    "ts": 1657070755, 
                    "point": "r_tx_devout"
                }, 
                {
                    "ts": 2286161207, 
                    "point": "l_rx_iprcv"
                }, 
                {
                    "ts": 2286161209, 
                    "point": "l_rx_skdataready"
                }, 
                {
                    "ts": 2286161211, 
                    "point": "l_rx_wakeup"
                }, 
                {
                    "ts": 2286161217, 
                    "point": "l_rx_user"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_devrcv"
                }, 
                {
                    "ts": 2286161204, 
                    "point": "l_rx_softirq"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_mac"
                }
            ]
        }, 
        {
            "delays": [
                {
                    "delay": "total", 
                    "ts": 93
                }, 
                {
                    "delay": "l_tx_kern", 
                    "ts": 9
                }, 
                {
                    "delay": "l_tx_qdisc", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "r_rx_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_inlink", 
                    "ts": 1
                }, 
                {
                    "delay": "l_rx_kern", 
                    "ts": 3
                }, 
                {
                    "delay": "l_rx_task_waking", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_task_queue", 
                    "ts": 7
                }, 
                {
                    "delay": "l_rx_softirq", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ringkern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_kern", 
                    "ts": 12
                }, 
                {
                    "delay": "l_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "r_rx_merged_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_inlink", 
                    "ts": 1
                }, 
                {
                    "delay": "l_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_kern", 
                    "ts": 12
                }
            ], 
            "meta": {
                "start_ns": 11766201597180942, 
                "seq": 8
            }, 
            "points": [
                {
                    "ts": 2286173436, 
                    "point": "l_tx_user"
                }, 
                {
                    "ts": 2286173445, 
                    "point": "l_tx_devqueue"
                }, 
                {
                    "ts": 2286173448, 
                    "point": "l_tx_devout"
                }, 
                {
                    "ts": 1657083058, 
                    "point": "r_rx_icmprcv"
                }, 
                {
                    "ts": 1657083064, 
                    "point": "r_tx_devout"
                }, 
                {
                    "ts": 2286173517, 
                    "point": "l_rx_iprcv"
                }, 
                {
                    "ts": 2286173520, 
                    "point": "l_rx_skdataready"
                }, 
                {
                    "ts": 2286173522, 
                    "point": "l_rx_wakeup"
                }, 
                {
                    "ts": 2286173529, 
                    "point": "l_rx_user"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_devrcv"
                }, 
                {
                    "ts": 2286173514, 
                    "point": "l_rx_softirq"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_mac"
                }
            ]
        }, 
        {
            "delays": [
                {
                    "delay": "total", 
                    "ts": 88
                }, 
                {
                    "delay": "l_tx_kern", 
                    "ts": 7
                }, 
                {
                    "delay": "l_tx_qdisc", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "r_rx_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_inlink", 
                    "ts": 0
                }, 
                {
                    "delay": "l_rx_kern", 
                    "ts": 3
                }, 
                {
                    "delay": "l_rx_task_waking", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_task_queue", 
                    "ts": 7
                }, 
                {
                    "delay": "l_rx_softirq", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ringkern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_kern", 
                    "ts": 10
                }, 
                {
                    "delay": "l_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "r_rx_merged_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_inlink", 
                    "ts": 0
                }, 
                {
                    "delay": "l_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_kern", 
                    "ts": 12
                }
            ], 
            "meta": {
                "start_ns": 11766201609487232, 
                "seq": 9
            }, 
            "points": [
                {
                    "ts": 2286185743, 
                    "point": "l_tx_user"
                }, 
                {
                    "ts": 2286185750, 
                    "point": "l_tx_devqueue"
                }, 
                {
                    "ts": 2286185753, 
                    "point": "l_tx_devout"
                }, 
                {
                    "ts": 1657095361, 
                    "point": "r_rx_icmprcv"
                }, 
                {
                    "ts": 1657095367, 
                    "point": "r_tx_devout"
                }, 
                {
                    "ts": 2286185819, 
                    "point": "l_rx_iprcv"
                }, 
                {
                    "ts": 2286185822, 
                    "point": "l_rx_skdataready"
                }, 
                {
                    "ts": 2286185824, 
                    "point": "l_rx_wakeup"
                }, 
                {
                    "ts": 2286185831, 
                    "point": "l_rx_user"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_devrcv"
                }, 
                {
                    "ts": 2286185816, 
                    "point": "l_rx_softirq"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_mac"
                }
            ]
        }, 
        {
            "delays": [
                {
                    "delay": "total", 
                    "ts": 94
                }, 
                {
                    "delay": "l_tx_kern", 
                    "ts": 7
                }, 
                {
                    "delay": "l_tx_qdisc", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_kern", 
                    "ts": 5
                }, 
                {
                    "delay": "r_rx_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_inlink", 
                    "ts": 1
                }, 
                {
                    "delay": "l_rx_kern", 
                    "ts": 3
                }, 
                {
                    "delay": "l_rx_task_waking", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_task_queue", 
                    "ts": 7
                }, 
                {
                    "delay": "l_rx_softirq", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ringkern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_kern", 
                    "ts": 10
                }, 
                {
                    "delay": "l_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_kern", 
                    "ts": 5
                }, 
                {
                    "delay": "r_rx_merged_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_inlink", 
                    "ts": 1
                }, 
                {
                    "delay": "l_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_kern", 
                    "ts": 12
                }
            ], 
            "meta": {
                "start_ns": 11766201621807481, 
                "seq": 10
            }, 
            "points": [
                {
                    "ts": 2286198063, 
                    "point": "l_tx_user"
                }, 
                {
                    "ts": 2286198070, 
                    "point": "l_tx_devqueue"
                }, 
                {
                    "ts": 2286198073, 
                    "point": "l_tx_devout"
                }, 
                {
                    "ts": 1657107687, 
                    "point": "r_rx_icmprcv"
                }, 
                {
                    "ts": 1657107692, 
                    "point": "r_tx_devout"
                }, 
                {
                    "ts": 2286198145, 
                    "point": "l_rx_iprcv"
                }, 
                {
                    "ts": 2286198148, 
                    "point": "l_rx_skdataready"
                }, 
                {
                    "ts": 2286198150, 
                    "point": "l_rx_wakeup"
                }, 
                {
                    "ts": 2286198157, 
                    "point": "l_rx_user"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_devrcv"
                }, 
                {
                    "ts": 2286198142, 
                    "point": "l_rx_softirq"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_mac"
                }
            ]
        }, 
        {
            "delays": [
                {
                    "delay": "total", 
                    "ts": 85
                }, 
                {
                    "delay": "l_tx_kern", 
                    "ts": 5
                }, 
                {
                    "delay": "l_tx_qdisc", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "r_rx_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_inlink", 
                    "ts": 0
                }, 
                {
                    "delay": "l_rx_kern", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_task_waking", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_task_queue", 
                    "ts": 7
                }, 
                {
                    "delay": "l_rx_softirq", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ringkern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_kern", 
                    "ts": 8
                }, 
                {
                    "delay": "l_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "r_rx_merged_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_inlink", 
                    "ts": 0
                }, 
                {
                    "delay": "l_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_kern", 
                    "ts": 11
                }
            ], 
            "meta": {
                "start_ns": 11766201634122196, 
                "seq": 11
            }, 
            "points": [
                {
                    "ts": 2286210378, 
                    "point": "l_tx_user"
                }, 
                {
                    "ts": 2286210383, 
                    "point": "l_tx_devqueue"
                }, 
                {
                    "ts": 2286210386, 
                    "point": "l_tx_devout"
                }, 
                {
                    "ts": 1657119994, 
                    "point": "r_rx_icmprcv"
                }, 
                {
                    "ts": 1657120000, 
                    "point": "r_tx_devout"
                }, 
                {
                    "ts": 2286210452, 
                    "point": "l_rx_iprcv"
                }, 
                {
                    "ts": 2286210454, 
                    "point": "l_rx_skdataready"
                }, 
                {
                    "ts": 2286210456, 
                    "point": "l_rx_wakeup"
                }, 
                {
                    "ts": 2286210463, 
                    "point": "l_rx_user"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_devrcv"
                }, 
                {
                    "ts": 2286210449, 
                    "point": "l_rx_softirq"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_mac"
                }
            ]
        }, 
        {
            "delays": [
                {
                    "delay": "total", 
                    "ts": 95
                }, 
                {
                    "delay": "l_tx_kern", 
                    "ts": 8
                }, 
                {
                    "delay": "l_tx_qdisc", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_kern", 
                    "ts": 7
                }, 
                {
                    "delay": "r_rx_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_inlink", 
                    "ts": 0
                }, 
                {
                    "delay": "l_rx_kern", 
                    "ts": 3
                }, 
                {
                    "delay": "l_rx_task_waking", 
                    "ts": 3
                }, 
                {
                    "delay": "l_rx_task_queue", 
                    "ts": 6
                }, 
                {
                    "delay": "l_rx_softirq", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ringkern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_kern", 
                    "ts": 11
                }, 
                {
                    "delay": "l_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_kern", 
                    "ts": 7
                }, 
                {
                    "delay": "r_rx_merged_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_inlink", 
                    "ts": 0
                }, 
                {
                    "delay": "l_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_kern", 
                    "ts": 12
                }
            ], 
            "meta": {
                "start_ns": 11766201646425774, 
                "seq": 12
            }, 
            "points": [
                {
                    "ts": 2286222681, 
                    "point": "l_tx_user"
                }, 
                {
                    "ts": 2286222689, 
                    "point": "l_tx_devqueue"
                }, 
                {
                    "ts": 2286222692, 
                    "point": "l_tx_devout"
                }, 
                {
                    "ts": 1657132305, 
                    "point": "r_rx_icmprcv"
                }, 
                {
                    "ts": 1657132312, 
                    "point": "r_tx_devout"
                }, 
                {
                    "ts": 2286222764, 
                    "point": "l_rx_iprcv"
                }, 
                {
                    "ts": 2286222767, 
                    "point": "l_rx_skdataready"
                }, 
                {
                    "ts": 2286222770, 
                    "point": "l_rx_wakeup"
                }, 
                {
                    "ts": 2286222776, 
                    "point": "l_rx_user"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_devrcv"
                }, 
                {
                    "ts": 2286222761, 
                    "point": "l_rx_softirq"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_mac"
                }
            ]
        }, 
        {
            "delays": [
                {
                    "delay": "total", 
                    "ts": 99
                }, 
                {
                    "delay": "l_tx_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "l_tx_qdisc", 
                    "ts": 2
                }, 
                {
                    "delay": "l_tx_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_kern", 
                    "ts": 8
                }, 
                {
                    "delay": "r_rx_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_inlink", 
                    "ts": 0
                }, 
                {
                    "delay": "l_rx_kern", 
                    "ts": 3
                }, 
                {
                    "delay": "l_rx_task_waking", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_task_queue", 
                    "ts": 6
                }, 
                {
                    "delay": "l_rx_softirq", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ringkern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_kern", 
                    "ts": 8
                }, 
                {
                    "delay": "l_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_kern", 
                    "ts": 8
                }, 
                {
                    "delay": "r_rx_merged_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_inlink", 
                    "ts": 0
                }, 
                {
                    "delay": "l_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_kern", 
                    "ts": 11
                }
            ], 
            "meta": {
                "start_ns": 11766201658733137, 
                "seq": 13
            }, 
            "points": [
                {
                    "ts": 2286234989, 
                    "point": "l_tx_user"
                }, 
                {
                    "ts": 2286234995, 
                    "point": "l_tx_devqueue"
                }, 
                {
                    "ts": 2286234997, 
                    "point": "l_tx_devout"
                }, 
                {
                    "ts": 1657144617, 
                    "point": "r_rx_icmprcv"
                }, 
                {
                    "ts": 1657144625, 
                    "point": "r_tx_devout"
                }, 
                {
                    "ts": 2286235077, 
                    "point": "l_rx_iprcv"
                }, 
                {
                    "ts": 2286235080, 
                    "point": "l_rx_skdataready"
                }, 
                {
                    "ts": 2286235082, 
                    "point": "l_rx_wakeup"
                }, 
                {
                    "ts": 2286235088, 
                    "point": "l_rx_user"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_devrcv"
                }, 
                {
                    "ts": 2286235074, 
                    "point": "l_rx_softirq"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_mac"
                }
            ]
        }, 
        {
            "delays": [
                {
                    "delay": "total", 
                    "ts": 114
                }, 
                {
                    "delay": "l_tx_kern", 
                    "ts": 13
                }, 
                {
                    "delay": "l_tx_qdisc", 
                    "ts": 4
                }, 
                {
                    "delay": "l_tx_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_kern", 
                    "ts": 8
                }, 
                {
                    "delay": "r_rx_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_inlink", 
                    "ts": 4
                }, 
                {
                    "delay": "l_rx_kern", 
                    "ts": 4
                }, 
                {
                    "delay": "l_rx_task_waking", 
                    "ts": 3
                }, 
                {
                    "delay": "l_rx_task_queue", 
                    "ts": 8
                }, 
                {
                    "delay": "l_rx_softirq", 
                    "ts": 5
                }, 
                {
                    "delay": "l_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ringkern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_kern", 
                    "ts": 17
                }, 
                {
                    "delay": "l_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_kern", 
                    "ts": 8
                }, 
                {
                    "delay": "r_rx_merged_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_inlink", 
                    "ts": 4
                }, 
                {
                    "delay": "l_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_kern", 
                    "ts": 15
                }
            ], 
            "meta": {
                "start_ns": 11766201671052028, 
                "seq": 14
            }, 
            "points": [
                {
                    "ts": 2286247308, 
                    "point": "l_tx_user"
                }, 
                {
                    "ts": 2286247321, 
                    "point": "l_tx_devqueue"
                }, 
                {
                    "ts": 2286247325, 
                    "point": "l_tx_devout"
                }, 
                {
                    "ts": 1657156943, 
                    "point": "r_rx_icmprcv"
                }, 
                {
                    "ts": 1657156951, 
                    "point": "r_tx_devout"
                }, 
                {
                    "ts": 2286247407, 
                    "point": "l_rx_iprcv"
                }, 
                {
                    "ts": 2286247411, 
                    "point": "l_rx_skdataready"
                }, 
                {
                    "ts": 2286247414, 
                    "point": "l_rx_wakeup"
                }, 
                {
                    "ts": 2286247422, 
                    "point": "l_rx_user"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_devrcv"
                }, 
                {
                    "ts": 2286247402, 
                    "point": "l_rx_softirq"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_mac"
                }
            ]
        }, 
        {
            "delays": [
                {
                    "delay": "total", 
                    "ts": 98
                }, 
                {
                    "delay": "l_tx_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "l_tx_qdisc", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "r_rx_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_inlink", 
                    "ts": 0
                }, 
                {
                    "delay": "l_rx_kern", 
                    "ts": 3
                }, 
                {
                    "delay": "l_rx_task_waking", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_task_queue", 
                    "ts": 6
                }, 
                {
                    "delay": "l_rx_softirq", 
                    "ts": 2
                }, 
                {
                    "delay": "l_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ringkern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_kern", 
                    "ts": 9
                }, 
                {
                    "delay": "l_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "r_rx_merged_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_inlink", 
                    "ts": 0
                }, 
                {
                    "delay": "l_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_kern", 
                    "ts": 11
                }
            ], 
            "meta": {
                "start_ns": 11766201683395222, 
                "seq": 15
            }, 
            "points": [
                {
                    "ts": 2286259651, 
                    "point": "l_tx_user"
                }, 
                {
                    "ts": 2286259657, 
                    "point": "l_tx_devqueue"
                }, 
                {
                    "ts": 2286259660, 
                    "point": "l_tx_devout"
                }, 
                {
                    "ts": 1657169280, 
                    "point": "r_rx_icmprcv"
                }, 
                {
                    "ts": 1657169286, 
                    "point": "r_tx_devout"
                }, 
                {
                    "ts": 2286259738, 
                    "point": "l_rx_iprcv"
                }, 
                {
                    "ts": 2286259741, 
                    "point": "l_rx_skdataready"
                }, 
                {
                    "ts": 2286259743, 
                    "point": "l_rx_wakeup"
                }, 
                {
                    "ts": 2286259749, 
                    "point": "l_rx_user"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_devrcv"
                }, 
                {
                    "ts": 2286259736, 
                    "point": "l_rx_softirq"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_mac"
                }
            ]
        }, 
        {
            "delays": [
                {
                    "delay": "total", 
                    "ts": 99
                }, 
                {
                    "delay": "l_tx_kern", 
                    "ts": 8
                }, 
                {
                    "delay": "l_tx_qdisc", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "r_rx_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_inlink", 
                    "ts": 0
                }, 
                {
                    "delay": "l_rx_kern", 
                    "ts": 3
                }, 
                {
                    "delay": "l_rx_task_waking", 
                    "ts": 3
                }, 
                {
                    "delay": "l_rx_task_queue", 
                    "ts": 7
                }, 
                {
                    "delay": "l_rx_softirq", 
                    "ts": 2
                }, 
                {
                    "delay": "l_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ringkern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_kern", 
                    "ts": 11
                }, 
                {
                    "delay": "l_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "r_rx_merged_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_inlink", 
                    "ts": 0
                }, 
                {
                    "delay": "l_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_kern", 
                    "ts": 13
                }
            ], 
            "meta": {
                "start_ns": 11766201695693268, 
                "seq": 16
            }, 
            "points": [
                {
                    "ts": 2286271949, 
                    "point": "l_tx_user"
                }, 
                {
                    "ts": 2286271957, 
                    "point": "l_tx_devqueue"
                }, 
                {
                    "ts": 2286271960, 
                    "point": "l_tx_devout"
                }, 
                {
                    "ts": 1657181577, 
                    "point": "r_rx_icmprcv"
                }, 
                {
                    "ts": 1657181583, 
                    "point": "r_tx_devout"
                }, 
                {
                    "ts": 2286272035, 
                    "point": "l_rx_iprcv"
                }, 
                {
                    "ts": 2286272038, 
                    "point": "l_rx_skdataready"
                }, 
                {
                    "ts": 2286272041, 
                    "point": "l_rx_wakeup"
                }, 
                {
                    "ts": 2286272048, 
                    "point": "l_rx_user"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_devrcv"
                }, 
                {
                    "ts": 2286272033, 
                    "point": "l_rx_softirq"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_mac"
                }
            ]
        }, 
        {
            "delays": [
                {
                    "delay": "total", 
                    "ts": 105
                }, 
                {
                    "delay": "l_tx_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "l_tx_qdisc", 
                    "ts": 2
                }, 
                {
                    "delay": "l_tx_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_kern", 
                    "ts": 9
                }, 
                {
                    "delay": "r_rx_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_inlink", 
                    "ts": 0
                }, 
                {
                    "delay": "l_rx_kern", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_task_waking", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_task_queue", 
                    "ts": 6
                }, 
                {
                    "delay": "l_rx_softirq", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ringkern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_kern", 
                    "ts": 8
                }, 
                {
                    "delay": "l_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_kern", 
                    "ts": 9
                }, 
                {
                    "delay": "r_rx_merged_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_inlink", 
                    "ts": 0
                }, 
                {
                    "delay": "l_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_kern", 
                    "ts": 10
                }
            ], 
            "meta": {
                "start_ns": 11766201708012554, 
                "seq": 17
            }, 
            "points": [
                {
                    "ts": 2286284268, 
                    "point": "l_tx_user"
                }, 
                {
                    "ts": 2286284274, 
                    "point": "l_tx_devqueue"
                }, 
                {
                    "ts": 2286284276, 
                    "point": "l_tx_devout"
                }, 
                {
                    "ts": 1657193902, 
                    "point": "r_rx_icmprcv"
                }, 
                {
                    "ts": 1657193911, 
                    "point": "r_tx_devout"
                }, 
                {
                    "ts": 2286284363, 
                    "point": "l_rx_iprcv"
                }, 
                {
                    "ts": 2286284365, 
                    "point": "l_rx_skdataready"
                }, 
                {
                    "ts": 2286284367, 
                    "point": "l_rx_wakeup"
                }, 
                {
                    "ts": 2286284373, 
                    "point": "l_rx_user"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_devrcv"
                }, 
                {
                    "ts": 2286284360, 
                    "point": "l_rx_softirq"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_mac"
                }
            ]
        }, 
        {
            "delays": [
                {
                    "delay": "total", 
                    "ts": 106
                }, 
                {
                    "delay": "l_tx_kern", 
                    "ts": 5
                }, 
                {
                    "delay": "l_tx_qdisc", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_kern", 
                    "ts": 11
                }, 
                {
                    "delay": "r_rx_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_inlink", 
                    "ts": 0
                }, 
                {
                    "delay": "l_rx_kern", 
                    "ts": 3
                }, 
                {
                    "delay": "l_rx_task_waking", 
                    "ts": 1
                }, 
                {
                    "delay": "l_rx_task_queue", 
                    "ts": 9
                }, 
                {
                    "delay": "l_rx_softirq", 
                    "ts": 2
                }, 
                {
                    "delay": "l_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ringkern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_kern", 
                    "ts": 8
                }, 
                {
                    "delay": "l_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_kern", 
                    "ts": 11
                }, 
                {
                    "delay": "r_rx_merged_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_inlink", 
                    "ts": 0
                }, 
                {
                    "delay": "l_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_kern", 
                    "ts": 13
                }
            ], 
            "meta": {
                "start_ns": 11766201722643555, 
                "seq": 18
            }, 
            "points": [
                {
                    "ts": 2286298899, 
                    "point": "l_tx_user"
                }, 
                {
                    "ts": 2286298904, 
                    "point": "l_tx_devqueue"
                }, 
                {
                    "ts": 2286298907, 
                    "point": "l_tx_devout"
                }, 
                {
                    "ts": 1657208529, 
                    "point": "r_rx_icmprcv"
                }, 
                {
                    "ts": 1657208540, 
                    "point": "r_tx_devout"
                }, 
                {
                    "ts": 2286298992, 
                    "point": "l_rx_iprcv"
                }, 
                {
                    "ts": 2286298995, 
                    "point": "l_rx_skdataready"
                }, 
                {
                    "ts": 2286298996, 
                    "point": "l_rx_wakeup"
                }, 
                {
                    "ts": 2286299005, 
                    "point": "l_rx_user"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_devrcv"
                }, 
                {
                    "ts": 2286298990, 
                    "point": "l_rx_softirq"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_mac"
                }
            ]
        }, 
        {
            "delays": [
                {
                    "delay": "total", 
                    "ts": 95
                }, 
                {
                    "delay": "l_tx_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "l_tx_qdisc", 
                    "ts": 2
                }, 
                {
                    "delay": "l_tx_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_kern", 
                    "ts": 9
                }, 
                {
                    "delay": "r_rx_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_inlink", 
                    "ts": 0
                }, 
                {
                    "delay": "l_rx_kern", 
                    "ts": 3
                }, 
                {
                    "delay": "l_rx_task_waking", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_task_queue", 
                    "ts": 6
                }, 
                {
                    "delay": "l_rx_softirq", 
                    "ts": 2
                }, 
                {
                    "delay": "l_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ringkern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_kern", 
                    "ts": 8
                }, 
                {
                    "delay": "l_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_kern", 
                    "ts": 9
                }, 
                {
                    "delay": "r_rx_merged_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_inlink", 
                    "ts": 0
                }, 
                {
                    "delay": "l_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_kern", 
                    "ts": 11
                }
            ], 
            "meta": {
                "start_ns": 11766201734968992, 
                "seq": 19
            }, 
            "points": [
                {
                    "ts": 2286311224, 
                    "point": "l_tx_user"
                }, 
                {
                    "ts": 2286311230, 
                    "point": "l_tx_devqueue"
                }, 
                {
                    "ts": 2286311232, 
                    "point": "l_tx_devout"
                }, 
                {
                    "ts": 1657220848, 
                    "point": "r_rx_icmprcv"
                }, 
                {
                    "ts": 1657220857, 
                    "point": "r_tx_devout"
                }, 
                {
                    "ts": 2286311308, 
                    "point": "l_rx_iprcv"
                }, 
                {
                    "ts": 2286311311, 
                    "point": "l_rx_skdataready"
                }, 
                {
                    "ts": 2286311313, 
                    "point": "l_rx_wakeup"
                }, 
                {
                    "ts": 2286311319, 
                    "point": "l_rx_user"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_devrcv"
                }, 
                {
                    "ts": 2286311306, 
                    "point": "l_rx_softirq"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_mac"
                }
            ]
        }, 
        {
            "delays": [
                {
                    "delay": "total", 
                    "ts": 93
                }, 
                {
                    "delay": "l_tx_kern", 
                    "ts": 8
                }, 
                {
                    "delay": "l_tx_qdisc", 
                    "ts": 4
                }, 
                {
                    "delay": "l_tx_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_kern", 
                    "ts": 7
                }, 
                {
                    "delay": "r_rx_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_inlink", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_kern", 
                    "ts": 3
                }, 
                {
                    "delay": "l_rx_task_waking", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_task_queue", 
                    "ts": 7
                }, 
                {
                    "delay": "l_rx_softirq", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ringkern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_kern", 
                    "ts": 12
                }, 
                {
                    "delay": "l_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_kern", 
                    "ts": 7
                }, 
                {
                    "delay": "r_rx_merged_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_inlink", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_kern", 
                    "ts": 12
                }
            ], 
            "meta": {
                "start_ns": 11766201747281902, 
                "seq": 20
            }, 
            "points": [
                {
                    "ts": 2286323537, 
                    "point": "l_tx_user"
                }, 
                {
                    "ts": 2286323545, 
                    "point": "l_tx_devqueue"
                }, 
                {
                    "ts": 2286323549, 
                    "point": "l_tx_devout"
                }, 
                {
                    "ts": 1657233158, 
                    "point": "r_rx_icmprcv"
                }, 
                {
                    "ts": 1657233165, 
                    "point": "r_tx_devout"
                }, 
                {
                    "ts": 2286323618, 
                    "point": "l_rx_iprcv"
                }, 
                {
                    "ts": 2286323621, 
                    "point": "l_rx_skdataready"
                }, 
                {
                    "ts": 2286323623, 
                    "point": "l_rx_wakeup"
                }, 
                {
                    "ts": 2286323630, 
                    "point": "l_rx_user"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_devrcv"
                }, 
                {
                    "ts": 2286323615, 
                    "point": "l_rx_softirq"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_mac"
                }
            ]
        }, 
        {
            "delays": [
                {
                    "delay": "total", 
                    "ts": 85
                }, 
                {
                    "delay": "l_tx_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "l_tx_qdisc", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "r_rx_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_inlink", 
                    "ts": 1
                }, 
                {
                    "delay": "l_rx_kern", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_task_waking", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_task_queue", 
                    "ts": 7
                }, 
                {
                    "delay": "l_rx_softirq", 
                    "ts": 2
                }, 
                {
                    "delay": "l_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ringkern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_kern", 
                    "ts": 9
                }, 
                {
                    "delay": "l_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "r_rx_merged_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_inlink", 
                    "ts": 1
                }, 
                {
                    "delay": "l_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_kern", 
                    "ts": 11
                }
            ], 
            "meta": {
                "start_ns": 11766201759594617, 
                "seq": 21
            }, 
            "points": [
                {
                    "ts": 2286335850, 
                    "point": "l_tx_user"
                }, 
                {
                    "ts": 2286335856, 
                    "point": "l_tx_devqueue"
                }, 
                {
                    "ts": 2286335859, 
                    "point": "l_tx_devout"
                }, 
                {
                    "ts": 1657245466, 
                    "point": "r_rx_icmprcv"
                }, 
                {
                    "ts": 1657245472, 
                    "point": "r_tx_devout"
                }, 
                {
                    "ts": 2286335924, 
                    "point": "l_rx_iprcv"
                }, 
                {
                    "ts": 2286335926, 
                    "point": "l_rx_skdataready"
                }, 
                {
                    "ts": 2286335928, 
                    "point": "l_rx_wakeup"
                }, 
                {
                    "ts": 2286335935, 
                    "point": "l_rx_user"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_devrcv"
                }, 
                {
                    "ts": 2286335922, 
                    "point": "l_rx_softirq"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_mac"
                }
            ]
        }, 
        {
            "delays": [
                {
                    "delay": "total", 
                    "ts": 99
                }, 
                {
                    "delay": "l_tx_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "l_tx_qdisc", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_kern", 
                    "ts": 9
                }, 
                {
                    "delay": "r_rx_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_inlink", 
                    "ts": 1
                }, 
                {
                    "delay": "l_rx_kern", 
                    "ts": 3
                }, 
                {
                    "delay": "l_rx_task_waking", 
                    "ts": 1
                }, 
                {
                    "delay": "l_rx_task_queue", 
                    "ts": 7
                }, 
                {
                    "delay": "l_rx_softirq", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ringkern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_kern", 
                    "ts": 9
                }, 
                {
                    "delay": "l_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_kern", 
                    "ts": 9
                }, 
                {
                    "delay": "r_rx_merged_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_inlink", 
                    "ts": 1
                }, 
                {
                    "delay": "l_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_kern", 
                    "ts": 11
                }
            ], 
            "meta": {
                "start_ns": 11766201771896719, 
                "seq": 22
            }, 
            "points": [
                {
                    "ts": 2286348152, 
                    "point": "l_tx_user"
                }, 
                {
                    "ts": 2286348158, 
                    "point": "l_tx_devqueue"
                }, 
                {
                    "ts": 2286348161, 
                    "point": "l_tx_devout"
                }, 
                {
                    "ts": 1657257779, 
                    "point": "r_rx_icmprcv"
                }, 
                {
                    "ts": 1657257788, 
                    "point": "r_tx_devout"
                }, 
                {
                    "ts": 2286348240, 
                    "point": "l_rx_iprcv"
                }, 
                {
                    "ts": 2286348243, 
                    "point": "l_rx_skdataready"
                }, 
                {
                    "ts": 2286348244, 
                    "point": "l_rx_wakeup"
                }, 
                {
                    "ts": 2286348251, 
                    "point": "l_rx_user"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_devrcv"
                }, 
                {
                    "ts": 2286348237, 
                    "point": "l_rx_softirq"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_mac"
                }
            ]
        }, 
        {
            "delays": [
                {
                    "delay": "total", 
                    "ts": 85
                }, 
                {
                    "delay": "l_tx_kern", 
                    "ts": 5
                }, 
                {
                    "delay": "l_tx_qdisc", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_kern", 
                    "ts": 7
                }, 
                {
                    "delay": "r_rx_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_inlink", 
                    "ts": 1
                }, 
                {
                    "delay": "l_rx_kern", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_task_waking", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_task_queue", 
                    "ts": 7
                }, 
                {
                    "delay": "l_rx_softirq", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ringkern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_kern", 
                    "ts": 8
                }, 
                {
                    "delay": "l_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_kern", 
                    "ts": 7
                }, 
                {
                    "delay": "r_rx_merged_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_inlink", 
                    "ts": 1
                }, 
                {
                    "delay": "l_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_kern", 
                    "ts": 11
                }
            ], 
            "meta": {
                "start_ns": 11766201784186384, 
                "seq": 23
            }, 
            "points": [
                {
                    "ts": 2286360442, 
                    "point": "l_tx_user"
                }, 
                {
                    "ts": 2286360447, 
                    "point": "l_tx_devqueue"
                }, 
                {
                    "ts": 2286360450, 
                    "point": "l_tx_devout"
                }, 
                {
                    "ts": 1657270057, 
                    "point": "r_rx_icmprcv"
                }, 
                {
                    "ts": 1657270064, 
                    "point": "r_tx_devout"
                }, 
                {
                    "ts": 2286360516, 
                    "point": "l_rx_iprcv"
                }, 
                {
                    "ts": 2286360518, 
                    "point": "l_rx_skdataready"
                }, 
                {
                    "ts": 2286360520, 
                    "point": "l_rx_wakeup"
                }, 
                {
                    "ts": 2286360527, 
                    "point": "l_rx_user"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_devrcv"
                }, 
                {
                    "ts": 2286360513, 
                    "point": "l_rx_softirq"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_mac"
                }
            ]
        }, 
        {
            "delays": [
                {
                    "delay": "total", 
                    "ts": 106
                }, 
                {
                    "delay": "l_tx_kern", 
                    "ts": 8
                }, 
                {
                    "delay": "l_tx_qdisc", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_kern", 
                    "ts": 10
                }, 
                {
                    "delay": "r_rx_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_inlink", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_kern", 
                    "ts": 3
                }, 
                {
                    "delay": "l_rx_task_waking", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_task_queue", 
                    "ts": 7
                }, 
                {
                    "delay": "l_rx_softirq", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ringkern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_kern", 
                    "ts": 11
                }, 
                {
                    "delay": "l_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_kern", 
                    "ts": 10
                }, 
                {
                    "delay": "r_rx_merged_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_inlink", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_kern", 
                    "ts": 12
                }
            ], 
            "meta": {
                "start_ns": 11766201796483577, 
                "seq": 24
            }, 
            "points": [
                {
                    "ts": 2286372739, 
                    "point": "l_tx_user"
                }, 
                {
                    "ts": 2286372747, 
                    "point": "l_tx_devqueue"
                }, 
                {
                    "ts": 2286372750, 
                    "point": "l_tx_devout"
                }, 
                {
                    "ts": 1657282370, 
                    "point": "r_rx_icmprcv"
                }, 
                {
                    "ts": 1657282380, 
                    "point": "r_tx_devout"
                }, 
                {
                    "ts": 2286372833, 
                    "point": "l_rx_iprcv"
                }, 
                {
                    "ts": 2286372836, 
                    "point": "l_rx_skdataready"
                }, 
                {
                    "ts": 2286372838, 
                    "point": "l_rx_wakeup"
                }, 
                {
                    "ts": 2286372845, 
                    "point": "l_rx_user"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_devrcv"
                }, 
                {
                    "ts": 2286372830, 
                    "point": "l_rx_softirq"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_mac"
                }
            ]
        }, 
        {
            "delays": [
                {
                    "delay": "total", 
                    "ts": 97
                }, 
                {
                    "delay": "l_tx_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "l_tx_qdisc", 
                    "ts": 2
                }, 
                {
                    "delay": "l_tx_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_kern", 
                    "ts": 8
                }, 
                {
                    "delay": "r_rx_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_inlink", 
                    "ts": 1
                }, 
                {
                    "delay": "l_rx_kern", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_task_waking", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_task_queue", 
                    "ts": 6
                }, 
                {
                    "delay": "l_rx_softirq", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ringkern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_kern", 
                    "ts": 8
                }, 
                {
                    "delay": "l_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_kern", 
                    "ts": 8
                }, 
                {
                    "delay": "r_rx_merged_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_inlink", 
                    "ts": 1
                }, 
                {
                    "delay": "l_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_kern", 
                    "ts": 10
                }
            ], 
            "meta": {
                "start_ns": 11766201808755791, 
                "seq": 25
            }, 
            "points": [
                {
                    "ts": 2286385011, 
                    "point": "l_tx_user"
                }, 
                {
                    "ts": 2286385017, 
                    "point": "l_tx_devqueue"
                }, 
                {
                    "ts": 2286385019, 
                    "point": "l_tx_devout"
                }, 
                {
                    "ts": 1657294638, 
                    "point": "r_rx_icmprcv"
                }, 
                {
                    "ts": 1657294646, 
                    "point": "r_tx_devout"
                }, 
                {
                    "ts": 2286385098, 
                    "point": "l_rx_iprcv"
                }, 
                {
                    "ts": 2286385100, 
                    "point": "l_rx_skdataready"
                }, 
                {
                    "ts": 2286385102, 
                    "point": "l_rx_wakeup"
                }, 
                {
                    "ts": 2286385108, 
                    "point": "l_rx_user"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_devrcv"
                }, 
                {
                    "ts": 2286385095, 
                    "point": "l_rx_softirq"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_mac"
                }
            ]
        }, 
        {
            "delays": [
                {
                    "delay": "total", 
                    "ts": 87
                }, 
                {
                    "delay": "l_tx_kern", 
                    "ts": 8
                }, 
                {
                    "delay": "l_tx_qdisc", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "r_rx_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_inlink", 
                    "ts": 1
                }, 
                {
                    "delay": "l_rx_kern", 
                    "ts": 3
                }, 
                {
                    "delay": "l_rx_task_waking", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_task_queue", 
                    "ts": 7
                }, 
                {
                    "delay": "l_rx_softirq", 
                    "ts": 2
                }, 
                {
                    "delay": "l_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ringkern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_kern", 
                    "ts": 11
                }, 
                {
                    "delay": "l_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "r_rx_merged_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_inlink", 
                    "ts": 1
                }, 
                {
                    "delay": "l_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_kern", 
                    "ts": 12
                }
            ], 
            "meta": {
                "start_ns": 11766201821086803, 
                "seq": 26
            }, 
            "points": [
                {
                    "ts": 2286397342, 
                    "point": "l_tx_user"
                }, 
                {
                    "ts": 2286397350, 
                    "point": "l_tx_devqueue"
                }, 
                {
                    "ts": 2286397353, 
                    "point": "l_tx_devout"
                }, 
                {
                    "ts": 1657306959, 
                    "point": "r_rx_icmprcv"
                }, 
                {
                    "ts": 1657306965, 
                    "point": "r_tx_devout"
                }, 
                {
                    "ts": 2286397417, 
                    "point": "l_rx_iprcv"
                }, 
                {
                    "ts": 2286397420, 
                    "point": "l_rx_skdataready"
                }, 
                {
                    "ts": 2286397422, 
                    "point": "l_rx_wakeup"
                }, 
                {
                    "ts": 2286397429, 
                    "point": "l_rx_user"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_devrcv"
                }, 
                {
                    "ts": 2286397415, 
                    "point": "l_rx_softirq"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_mac"
                }
            ]
        }, 
        {
            "delays": [
                {
                    "delay": "total", 
                    "ts": 98
                }, 
                {
                    "delay": "l_tx_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "l_tx_qdisc", 
                    "ts": 2
                }, 
                {
                    "delay": "l_tx_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_kern", 
                    "ts": 8
                }, 
                {
                    "delay": "r_rx_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_inlink", 
                    "ts": 0
                }, 
                {
                    "delay": "l_rx_kern", 
                    "ts": 3
                }, 
                {
                    "delay": "l_rx_task_waking", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_task_queue", 
                    "ts": 6
                }, 
                {
                    "delay": "l_rx_softirq", 
                    "ts": 2
                }, 
                {
                    "delay": "l_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ringkern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_kern", 
                    "ts": 8
                }, 
                {
                    "delay": "l_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_kern", 
                    "ts": 8
                }, 
                {
                    "delay": "r_rx_merged_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_inlink", 
                    "ts": 0
                }, 
                {
                    "delay": "l_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_kern", 
                    "ts": 11
                }
            ], 
            "meta": {
                "start_ns": 11766201833386420, 
                "seq": 27
            }, 
            "points": [
                {
                    "ts": 2286409642, 
                    "point": "l_tx_user"
                }, 
                {
                    "ts": 2286409648, 
                    "point": "l_tx_devqueue"
                }, 
                {
                    "ts": 2286409650, 
                    "point": "l_tx_devout"
                }, 
                {
                    "ts": 1657319270, 
                    "point": "r_rx_icmprcv"
                }, 
                {
                    "ts": 1657319278, 
                    "point": "r_tx_devout"
                }, 
                {
                    "ts": 2286409729, 
                    "point": "l_rx_iprcv"
                }, 
                {
                    "ts": 2286409732, 
                    "point": "l_rx_skdataready"
                }, 
                {
                    "ts": 2286409734, 
                    "point": "l_rx_wakeup"
                }, 
                {
                    "ts": 2286409740, 
                    "point": "l_rx_user"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_devrcv"
                }, 
                {
                    "ts": 2286409727, 
                    "point": "l_rx_softirq"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_mac"
                }
            ]
        }, 
        {
            "delays": [
                {
                    "delay": "total", 
                    "ts": 110
                }, 
                {
                    "delay": "l_tx_kern", 
                    "ts": 8
                }, 
                {
                    "delay": "l_tx_qdisc", 
                    "ts": 4
                }, 
                {
                    "delay": "l_tx_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_kern", 
                    "ts": 10
                }, 
                {
                    "delay": "r_rx_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_inlink", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_kern", 
                    "ts": 3
                }, 
                {
                    "delay": "l_rx_task_waking", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_task_queue", 
                    "ts": 8
                }, 
                {
                    "delay": "l_rx_softirq", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ringkern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_kern", 
                    "ts": 12
                }, 
                {
                    "delay": "l_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_kern", 
                    "ts": 10
                }, 
                {
                    "delay": "r_rx_merged_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_inlink", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_kern", 
                    "ts": 13
                }
            ], 
            "meta": {
                "start_ns": 11766201845675414, 
                "seq": 28
            }, 
            "points": [
                {
                    "ts": 2286421931, 
                    "point": "l_tx_user"
                }, 
                {
                    "ts": 2286421939, 
                    "point": "l_tx_devqueue"
                }, 
                {
                    "ts": 2286421943, 
                    "point": "l_tx_devout"
                }, 
                {
                    "ts": 1657331565, 
                    "point": "r_rx_icmprcv"
                }, 
                {
                    "ts": 1657331575, 
                    "point": "r_tx_devout"
                }, 
                {
                    "ts": 2286422028, 
                    "point": "l_rx_iprcv"
                }, 
                {
                    "ts": 2286422031, 
                    "point": "l_rx_skdataready"
                }, 
                {
                    "ts": 2286422033, 
                    "point": "l_rx_wakeup"
                }, 
                {
                    "ts": 2286422041, 
                    "point": "l_rx_user"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_devrcv"
                }, 
                {
                    "ts": 2286422025, 
                    "point": "l_rx_softirq"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_mac"
                }
            ]
        }, 
        {
            "delays": [
                {
                    "delay": "total", 
                    "ts": 109
                }, 
                {
                    "delay": "l_tx_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "l_tx_qdisc", 
                    "ts": 6
                }, 
                {
                    "delay": "l_tx_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_kern", 
                    "ts": 9
                }, 
                {
                    "delay": "r_rx_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_inlink", 
                    "ts": 1
                }, 
                {
                    "delay": "l_rx_kern", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_task_waking", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_task_queue", 
                    "ts": 7
                }, 
                {
                    "delay": "l_rx_softirq", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ringkern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_kern", 
                    "ts": 12
                }, 
                {
                    "delay": "l_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_kern", 
                    "ts": 9
                }, 
                {
                    "delay": "r_rx_merged_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_inlink", 
                    "ts": 1
                }, 
                {
                    "delay": "l_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_kern", 
                    "ts": 11
                }
            ], 
            "meta": {
                "start_ns": 11766201858001417, 
                "seq": 29
            }, 
            "points": [
                {
                    "ts": 2286434257, 
                    "point": "l_tx_user"
                }, 
                {
                    "ts": 2286434263, 
                    "point": "l_tx_devqueue"
                }, 
                {
                    "ts": 2286434269, 
                    "point": "l_tx_devout"
                }, 
                {
                    "ts": 1657343894, 
                    "point": "r_rx_icmprcv"
                }, 
                {
                    "ts": 1657343903, 
                    "point": "r_tx_devout"
                }, 
                {
                    "ts": 2286434355, 
                    "point": "l_rx_iprcv"
                }, 
                {
                    "ts": 2286434357, 
                    "point": "l_rx_skdataready"
                }, 
                {
                    "ts": 2286434359, 
                    "point": "l_rx_wakeup"
                }, 
                {
                    "ts": 2286434366, 
                    "point": "l_rx_user"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_devrcv"
                }, 
                {
                    "ts": 2286434352, 
                    "point": "l_rx_softirq"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_mac"
                }
            ]
        }, 
        {
            "delays": [
                {
                    "delay": "total", 
                    "ts": 93
                }, 
                {
                    "delay": "l_tx_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "l_tx_qdisc", 
                    "ts": 2
                }, 
                {
                    "delay": "l_tx_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "r_rx_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_inlink", 
                    "ts": 3
                }, 
                {
                    "delay": "l_rx_kern", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_task_waking", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_task_queue", 
                    "ts": 6
                }, 
                {
                    "delay": "l_rx_softirq", 
                    "ts": 4
                }, 
                {
                    "delay": "l_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ringkern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_kern", 
                    "ts": 8
                }, 
                {
                    "delay": "l_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "r_rx_merged_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_inlink", 
                    "ts": 3
                }, 
                {
                    "delay": "l_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_kern", 
                    "ts": 10
                }
            ], 
            "meta": {
                "start_ns": 11766201870332873, 
                "seq": 30
            }, 
            "points": [
                {
                    "ts": 2286446588, 
                    "point": "l_tx_user"
                }, 
                {
                    "ts": 2286446594, 
                    "point": "l_tx_devqueue"
                }, 
                {
                    "ts": 2286446596, 
                    "point": "l_tx_devout"
                }, 
                {
                    "ts": 1657356211, 
                    "point": "r_rx_icmprcv"
                }, 
                {
                    "ts": 1657356217, 
                    "point": "r_tx_devout"
                }, 
                {
                    "ts": 2286446671, 
                    "point": "l_rx_iprcv"
                }, 
                {
                    "ts": 2286446673, 
                    "point": "l_rx_skdataready"
                }, 
                {
                    "ts": 2286446675, 
                    "point": "l_rx_wakeup"
                }, 
                {
                    "ts": 2286446681, 
                    "point": "l_rx_user"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_devrcv"
                }, 
                {
                    "ts": 2286446667, 
                    "point": "l_rx_softirq"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_mac"
                }
            ]
        }, 
        {
            "delays": [
                {
                    "delay": "total", 
                    "ts": 102
                }, 
                {
                    "delay": "l_tx_kern", 
                    "ts": 5
                }, 
                {
                    "delay": "l_tx_qdisc", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_kern", 
                    "ts": 8
                }, 
                {
                    "delay": "r_rx_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_inlink", 
                    "ts": 0
                }, 
                {
                    "delay": "l_rx_kern", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_task_waking", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_task_queue", 
                    "ts": 9
                }, 
                {
                    "delay": "l_rx_softirq", 
                    "ts": 2
                }, 
                {
                    "delay": "l_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ringkern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_kern", 
                    "ts": 8
                }, 
                {
                    "delay": "l_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_kern", 
                    "ts": 8
                }, 
                {
                    "delay": "r_rx_merged_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_inlink", 
                    "ts": 0
                }, 
                {
                    "delay": "l_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_kern", 
                    "ts": 13
                }
            ], 
            "meta": {
                "start_ns": 11766201882640173, 
                "seq": 31
            }, 
            "points": [
                {
                    "ts": 2286458896, 
                    "point": "l_tx_user"
                }, 
                {
                    "ts": 2286458901, 
                    "point": "l_tx_devqueue"
                }, 
                {
                    "ts": 2286458904, 
                    "point": "l_tx_devout"
                }, 
                {
                    "ts": 1657368526, 
                    "point": "r_rx_icmprcv"
                }, 
                {
                    "ts": 1657368534, 
                    "point": "r_tx_devout"
                }, 
                {
                    "ts": 2286458985, 
                    "point": "l_rx_iprcv"
                }, 
                {
                    "ts": 2286458987, 
                    "point": "l_rx_skdataready"
                }, 
                {
                    "ts": 2286458989, 
                    "point": "l_rx_wakeup"
                }, 
                {
                    "ts": 2286458998, 
                    "point": "l_rx_user"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_devrcv"
                }, 
                {
                    "ts": 2286458983, 
                    "point": "l_rx_softirq"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_mac"
                }
            ]
        }, 
        {
            "delays": [
                {
                    "delay": "total", 
                    "ts": 96
                }, 
                {
                    "delay": "l_tx_kern", 
                    "ts": 8
                }, 
                {
                    "delay": "l_tx_qdisc", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_kern", 
                    "ts": 10
                }, 
                {
                    "delay": "r_rx_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_inlink", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_kern", 
                    "ts": 3
                }, 
                {
                    "delay": "l_rx_task_waking", 
                    "ts": 3
                }, 
                {
                    "delay": "l_rx_task_queue", 
                    "ts": 7
                }, 
                {
                    "delay": "l_rx_softirq", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ringkern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_kern", 
                    "ts": 11
                }, 
                {
                    "delay": "l_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_kern", 
                    "ts": 10
                }, 
                {
                    "delay": "r_rx_merged_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_inlink", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_kern", 
                    "ts": 13
                }
            ], 
            "meta": {
                "start_ns": 11766201894959618, 
                "seq": 32
            }, 
            "points": [
                {
                    "ts": 2286471215, 
                    "point": "l_tx_user"
                }, 
                {
                    "ts": 2286471223, 
                    "point": "l_tx_devqueue"
                }, 
                {
                    "ts": 2286471226, 
                    "point": "l_tx_devout"
                }, 
                {
                    "ts": 1657380835, 
                    "point": "r_rx_icmprcv"
                }, 
                {
                    "ts": 1657380845, 
                    "point": "r_tx_devout"
                }, 
                {
                    "ts": 2286471298, 
                    "point": "l_rx_iprcv"
                }, 
                {
                    "ts": 2286471301, 
                    "point": "l_rx_skdataready"
                }, 
                {
                    "ts": 2286471304, 
                    "point": "l_rx_wakeup"
                }, 
                {
                    "ts": 2286471311, 
                    "point": "l_rx_user"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_devrcv"
                }, 
                {
                    "ts": 2286471295, 
                    "point": "l_rx_softirq"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_mac"
                }
            ]
        }, 
        {
            "delays": [
                {
                    "delay": "total", 
                    "ts": 89
                }, 
                {
                    "delay": "l_tx_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "l_tx_qdisc", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "r_rx_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_inlink", 
                    "ts": 1
                }, 
                {
                    "delay": "l_rx_kern", 
                    "ts": 3
                }, 
                {
                    "delay": "l_rx_task_waking", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_task_queue", 
                    "ts": 11
                }, 
                {
                    "delay": "l_rx_softirq", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ringkern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_kern", 
                    "ts": 9
                }, 
                {
                    "delay": "l_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "r_rx_merged_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_inlink", 
                    "ts": 1
                }, 
                {
                    "delay": "l_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_kern", 
                    "ts": 16
                }
            ], 
            "meta": {
                "start_ns": 11766201907265919, 
                "seq": 33
            }, 
            "points": [
                {
                    "ts": 2286483521, 
                    "point": "l_tx_user"
                }, 
                {
                    "ts": 2286483527, 
                    "point": "l_tx_devqueue"
                }, 
                {
                    "ts": 2286483530, 
                    "point": "l_tx_devout"
                }, 
                {
                    "ts": 1657393136, 
                    "point": "r_rx_icmprcv"
                }, 
                {
                    "ts": 1657393142, 
                    "point": "r_tx_devout"
                }, 
                {
                    "ts": 2286483594, 
                    "point": "l_rx_iprcv"
                }, 
                {
                    "ts": 2286483597, 
                    "point": "l_rx_skdataready"
                }, 
                {
                    "ts": 2286483599, 
                    "point": "l_rx_wakeup"
                }, 
                {
                    "ts": 2286483610, 
                    "point": "l_rx_user"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_devrcv"
                }, 
                {
                    "ts": 2286483591, 
                    "point": "l_rx_softirq"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_mac"
                }
            ]
        }, 
        {
            "delays": [
                {
                    "delay": "total", 
                    "ts": 97
                }, 
                {
                    "delay": "l_tx_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "l_tx_qdisc", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_kern", 
                    "ts": 8
                }, 
                {
                    "delay": "r_rx_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_inlink", 
                    "ts": 0
                }, 
                {
                    "delay": "l_rx_kern", 
                    "ts": 3
                }, 
                {
                    "delay": "l_rx_task_waking", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_task_queue", 
                    "ts": 6
                }, 
                {
                    "delay": "l_rx_softirq", 
                    "ts": 2
                }, 
                {
                    "delay": "l_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ringkern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_kern", 
                    "ts": 9
                }, 
                {
                    "delay": "l_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_kern", 
                    "ts": 8
                }, 
                {
                    "delay": "r_rx_merged_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_inlink", 
                    "ts": 0
                }, 
                {
                    "delay": "l_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_kern", 
                    "ts": 11
                }
            ], 
            "meta": {
                "start_ns": 11766201919563727, 
                "seq": 34
            }, 
            "points": [
                {
                    "ts": 2286495819, 
                    "point": "l_tx_user"
                }, 
                {
                    "ts": 2286495825, 
                    "point": "l_tx_devqueue"
                }, 
                {
                    "ts": 2286495828, 
                    "point": "l_tx_devout"
                }, 
                {
                    "ts": 1657405446, 
                    "point": "r_rx_icmprcv"
                }, 
                {
                    "ts": 1657405454, 
                    "point": "r_tx_devout"
                }, 
                {
                    "ts": 2286495905, 
                    "point": "l_rx_iprcv"
                }, 
                {
                    "ts": 2286495908, 
                    "point": "l_rx_skdataready"
                }, 
                {
                    "ts": 2286495910, 
                    "point": "l_rx_wakeup"
                }, 
                {
                    "ts": 2286495916, 
                    "point": "l_rx_user"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_devrcv"
                }, 
                {
                    "ts": 2286495903, 
                    "point": "l_rx_softirq"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_mac"
                }
            ]
        }, 
        {
            "delays": [
                {
                    "delay": "total", 
                    "ts": 94
                }, 
                {
                    "delay": "l_tx_kern", 
                    "ts": 7
                }, 
                {
                    "delay": "l_tx_qdisc", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "r_rx_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_inlink", 
                    "ts": 1
                }, 
                {
                    "delay": "l_rx_kern", 
                    "ts": 3
                }, 
                {
                    "delay": "l_rx_task_waking", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_task_queue", 
                    "ts": 7
                }, 
                {
                    "delay": "l_rx_softirq", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ringkern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_kern", 
                    "ts": 10
                }, 
                {
                    "delay": "l_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "r_rx_merged_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_inlink", 
                    "ts": 1
                }, 
                {
                    "delay": "l_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_kern", 
                    "ts": 12
                }
            ], 
            "meta": {
                "start_ns": 11766201931879230, 
                "seq": 35
            }, 
            "points": [
                {
                    "ts": 2286508135, 
                    "point": "l_tx_user"
                }, 
                {
                    "ts": 2286508142, 
                    "point": "l_tx_devqueue"
                }, 
                {
                    "ts": 2286508145, 
                    "point": "l_tx_devout"
                }, 
                {
                    "ts": 1657417759, 
                    "point": "r_rx_icmprcv"
                }, 
                {
                    "ts": 1657417765, 
                    "point": "r_tx_devout"
                }, 
                {
                    "ts": 2286508217, 
                    "point": "l_rx_iprcv"
                }, 
                {
                    "ts": 2286508220, 
                    "point": "l_rx_skdataready"
                }, 
                {
                    "ts": 2286508222, 
                    "point": "l_rx_wakeup"
                }, 
                {
                    "ts": 2286508229, 
                    "point": "l_rx_user"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_devrcv"
                }, 
                {
                    "ts": 2286508214, 
                    "point": "l_rx_softirq"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_mac"
                }
            ]
        }, 
        {
            "delays": [
                {
                    "delay": "total", 
                    "ts": 96
                }, 
                {
                    "delay": "l_tx_kern", 
                    "ts": 7
                }, 
                {
                    "delay": "l_tx_qdisc", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_kern", 
                    "ts": 7
                }, 
                {
                    "delay": "r_rx_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_inlink", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_kern", 
                    "ts": 3
                }, 
                {
                    "delay": "l_rx_task_waking", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_task_queue", 
                    "ts": 7
                }, 
                {
                    "delay": "l_rx_softirq", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ringkern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_kern", 
                    "ts": 10
                }, 
                {
                    "delay": "l_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_kern", 
                    "ts": 7
                }, 
                {
                    "delay": "r_rx_merged_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_inlink", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_kern", 
                    "ts": 12
                }
            ], 
            "meta": {
                "start_ns": 11766201944188208, 
                "seq": 36
            }, 
            "points": [
                {
                    "ts": 2286520444, 
                    "point": "l_tx_user"
                }, 
                {
                    "ts": 2286520451, 
                    "point": "l_tx_devqueue"
                }, 
                {
                    "ts": 2286520454, 
                    "point": "l_tx_devout"
                }, 
                {
                    "ts": 1657430068, 
                    "point": "r_rx_icmprcv"
                }, 
                {
                    "ts": 1657430075, 
                    "point": "r_tx_devout"
                }, 
                {
                    "ts": 2286520528, 
                    "point": "l_rx_iprcv"
                }, 
                {
                    "ts": 2286520531, 
                    "point": "l_rx_skdataready"
                }, 
                {
                    "ts": 2286520533, 
                    "point": "l_rx_wakeup"
                }, 
                {
                    "ts": 2286520540, 
                    "point": "l_rx_user"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_devrcv"
                }, 
                {
                    "ts": 2286520525, 
                    "point": "l_rx_softirq"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_mac"
                }
            ]
        }, 
        {
            "delays": [
                {
                    "delay": "total", 
                    "ts": 97
                }, 
                {
                    "delay": "l_tx_kern", 
                    "ts": 5
                }, 
                {
                    "delay": "l_tx_qdisc", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_kern", 
                    "ts": 8
                }, 
                {
                    "delay": "r_rx_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_inlink", 
                    "ts": 1
                }, 
                {
                    "delay": "l_rx_kern", 
                    "ts": 3
                }, 
                {
                    "delay": "l_rx_task_waking", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_task_queue", 
                    "ts": 6
                }, 
                {
                    "delay": "l_rx_softirq", 
                    "ts": 2
                }, 
                {
                    "delay": "l_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ringkern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_kern", 
                    "ts": 8
                }, 
                {
                    "delay": "l_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_kern", 
                    "ts": 8
                }, 
                {
                    "delay": "r_rx_merged_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_inlink", 
                    "ts": 1
                }, 
                {
                    "delay": "l_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_kern", 
                    "ts": 11
                }
            ], 
            "meta": {
                "start_ns": 11766201956499069, 
                "seq": 37
            }, 
            "points": [
                {
                    "ts": 2286532755, 
                    "point": "l_tx_user"
                }, 
                {
                    "ts": 2286532760, 
                    "point": "l_tx_devqueue"
                }, 
                {
                    "ts": 2286532763, 
                    "point": "l_tx_devout"
                }, 
                {
                    "ts": 1657442381, 
                    "point": "r_rx_icmprcv"
                }, 
                {
                    "ts": 1657442389, 
                    "point": "r_tx_devout"
                }, 
                {
                    "ts": 2286532841, 
                    "point": "l_rx_iprcv"
                }, 
                {
                    "ts": 2286532844, 
                    "point": "l_rx_skdataready"
                }, 
                {
                    "ts": 2286532846, 
                    "point": "l_rx_wakeup"
                }, 
                {
                    "ts": 2286532852, 
                    "point": "l_rx_user"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_devrcv"
                }, 
                {
                    "ts": 2286532839, 
                    "point": "l_rx_softirq"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_mac"
                }
            ]
        }, 
        {
            "delays": [
                {
                    "delay": "total", 
                    "ts": 88
                }, 
                {
                    "delay": "l_tx_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "l_tx_qdisc", 
                    "ts": 2
                }, 
                {
                    "delay": "l_tx_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "r_rx_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_inlink", 
                    "ts": 1
                }, 
                {
                    "delay": "l_rx_kern", 
                    "ts": 3
                }, 
                {
                    "delay": "l_rx_task_waking", 
                    "ts": 1
                }, 
                {
                    "delay": "l_rx_task_queue", 
                    "ts": 7
                }, 
                {
                    "delay": "l_rx_softirq", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ringkern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_kern", 
                    "ts": 8
                }, 
                {
                    "delay": "l_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "r_rx_merged_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_inlink", 
                    "ts": 1
                }, 
                {
                    "delay": "l_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_kern", 
                    "ts": 11
                }
            ], 
            "meta": {
                "start_ns": 11766201968813694, 
                "seq": 38
            }, 
            "points": [
                {
                    "ts": 2286545069, 
                    "point": "l_tx_user"
                }, 
                {
                    "ts": 2286545075, 
                    "point": "l_tx_devqueue"
                }, 
                {
                    "ts": 2286545077, 
                    "point": "l_tx_devout"
                }, 
                {
                    "ts": 1657454688, 
                    "point": "r_rx_icmprcv"
                }, 
                {
                    "ts": 1657454694, 
                    "point": "r_tx_devout"
                }, 
                {
                    "ts": 2286545146, 
                    "point": "l_rx_iprcv"
                }, 
                {
                    "ts": 2286545149, 
                    "point": "l_rx_skdataready"
                }, 
                {
                    "ts": 2286545150, 
                    "point": "l_rx_wakeup"
                }, 
                {
                    "ts": 2286545157, 
                    "point": "l_rx_user"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_devrcv"
                }, 
                {
                    "ts": 2286545143, 
                    "point": "l_rx_softirq"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_mac"
                }
            ]
        }, 
        {
            "delays": [
                {
                    "delay": "total", 
                    "ts": 90
                }, 
                {
                    "delay": "l_tx_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "l_tx_qdisc", 
                    "ts": 2
                }, 
                {
                    "delay": "l_tx_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "r_rx_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_inlink", 
                    "ts": 1
                }, 
                {
                    "delay": "l_rx_kern", 
                    "ts": 3
                }, 
                {
                    "delay": "l_rx_task_waking", 
                    "ts": 1
                }, 
                {
                    "delay": "l_rx_task_queue", 
                    "ts": 7
                }, 
                {
                    "delay": "l_rx_softirq", 
                    "ts": 2
                }, 
                {
                    "delay": "l_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ringkern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_kern", 
                    "ts": 8
                }, 
                {
                    "delay": "l_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "r_rx_merged_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_inlink", 
                    "ts": 1
                }, 
                {
                    "delay": "l_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_kern", 
                    "ts": 11
                }
            ], 
            "meta": {
                "start_ns": 11766201981120843, 
                "seq": 39
            }, 
            "points": [
                {
                    "ts": 2286557376, 
                    "point": "l_tx_user"
                }, 
                {
                    "ts": 2286557382, 
                    "point": "l_tx_devqueue"
                }, 
                {
                    "ts": 2286557384, 
                    "point": "l_tx_devout"
                }, 
                {
                    "ts": 1657466997, 
                    "point": "r_rx_icmprcv"
                }, 
                {
                    "ts": 1657467003, 
                    "point": "r_tx_devout"
                }, 
                {
                    "ts": 2286557455, 
                    "point": "l_rx_iprcv"
                }, 
                {
                    "ts": 2286557458, 
                    "point": "l_rx_skdataready"
                }, 
                {
                    "ts": 2286557459, 
                    "point": "l_rx_wakeup"
                }, 
                {
                    "ts": 2286557466, 
                    "point": "l_rx_user"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_devrcv"
                }, 
                {
                    "ts": 2286557453, 
                    "point": "l_rx_softirq"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_mac"
                }
            ]
        }, 
        {
            "delays": [
                {
                    "delay": "total", 
                    "ts": 93
                }, 
                {
                    "delay": "l_tx_kern", 
                    "ts": 7
                }, 
                {
                    "delay": "l_tx_qdisc", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_kern", 
                    "ts": 7
                }, 
                {
                    "delay": "r_rx_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_inlink", 
                    "ts": 1
                }, 
                {
                    "delay": "l_rx_kern", 
                    "ts": 3
                }, 
                {
                    "delay": "l_rx_task_waking", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_task_queue", 
                    "ts": 7
                }, 
                {
                    "delay": "l_rx_softirq", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ringkern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_kern", 
                    "ts": 10
                }, 
                {
                    "delay": "l_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_kern", 
                    "ts": 7
                }, 
                {
                    "delay": "r_rx_merged_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_inlink", 
                    "ts": 1
                }, 
                {
                    "delay": "l_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_kern", 
                    "ts": 12
                }
            ], 
            "meta": {
                "start_ns": 11766201993430723, 
                "seq": 40
            }, 
            "points": [
                {
                    "ts": 2286569686, 
                    "point": "l_tx_user"
                }, 
                {
                    "ts": 2286569693, 
                    "point": "l_tx_devqueue"
                }, 
                {
                    "ts": 2286569696, 
                    "point": "l_tx_devout"
                }, 
                {
                    "ts": 1657479308, 
                    "point": "r_rx_icmprcv"
                }, 
                {
                    "ts": 1657479315, 
                    "point": "r_tx_devout"
                }, 
                {
                    "ts": 2286569767, 
                    "point": "l_rx_iprcv"
                }, 
                {
                    "ts": 2286569770, 
                    "point": "l_rx_skdataready"
                }, 
                {
                    "ts": 2286569772, 
                    "point": "l_rx_wakeup"
                }, 
                {
                    "ts": 2286569779, 
                    "point": "l_rx_user"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_devrcv"
                }, 
                {
                    "ts": 2286569764, 
                    "point": "l_rx_softirq"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_mac"
                }
            ]
        }, 
        {
            "delays": [
                {
                    "delay": "total", 
                    "ts": 101
                }, 
                {
                    "delay": "l_tx_kern", 
                    "ts": 8
                }, 
                {
                    "delay": "l_tx_qdisc", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_kern", 
                    "ts": 8
                }, 
                {
                    "delay": "r_rx_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_inlink", 
                    "ts": 0
                }, 
                {
                    "delay": "l_rx_kern", 
                    "ts": 3
                }, 
                {
                    "delay": "l_rx_task_waking", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_task_queue", 
                    "ts": 6
                }, 
                {
                    "delay": "l_rx_softirq", 
                    "ts": 2
                }, 
                {
                    "delay": "l_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ringkern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_kern", 
                    "ts": 11
                }, 
                {
                    "delay": "l_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_kern", 
                    "ts": 8
                }, 
                {
                    "delay": "r_rx_merged_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_inlink", 
                    "ts": 0
                }, 
                {
                    "delay": "l_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_kern", 
                    "ts": 11
                }
            ], 
            "meta": {
                "start_ns": 11766202005738461, 
                "seq": 41
            }, 
            "points": [
                {
                    "ts": 2286581994, 
                    "point": "l_tx_user"
                }, 
                {
                    "ts": 2286582002, 
                    "point": "l_tx_devqueue"
                }, 
                {
                    "ts": 2286582005, 
                    "point": "l_tx_devout"
                }, 
                {
                    "ts": 1657491625, 
                    "point": "r_rx_icmprcv"
                }, 
                {
                    "ts": 1657491633, 
                    "point": "r_tx_devout"
                }, 
                {
                    "ts": 2286582084, 
                    "point": "l_rx_iprcv"
                }, 
                {
                    "ts": 2286582087, 
                    "point": "l_rx_skdataready"
                }, 
                {
                    "ts": 2286582089, 
                    "point": "l_rx_wakeup"
                }, 
                {
                    "ts": 2286582095, 
                    "point": "l_rx_user"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_devrcv"
                }, 
                {
                    "ts": 2286582082, 
                    "point": "l_rx_softirq"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_mac"
                }
            ]
        }, 
        {
            "delays": [
                {
                    "delay": "total", 
                    "ts": 106
                }, 
                {
                    "delay": "l_tx_kern", 
                    "ts": 8
                }, 
                {
                    "delay": "l_tx_qdisc", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_kern", 
                    "ts": 8
                }, 
                {
                    "delay": "r_rx_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_inlink", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_kern", 
                    "ts": 3
                }, 
                {
                    "delay": "l_rx_task_waking", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_task_queue", 
                    "ts": 7
                }, 
                {
                    "delay": "l_rx_softirq", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ringkern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_kern", 
                    "ts": 11
                }, 
                {
                    "delay": "l_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_kern", 
                    "ts": 8
                }, 
                {
                    "delay": "r_rx_merged_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_inlink", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_kern", 
                    "ts": 12
                }
            ], 
            "meta": {
                "start_ns": 11766202018056826, 
                "seq": 42
            }, 
            "points": [
                {
                    "ts": 2286594312, 
                    "point": "l_tx_user"
                }, 
                {
                    "ts": 2286594320, 
                    "point": "l_tx_devqueue"
                }, 
                {
                    "ts": 2286594323, 
                    "point": "l_tx_devout"
                }, 
                {
                    "ts": 1657503945, 
                    "point": "r_rx_icmprcv"
                }, 
                {
                    "ts": 1657503953, 
                    "point": "r_tx_devout"
                }, 
                {
                    "ts": 2286594406, 
                    "point": "l_rx_iprcv"
                }, 
                {
                    "ts": 2286594409, 
                    "point": "l_rx_skdataready"
                }, 
                {
                    "ts": 2286594411, 
                    "point": "l_rx_wakeup"
                }, 
                {
                    "ts": 2286594418, 
                    "point": "l_rx_user"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_devrcv"
                }, 
                {
                    "ts": 2286594403, 
                    "point": "l_rx_softirq"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_mac"
                }
            ]
        }, 
        {
            "delays": [
                {
                    "delay": "total", 
                    "ts": 96
                }, 
                {
                    "delay": "l_tx_kern", 
                    "ts": 7
                }, 
                {
                    "delay": "l_tx_qdisc", 
                    "ts": 2
                }, 
                {
                    "delay": "l_tx_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "r_rx_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_inlink", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_kern", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_task_waking", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_task_queue", 
                    "ts": 7
                }, 
                {
                    "delay": "l_rx_softirq", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ringkern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_kern", 
                    "ts": 9
                }, 
                {
                    "delay": "l_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "r_rx_merged_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_inlink", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_kern", 
                    "ts": 11
                }
            ], 
            "meta": {
                "start_ns": 11766202030385483, 
                "seq": 43
            }, 
            "points": [
                {
                    "ts": 2286606641, 
                    "point": "l_tx_user"
                }, 
                {
                    "ts": 2286606648, 
                    "point": "l_tx_devqueue"
                }, 
                {
                    "ts": 2286606650, 
                    "point": "l_tx_devout"
                }, 
                {
                    "ts": 1657516267, 
                    "point": "r_rx_icmprcv"
                }, 
                {
                    "ts": 1657516273, 
                    "point": "r_tx_devout"
                }, 
                {
                    "ts": 2286606726, 
                    "point": "l_rx_iprcv"
                }, 
                {
                    "ts": 2286606728, 
                    "point": "l_rx_skdataready"
                }, 
                {
                    "ts": 2286606730, 
                    "point": "l_rx_wakeup"
                }, 
                {
                    "ts": 2286606737, 
                    "point": "l_rx_user"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_devrcv"
                }, 
                {
                    "ts": 2286606723, 
                    "point": "l_rx_softirq"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_mac"
                }
            ]
        }, 
        {
            "delays": [
                {
                    "delay": "total", 
                    "ts": 98
                }, 
                {
                    "delay": "l_tx_kern", 
                    "ts": 7
                }, 
                {
                    "delay": "l_tx_qdisc", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_kern", 
                    "ts": 7
                }, 
                {
                    "delay": "r_rx_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_inlink", 
                    "ts": 1
                }, 
                {
                    "delay": "l_rx_kern", 
                    "ts": 3
                }, 
                {
                    "delay": "l_rx_task_waking", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_task_queue", 
                    "ts": 7
                }, 
                {
                    "delay": "l_rx_softirq", 
                    "ts": 2
                }, 
                {
                    "delay": "l_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ringkern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_kern", 
                    "ts": 10
                }, 
                {
                    "delay": "l_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_kern", 
                    "ts": 7
                }, 
                {
                    "delay": "r_rx_merged_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_inlink", 
                    "ts": 1
                }, 
                {
                    "delay": "l_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_kern", 
                    "ts": 12
                }
            ], 
            "meta": {
                "start_ns": 11766202042696689, 
                "seq": 44
            }, 
            "points": [
                {
                    "ts": 2286618952, 
                    "point": "l_tx_user"
                }, 
                {
                    "ts": 2286618959, 
                    "point": "l_tx_devqueue"
                }, 
                {
                    "ts": 2286618962, 
                    "point": "l_tx_devout"
                }, 
                {
                    "ts": 1657528579, 
                    "point": "r_rx_icmprcv"
                }, 
                {
                    "ts": 1657528586, 
                    "point": "r_tx_devout"
                }, 
                {
                    "ts": 2286619038, 
                    "point": "l_rx_iprcv"
                }, 
                {
                    "ts": 2286619041, 
                    "point": "l_rx_skdataready"
                }, 
                {
                    "ts": 2286619043, 
                    "point": "l_rx_wakeup"
                }, 
                {
                    "ts": 2286619050, 
                    "point": "l_rx_user"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_devrcv"
                }, 
                {
                    "ts": 2286619036, 
                    "point": "l_rx_softirq"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_mac"
                }
            ]
        }, 
        {
            "delays": [
                {
                    "delay": "total", 
                    "ts": 87
                }, 
                {
                    "delay": "l_tx_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "l_tx_qdisc", 
                    "ts": 2
                }, 
                {
                    "delay": "l_tx_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "r_rx_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_inlink", 
                    "ts": 1
                }, 
                {
                    "delay": "l_rx_kern", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_task_waking", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_task_queue", 
                    "ts": 6
                }, 
                {
                    "delay": "l_rx_softirq", 
                    "ts": 2
                }, 
                {
                    "delay": "l_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ringkern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_kern", 
                    "ts": 8
                }, 
                {
                    "delay": "l_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "r_rx_merged_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_inlink", 
                    "ts": 1
                }, 
                {
                    "delay": "l_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_kern", 
                    "ts": 10
                }
            ], 
            "meta": {
                "start_ns": 11766202055011743, 
                "seq": 45
            }, 
            "points": [
                {
                    "ts": 2286631267, 
                    "point": "l_tx_user"
                }, 
                {
                    "ts": 2286631273, 
                    "point": "l_tx_devqueue"
                }, 
                {
                    "ts": 2286631275, 
                    "point": "l_tx_devout"
                }, 
                {
                    "ts": 1657540886, 
                    "point": "r_rx_icmprcv"
                }, 
                {
                    "ts": 1657540892, 
                    "point": "r_tx_devout"
                }, 
                {
                    "ts": 2286631344, 
                    "point": "l_rx_iprcv"
                }, 
                {
                    "ts": 2286631346, 
                    "point": "l_rx_skdataready"
                }, 
                {
                    "ts": 2286631348, 
                    "point": "l_rx_wakeup"
                }, 
                {
                    "ts": 2286631354, 
                    "point": "l_rx_user"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_devrcv"
                }, 
                {
                    "ts": 2286631342, 
                    "point": "l_rx_softirq"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_mac"
                }
            ]
        }, 
        {
            "delays": [
                {
                    "delay": "total", 
                    "ts": 89
                }, 
                {
                    "delay": "l_tx_kern", 
                    "ts": 5
                }, 
                {
                    "delay": "l_tx_qdisc", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_kern", 
                    "ts": 9
                }, 
                {
                    "delay": "r_rx_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_inlink", 
                    "ts": 0
                }, 
                {
                    "delay": "l_rx_kern", 
                    "ts": 3
                }, 
                {
                    "delay": "l_rx_task_waking", 
                    "ts": 1
                }, 
                {
                    "delay": "l_rx_task_queue", 
                    "ts": 7
                }, 
                {
                    "delay": "l_rx_softirq", 
                    "ts": 2
                }, 
                {
                    "delay": "l_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ringkern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_kern", 
                    "ts": 8
                }, 
                {
                    "delay": "l_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_kern", 
                    "ts": 9
                }, 
                {
                    "delay": "r_rx_merged_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_inlink", 
                    "ts": 0
                }, 
                {
                    "delay": "l_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_kern", 
                    "ts": 11
                }
            ], 
            "meta": {
                "start_ns": 11766202067310188, 
                "seq": 46
            }, 
            "points": [
                {
                    "ts": 2286643566, 
                    "point": "l_tx_user"
                }, 
                {
                    "ts": 2286643571, 
                    "point": "l_tx_devqueue"
                }, 
                {
                    "ts": 2286643574, 
                    "point": "l_tx_devout"
                }, 
                {
                    "ts": 1657553184, 
                    "point": "r_rx_icmprcv"
                }, 
                {
                    "ts": 1657553193, 
                    "point": "r_tx_devout"
                }, 
                {
                    "ts": 2286643644, 
                    "point": "l_rx_iprcv"
                }, 
                {
                    "ts": 2286643647, 
                    "point": "l_rx_skdataready"
                }, 
                {
                    "ts": 2286643648, 
                    "point": "l_rx_wakeup"
                }, 
                {
                    "ts": 2286643655, 
                    "point": "l_rx_user"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_devrcv"
                }, 
                {
                    "ts": 2286643642, 
                    "point": "l_rx_softirq"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_mac"
                }
            ]
        }, 
        {
            "delays": [
                {
                    "delay": "total", 
                    "ts": 108
                }, 
                {
                    "delay": "l_tx_kern", 
                    "ts": 7
                }, 
                {
                    "delay": "l_tx_qdisc", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_kern", 
                    "ts": 9
                }, 
                {
                    "delay": "r_rx_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_inlink", 
                    "ts": 1
                }, 
                {
                    "delay": "l_rx_kern", 
                    "ts": 3
                }, 
                {
                    "delay": "l_rx_task_waking", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_task_queue", 
                    "ts": 7
                }, 
                {
                    "delay": "l_rx_softirq", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ringkern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_kern", 
                    "ts": 10
                }, 
                {
                    "delay": "l_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_kern", 
                    "ts": 9
                }, 
                {
                    "delay": "r_rx_merged_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_inlink", 
                    "ts": 1
                }, 
                {
                    "delay": "l_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_kern", 
                    "ts": 12
                }
            ], 
            "meta": {
                "start_ns": 11766202079619662, 
                "seq": 47
            }, 
            "points": [
                {
                    "ts": 2286655875, 
                    "point": "l_tx_user"
                }, 
                {
                    "ts": 2286655882, 
                    "point": "l_tx_devqueue"
                }, 
                {
                    "ts": 2286655885, 
                    "point": "l_tx_devout"
                }, 
                {
                    "ts": 1657565510, 
                    "point": "r_rx_icmprcv"
                }, 
                {
                    "ts": 1657565519, 
                    "point": "r_tx_devout"
                }, 
                {
                    "ts": 2286655971, 
                    "point": "l_rx_iprcv"
                }, 
                {
                    "ts": 2286655974, 
                    "point": "l_rx_skdataready"
                }, 
                {
                    "ts": 2286655976, 
                    "point": "l_rx_wakeup"
                }, 
                {
                    "ts": 2286655983, 
                    "point": "l_rx_user"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_devrcv"
                }, 
                {
                    "ts": 2286655968, 
                    "point": "l_rx_softirq"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_mac"
                }
            ]
        }, 
        {
            "delays": [
                {
                    "delay": "total", 
                    "ts": 99
                }, 
                {
                    "delay": "l_tx_kern", 
                    "ts": 7
                }, 
                {
                    "delay": "l_tx_qdisc", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_kern", 
                    "ts": 8
                }, 
                {
                    "delay": "r_rx_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_inlink", 
                    "ts": 1
                }, 
                {
                    "delay": "l_rx_kern", 
                    "ts": 3
                }, 
                {
                    "delay": "l_rx_task_waking", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_task_queue", 
                    "ts": 7
                }, 
                {
                    "delay": "l_rx_softirq", 
                    "ts": 2
                }, 
                {
                    "delay": "l_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ringkern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_kern", 
                    "ts": 10
                }, 
                {
                    "delay": "l_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_kern", 
                    "ts": 8
                }, 
                {
                    "delay": "r_rx_merged_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_inlink", 
                    "ts": 1
                }, 
                {
                    "delay": "l_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_kern", 
                    "ts": 12
                }
            ], 
            "meta": {
                "start_ns": 11766202091948284, 
                "seq": 48
            }, 
            "points": [
                {
                    "ts": 2286668204, 
                    "point": "l_tx_user"
                }, 
                {
                    "ts": 2286668211, 
                    "point": "l_tx_devqueue"
                }, 
                {
                    "ts": 2286668214, 
                    "point": "l_tx_devout"
                }, 
                {
                    "ts": 1657577831, 
                    "point": "r_rx_icmprcv"
                }, 
                {
                    "ts": 1657577839, 
                    "point": "r_tx_devout"
                }, 
                {
                    "ts": 2286668291, 
                    "point": "l_rx_iprcv"
                }, 
                {
                    "ts": 2286668294, 
                    "point": "l_rx_skdataready"
                }, 
                {
                    "ts": 2286668296, 
                    "point": "l_rx_wakeup"
                }, 
                {
                    "ts": 2286668303, 
                    "point": "l_rx_user"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_devrcv"
                }, 
                {
                    "ts": 2286668289, 
                    "point": "l_rx_softirq"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_mac"
                }
            ]
        }, 
        {
            "delays": [
                {
                    "delay": "total", 
                    "ts": 91
                }, 
                {
                    "delay": "l_tx_kern", 
                    "ts": 5
                }, 
                {
                    "delay": "l_tx_qdisc", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "r_rx_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_inlink", 
                    "ts": 1
                }, 
                {
                    "delay": "l_rx_kern", 
                    "ts": 3
                }, 
                {
                    "delay": "l_rx_task_waking", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_task_queue", 
                    "ts": 6
                }, 
                {
                    "delay": "l_rx_softirq", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ringkern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_kern", 
                    "ts": 8
                }, 
                {
                    "delay": "l_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "r_rx_merged_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_inlink", 
                    "ts": 1
                }, 
                {
                    "delay": "l_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_kern", 
                    "ts": 11
                }
            ], 
            "meta": {
                "start_ns": 11766202104261405, 
                "seq": 49
            }, 
            "points": [
                {
                    "ts": 2286680517, 
                    "point": "l_tx_user"
                }, 
                {
                    "ts": 2286680522, 
                    "point": "l_tx_devqueue"
                }, 
                {
                    "ts": 2286680525, 
                    "point": "l_tx_devout"
                }, 
                {
                    "ts": 1657590139, 
                    "point": "r_rx_icmprcv"
                }, 
                {
                    "ts": 1657590145, 
                    "point": "r_tx_devout"
                }, 
                {
                    "ts": 2286680597, 
                    "point": "l_rx_iprcv"
                }, 
                {
                    "ts": 2286680600, 
                    "point": "l_rx_skdataready"
                }, 
                {
                    "ts": 2286680602, 
                    "point": "l_rx_wakeup"
                }, 
                {
                    "ts": 2286680608, 
                    "point": "l_rx_user"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_devrcv"
                }, 
                {
                    "ts": 2286680594, 
                    "point": "l_rx_softirq"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_mac"
                }
            ]
        }, 
        {
            "delays": [
                {
                    "delay": "total", 
                    "ts": 107
                }, 
                {
                    "delay": "l_tx_kern", 
                    "ts": 9
                }, 
                {
                    "delay": "l_tx_qdisc", 
                    "ts": 4
                }, 
                {
                    "delay": "l_tx_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_kern", 
                    "ts": 11
                }, 
                {
                    "delay": "r_rx_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_inlink", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_kern", 
                    "ts": 3
                }, 
                {
                    "delay": "l_rx_task_waking", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_task_queue", 
                    "ts": 9
                }, 
                {
                    "delay": "l_rx_softirq", 
                    "ts": 4
                }, 
                {
                    "delay": "l_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ringkern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_kern", 
                    "ts": 13
                }, 
                {
                    "delay": "l_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_kern", 
                    "ts": 11
                }, 
                {
                    "delay": "r_rx_merged_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_inlink", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_kern", 
                    "ts": 14
                }
            ], 
            "meta": {
                "start_ns": 11766202116581671, 
                "seq": 50
            }, 
            "points": [
                {
                    "ts": 2286692837, 
                    "point": "l_tx_user"
                }, 
                {
                    "ts": 2286692846, 
                    "point": "l_tx_devqueue"
                }, 
                {
                    "ts": 2286692850, 
                    "point": "l_tx_devout"
                }, 
                {
                    "ts": 1657602466, 
                    "point": "r_rx_icmprcv"
                }, 
                {
                    "ts": 1657602477, 
                    "point": "r_tx_devout"
                }, 
                {
                    "ts": 2286692930, 
                    "point": "l_rx_iprcv"
                }, 
                {
                    "ts": 2286692933, 
                    "point": "l_rx_skdataready"
                }, 
                {
                    "ts": 2286692935, 
                    "point": "l_rx_wakeup"
                }, 
                {
                    "ts": 2286692944, 
                    "point": "l_rx_user"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_devrcv"
                }, 
                {
                    "ts": 2286692926, 
                    "point": "l_rx_softirq"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_mac"
                }
            ]
        }, 
        {
            "delays": [
                {
                    "delay": "total", 
                    "ts": 94
                }, 
                {
                    "delay": "l_tx_kern", 
                    "ts": 7
                }, 
                {
                    "delay": "l_tx_qdisc", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "r_rx_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_inlink", 
                    "ts": 1
                }, 
                {
                    "delay": "l_rx_kern", 
                    "ts": 3
                }, 
                {
                    "delay": "l_rx_task_waking", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_task_queue", 
                    "ts": 6
                }, 
                {
                    "delay": "l_rx_softirq", 
                    "ts": 2
                }, 
                {
                    "delay": "l_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ringkern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_kern", 
                    "ts": 10
                }, 
                {
                    "delay": "l_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "r_rx_merged_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_inlink", 
                    "ts": 1
                }, 
                {
                    "delay": "l_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_kern", 
                    "ts": 11
                }
            ], 
            "meta": {
                "start_ns": 11766202128907820, 
                "seq": 51
            }, 
            "points": [
                {
                    "ts": 2286705163, 
                    "point": "l_tx_user"
                }, 
                {
                    "ts": 2286705170, 
                    "point": "l_tx_devqueue"
                }, 
                {
                    "ts": 2286705173, 
                    "point": "l_tx_devout"
                }, 
                {
                    "ts": 1657614788, 
                    "point": "r_rx_icmprcv"
                }, 
                {
                    "ts": 1657614794, 
                    "point": "r_tx_devout"
                }, 
                {
                    "ts": 2286705246, 
                    "point": "l_rx_iprcv"
                }, 
                {
                    "ts": 2286705249, 
                    "point": "l_rx_skdataready"
                }, 
                {
                    "ts": 2286705251, 
                    "point": "l_rx_wakeup"
                }, 
                {
                    "ts": 2286705257, 
                    "point": "l_rx_user"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_devrcv"
                }, 
                {
                    "ts": 2286705244, 
                    "point": "l_rx_softirq"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_mac"
                }
            ]
        }, 
        {
            "delays": [
                {
                    "delay": "total", 
                    "ts": 102
                }, 
                {
                    "delay": "l_tx_kern", 
                    "ts": 7
                }, 
                {
                    "delay": "l_tx_qdisc", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "r_rx_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_inlink", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_kern", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_task_waking", 
                    "ts": 3
                }, 
                {
                    "delay": "l_rx_task_queue", 
                    "ts": 7
                }, 
                {
                    "delay": "l_rx_softirq", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ringkern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_kern", 
                    "ts": 10
                }, 
                {
                    "delay": "l_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "r_rx_merged_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_inlink", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_kern", 
                    "ts": 12
                }
            ], 
            "meta": {
                "start_ns": 11766202141226949, 
                "seq": 52
            }, 
            "points": [
                {
                    "ts": 2286717482, 
                    "point": "l_tx_user"
                }, 
                {
                    "ts": 2286717489, 
                    "point": "l_tx_devqueue"
                }, 
                {
                    "ts": 2286717492, 
                    "point": "l_tx_devout"
                }, 
                {
                    "ts": 1657627113, 
                    "point": "r_rx_icmprcv"
                }, 
                {
                    "ts": 1657627119, 
                    "point": "r_tx_devout"
                }, 
                {
                    "ts": 2286717572, 
                    "point": "l_rx_iprcv"
                }, 
                {
                    "ts": 2286717574, 
                    "point": "l_rx_skdataready"
                }, 
                {
                    "ts": 2286717577, 
                    "point": "l_rx_wakeup"
                }, 
                {
                    "ts": 2286717584, 
                    "point": "l_rx_user"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_devrcv"
                }, 
                {
                    "ts": 2286717569, 
                    "point": "l_rx_softirq"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_mac"
                }
            ]
        }, 
        {
            "delays": [
                {
                    "delay": "total", 
                    "ts": 95
                }, 
                {
                    "delay": "l_tx_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "l_tx_qdisc", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_kern", 
                    "ts": 7
                }, 
                {
                    "delay": "r_rx_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_inlink", 
                    "ts": 1
                }, 
                {
                    "delay": "l_rx_kern", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_task_waking", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_task_queue", 
                    "ts": 7
                }, 
                {
                    "delay": "l_rx_softirq", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ringkern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_kern", 
                    "ts": 9
                }, 
                {
                    "delay": "l_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_kern", 
                    "ts": 7
                }, 
                {
                    "delay": "r_rx_merged_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_inlink", 
                    "ts": 1
                }, 
                {
                    "delay": "l_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_kern", 
                    "ts": 11
                }
            ], 
            "meta": {
                "start_ns": 11766202153540719, 
                "seq": 53
            }, 
            "points": [
                {
                    "ts": 2286729796, 
                    "point": "l_tx_user"
                }, 
                {
                    "ts": 2286729802, 
                    "point": "l_tx_devqueue"
                }, 
                {
                    "ts": 2286729805, 
                    "point": "l_tx_devout"
                }, 
                {
                    "ts": 1657639421, 
                    "point": "r_rx_icmprcv"
                }, 
                {
                    "ts": 1657639428, 
                    "point": "r_tx_devout"
                }, 
                {
                    "ts": 2286729880, 
                    "point": "l_rx_iprcv"
                }, 
                {
                    "ts": 2286729882, 
                    "point": "l_rx_skdataready"
                }, 
                {
                    "ts": 2286729884, 
                    "point": "l_rx_wakeup"
                }, 
                {
                    "ts": 2286729891, 
                    "point": "l_rx_user"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_devrcv"
                }, 
                {
                    "ts": 2286729877, 
                    "point": "l_rx_softirq"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_mac"
                }
            ]
        }, 
        {
            "delays": [
                {
                    "delay": "total", 
                    "ts": 108
                }, 
                {
                    "delay": "l_tx_kern", 
                    "ts": 12
                }, 
                {
                    "delay": "l_tx_qdisc", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_kern", 
                    "ts": 8
                }, 
                {
                    "delay": "r_rx_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_inlink", 
                    "ts": 3
                }, 
                {
                    "delay": "l_rx_kern", 
                    "ts": 4
                }, 
                {
                    "delay": "l_rx_task_waking", 
                    "ts": 3
                }, 
                {
                    "delay": "l_rx_task_queue", 
                    "ts": 8
                }, 
                {
                    "delay": "l_rx_softirq", 
                    "ts": 4
                }, 
                {
                    "delay": "l_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ringkern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_kern", 
                    "ts": 15
                }, 
                {
                    "delay": "l_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_kern", 
                    "ts": 8
                }, 
                {
                    "delay": "r_rx_merged_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_inlink", 
                    "ts": 3
                }, 
                {
                    "delay": "l_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_kern", 
                    "ts": 15
                }
            ], 
            "meta": {
                "start_ns": 11766202165861704, 
                "seq": 54
            }, 
            "points": [
                {
                    "ts": 2286742117, 
                    "point": "l_tx_user"
                }, 
                {
                    "ts": 2286742129, 
                    "point": "l_tx_devqueue"
                }, 
                {
                    "ts": 2286742132, 
                    "point": "l_tx_devout"
                }, 
                {
                    "ts": 1657651748, 
                    "point": "r_rx_icmprcv"
                }, 
                {
                    "ts": 1657651756, 
                    "point": "r_tx_devout"
                }, 
                {
                    "ts": 2286742210, 
                    "point": "l_rx_iprcv"
                }, 
                {
                    "ts": 2286742214, 
                    "point": "l_rx_skdataready"
                }, 
                {
                    "ts": 2286742217, 
                    "point": "l_rx_wakeup"
                }, 
                {
                    "ts": 2286742225, 
                    "point": "l_rx_user"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_devrcv"
                }, 
                {
                    "ts": 2286742206, 
                    "point": "l_rx_softirq"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_mac"
                }
            ]
        }, 
        {
            "delays": [
                {
                    "delay": "total", 
                    "ts": 93
                }, 
                {
                    "delay": "l_tx_kern", 
                    "ts": 7
                }, 
                {
                    "delay": "l_tx_qdisc", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "r_rx_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_inlink", 
                    "ts": 0
                }, 
                {
                    "delay": "l_rx_kern", 
                    "ts": 3
                }, 
                {
                    "delay": "l_rx_task_waking", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_task_queue", 
                    "ts": 6
                }, 
                {
                    "delay": "l_rx_softirq", 
                    "ts": 2
                }, 
                {
                    "delay": "l_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ringkern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_kern", 
                    "ts": 10
                }, 
                {
                    "delay": "l_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "r_rx_merged_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_inlink", 
                    "ts": 0
                }, 
                {
                    "delay": "l_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_kern", 
                    "ts": 11
                }
            ], 
            "meta": {
                "start_ns": 11766202178190892, 
                "seq": 55
            }, 
            "points": [
                {
                    "ts": 2286754446, 
                    "point": "l_tx_user"
                }, 
                {
                    "ts": 2286754453, 
                    "point": "l_tx_devqueue"
                }, 
                {
                    "ts": 2286754456, 
                    "point": "l_tx_devout"
                }, 
                {
                    "ts": 1657664071, 
                    "point": "r_rx_icmprcv"
                }, 
                {
                    "ts": 1657664077, 
                    "point": "r_tx_devout"
                }, 
                {
                    "ts": 2286754528, 
                    "point": "l_rx_iprcv"
                }, 
                {
                    "ts": 2286754531, 
                    "point": "l_rx_skdataready"
                }, 
                {
                    "ts": 2286754533, 
                    "point": "l_rx_wakeup"
                }, 
                {
                    "ts": 2286754539, 
                    "point": "l_rx_user"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_devrcv"
                }, 
                {
                    "ts": 2286754526, 
                    "point": "l_rx_softirq"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_mac"
                }
            ]
        }, 
        {
            "delays": [
                {
                    "delay": "total", 
                    "ts": 91
                }, 
                {
                    "delay": "l_tx_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "l_tx_qdisc", 
                    "ts": 2
                }, 
                {
                    "delay": "l_tx_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_kern", 
                    "ts": 5
                }, 
                {
                    "delay": "r_rx_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_inlink", 
                    "ts": 1
                }, 
                {
                    "delay": "l_rx_kern", 
                    "ts": 3
                }, 
                {
                    "delay": "l_rx_task_waking", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_task_queue", 
                    "ts": 6
                }, 
                {
                    "delay": "l_rx_softirq", 
                    "ts": 2
                }, 
                {
                    "delay": "l_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ringkern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_kern", 
                    "ts": 8
                }, 
                {
                    "delay": "l_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_kern", 
                    "ts": 5
                }, 
                {
                    "delay": "r_rx_merged_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_inlink", 
                    "ts": 1
                }, 
                {
                    "delay": "l_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_kern", 
                    "ts": 11
                }
            ], 
            "meta": {
                "start_ns": 11766202190502502, 
                "seq": 56
            }, 
            "points": [
                {
                    "ts": 2286766758, 
                    "point": "l_tx_user"
                }, 
                {
                    "ts": 2286766764, 
                    "point": "l_tx_devqueue"
                }, 
                {
                    "ts": 2286766766, 
                    "point": "l_tx_devout"
                }, 
                {
                    "ts": 1657676381, 
                    "point": "r_rx_icmprcv"
                }, 
                {
                    "ts": 1657676386, 
                    "point": "r_tx_devout"
                }, 
                {
                    "ts": 2286766838, 
                    "point": "l_rx_iprcv"
                }, 
                {
                    "ts": 2286766841, 
                    "point": "l_rx_skdataready"
                }, 
                {
                    "ts": 2286766843, 
                    "point": "l_rx_wakeup"
                }, 
                {
                    "ts": 2286766849, 
                    "point": "l_rx_user"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_devrcv"
                }, 
                {
                    "ts": 2286766836, 
                    "point": "l_rx_softirq"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_mac"
                }
            ]
        }, 
        {
            "delays": [
                {
                    "delay": "total", 
                    "ts": 89
                }, 
                {
                    "delay": "l_tx_kern", 
                    "ts": 7
                }, 
                {
                    "delay": "l_tx_qdisc", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_kern", 
                    "ts": 8
                }, 
                {
                    "delay": "r_rx_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_inlink", 
                    "ts": 1
                }, 
                {
                    "delay": "l_rx_kern", 
                    "ts": 3
                }, 
                {
                    "delay": "l_rx_task_waking", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_task_queue", 
                    "ts": 6
                }, 
                {
                    "delay": "l_rx_softirq", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ringkern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_kern", 
                    "ts": 10
                }, 
                {
                    "delay": "l_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_kern", 
                    "ts": 8
                }, 
                {
                    "delay": "r_rx_merged_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_inlink", 
                    "ts": 1
                }, 
                {
                    "delay": "l_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_kern", 
                    "ts": 11
                }
            ], 
            "meta": {
                "start_ns": 11766202202818712, 
                "seq": 57
            }, 
            "points": [
                {
                    "ts": 2286779074, 
                    "point": "l_tx_user"
                }, 
                {
                    "ts": 2286779081, 
                    "point": "l_tx_devqueue"
                }, 
                {
                    "ts": 2286779084, 
                    "point": "l_tx_devout"
                }, 
                {
                    "ts": 1657688692, 
                    "point": "r_rx_icmprcv"
                }, 
                {
                    "ts": 1657688700, 
                    "point": "r_tx_devout"
                }, 
                {
                    "ts": 2286779152, 
                    "point": "l_rx_iprcv"
                }, 
                {
                    "ts": 2286779155, 
                    "point": "l_rx_skdataready"
                }, 
                {
                    "ts": 2286779157, 
                    "point": "l_rx_wakeup"
                }, 
                {
                    "ts": 2286779163, 
                    "point": "l_rx_user"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_devrcv"
                }, 
                {
                    "ts": 2286779149, 
                    "point": "l_rx_softirq"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_mac"
                }
            ]
        }, 
        {
            "delays": [
                {
                    "delay": "total", 
                    "ts": 99
                }, 
                {
                    "delay": "l_tx_kern", 
                    "ts": 8
                }, 
                {
                    "delay": "l_tx_qdisc", 
                    "ts": 4
                }, 
                {
                    "delay": "l_tx_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_kern", 
                    "ts": 7
                }, 
                {
                    "delay": "r_rx_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_inlink", 
                    "ts": 1
                }, 
                {
                    "delay": "l_rx_kern", 
                    "ts": 3
                }, 
                {
                    "delay": "l_rx_task_waking", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_task_queue", 
                    "ts": 7
                }, 
                {
                    "delay": "l_rx_softirq", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ringkern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_kern", 
                    "ts": 12
                }, 
                {
                    "delay": "l_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_kern", 
                    "ts": 7
                }, 
                {
                    "delay": "r_rx_merged_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_inlink", 
                    "ts": 1
                }, 
                {
                    "delay": "l_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_kern", 
                    "ts": 12
                }
            ], 
            "meta": {
                "start_ns": 11766202215144475, 
                "seq": 58
            }, 
            "points": [
                {
                    "ts": 2286791400, 
                    "point": "l_tx_user"
                }, 
                {
                    "ts": 2286791408, 
                    "point": "l_tx_devqueue"
                }, 
                {
                    "ts": 2286791412, 
                    "point": "l_tx_devout"
                }, 
                {
                    "ts": 1657701028, 
                    "point": "r_rx_icmprcv"
                }, 
                {
                    "ts": 1657701035, 
                    "point": "r_tx_devout"
                }, 
                {
                    "ts": 2286791487, 
                    "point": "l_rx_iprcv"
                }, 
                {
                    "ts": 2286791490, 
                    "point": "l_rx_skdataready"
                }, 
                {
                    "ts": 2286791492, 
                    "point": "l_rx_wakeup"
                }, 
                {
                    "ts": 2286791499, 
                    "point": "l_rx_user"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_devrcv"
                }, 
                {
                    "ts": 2286791484, 
                    "point": "l_rx_softirq"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_mac"
                }
            ]
        }, 
        {
            "delays": [
                {
                    "delay": "total", 
                    "ts": 91
                }, 
                {
                    "delay": "l_tx_kern", 
                    "ts": 7
                }, 
                {
                    "delay": "l_tx_qdisc", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_kern", 
                    "ts": 7
                }, 
                {
                    "delay": "r_rx_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_inlink", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_kern", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_task_waking", 
                    "ts": 3
                }, 
                {
                    "delay": "l_rx_task_queue", 
                    "ts": 6
                }, 
                {
                    "delay": "l_rx_softirq", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ringkern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_kern", 
                    "ts": 10
                }, 
                {
                    "delay": "l_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_kern", 
                    "ts": 7
                }, 
                {
                    "delay": "r_rx_merged_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_inlink", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_kern", 
                    "ts": 11
                }
            ], 
            "meta": {
                "start_ns": 11766202227462794, 
                "seq": 59
            }, 
            "points": [
                {
                    "ts": 2286803718, 
                    "point": "l_tx_user"
                }, 
                {
                    "ts": 2286803725, 
                    "point": "l_tx_devqueue"
                }, 
                {
                    "ts": 2286803728, 
                    "point": "l_tx_devout"
                }, 
                {
                    "ts": 1657713338, 
                    "point": "r_rx_icmprcv"
                }, 
                {
                    "ts": 1657713345, 
                    "point": "r_tx_devout"
                }, 
                {
                    "ts": 2286803798, 
                    "point": "l_rx_iprcv"
                }, 
                {
                    "ts": 2286803800, 
                    "point": "l_rx_skdataready"
                }, 
                {
                    "ts": 2286803803, 
                    "point": "l_rx_wakeup"
                }, 
                {
                    "ts": 2286803809, 
                    "point": "l_rx_user"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_devrcv"
                }, 
                {
                    "ts": 2286803795, 
                    "point": "l_rx_softirq"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_mac"
                }
            ]
        }, 
        {
            "delays": [
                {
                    "delay": "total", 
                    "ts": 89
                }, 
                {
                    "delay": "l_tx_kern", 
                    "ts": 5
                }, 
                {
                    "delay": "l_tx_qdisc", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_kern", 
                    "ts": 9
                }, 
                {
                    "delay": "r_rx_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_inlink", 
                    "ts": 1
                }, 
                {
                    "delay": "l_rx_kern", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_task_waking", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_task_queue", 
                    "ts": 6
                }, 
                {
                    "delay": "l_rx_softirq", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ringkern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_kern", 
                    "ts": 8
                }, 
                {
                    "delay": "l_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_kern", 
                    "ts": 9
                }, 
                {
                    "delay": "r_rx_merged_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_inlink", 
                    "ts": 1
                }, 
                {
                    "delay": "l_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_kern", 
                    "ts": 10
                }
            ], 
            "meta": {
                "start_ns": 11766202239861155, 
                "seq": 60
            }, 
            "points": [
                {
                    "ts": 2286816117, 
                    "point": "l_tx_user"
                }, 
                {
                    "ts": 2286816122, 
                    "point": "l_tx_devqueue"
                }, 
                {
                    "ts": 2286816125, 
                    "point": "l_tx_devout"
                }, 
                {
                    "ts": 1657725735, 
                    "point": "r_rx_icmprcv"
                }, 
                {
                    "ts": 1657725744, 
                    "point": "r_tx_devout"
                }, 
                {
                    "ts": 2286816196, 
                    "point": "l_rx_iprcv"
                }, 
                {
                    "ts": 2286816198, 
                    "point": "l_rx_skdataready"
                }, 
                {
                    "ts": 2286816200, 
                    "point": "l_rx_wakeup"
                }, 
                {
                    "ts": 2286816206, 
                    "point": "l_rx_user"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_devrcv"
                }, 
                {
                    "ts": 2286816193, 
                    "point": "l_rx_softirq"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_mac"
                }
            ]
        }, 
        {
            "delays": [
                {
                    "delay": "total", 
                    "ts": 96
                }, 
                {
                    "delay": "l_tx_kern", 
                    "ts": 7
                }, 
                {
                    "delay": "l_tx_qdisc", 
                    "ts": 4
                }, 
                {
                    "delay": "l_tx_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "r_rx_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_inlink", 
                    "ts": 1
                }, 
                {
                    "delay": "l_rx_kern", 
                    "ts": 3
                }, 
                {
                    "delay": "l_rx_task_waking", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_task_queue", 
                    "ts": 7
                }, 
                {
                    "delay": "l_rx_softirq", 
                    "ts": 2
                }, 
                {
                    "delay": "l_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ringkern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_kern", 
                    "ts": 11
                }, 
                {
                    "delay": "l_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "r_rx_merged_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_inlink", 
                    "ts": 1
                }, 
                {
                    "delay": "l_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_kern", 
                    "ts": 12
                }
            ], 
            "meta": {
                "start_ns": 11766202252178711, 
                "seq": 61
            }, 
            "points": [
                {
                    "ts": 2286828434, 
                    "point": "l_tx_user"
                }, 
                {
                    "ts": 2286828441, 
                    "point": "l_tx_devqueue"
                }, 
                {
                    "ts": 2286828445, 
                    "point": "l_tx_devout"
                }, 
                {
                    "ts": 1657738060, 
                    "point": "r_rx_icmprcv"
                }, 
                {
                    "ts": 1657738066, 
                    "point": "r_tx_devout"
                }, 
                {
                    "ts": 2286828518, 
                    "point": "l_rx_iprcv"
                }, 
                {
                    "ts": 2286828521, 
                    "point": "l_rx_skdataready"
                }, 
                {
                    "ts": 2286828523, 
                    "point": "l_rx_wakeup"
                }, 
                {
                    "ts": 2286828530, 
                    "point": "l_rx_user"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_devrcv"
                }, 
                {
                    "ts": 2286828516, 
                    "point": "l_rx_softirq"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_mac"
                }
            ]
        }, 
        {
            "delays": [
                {
                    "delay": "total", 
                    "ts": 99
                }, 
                {
                    "delay": "l_tx_kern", 
                    "ts": 5
                }, 
                {
                    "delay": "l_tx_qdisc", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "r_rx_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_inlink", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_kern", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_task_waking", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_task_queue", 
                    "ts": 7
                }, 
                {
                    "delay": "l_rx_softirq", 
                    "ts": 4
                }, 
                {
                    "delay": "l_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ringkern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_kern", 
                    "ts": 8
                }, 
                {
                    "delay": "l_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "r_rx_merged_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_inlink", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_kern", 
                    "ts": 11
                }
            ], 
            "meta": {
                "start_ns": 11766202264485500, 
                "seq": 62
            }, 
            "points": [
                {
                    "ts": 2286840741, 
                    "point": "l_tx_user"
                }, 
                {
                    "ts": 2286840746, 
                    "point": "l_tx_devqueue"
                }, 
                {
                    "ts": 2286840749, 
                    "point": "l_tx_devout"
                }, 
                {
                    "ts": 1657750370, 
                    "point": "r_rx_icmprcv"
                }, 
                {
                    "ts": 1657750376, 
                    "point": "r_tx_devout"
                }, 
                {
                    "ts": 2286840829, 
                    "point": "l_rx_iprcv"
                }, 
                {
                    "ts": 2286840831, 
                    "point": "l_rx_skdataready"
                }, 
                {
                    "ts": 2286840833, 
                    "point": "l_rx_wakeup"
                }, 
                {
                    "ts": 2286840840, 
                    "point": "l_rx_user"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_devrcv"
                }, 
                {
                    "ts": 2286840825, 
                    "point": "l_rx_softirq"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_mac"
                }
            ]
        }, 
        {
            "delays": [
                {
                    "delay": "total", 
                    "ts": 93
                }, 
                {
                    "delay": "l_tx_kern", 
                    "ts": 10
                }, 
                {
                    "delay": "l_tx_qdisc", 
                    "ts": 4
                }, 
                {
                    "delay": "l_tx_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "r_rx_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_inlink", 
                    "ts": 3
                }, 
                {
                    "delay": "l_rx_kern", 
                    "ts": 3
                }, 
                {
                    "delay": "l_rx_task_waking", 
                    "ts": 3
                }, 
                {
                    "delay": "l_rx_task_queue", 
                    "ts": 6
                }, 
                {
                    "delay": "l_rx_softirq", 
                    "ts": 4
                }, 
                {
                    "delay": "l_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ringkern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_kern", 
                    "ts": 14
                }, 
                {
                    "delay": "l_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "r_rx_merged_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_inlink", 
                    "ts": 3
                }, 
                {
                    "delay": "l_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_kern", 
                    "ts": 12
                }
            ], 
            "meta": {
                "start_ns": 11766202276803060, 
                "seq": 63
            }, 
            "points": [
                {
                    "ts": 2286853059, 
                    "point": "l_tx_user"
                }, 
                {
                    "ts": 2286853069, 
                    "point": "l_tx_devqueue"
                }, 
                {
                    "ts": 2286853073, 
                    "point": "l_tx_devout"
                }, 
                {
                    "ts": 1657762680, 
                    "point": "r_rx_icmprcv"
                }, 
                {
                    "ts": 1657762686, 
                    "point": "r_tx_devout"
                }, 
                {
                    "ts": 2286853140, 
                    "point": "l_rx_iprcv"
                }, 
                {
                    "ts": 2286853143, 
                    "point": "l_rx_skdataready"
                }, 
                {
                    "ts": 2286853146, 
                    "point": "l_rx_wakeup"
                }, 
                {
                    "ts": 2286853152, 
                    "point": "l_rx_user"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_devrcv"
                }, 
                {
                    "ts": 2286853136, 
                    "point": "l_rx_softirq"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_mac"
                }
            ]
        }, 
        {
            "delays": [
                {
                    "delay": "total", 
                    "ts": 98
                }, 
                {
                    "delay": "l_tx_kern", 
                    "ts": 7
                }, 
                {
                    "delay": "l_tx_qdisc", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "r_rx_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_inlink", 
                    "ts": 1
                }, 
                {
                    "delay": "l_rx_kern", 
                    "ts": 3
                }, 
                {
                    "delay": "l_rx_task_waking", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_task_queue", 
                    "ts": 6
                }, 
                {
                    "delay": "l_rx_softirq", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ringkern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_kern", 
                    "ts": 10
                }, 
                {
                    "delay": "l_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "r_rx_merged_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_inlink", 
                    "ts": 1
                }, 
                {
                    "delay": "l_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_kern", 
                    "ts": 11
                }
            ], 
            "meta": {
                "start_ns": 11766202289120882, 
                "seq": 64
            }, 
            "points": [
                {
                    "ts": 2286865376, 
                    "point": "l_tx_user"
                }, 
                {
                    "ts": 2286865383, 
                    "point": "l_tx_devqueue"
                }, 
                {
                    "ts": 2286865386, 
                    "point": "l_tx_devout"
                }, 
                {
                    "ts": 1657775005, 
                    "point": "r_rx_icmprcv"
                }, 
                {
                    "ts": 1657775011, 
                    "point": "r_tx_devout"
                }, 
                {
                    "ts": 2286865463, 
                    "point": "l_rx_iprcv"
                }, 
                {
                    "ts": 2286865466, 
                    "point": "l_rx_skdataready"
                }, 
                {
                    "ts": 2286865468, 
                    "point": "l_rx_wakeup"
                }, 
                {
                    "ts": 2286865474, 
                    "point": "l_rx_user"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_devrcv"
                }, 
                {
                    "ts": 2286865460, 
                    "point": "l_rx_softirq"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_mac"
                }
            ]
        }, 
        {
            "delays": [
                {
                    "delay": "total", 
                    "ts": 92
                }, 
                {
                    "delay": "l_tx_kern", 
                    "ts": 8
                }, 
                {
                    "delay": "l_tx_qdisc", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "r_rx_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_inlink", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_kern", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_task_waking", 
                    "ts": 3
                }, 
                {
                    "delay": "l_rx_task_queue", 
                    "ts": 6
                }, 
                {
                    "delay": "l_rx_softirq", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ringkern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_kern", 
                    "ts": 11
                }, 
                {
                    "delay": "l_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "r_rx_merged_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_inlink", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_kern", 
                    "ts": 11
                }
            ], 
            "meta": {
                "start_ns": 11766202301436638, 
                "seq": 65
            }, 
            "points": [
                {
                    "ts": 2286877692, 
                    "point": "l_tx_user"
                }, 
                {
                    "ts": 2286877700, 
                    "point": "l_tx_devqueue"
                }, 
                {
                    "ts": 2286877703, 
                    "point": "l_tx_devout"
                }, 
                {
                    "ts": 1657787314, 
                    "point": "r_rx_icmprcv"
                }, 
                {
                    "ts": 1657787320, 
                    "point": "r_tx_devout"
                }, 
                {
                    "ts": 2286877773, 
                    "point": "l_rx_iprcv"
                }, 
                {
                    "ts": 2286877775, 
                    "point": "l_rx_skdataready"
                }, 
                {
                    "ts": 2286877778, 
                    "point": "l_rx_wakeup"
                }, 
                {
                    "ts": 2286877784, 
                    "point": "l_rx_user"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_devrcv"
                }, 
                {
                    "ts": 2286877770, 
                    "point": "l_rx_softirq"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_mac"
                }
            ]
        }, 
        {
            "delays": [
                {
                    "delay": "total", 
                    "ts": 85
                }, 
                {
                    "delay": "l_tx_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "l_tx_qdisc", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "r_rx_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_inlink", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_kern", 
                    "ts": 3
                }, 
                {
                    "delay": "l_rx_task_waking", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_task_queue", 
                    "ts": 6
                }, 
                {
                    "delay": "l_rx_softirq", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ringkern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_kern", 
                    "ts": 9
                }, 
                {
                    "delay": "l_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "r_rx_merged_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_inlink", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_kern", 
                    "ts": 11
                }
            ], 
            "meta": {
                "start_ns": 11766202313767000, 
                "seq": 66
            }, 
            "points": [
                {
                    "ts": 2286890023, 
                    "point": "l_tx_user"
                }, 
                {
                    "ts": 2286890029, 
                    "point": "l_tx_devqueue"
                }, 
                {
                    "ts": 2286890032, 
                    "point": "l_tx_devout"
                }, 
                {
                    "ts": 1657799638, 
                    "point": "r_rx_icmprcv"
                }, 
                {
                    "ts": 1657799644, 
                    "point": "r_tx_devout"
                }, 
                {
                    "ts": 2286890097, 
                    "point": "l_rx_iprcv"
                }, 
                {
                    "ts": 2286890100, 
                    "point": "l_rx_skdataready"
                }, 
                {
                    "ts": 2286890102, 
                    "point": "l_rx_wakeup"
                }, 
                {
                    "ts": 2286890108, 
                    "point": "l_rx_user"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_devrcv"
                }, 
                {
                    "ts": 2286890094, 
                    "point": "l_rx_softirq"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_mac"
                }
            ]
        }, 
        {
            "delays": [
                {
                    "delay": "total", 
                    "ts": 86
                }, 
                {
                    "delay": "l_tx_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "l_tx_qdisc", 
                    "ts": 2
                }, 
                {
                    "delay": "l_tx_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "r_rx_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_inlink", 
                    "ts": 0
                }, 
                {
                    "delay": "l_rx_kern", 
                    "ts": 3
                }, 
                {
                    "delay": "l_rx_task_waking", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_task_queue", 
                    "ts": 6
                }, 
                {
                    "delay": "l_rx_softirq", 
                    "ts": 2
                }, 
                {
                    "delay": "l_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ringkern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_kern", 
                    "ts": 8
                }, 
                {
                    "delay": "l_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "r_rx_merged_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_inlink", 
                    "ts": 0
                }, 
                {
                    "delay": "l_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_kern", 
                    "ts": 11
                }
            ], 
            "meta": {
                "start_ns": 11766202326074335, 
                "seq": 67
            }, 
            "points": [
                {
                    "ts": 2286902330, 
                    "point": "l_tx_user"
                }, 
                {
                    "ts": 2286902336, 
                    "point": "l_tx_devqueue"
                }, 
                {
                    "ts": 2286902338, 
                    "point": "l_tx_devout"
                }, 
                {
                    "ts": 1657811948, 
                    "point": "r_rx_icmprcv"
                }, 
                {
                    "ts": 1657811954, 
                    "point": "r_tx_devout"
                }, 
                {
                    "ts": 2286902405, 
                    "point": "l_rx_iprcv"
                }, 
                {
                    "ts": 2286902408, 
                    "point": "l_rx_skdataready"
                }, 
                {
                    "ts": 2286902410, 
                    "point": "l_rx_wakeup"
                }, 
                {
                    "ts": 2286902416, 
                    "point": "l_rx_user"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_devrcv"
                }, 
                {
                    "ts": 2286902403, 
                    "point": "l_rx_softirq"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_mac"
                }
            ]
        }, 
        {
            "delays": [
                {
                    "delay": "total", 
                    "ts": 86
                }, 
                {
                    "delay": "l_tx_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "l_tx_qdisc", 
                    "ts": 2
                }, 
                {
                    "delay": "l_tx_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "r_rx_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_inlink", 
                    "ts": 0
                }, 
                {
                    "delay": "l_rx_kern", 
                    "ts": 3
                }, 
                {
                    "delay": "l_rx_task_waking", 
                    "ts": 1
                }, 
                {
                    "delay": "l_rx_task_queue", 
                    "ts": 7
                }, 
                {
                    "delay": "l_rx_softirq", 
                    "ts": 2
                }, 
                {
                    "delay": "l_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ringkern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_kern", 
                    "ts": 8
                }, 
                {
                    "delay": "l_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "r_rx_merged_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_inlink", 
                    "ts": 0
                }, 
                {
                    "delay": "l_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_kern", 
                    "ts": 11
                }
            ], 
            "meta": {
                "start_ns": 11766202338370189, 
                "seq": 68
            }, 
            "points": [
                {
                    "ts": 2286914626, 
                    "point": "l_tx_user"
                }, 
                {
                    "ts": 2286914632, 
                    "point": "l_tx_devqueue"
                }, 
                {
                    "ts": 2286914634, 
                    "point": "l_tx_devout"
                }, 
                {
                    "ts": 1657824244, 
                    "point": "r_rx_icmprcv"
                }, 
                {
                    "ts": 1657824250, 
                    "point": "r_tx_devout"
                }, 
                {
                    "ts": 2286914701, 
                    "point": "l_rx_iprcv"
                }, 
                {
                    "ts": 2286914704, 
                    "point": "l_rx_skdataready"
                }, 
                {
                    "ts": 2286914705, 
                    "point": "l_rx_wakeup"
                }, 
                {
                    "ts": 2286914712, 
                    "point": "l_rx_user"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_devrcv"
                }, 
                {
                    "ts": 2286914699, 
                    "point": "l_rx_softirq"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_mac"
                }
            ]
        }, 
        {
            "delays": [
                {
                    "delay": "total", 
                    "ts": 98
                }, 
                {
                    "delay": "l_tx_kern", 
                    "ts": 7
                }, 
                {
                    "delay": "l_tx_qdisc", 
                    "ts": 4
                }, 
                {
                    "delay": "l_tx_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_kern", 
                    "ts": 5
                }, 
                {
                    "delay": "r_rx_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_inlink", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_kern", 
                    "ts": 3
                }, 
                {
                    "delay": "l_rx_task_waking", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_task_queue", 
                    "ts": 7
                }, 
                {
                    "delay": "l_rx_softirq", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ringkern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_kern", 
                    "ts": 11
                }, 
                {
                    "delay": "l_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_kern", 
                    "ts": 5
                }, 
                {
                    "delay": "r_rx_merged_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_inlink", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_kern", 
                    "ts": 12
                }
            ], 
            "meta": {
                "start_ns": 11766202350670622, 
                "seq": 69
            }, 
            "points": [
                {
                    "ts": 2286926926, 
                    "point": "l_tx_user"
                }, 
                {
                    "ts": 2286926933, 
                    "point": "l_tx_devqueue"
                }, 
                {
                    "ts": 2286926937, 
                    "point": "l_tx_devout"
                }, 
                {
                    "ts": 1657836554, 
                    "point": "r_rx_icmprcv"
                }, 
                {
                    "ts": 1657836559, 
                    "point": "r_tx_devout"
                }, 
                {
                    "ts": 2286927012, 
                    "point": "l_rx_iprcv"
                }, 
                {
                    "ts": 2286927015, 
                    "point": "l_rx_skdataready"
                }, 
                {
                    "ts": 2286927017, 
                    "point": "l_rx_wakeup"
                }, 
                {
                    "ts": 2286927024, 
                    "point": "l_rx_user"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_devrcv"
                }, 
                {
                    "ts": 2286927009, 
                    "point": "l_rx_softirq"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_mac"
                }
            ]
        }, 
        {
            "delays": [
                {
                    "delay": "total", 
                    "ts": 96
                }, 
                {
                    "delay": "l_tx_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "l_tx_qdisc", 
                    "ts": 2
                }, 
                {
                    "delay": "l_tx_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_kern", 
                    "ts": 9
                }, 
                {
                    "delay": "r_rx_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_inlink", 
                    "ts": 1
                }, 
                {
                    "delay": "l_rx_kern", 
                    "ts": 3
                }, 
                {
                    "delay": "l_rx_task_waking", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_task_queue", 
                    "ts": 6
                }, 
                {
                    "delay": "l_rx_softirq", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ringkern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_kern", 
                    "ts": 8
                }, 
                {
                    "delay": "l_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_kern", 
                    "ts": 9
                }, 
                {
                    "delay": "r_rx_merged_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_inlink", 
                    "ts": 1
                }, 
                {
                    "delay": "l_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_kern", 
                    "ts": 11
                }
            ], 
            "meta": {
                "start_ns": 11766202362960109, 
                "seq": 70
            }, 
            "points": [
                {
                    "ts": 2286939216, 
                    "point": "l_tx_user"
                }, 
                {
                    "ts": 2286939222, 
                    "point": "l_tx_devqueue"
                }, 
                {
                    "ts": 2286939224, 
                    "point": "l_tx_devout"
                }, 
                {
                    "ts": 1657848840, 
                    "point": "r_rx_icmprcv"
                }, 
                {
                    "ts": 1657848849, 
                    "point": "r_tx_devout"
                }, 
                {
                    "ts": 2286939301, 
                    "point": "l_rx_iprcv"
                }, 
                {
                    "ts": 2286939304, 
                    "point": "l_rx_skdataready"
                }, 
                {
                    "ts": 2286939306, 
                    "point": "l_rx_wakeup"
                }, 
                {
                    "ts": 2286939312, 
                    "point": "l_rx_user"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_devrcv"
                }, 
                {
                    "ts": 2286939298, 
                    "point": "l_rx_softirq"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_mac"
                }
            ]
        }, 
        {
            "delays": [
                {
                    "delay": "total", 
                    "ts": 93
                }, 
                {
                    "delay": "l_tx_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "l_tx_qdisc", 
                    "ts": 2
                }, 
                {
                    "delay": "l_tx_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_kern", 
                    "ts": 8
                }, 
                {
                    "delay": "r_rx_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_inlink", 
                    "ts": 1
                }, 
                {
                    "delay": "l_rx_kern", 
                    "ts": 3
                }, 
                {
                    "delay": "l_rx_task_waking", 
                    "ts": 1
                }, 
                {
                    "delay": "l_rx_task_queue", 
                    "ts": 7
                }, 
                {
                    "delay": "l_rx_softirq", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ringkern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_kern", 
                    "ts": 8
                }, 
                {
                    "delay": "l_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_kern", 
                    "ts": 8
                }, 
                {
                    "delay": "r_rx_merged_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_inlink", 
                    "ts": 1
                }, 
                {
                    "delay": "l_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_kern", 
                    "ts": 11
                }
            ], 
            "meta": {
                "start_ns": 11766202375270442, 
                "seq": 71
            }, 
            "points": [
                {
                    "ts": 2286951526, 
                    "point": "l_tx_user"
                }, 
                {
                    "ts": 2286951532, 
                    "point": "l_tx_devqueue"
                }, 
                {
                    "ts": 2286951534, 
                    "point": "l_tx_devout"
                }, 
                {
                    "ts": 1657861148, 
                    "point": "r_rx_icmprcv"
                }, 
                {
                    "ts": 1657861156, 
                    "point": "r_tx_devout"
                }, 
                {
                    "ts": 2286951608, 
                    "point": "l_rx_iprcv"
                }, 
                {
                    "ts": 2286951611, 
                    "point": "l_rx_skdataready"
                }, 
                {
                    "ts": 2286951612, 
                    "point": "l_rx_wakeup"
                }, 
                {
                    "ts": 2286951619, 
                    "point": "l_rx_user"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_devrcv"
                }, 
                {
                    "ts": 2286951605, 
                    "point": "l_rx_softirq"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_mac"
                }
            ]
        }, 
        {
            "delays": [
                {
                    "delay": "total", 
                    "ts": 86
                }, 
                {
                    "delay": "l_tx_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "l_tx_qdisc", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "r_rx_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_inlink", 
                    "ts": 1
                }, 
                {
                    "delay": "l_rx_kern", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_task_waking", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_task_queue", 
                    "ts": 6
                }, 
                {
                    "delay": "l_rx_softirq", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ringkern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_kern", 
                    "ts": 9
                }, 
                {
                    "delay": "l_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "r_rx_merged_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_inlink", 
                    "ts": 1
                }, 
                {
                    "delay": "l_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_kern", 
                    "ts": 10
                }
            ], 
            "meta": {
                "start_ns": 11766202387580881, 
                "seq": 72
            }, 
            "points": [
                {
                    "ts": 2286963836, 
                    "point": "l_tx_user"
                }, 
                {
                    "ts": 2286963842, 
                    "point": "l_tx_devqueue"
                }, 
                {
                    "ts": 2286963845, 
                    "point": "l_tx_devout"
                }, 
                {
                    "ts": 1657873454, 
                    "point": "r_rx_icmprcv"
                }, 
                {
                    "ts": 1657873460, 
                    "point": "r_tx_devout"
                }, 
                {
                    "ts": 2286963912, 
                    "point": "l_rx_iprcv"
                }, 
                {
                    "ts": 2286963914, 
                    "point": "l_rx_skdataready"
                }, 
                {
                    "ts": 2286963916, 
                    "point": "l_rx_wakeup"
                }, 
                {
                    "ts": 2286963922, 
                    "point": "l_rx_user"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_devrcv"
                }, 
                {
                    "ts": 2286963909, 
                    "point": "l_rx_softirq"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_mac"
                }
            ]
        }, 
        {
            "delays": [
                {
                    "delay": "total", 
                    "ts": 94
                }, 
                {
                    "delay": "l_tx_kern", 
                    "ts": 7
                }, 
                {
                    "delay": "l_tx_qdisc", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "r_rx_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_inlink", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_kern", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_task_waking", 
                    "ts": 3
                }, 
                {
                    "delay": "l_rx_task_queue", 
                    "ts": 6
                }, 
                {
                    "delay": "l_rx_softirq", 
                    "ts": 4
                }, 
                {
                    "delay": "l_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ringkern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_kern", 
                    "ts": 10
                }, 
                {
                    "delay": "l_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "r_rx_merged_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_inlink", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_kern", 
                    "ts": 11
                }
            ], 
            "meta": {
                "start_ns": 11766202399883237, 
                "seq": 73
            }, 
            "points": [
                {
                    "ts": 2286976139, 
                    "point": "l_tx_user"
                }, 
                {
                    "ts": 2286976146, 
                    "point": "l_tx_devqueue"
                }, 
                {
                    "ts": 2286976149, 
                    "point": "l_tx_devout"
                }, 
                {
                    "ts": 1657885763, 
                    "point": "r_rx_icmprcv"
                }, 
                {
                    "ts": 1657885769, 
                    "point": "r_tx_devout"
                }, 
                {
                    "ts": 2286976222, 
                    "point": "l_rx_iprcv"
                }, 
                {
                    "ts": 2286976224, 
                    "point": "l_rx_skdataready"
                }, 
                {
                    "ts": 2286976227, 
                    "point": "l_rx_wakeup"
                }, 
                {
                    "ts": 2286976233, 
                    "point": "l_rx_user"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_devrcv"
                }, 
                {
                    "ts": 2286976218, 
                    "point": "l_rx_softirq"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_mac"
                }
            ]
        }, 
        {
            "delays": [
                {
                    "delay": "total", 
                    "ts": 94
                }, 
                {
                    "delay": "l_tx_kern", 
                    "ts": 8
                }, 
                {
                    "delay": "l_tx_qdisc", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "r_rx_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_inlink", 
                    "ts": 1
                }, 
                {
                    "delay": "l_rx_kern", 
                    "ts": 3
                }, 
                {
                    "delay": "l_rx_task_waking", 
                    "ts": 3
                }, 
                {
                    "delay": "l_rx_task_queue", 
                    "ts": 6
                }, 
                {
                    "delay": "l_rx_softirq", 
                    "ts": 2
                }, 
                {
                    "delay": "l_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ringkern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_kern", 
                    "ts": 11
                }, 
                {
                    "delay": "l_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "r_rx_merged_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_inlink", 
                    "ts": 1
                }, 
                {
                    "delay": "l_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_kern", 
                    "ts": 12
                }
            ], 
            "meta": {
                "start_ns": 11766202412194863, 
                "seq": 74
            }, 
            "points": [
                {
                    "ts": 2286988450, 
                    "point": "l_tx_user"
                }, 
                {
                    "ts": 2286988458, 
                    "point": "l_tx_devqueue"
                }, 
                {
                    "ts": 2286988461, 
                    "point": "l_tx_devout"
                }, 
                {
                    "ts": 1657898074, 
                    "point": "r_rx_icmprcv"
                }, 
                {
                    "ts": 1657898080, 
                    "point": "r_tx_devout"
                }, 
                {
                    "ts": 2286988532, 
                    "point": "l_rx_iprcv"
                }, 
                {
                    "ts": 2286988535, 
                    "point": "l_rx_skdataready"
                }, 
                {
                    "ts": 2286988538, 
                    "point": "l_rx_wakeup"
                }, 
                {
                    "ts": 2286988544, 
                    "point": "l_rx_user"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_devrcv"
                }, 
                {
                    "ts": 2286988530, 
                    "point": "l_rx_softirq"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_mac"
                }
            ]
        }, 
        {
            "delays": [
                {
                    "delay": "total", 
                    "ts": 97
                }, 
                {
                    "delay": "l_tx_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "l_tx_qdisc", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_kern", 
                    "ts": 7
                }, 
                {
                    "delay": "r_rx_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_inlink", 
                    "ts": 1
                }, 
                {
                    "delay": "l_rx_kern", 
                    "ts": 3
                }, 
                {
                    "delay": "l_rx_task_waking", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_task_queue", 
                    "ts": 6
                }, 
                {
                    "delay": "l_rx_softirq", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ringkern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_kern", 
                    "ts": 9
                }, 
                {
                    "delay": "l_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_kern", 
                    "ts": 7
                }, 
                {
                    "delay": "r_rx_merged_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_inlink", 
                    "ts": 1
                }, 
                {
                    "delay": "l_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_kern", 
                    "ts": 11
                }
            ], 
            "meta": {
                "start_ns": 11766202424502016, 
                "seq": 75
            }, 
            "points": [
                {
                    "ts": 2287000758, 
                    "point": "l_tx_user"
                }, 
                {
                    "ts": 2287000764, 
                    "point": "l_tx_devqueue"
                }, 
                {
                    "ts": 2287000767, 
                    "point": "l_tx_devout"
                }, 
                {
                    "ts": 1657910385, 
                    "point": "r_rx_icmprcv"
                }, 
                {
                    "ts": 1657910392, 
                    "point": "r_tx_devout"
                }, 
                {
                    "ts": 2287000844, 
                    "point": "l_rx_iprcv"
                }, 
                {
                    "ts": 2287000847, 
                    "point": "l_rx_skdataready"
                }, 
                {
                    "ts": 2287000849, 
                    "point": "l_rx_wakeup"
                }, 
                {
                    "ts": 2287000855, 
                    "point": "l_rx_user"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_devrcv"
                }, 
                {
                    "ts": 2287000841, 
                    "point": "l_rx_softirq"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_mac"
                }
            ]
        }, 
        {
            "delays": [
                {
                    "delay": "total", 
                    "ts": 89
                }, 
                {
                    "delay": "l_tx_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "l_tx_qdisc", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "r_rx_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_inlink", 
                    "ts": 1
                }, 
                {
                    "delay": "l_rx_kern", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_task_waking", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_task_queue", 
                    "ts": 7
                }, 
                {
                    "delay": "l_rx_softirq", 
                    "ts": 2
                }, 
                {
                    "delay": "l_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ringkern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_kern", 
                    "ts": 9
                }, 
                {
                    "delay": "l_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "r_rx_merged_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_inlink", 
                    "ts": 1
                }, 
                {
                    "delay": "l_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_kern", 
                    "ts": 11
                }
            ], 
            "meta": {
                "start_ns": 11766202436817664, 
                "seq": 76
            }, 
            "points": [
                {
                    "ts": 2287013073, 
                    "point": "l_tx_user"
                }, 
                {
                    "ts": 2287013079, 
                    "point": "l_tx_devqueue"
                }, 
                {
                    "ts": 2287013082, 
                    "point": "l_tx_devout"
                }, 
                {
                    "ts": 1657922693, 
                    "point": "r_rx_icmprcv"
                }, 
                {
                    "ts": 1657922699, 
                    "point": "r_tx_devout"
                }, 
                {
                    "ts": 2287013151, 
                    "point": "l_rx_iprcv"
                }, 
                {
                    "ts": 2287013153, 
                    "point": "l_rx_skdataready"
                }, 
                {
                    "ts": 2287013155, 
                    "point": "l_rx_wakeup"
                }, 
                {
                    "ts": 2287013162, 
                    "point": "l_rx_user"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_devrcv"
                }, 
                {
                    "ts": 2287013149, 
                    "point": "l_rx_softirq"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_mac"
                }
            ]
        }, 
        {
            "delays": [
                {
                    "delay": "total", 
                    "ts": 94
                }, 
                {
                    "delay": "l_tx_kern", 
                    "ts": 8
                }, 
                {
                    "delay": "l_tx_qdisc", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "r_rx_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_inlink", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_kern", 
                    "ts": 3
                }, 
                {
                    "delay": "l_rx_task_waking", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_task_queue", 
                    "ts": 7
                }, 
                {
                    "delay": "l_rx_softirq", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ringkern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_kern", 
                    "ts": 11
                }, 
                {
                    "delay": "l_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "r_rx_merged_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_inlink", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_kern", 
                    "ts": 12
                }
            ], 
            "meta": {
                "start_ns": 11766202449125714, 
                "seq": 77
            }, 
            "points": [
                {
                    "ts": 2287025381, 
                    "point": "l_tx_user"
                }, 
                {
                    "ts": 2287025389, 
                    "point": "l_tx_devqueue"
                }, 
                {
                    "ts": 2287025392, 
                    "point": "l_tx_devout"
                }, 
                {
                    "ts": 1657935004, 
                    "point": "r_rx_icmprcv"
                }, 
                {
                    "ts": 1657935010, 
                    "point": "r_tx_devout"
                }, 
                {
                    "ts": 2287025463, 
                    "point": "l_rx_iprcv"
                }, 
                {
                    "ts": 2287025466, 
                    "point": "l_rx_skdataready"
                }, 
                {
                    "ts": 2287025468, 
                    "point": "l_rx_wakeup"
                }, 
                {
                    "ts": 2287025475, 
                    "point": "l_rx_user"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_devrcv"
                }, 
                {
                    "ts": 2287025460, 
                    "point": "l_rx_softirq"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_mac"
                }
            ]
        }, 
        {
            "delays": [
                {
                    "delay": "total", 
                    "ts": 91
                }, 
                {
                    "delay": "l_tx_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "l_tx_qdisc", 
                    "ts": 2
                }, 
                {
                    "delay": "l_tx_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_kern", 
                    "ts": 5
                }, 
                {
                    "delay": "r_rx_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_inlink", 
                    "ts": 1
                }, 
                {
                    "delay": "l_rx_kern", 
                    "ts": 3
                }, 
                {
                    "delay": "l_rx_task_waking", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_task_queue", 
                    "ts": 6
                }, 
                {
                    "delay": "l_rx_softirq", 
                    "ts": 2
                }, 
                {
                    "delay": "l_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ringkern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_kern", 
                    "ts": 8
                }, 
                {
                    "delay": "l_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_kern", 
                    "ts": 5
                }, 
                {
                    "delay": "r_rx_merged_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_inlink", 
                    "ts": 1
                }, 
                {
                    "delay": "l_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_kern", 
                    "ts": 11
                }
            ], 
            "meta": {
                "start_ns": 11766202461434798, 
                "seq": 78
            }, 
            "points": [
                {
                    "ts": 2287037690, 
                    "point": "l_tx_user"
                }, 
                {
                    "ts": 2287037696, 
                    "point": "l_tx_devqueue"
                }, 
                {
                    "ts": 2287037698, 
                    "point": "l_tx_devout"
                }, 
                {
                    "ts": 1657947313, 
                    "point": "r_rx_icmprcv"
                }, 
                {
                    "ts": 1657947318, 
                    "point": "r_tx_devout"
                }, 
                {
                    "ts": 2287037770, 
                    "point": "l_rx_iprcv"
                }, 
                {
                    "ts": 2287037773, 
                    "point": "l_rx_skdataready"
                }, 
                {
                    "ts": 2287037775, 
                    "point": "l_rx_wakeup"
                }, 
                {
                    "ts": 2287037781, 
                    "point": "l_rx_user"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_devrcv"
                }, 
                {
                    "ts": 2287037768, 
                    "point": "l_rx_softirq"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_mac"
                }
            ]
        }, 
        {
            "delays": [
                {
                    "delay": "total", 
                    "ts": 82
                }, 
                {
                    "delay": "l_tx_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "l_tx_qdisc", 
                    "ts": 2
                }, 
                {
                    "delay": "l_tx_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "r_rx_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_inlink", 
                    "ts": 1
                }, 
                {
                    "delay": "l_rx_kern", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_task_waking", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_task_queue", 
                    "ts": 6
                }, 
                {
                    "delay": "l_rx_softirq", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ringkern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_kern", 
                    "ts": 8
                }, 
                {
                    "delay": "l_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "r_rx_merged_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_inlink", 
                    "ts": 1
                }, 
                {
                    "delay": "l_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_kern", 
                    "ts": 10
                }
            ], 
            "meta": {
                "start_ns": 11766202473738653, 
                "seq": 79
            }, 
            "points": [
                {
                    "ts": 2287049994, 
                    "point": "l_tx_user"
                }, 
                {
                    "ts": 2287050000, 
                    "point": "l_tx_devqueue"
                }, 
                {
                    "ts": 2287050002, 
                    "point": "l_tx_devout"
                }, 
                {
                    "ts": 1657959608, 
                    "point": "r_rx_icmprcv"
                }, 
                {
                    "ts": 1657959614, 
                    "point": "r_tx_devout"
                }, 
                {
                    "ts": 2287050066, 
                    "point": "l_rx_iprcv"
                }, 
                {
                    "ts": 2287050068, 
                    "point": "l_rx_skdataready"
                }, 
                {
                    "ts": 2287050070, 
                    "point": "l_rx_wakeup"
                }, 
                {
                    "ts": 2287050076, 
                    "point": "l_rx_user"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_devrcv"
                }, 
                {
                    "ts": 2287050063, 
                    "point": "l_rx_softirq"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_mac"
                }
            ]
        }, 
        {
            "delays": [
                {
                    "delay": "total", 
                    "ts": 84
                }, 
                {
                    "delay": "l_tx_kern", 
                    "ts": 5
                }, 
                {
                    "delay": "l_tx_qdisc", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "r_rx_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_inlink", 
                    "ts": 1
                }, 
                {
                    "delay": "l_rx_kern", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_task_waking", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_task_queue", 
                    "ts": 6
                }, 
                {
                    "delay": "l_rx_softirq", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ringkern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_kern", 
                    "ts": 8
                }, 
                {
                    "delay": "l_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "r_rx_merged_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_inlink", 
                    "ts": 1
                }, 
                {
                    "delay": "l_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_kern", 
                    "ts": 10
                }
            ], 
            "meta": {
                "start_ns": 11766202486033311, 
                "seq": 80
            }, 
            "points": [
                {
                    "ts": 2287062289, 
                    "point": "l_tx_user"
                }, 
                {
                    "ts": 2287062294, 
                    "point": "l_tx_devqueue"
                }, 
                {
                    "ts": 2287062297, 
                    "point": "l_tx_devout"
                }, 
                {
                    "ts": 1657971905, 
                    "point": "r_rx_icmprcv"
                }, 
                {
                    "ts": 1657971911, 
                    "point": "r_tx_devout"
                }, 
                {
                    "ts": 2287062363, 
                    "point": "l_rx_iprcv"
                }, 
                {
                    "ts": 2287062365, 
                    "point": "l_rx_skdataready"
                }, 
                {
                    "ts": 2287062367, 
                    "point": "l_rx_wakeup"
                }, 
                {
                    "ts": 2287062373, 
                    "point": "l_rx_user"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_devrcv"
                }, 
                {
                    "ts": 2287062360, 
                    "point": "l_rx_softirq"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_mac"
                }
            ]
        }, 
        {
            "delays": [
                {
                    "delay": "total", 
                    "ts": 94
                }, 
                {
                    "delay": "l_tx_kern", 
                    "ts": 8
                }, 
                {
                    "delay": "l_tx_qdisc", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_kern", 
                    "ts": 5
                }, 
                {
                    "delay": "r_rx_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_inlink", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_kern", 
                    "ts": 3
                }, 
                {
                    "delay": "l_rx_task_waking", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_task_queue", 
                    "ts": 6
                }, 
                {
                    "delay": "l_rx_softirq", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ringkern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_kern", 
                    "ts": 11
                }, 
                {
                    "delay": "l_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_kern", 
                    "ts": 5
                }, 
                {
                    "delay": "r_rx_merged_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_inlink", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_kern", 
                    "ts": 11
                }
            ], 
            "meta": {
                "start_ns": 11766202498333970, 
                "seq": 81
            }, 
            "points": [
                {
                    "ts": 2287074589, 
                    "point": "l_tx_user"
                }, 
                {
                    "ts": 2287074597, 
                    "point": "l_tx_devqueue"
                }, 
                {
                    "ts": 2287074600, 
                    "point": "l_tx_devout"
                }, 
                {
                    "ts": 1657984214, 
                    "point": "r_rx_icmprcv"
                }, 
                {
                    "ts": 1657984219, 
                    "point": "r_tx_devout"
                }, 
                {
                    "ts": 2287074672, 
                    "point": "l_rx_iprcv"
                }, 
                {
                    "ts": 2287074675, 
                    "point": "l_rx_skdataready"
                }, 
                {
                    "ts": 2287074677, 
                    "point": "l_rx_wakeup"
                }, 
                {
                    "ts": 2287074683, 
                    "point": "l_rx_user"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_devrcv"
                }, 
                {
                    "ts": 2287074669, 
                    "point": "l_rx_softirq"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_mac"
                }
            ]
        }, 
        {
            "delays": [
                {
                    "delay": "total", 
                    "ts": 85
                }, 
                {
                    "delay": "l_tx_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "l_tx_qdisc", 
                    "ts": 2
                }, 
                {
                    "delay": "l_tx_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "r_rx_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_inlink", 
                    "ts": 1
                }, 
                {
                    "delay": "l_rx_kern", 
                    "ts": 3
                }, 
                {
                    "delay": "l_rx_task_waking", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_task_queue", 
                    "ts": 6
                }, 
                {
                    "delay": "l_rx_softirq", 
                    "ts": 2
                }, 
                {
                    "delay": "l_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ringkern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_kern", 
                    "ts": 8
                }, 
                {
                    "delay": "l_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "r_rx_merged_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_inlink", 
                    "ts": 1
                }, 
                {
                    "delay": "l_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_kern", 
                    "ts": 11
                }
            ], 
            "meta": {
                "start_ns": 11766202510638723, 
                "seq": 82
            }, 
            "points": [
                {
                    "ts": 2287086894, 
                    "point": "l_tx_user"
                }, 
                {
                    "ts": 2287086900, 
                    "point": "l_tx_devqueue"
                }, 
                {
                    "ts": 2287086902, 
                    "point": "l_tx_devout"
                }, 
                {
                    "ts": 1657996510, 
                    "point": "r_rx_icmprcv"
                }, 
                {
                    "ts": 1657996516, 
                    "point": "r_tx_devout"
                }, 
                {
                    "ts": 2287086968, 
                    "point": "l_rx_iprcv"
                }, 
                {
                    "ts": 2287086971, 
                    "point": "l_rx_skdataready"
                }, 
                {
                    "ts": 2287086973, 
                    "point": "l_rx_wakeup"
                }, 
                {
                    "ts": 2287086979, 
                    "point": "l_rx_user"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_devrcv"
                }, 
                {
                    "ts": 2287086966, 
                    "point": "l_rx_softirq"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_mac"
                }
            ]
        }, 
        {
            "delays": [
                {
                    "delay": "total", 
                    "ts": 113
                }, 
                {
                    "delay": "l_tx_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "l_tx_qdisc", 
                    "ts": 2
                }, 
                {
                    "delay": "l_tx_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_kern", 
                    "ts": 8
                }, 
                {
                    "delay": "r_rx_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_inlink", 
                    "ts": 13
                }, 
                {
                    "delay": "l_rx_kern", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_task_waking", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_task_queue", 
                    "ts": 6
                }, 
                {
                    "delay": "l_rx_softirq", 
                    "ts": 15
                }, 
                {
                    "delay": "l_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ringkern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_kern", 
                    "ts": 8
                }, 
                {
                    "delay": "l_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_kern", 
                    "ts": 8
                }, 
                {
                    "delay": "r_rx_merged_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_inlink", 
                    "ts": 13
                }, 
                {
                    "delay": "l_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_kern", 
                    "ts": 10
                }
            ], 
            "meta": {
                "start_ns": 11766202522935457, 
                "seq": 83
            }, 
            "points": [
                {
                    "ts": 2287099191, 
                    "point": "l_tx_user"
                }, 
                {
                    "ts": 2287099197, 
                    "point": "l_tx_devqueue"
                }, 
                {
                    "ts": 2287099199, 
                    "point": "l_tx_devout"
                }, 
                {
                    "ts": 1658008822, 
                    "point": "r_rx_icmprcv"
                }, 
                {
                    "ts": 1658008830, 
                    "point": "r_tx_devout"
                }, 
                {
                    "ts": 2287099294, 
                    "point": "l_rx_iprcv"
                }, 
                {
                    "ts": 2287099296, 
                    "point": "l_rx_skdataready"
                }, 
                {
                    "ts": 2287099298, 
                    "point": "l_rx_wakeup"
                }, 
                {
                    "ts": 2287099304, 
                    "point": "l_rx_user"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_devrcv"
                }, 
                {
                    "ts": 2287099279, 
                    "point": "l_rx_softirq"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_mac"
                }
            ]
        }, 
        {
            "delays": [
                {
                    "delay": "total", 
                    "ts": 108
                }, 
                {
                    "delay": "l_tx_kern", 
                    "ts": 18
                }, 
                {
                    "delay": "l_tx_qdisc", 
                    "ts": 2
                }, 
                {
                    "delay": "l_tx_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "r_rx_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_inlink", 
                    "ts": 0
                }, 
                {
                    "delay": "l_rx_kern", 
                    "ts": 3
                }, 
                {
                    "delay": "l_rx_task_waking", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_task_queue", 
                    "ts": 6
                }, 
                {
                    "delay": "l_rx_softirq", 
                    "ts": 2
                }, 
                {
                    "delay": "l_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ringkern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_kern", 
                    "ts": 20
                }, 
                {
                    "delay": "l_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "r_rx_merged_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_inlink", 
                    "ts": 0
                }, 
                {
                    "delay": "l_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_kern", 
                    "ts": 11
                }
            ], 
            "meta": {
                "start_ns": 11766202535248090, 
                "seq": 84
            }, 
            "points": [
                {
                    "ts": 2287111504, 
                    "point": "l_tx_user"
                }, 
                {
                    "ts": 2287111522, 
                    "point": "l_tx_devqueue"
                }, 
                {
                    "ts": 2287111524, 
                    "point": "l_tx_devout"
                }, 
                {
                    "ts": 1658021144, 
                    "point": "r_rx_icmprcv"
                }, 
                {
                    "ts": 1658021150, 
                    "point": "r_tx_devout"
                }, 
                {
                    "ts": 2287111601, 
                    "point": "l_rx_iprcv"
                }, 
                {
                    "ts": 2287111604, 
                    "point": "l_rx_skdataready"
                }, 
                {
                    "ts": 2287111606, 
                    "point": "l_rx_wakeup"
                }, 
                {
                    "ts": 2287111612, 
                    "point": "l_rx_user"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_devrcv"
                }, 
                {
                    "ts": 2287111599, 
                    "point": "l_rx_softirq"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_mac"
                }
            ]
        }, 
        {
            "delays": [
                {
                    "delay": "total", 
                    "ts": 98
                }, 
                {
                    "delay": "l_tx_kern", 
                    "ts": 7
                }, 
                {
                    "delay": "l_tx_qdisc", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_kern", 
                    "ts": 8
                }, 
                {
                    "delay": "r_rx_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_inlink", 
                    "ts": 1
                }, 
                {
                    "delay": "l_rx_kern", 
                    "ts": 3
                }, 
                {
                    "delay": "l_rx_task_waking", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_task_queue", 
                    "ts": 7
                }, 
                {
                    "delay": "l_rx_softirq", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ringkern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_kern", 
                    "ts": 10
                }, 
                {
                    "delay": "l_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_kern", 
                    "ts": 8
                }, 
                {
                    "delay": "r_rx_merged_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_inlink", 
                    "ts": 1
                }, 
                {
                    "delay": "l_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_kern", 
                    "ts": 12
                }
            ], 
            "meta": {
                "start_ns": 11766202547573304, 
                "seq": 85
            }, 
            "points": [
                {
                    "ts": 2287123829, 
                    "point": "l_tx_user"
                }, 
                {
                    "ts": 2287123836, 
                    "point": "l_tx_devqueue"
                }, 
                {
                    "ts": 2287123839, 
                    "point": "l_tx_devout"
                }, 
                {
                    "ts": 1658033455, 
                    "point": "r_rx_icmprcv"
                }, 
                {
                    "ts": 1658033463, 
                    "point": "r_tx_devout"
                }, 
                {
                    "ts": 2287123915, 
                    "point": "l_rx_iprcv"
                }, 
                {
                    "ts": 2287123918, 
                    "point": "l_rx_skdataready"
                }, 
                {
                    "ts": 2287123920, 
                    "point": "l_rx_wakeup"
                }, 
                {
                    "ts": 2287123927, 
                    "point": "l_rx_user"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_devrcv"
                }, 
                {
                    "ts": 2287123912, 
                    "point": "l_rx_softirq"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_mac"
                }
            ]
        }, 
        {
            "delays": [
                {
                    "delay": "total", 
                    "ts": 89
                }, 
                {
                    "delay": "l_tx_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "l_tx_qdisc", 
                    "ts": 2
                }, 
                {
                    "delay": "l_tx_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "r_rx_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_inlink", 
                    "ts": 1
                }, 
                {
                    "delay": "l_rx_kern", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_task_waking", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_task_queue", 
                    "ts": 7
                }, 
                {
                    "delay": "l_rx_softirq", 
                    "ts": 2
                }, 
                {
                    "delay": "l_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ringkern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_kern", 
                    "ts": 8
                }, 
                {
                    "delay": "l_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "r_rx_merged_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_inlink", 
                    "ts": 1
                }, 
                {
                    "delay": "l_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_kern", 
                    "ts": 11
                }
            ], 
            "meta": {
                "start_ns": 11766202559887480, 
                "seq": 86
            }, 
            "points": [
                {
                    "ts": 2287136143, 
                    "point": "l_tx_user"
                }, 
                {
                    "ts": 2287136149, 
                    "point": "l_tx_devqueue"
                }, 
                {
                    "ts": 2287136151, 
                    "point": "l_tx_devout"
                }, 
                {
                    "ts": 1658045763, 
                    "point": "r_rx_icmprcv"
                }, 
                {
                    "ts": 1658045769, 
                    "point": "r_tx_devout"
                }, 
                {
                    "ts": 2287136221, 
                    "point": "l_rx_iprcv"
                }, 
                {
                    "ts": 2287136223, 
                    "point": "l_rx_skdataready"
                }, 
                {
                    "ts": 2287136225, 
                    "point": "l_rx_wakeup"
                }, 
                {
                    "ts": 2287136232, 
                    "point": "l_rx_user"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_devrcv"
                }, 
                {
                    "ts": 2287136219, 
                    "point": "l_rx_softirq"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_mac"
                }
            ]
        }, 
        {
            "delays": [
                {
                    "delay": "total", 
                    "ts": 97
                }, 
                {
                    "delay": "l_tx_kern", 
                    "ts": 5
                }, 
                {
                    "delay": "l_tx_qdisc", 
                    "ts": 2
                }, 
                {
                    "delay": "l_tx_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_kern", 
                    "ts": 8
                }, 
                {
                    "delay": "r_rx_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_inlink", 
                    "ts": 1
                }, 
                {
                    "delay": "l_rx_kern", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_task_waking", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_task_queue", 
                    "ts": 6
                }, 
                {
                    "delay": "l_rx_softirq", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ringkern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_kern", 
                    "ts": 7
                }, 
                {
                    "delay": "l_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_kern", 
                    "ts": 8
                }, 
                {
                    "delay": "r_rx_merged_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_inlink", 
                    "ts": 1
                }, 
                {
                    "delay": "l_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_kern", 
                    "ts": 10
                }
            ], 
            "meta": {
                "start_ns": 11766202572193022, 
                "seq": 87
            }, 
            "points": [
                {
                    "ts": 2287148449, 
                    "point": "l_tx_user"
                }, 
                {
                    "ts": 2287148454, 
                    "point": "l_tx_devqueue"
                }, 
                {
                    "ts": 2287148456, 
                    "point": "l_tx_devout"
                }, 
                {
                    "ts": 1658058076, 
                    "point": "r_rx_icmprcv"
                }, 
                {
                    "ts": 1658058084, 
                    "point": "r_tx_devout"
                }, 
                {
                    "ts": 2287148536, 
                    "point": "l_rx_iprcv"
                }, 
                {
                    "ts": 2287148538, 
                    "point": "l_rx_skdataready"
                }, 
                {
                    "ts": 2287148540, 
                    "point": "l_rx_wakeup"
                }, 
                {
                    "ts": 2287148546, 
                    "point": "l_rx_user"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_devrcv"
                }, 
                {
                    "ts": 2287148533, 
                    "point": "l_rx_softirq"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_mac"
                }
            ]
        }, 
        {
            "delays": [
                {
                    "delay": "total", 
                    "ts": 90
                }, 
                {
                    "delay": "l_tx_kern", 
                    "ts": 5
                }, 
                {
                    "delay": "l_tx_qdisc", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_kern", 
                    "ts": 5
                }, 
                {
                    "delay": "r_rx_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_inlink", 
                    "ts": 1
                }, 
                {
                    "delay": "l_rx_kern", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_task_waking", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_task_queue", 
                    "ts": 6
                }, 
                {
                    "delay": "l_rx_softirq", 
                    "ts": 2
                }, 
                {
                    "delay": "l_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ringkern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_kern", 
                    "ts": 8
                }, 
                {
                    "delay": "l_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_kern", 
                    "ts": 5
                }, 
                {
                    "delay": "r_rx_merged_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_inlink", 
                    "ts": 1
                }, 
                {
                    "delay": "l_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_kern", 
                    "ts": 10
                }
            ], 
            "meta": {
                "start_ns": 11766202584504815, 
                "seq": 88
            }, 
            "points": [
                {
                    "ts": 2287160760, 
                    "point": "l_tx_user"
                }, 
                {
                    "ts": 2287160765, 
                    "point": "l_tx_devqueue"
                }, 
                {
                    "ts": 2287160768, 
                    "point": "l_tx_devout"
                }, 
                {
                    "ts": 1658070383, 
                    "point": "r_rx_icmprcv"
                }, 
                {
                    "ts": 1658070388, 
                    "point": "r_tx_devout"
                }, 
                {
                    "ts": 2287160840, 
                    "point": "l_rx_iprcv"
                }, 
                {
                    "ts": 2287160842, 
                    "point": "l_rx_skdataready"
                }, 
                {
                    "ts": 2287160844, 
                    "point": "l_rx_wakeup"
                }, 
                {
                    "ts": 2287160850, 
                    "point": "l_rx_user"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_devrcv"
                }, 
                {
                    "ts": 2287160838, 
                    "point": "l_rx_softirq"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_mac"
                }
            ]
        }, 
        {
            "delays": [
                {
                    "delay": "total", 
                    "ts": 98
                }, 
                {
                    "delay": "l_tx_kern", 
                    "ts": 7
                }, 
                {
                    "delay": "l_tx_qdisc", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "r_rx_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_inlink", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_kern", 
                    "ts": 3
                }, 
                {
                    "delay": "l_rx_task_waking", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_task_queue", 
                    "ts": 10
                }, 
                {
                    "delay": "l_rx_softirq", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ringkern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_kern", 
                    "ts": 10
                }, 
                {
                    "delay": "l_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "r_rx_merged_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_inlink", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_kern", 
                    "ts": 15
                }
            ], 
            "meta": {
                "start_ns": 11766202596813219, 
                "seq": 89
            }, 
            "points": [
                {
                    "ts": 2287173069, 
                    "point": "l_tx_user"
                }, 
                {
                    "ts": 2287173076, 
                    "point": "l_tx_devqueue"
                }, 
                {
                    "ts": 2287173079, 
                    "point": "l_tx_devout"
                }, 
                {
                    "ts": 1658082693, 
                    "point": "r_rx_icmprcv"
                }, 
                {
                    "ts": 1658082699, 
                    "point": "r_tx_devout"
                }, 
                {
                    "ts": 2287173152, 
                    "point": "l_rx_iprcv"
                }, 
                {
                    "ts": 2287173155, 
                    "point": "l_rx_skdataready"
                }, 
                {
                    "ts": 2287173157, 
                    "point": "l_rx_wakeup"
                }, 
                {
                    "ts": 2287173167, 
                    "point": "l_rx_user"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_devrcv"
                }, 
                {
                    "ts": 2287173149, 
                    "point": "l_rx_softirq"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_mac"
                }
            ]
        }, 
        {
            "delays": [
                {
                    "delay": "total", 
                    "ts": 105
                }, 
                {
                    "delay": "l_tx_kern", 
                    "ts": 10
                }, 
                {
                    "delay": "l_tx_qdisc", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "r_rx_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_inlink", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_kern", 
                    "ts": 4
                }, 
                {
                    "delay": "l_rx_task_waking", 
                    "ts": 3
                }, 
                {
                    "delay": "l_rx_task_queue", 
                    "ts": 9
                }, 
                {
                    "delay": "l_rx_softirq", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ringkern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_kern", 
                    "ts": 13
                }, 
                {
                    "delay": "l_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "r_rx_merged_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_inlink", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_kern", 
                    "ts": 16
                }
            ], 
            "meta": {
                "start_ns": 11766202609131863, 
                "seq": 90
            }, 
            "points": [
                {
                    "ts": 2287185387, 
                    "point": "l_tx_user"
                }, 
                {
                    "ts": 2287185397, 
                    "point": "l_tx_devqueue"
                }, 
                {
                    "ts": 2287185400, 
                    "point": "l_tx_devout"
                }, 
                {
                    "ts": 1658095017, 
                    "point": "r_rx_icmprcv"
                }, 
                {
                    "ts": 1658095023, 
                    "point": "r_tx_devout"
                }, 
                {
                    "ts": 2287185476, 
                    "point": "l_rx_iprcv"
                }, 
                {
                    "ts": 2287185480, 
                    "point": "l_rx_skdataready"
                }, 
                {
                    "ts": 2287185483, 
                    "point": "l_rx_wakeup"
                }, 
                {
                    "ts": 2287185492, 
                    "point": "l_rx_user"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_devrcv"
                }, 
                {
                    "ts": 2287185473, 
                    "point": "l_rx_softirq"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_mac"
                }
            ]
        }, 
        {
            "delays": [
                {
                    "delay": "total", 
                    "ts": 100
                }, 
                {
                    "delay": "l_tx_kern", 
                    "ts": 7
                }, 
                {
                    "delay": "l_tx_qdisc", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_kern", 
                    "ts": 7
                }, 
                {
                    "delay": "r_rx_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_inlink", 
                    "ts": 1
                }, 
                {
                    "delay": "l_rx_kern", 
                    "ts": 3
                }, 
                {
                    "delay": "l_rx_task_waking", 
                    "ts": 3
                }, 
                {
                    "delay": "l_rx_task_queue", 
                    "ts": 6
                }, 
                {
                    "delay": "l_rx_softirq", 
                    "ts": 2
                }, 
                {
                    "delay": "l_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ringkern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_kern", 
                    "ts": 10
                }, 
                {
                    "delay": "l_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_kern", 
                    "ts": 7
                }, 
                {
                    "delay": "r_rx_merged_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_inlink", 
                    "ts": 1
                }, 
                {
                    "delay": "l_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_kern", 
                    "ts": 12
                }
            ], 
            "meta": {
                "start_ns": 11766202621457289, 
                "seq": 91
            }, 
            "points": [
                {
                    "ts": 2287197713, 
                    "point": "l_tx_user"
                }, 
                {
                    "ts": 2287197720, 
                    "point": "l_tx_devqueue"
                }, 
                {
                    "ts": 2287197723, 
                    "point": "l_tx_devout"
                }, 
                {
                    "ts": 1658107342, 
                    "point": "r_rx_icmprcv"
                }, 
                {
                    "ts": 1658107349, 
                    "point": "r_tx_devout"
                }, 
                {
                    "ts": 2287197801, 
                    "point": "l_rx_iprcv"
                }, 
                {
                    "ts": 2287197804, 
                    "point": "l_rx_skdataready"
                }, 
                {
                    "ts": 2287197807, 
                    "point": "l_rx_wakeup"
                }, 
                {
                    "ts": 2287197813, 
                    "point": "l_rx_user"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_devrcv"
                }, 
                {
                    "ts": 2287197799, 
                    "point": "l_rx_softirq"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_mac"
                }
            ]
        }, 
        {
            "delays": [
                {
                    "delay": "total", 
                    "ts": 91
                }, 
                {
                    "delay": "l_tx_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "l_tx_qdisc", 
                    "ts": 2
                }, 
                {
                    "delay": "l_tx_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_kern", 
                    "ts": 8
                }, 
                {
                    "delay": "r_rx_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_inlink", 
                    "ts": 0
                }, 
                {
                    "delay": "l_rx_kern", 
                    "ts": 3
                }, 
                {
                    "delay": "l_rx_task_waking", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_task_queue", 
                    "ts": 6
                }, 
                {
                    "delay": "l_rx_softirq", 
                    "ts": 2
                }, 
                {
                    "delay": "l_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ringkern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_kern", 
                    "ts": 8
                }, 
                {
                    "delay": "l_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_kern", 
                    "ts": 8
                }, 
                {
                    "delay": "r_rx_merged_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_inlink", 
                    "ts": 0
                }, 
                {
                    "delay": "l_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_kern", 
                    "ts": 11
                }
            ], 
            "meta": {
                "start_ns": 11766202633759549, 
                "seq": 92
            }, 
            "points": [
                {
                    "ts": 2287210015, 
                    "point": "l_tx_user"
                }, 
                {
                    "ts": 2287210021, 
                    "point": "l_tx_devqueue"
                }, 
                {
                    "ts": 2287210023, 
                    "point": "l_tx_devout"
                }, 
                {
                    "ts": 1658119636, 
                    "point": "r_rx_icmprcv"
                }, 
                {
                    "ts": 1658119644, 
                    "point": "r_tx_devout"
                }, 
                {
                    "ts": 2287210095, 
                    "point": "l_rx_iprcv"
                }, 
                {
                    "ts": 2287210098, 
                    "point": "l_rx_skdataready"
                }, 
                {
                    "ts": 2287210100, 
                    "point": "l_rx_wakeup"
                }, 
                {
                    "ts": 2287210106, 
                    "point": "l_rx_user"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_devrcv"
                }, 
                {
                    "ts": 2287210093, 
                    "point": "l_rx_softirq"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_mac"
                }
            ]
        }, 
        {
            "delays": [
                {
                    "delay": "total", 
                    "ts": 105
                }, 
                {
                    "delay": "l_tx_kern", 
                    "ts": 7
                }, 
                {
                    "delay": "l_tx_qdisc", 
                    "ts": 4
                }, 
                {
                    "delay": "l_tx_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_kern", 
                    "ts": 7
                }, 
                {
                    "delay": "r_rx_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_inlink", 
                    "ts": 3
                }, 
                {
                    "delay": "l_rx_kern", 
                    "ts": 3
                }, 
                {
                    "delay": "l_rx_task_waking", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_task_queue", 
                    "ts": 6
                }, 
                {
                    "delay": "l_rx_softirq", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ringkern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_kern", 
                    "ts": 11
                }, 
                {
                    "delay": "l_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_kern", 
                    "ts": 7
                }, 
                {
                    "delay": "r_rx_merged_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_inlink", 
                    "ts": 3
                }, 
                {
                    "delay": "l_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_kern", 
                    "ts": 11
                }
            ], 
            "meta": {
                "start_ns": 11766202646073985, 
                "seq": 93
            }, 
            "points": [
                {
                    "ts": 2287222329, 
                    "point": "l_tx_user"
                }, 
                {
                    "ts": 2287222336, 
                    "point": "l_tx_devqueue"
                }, 
                {
                    "ts": 2287222340, 
                    "point": "l_tx_devout"
                }, 
                {
                    "ts": 1658131962, 
                    "point": "r_rx_icmprcv"
                }, 
                {
                    "ts": 1658131969, 
                    "point": "r_tx_devout"
                }, 
                {
                    "ts": 2287222423, 
                    "point": "l_rx_iprcv"
                }, 
                {
                    "ts": 2287222426, 
                    "point": "l_rx_skdataready"
                }, 
                {
                    "ts": 2287222428, 
                    "point": "l_rx_wakeup"
                }, 
                {
                    "ts": 2287222434, 
                    "point": "l_rx_user"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_devrcv"
                }, 
                {
                    "ts": 2287222420, 
                    "point": "l_rx_softirq"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_mac"
                }
            ]
        }, 
        {
            "delays": [
                {
                    "delay": "total", 
                    "ts": 91
                }, 
                {
                    "delay": "l_tx_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "l_tx_qdisc", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_kern", 
                    "ts": 8
                }, 
                {
                    "delay": "r_rx_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_inlink", 
                    "ts": 1
                }, 
                {
                    "delay": "l_rx_kern", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_task_waking", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_task_queue", 
                    "ts": 6
                }, 
                {
                    "delay": "l_rx_softirq", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ringkern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_kern", 
                    "ts": 9
                }, 
                {
                    "delay": "l_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_kern", 
                    "ts": 8
                }, 
                {
                    "delay": "r_rx_merged_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_inlink", 
                    "ts": 1
                }, 
                {
                    "delay": "l_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_kern", 
                    "ts": 10
                }
            ], 
            "meta": {
                "start_ns": 11766202658396828, 
                "seq": 94
            }, 
            "points": [
                {
                    "ts": 2287234652, 
                    "point": "l_tx_user"
                }, 
                {
                    "ts": 2287234658, 
                    "point": "l_tx_devqueue"
                }, 
                {
                    "ts": 2287234661, 
                    "point": "l_tx_devout"
                }, 
                {
                    "ts": 1658144273, 
                    "point": "r_rx_icmprcv"
                }, 
                {
                    "ts": 1658144281, 
                    "point": "r_tx_devout"
                }, 
                {
                    "ts": 2287234733, 
                    "point": "l_rx_iprcv"
                }, 
                {
                    "ts": 2287234735, 
                    "point": "l_rx_skdataready"
                }, 
                {
                    "ts": 2287234737, 
                    "point": "l_rx_wakeup"
                }, 
                {
                    "ts": 2287234743, 
                    "point": "l_rx_user"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_devrcv"
                }, 
                {
                    "ts": 2287234730, 
                    "point": "l_rx_softirq"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_mac"
                }
            ]
        }, 
        {
            "delays": [
                {
                    "delay": "total", 
                    "ts": 109
                }, 
                {
                    "delay": "l_tx_kern", 
                    "ts": 11
                }, 
                {
                    "delay": "l_tx_qdisc", 
                    "ts": 4
                }, 
                {
                    "delay": "l_tx_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "r_rx_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_inlink", 
                    "ts": 3
                }, 
                {
                    "delay": "l_rx_kern", 
                    "ts": 4
                }, 
                {
                    "delay": "l_rx_task_waking", 
                    "ts": 3
                }, 
                {
                    "delay": "l_rx_task_queue", 
                    "ts": 7
                }, 
                {
                    "delay": "l_rx_softirq", 
                    "ts": 4
                }, 
                {
                    "delay": "l_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ringkern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_kern", 
                    "ts": 15
                }, 
                {
                    "delay": "l_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "r_rx_merged_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_inlink", 
                    "ts": 3
                }, 
                {
                    "delay": "l_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_kern", 
                    "ts": 14
                }
            ], 
            "meta": {
                "start_ns": 11766202670705625, 
                "seq": 95
            }, 
            "points": [
                {
                    "ts": 2287246961, 
                    "point": "l_tx_user"
                }, 
                {
                    "ts": 2287246972, 
                    "point": "l_tx_devqueue"
                }, 
                {
                    "ts": 2287246976, 
                    "point": "l_tx_devout"
                }, 
                {
                    "ts": 1658156596, 
                    "point": "r_rx_icmprcv"
                }, 
                {
                    "ts": 1658156602, 
                    "point": "r_tx_devout"
                }, 
                {
                    "ts": 2287247056, 
                    "point": "l_rx_iprcv"
                }, 
                {
                    "ts": 2287247060, 
                    "point": "l_rx_skdataready"
                }, 
                {
                    "ts": 2287247063, 
                    "point": "l_rx_wakeup"
                }, 
                {
                    "ts": 2287247070, 
                    "point": "l_rx_user"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_devrcv"
                }, 
                {
                    "ts": 2287247052, 
                    "point": "l_rx_softirq"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_mac"
                }
            ]
        }, 
        {
            "delays": [
                {
                    "delay": "total", 
                    "ts": 96
                }, 
                {
                    "delay": "l_tx_kern", 
                    "ts": 7
                }, 
                {
                    "delay": "l_tx_qdisc", 
                    "ts": 2
                }, 
                {
                    "delay": "l_tx_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_kern", 
                    "ts": 7
                }, 
                {
                    "delay": "r_rx_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_inlink", 
                    "ts": 1
                }, 
                {
                    "delay": "l_rx_kern", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_task_waking", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_task_queue", 
                    "ts": 7
                }, 
                {
                    "delay": "l_rx_softirq", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ringkern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_kern", 
                    "ts": 9
                }, 
                {
                    "delay": "l_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_kern", 
                    "ts": 7
                }, 
                {
                    "delay": "r_rx_merged_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_inlink", 
                    "ts": 1
                }, 
                {
                    "delay": "l_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_kern", 
                    "ts": 11
                }
            ], 
            "meta": {
                "start_ns": 11766202683040700, 
                "seq": 96
            }, 
            "points": [
                {
                    "ts": 2287259296, 
                    "point": "l_tx_user"
                }, 
                {
                    "ts": 2287259303, 
                    "point": "l_tx_devqueue"
                }, 
                {
                    "ts": 2287259305, 
                    "point": "l_tx_devout"
                }, 
                {
                    "ts": 1658168922, 
                    "point": "r_rx_icmprcv"
                }, 
                {
                    "ts": 1658168929, 
                    "point": "r_tx_devout"
                }, 
                {
                    "ts": 2287259381, 
                    "point": "l_rx_iprcv"
                }, 
                {
                    "ts": 2287259383, 
                    "point": "l_rx_skdataready"
                }, 
                {
                    "ts": 2287259385, 
                    "point": "l_rx_wakeup"
                }, 
                {
                    "ts": 2287259392, 
                    "point": "l_rx_user"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_devrcv"
                }, 
                {
                    "ts": 2287259378, 
                    "point": "l_rx_softirq"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_mac"
                }
            ]
        }, 
        {
            "delays": [
                {
                    "delay": "total", 
                    "ts": 98
                }, 
                {
                    "delay": "l_tx_kern", 
                    "ts": 7
                }, 
                {
                    "delay": "l_tx_qdisc", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_kern", 
                    "ts": 8
                }, 
                {
                    "delay": "r_rx_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_inlink", 
                    "ts": 3
                }, 
                {
                    "delay": "l_rx_kern", 
                    "ts": 3
                }, 
                {
                    "delay": "l_rx_task_waking", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_task_queue", 
                    "ts": 7
                }, 
                {
                    "delay": "l_rx_softirq", 
                    "ts": 4
                }, 
                {
                    "delay": "l_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ringkern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_kern", 
                    "ts": 10
                }, 
                {
                    "delay": "l_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_kern", 
                    "ts": 8
                }, 
                {
                    "delay": "r_rx_merged_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_inlink", 
                    "ts": 3
                }, 
                {
                    "delay": "l_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_kern", 
                    "ts": 12
                }
            ], 
            "meta": {
                "start_ns": 11766202695351196, 
                "seq": 97
            }, 
            "points": [
                {
                    "ts": 2287271607, 
                    "point": "l_tx_user"
                }, 
                {
                    "ts": 2287271614, 
                    "point": "l_tx_devqueue"
                }, 
                {
                    "ts": 2287271617, 
                    "point": "l_tx_devout"
                }, 
                {
                    "ts": 1658181231, 
                    "point": "r_rx_icmprcv"
                }, 
                {
                    "ts": 1658181239, 
                    "point": "r_tx_devout"
                }, 
                {
                    "ts": 2287271693, 
                    "point": "l_rx_iprcv"
                }, 
                {
                    "ts": 2287271696, 
                    "point": "l_rx_skdataready"
                }, 
                {
                    "ts": 2287271698, 
                    "point": "l_rx_wakeup"
                }, 
                {
                    "ts": 2287271705, 
                    "point": "l_rx_user"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_devrcv"
                }, 
                {
                    "ts": 2287271689, 
                    "point": "l_rx_softirq"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_mac"
                }
            ]
        }, 
        {
            "delays": [
                {
                    "delay": "total", 
                    "ts": 100
                }, 
                {
                    "delay": "l_tx_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "l_tx_qdisc", 
                    "ts": 3
                }, 
                {
                    "delay": "l_tx_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_kern", 
                    "ts": 9
                }, 
                {
                    "delay": "r_rx_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_inlink", 
                    "ts": 0
                }, 
                {
                    "delay": "l_rx_kern", 
                    "ts": 3
                }, 
                {
                    "delay": "l_rx_task_waking", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_task_queue", 
                    "ts": 6
                }, 
                {
                    "delay": "l_rx_softirq", 
                    "ts": 2
                }, 
                {
                    "delay": "l_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ringkern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_kern", 
                    "ts": 9
                }, 
                {
                    "delay": "l_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_kern", 
                    "ts": 9
                }, 
                {
                    "delay": "r_rx_merged_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_inlink", 
                    "ts": 0
                }, 
                {
                    "delay": "l_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_kern", 
                    "ts": 11
                }
            ], 
            "meta": {
                "start_ns": 11766202707669348, 
                "seq": 98
            }, 
            "points": [
                {
                    "ts": 2287283925, 
                    "point": "l_tx_user"
                }, 
                {
                    "ts": 2287283931, 
                    "point": "l_tx_devqueue"
                }, 
                {
                    "ts": 2287283934, 
                    "point": "l_tx_devout"
                }, 
                {
                    "ts": 1658193554, 
                    "point": "r_rx_icmprcv"
                }, 
                {
                    "ts": 1658193563, 
                    "point": "r_tx_devout"
                }, 
                {
                    "ts": 2287284014, 
                    "point": "l_rx_iprcv"
                }, 
                {
                    "ts": 2287284017, 
                    "point": "l_rx_skdataready"
                }, 
                {
                    "ts": 2287284019, 
                    "point": "l_rx_wakeup"
                }, 
                {
                    "ts": 2287284025, 
                    "point": "l_rx_user"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_devrcv"
                }, 
                {
                    "ts": 2287284012, 
                    "point": "l_rx_softirq"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_mac"
                }
            ]
        }, 
        {
            "delays": [
                {
                    "delay": "total", 
                    "ts": 92
                }, 
                {
                    "delay": "l_tx_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "l_tx_qdisc", 
                    "ts": 2
                }, 
                {
                    "delay": "l_tx_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "r_rx_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_inlink", 
                    "ts": 1
                }, 
                {
                    "delay": "l_rx_kern", 
                    "ts": 3
                }, 
                {
                    "delay": "l_rx_task_waking", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_task_queue", 
                    "ts": 6
                }, 
                {
                    "delay": "l_rx_softirq", 
                    "ts": 2
                }, 
                {
                    "delay": "l_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ringkern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_kern", 
                    "ts": 8
                }, 
                {
                    "delay": "l_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "r_rx_merged_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_inlink", 
                    "ts": 1
                }, 
                {
                    "delay": "l_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_kern", 
                    "ts": 11
                }
            ], 
            "meta": {
                "start_ns": 11766202719986538, 
                "seq": 99
            }, 
            "points": [
                {
                    "ts": 2287296242, 
                    "point": "l_tx_user"
                }, 
                {
                    "ts": 2287296248, 
                    "point": "l_tx_devqueue"
                }, 
                {
                    "ts": 2287296250, 
                    "point": "l_tx_devout"
                }, 
                {
                    "ts": 1658205865, 
                    "point": "r_rx_icmprcv"
                }, 
                {
                    "ts": 1658205871, 
                    "point": "r_tx_devout"
                }, 
                {
                    "ts": 2287296323, 
                    "point": "l_rx_iprcv"
                }, 
                {
                    "ts": 2287296326, 
                    "point": "l_rx_skdataready"
                }, 
                {
                    "ts": 2287296328, 
                    "point": "l_rx_wakeup"
                }, 
                {
                    "ts": 2287296334, 
                    "point": "l_rx_user"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_devrcv"
                }, 
                {
                    "ts": 2287296321, 
                    "point": "l_rx_softirq"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_mac"
                }
            ]
        }, 
        {
            "delays": [
                {
                    "delay": "total", 
                    "ts": 117
                }, 
                {
                    "delay": "l_tx_kern", 
                    "ts": 5
                }, 
                {
                    "delay": "l_tx_qdisc", 
                    "ts": 16
                }, 
                {
                    "delay": "l_tx_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "r_rx_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_inlink", 
                    "ts": 1
                }, 
                {
                    "delay": "l_rx_kern", 
                    "ts": 16
                }, 
                {
                    "delay": "l_rx_task_waking", 
                    "ts": 2
                }, 
                {
                    "delay": "l_rx_task_queue", 
                    "ts": 6
                }, 
                {
                    "delay": "l_rx_softirq", 
                    "ts": 2
                }, 
                {
                    "delay": "l_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_ringkern", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_kern", 
                    "ts": 21
                }, 
                {
                    "delay": "l_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_tx_merged_outlink", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "r_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_kern", 
                    "ts": 6
                }, 
                {
                    "delay": "r_rx_merged_kern", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "r_tx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_inlink", 
                    "ts": 1
                }, 
                {
                    "delay": "l_rx_merged_moc", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_ring", 
                    "ts": -1
                }, 
                {
                    "delay": "l_rx_merged_kern", 
                    "ts": 24
                }
            ], 
            "meta": {
                "start_ns": 11766202732296267, 
                "seq": 100
            }, 
            "points": [
                {
                    "ts": 2287308552, 
                    "point": "l_tx_user"
                }, 
                {
                    "ts": 2287308557, 
                    "point": "l_tx_devqueue"
                }, 
                {
                    "ts": 2287308573, 
                    "point": "l_tx_devout"
                }, 
                {
                    "ts": 1658218187, 
                    "point": "r_rx_icmprcv"
                }, 
                {
                    "ts": 1658218193, 
                    "point": "r_tx_devout"
                }, 
                {
                    "ts": 2287308645, 
                    "point": "l_rx_iprcv"
                }, 
                {
                    "ts": 2287308661, 
                    "point": "l_rx_skdataready"
                }, 
                {
                    "ts": 2287308663, 
                    "point": "l_rx_wakeup"
                }, 
                {
                    "ts": 2287308669, 
                    "point": "l_rx_user"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_devrcv"
                }, 
                {
                    "ts": 2287308643, 
                    "point": "l_rx_softirq"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "l_tx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "l_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_mac"
                }, 
                {
                    "ts": -1, 
                    "point": "r_rx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_avs"
                }, 
                {
                    "ts": -1, 
                    "point": "r_tx_mac"
                }
            ]
        }
    ]
  };

  const result = {
    data: dataSource,
    success: true,
  };
  return res.json(result);
}

async function getCurve(req, res, u) {
    let realUrl = u;
  
    if (
      !realUrl ||
      Object.prototype.toString.call(realUrl) !== "[object String]"
    ) {
      realUrl = req.url;
    }
    
    const dataSource = {
        "status":"success",
        "IO timeout":"true",
        "stat":[
            {
                "diskname":"vda",
                "delays":[
                    {
                        "component":"os(block)",
                        "percent":"8.894%",
                        "max":123,
                        "min":25,
                        "avg":74
                    },
                    {
                        "component":"os(driver)",
                        "percent":"1.442%",
                        "max":17,
                        "min":8,
                        "avg":12
                    },
                    {
                        "component":"disk",
                        "percent":"89.183%",
                        "max":830,
                        "min":655,
                        "avg":742
                    },
                    {
                        "component":"os(complete)",
                        "percent":"0.361%",
                        "max":5,
                        "min":2,
                        "avg":3
                    }
                ]
            },
            {
                "diskname":"vdb",
                "delays":[
                    {
                        "component":"os(block)",
                        "percent":"9.824%",
                        "max":133,
                        "min":43,
                        "avg":22
                    },
                    {
                        "component":"os(driver)",
                        "percent":"3.442%",
                        "max":19,
                        "min":80,
                        "avg":120
                    },
                    {
                        "component":"disk",
                        "percent":"80.183%",
                        "max":810,
                        "min":605,
                        "avg":702
                    },
                    {
                        "component":"os(complete)",
                        "percent":"1.361%",
                        "max":7,
                        "min":6,
                        "avg":5
                    }
                ]
            },
            {
                "diskname":"vdc",
                "delays":[
                    {
                        "component":"os(block)",
                        "percent":"12.894%",
                        "max":193,
                        "min":27,
                        "avg":36
                    },
                    {
                        "component":"os(driver)",
                        "percent":"0.442%",
                        "max":10,
                        "min":2,
                        "avg":3
                    },
                    {
                        "component":"disk",
                        "percent":"8.183%",
                        "max":13,
                        "min":65,
                        "avg":71
                    },
                    {
                        "component":"os(complete)",
                        "percent":"3.361%",
                        "max":8,
                        "min":9,
                        "avg":4
                    }
                ]
            }
        ],
        "seq":[
            {
                "diskname":"vda",
                "slow ios":[
                    {
                        "time": "Tue Jan 18 15:03:50 2022",
                        "totaldelay":877,
                        "delays":[
                            {
                                "component":"block",
                                "delay":25
                            },
                            {
                                "component":"driver",
                                "delay":17
                            },
                            {
                                "component":"disk",
                                "delay":830
                            },
                            {
                                "component":"complete",
                                "delay":5
                            }
                        ]
                    },
                    {
                        "time": "Tue Jan 19 15:03:50 2022",
                        "totaldelay":788,
                        "delays":[
                            {
                                "component":"block",
                                "delay":123
                            },
                            {
                                "component":"driver",
                                "delay":8
                            },
                            {
                                "component":"disk",
                                "delay":655
                            },
                            {
                                "component":"complete",
                                "delay":2
                            }
                        ]
                    }
                ]
            },
           {
                "diskname":"vdb",
                "slow ios":[
                    {
                        "time": "Tue Jan 18 15:03:50 2022",
                        "totaldelay":877,
                        "delays":[
                            {
                                "component":"block",
                                "delay":30
                            },
                            {
                                "component":"driver",
                                "delay":10
                            },
                            {
                                "component":"disk",
                                "delay":880
                            },
                            {
                                "component":"complete",
                                "delay":46
                            }
                        ]
                    },
                    {
                        "time": "Tue Jan 19 15:03:50 2022",
                        "totaldelay":788,
                        "delays":[
                            {
                                "component":"block",
                                "delay":122
                            },
                            {
                                "component":"driver",
                                "delay":9
                            },
                            {
                                "component":"disk",
                                "delay":66
                            },
                            {
                                "component":"complete",
                                "delay":267
                            }
                        ]
                    }
                ]
            },
            {
                "diskname":"vdc",
                "slow ios":[
                    {
                        "time": "Tue Jan 18 15:03:50 2022",
                        "totaldelay":877,
                        "delays":[
                            {
                                "component":"block",
                                "delay":33
                            },
                            {
                                "component":"driver",
                                "delay":15
                            },
                            {
                                "component":"disk",
                                "delay":886
                            },
                            {
                                "component":"complete",
                                "delay":45
                            }
                        ]
                    },
                    {
                        "time": "Tue Jan 19 15:03:50 2022",
                        "totaldelay":788,
                        "delays":[
                            {
                                "component":"block",
                                "delay":113
                            },
                            {
                                "component":"driver",
                                "delay":6
                            },
                            {
                                "component":"disk",
                                "delay":78
                            },
                            {
                                "component":"complete",
                                "delay":244
                            }
                        ]
                    }
                ]
            }
        ]
    };
  
    const result = {
      data: dataSource,
      success: true,
    };
    return res.json(result);
}

async function postIOTask(req, res, u) {
    let realUrl = u;
  
    if (
      !realUrl ||
      Object.prototype.toString.call(realUrl) !== "[object String]"
    ) {
      realUrl = req.url;
    }
  
    const dataSource = {
        "status": "success",
        "data": []
    };
  
    const result = {
      data: dataSource,
      success: true,
    };
    return res.json(result);
}

export default {
  "GET /api/getable/": getIoTable,
  "GET /api/metric/": getMetric,
  "GET /api/curve/": getCurve,
  "POST /api/iotask/": postIOTask,
};

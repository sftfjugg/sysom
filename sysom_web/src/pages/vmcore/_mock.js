import { parse } from "url";

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
    tableListDataSource.push({
      id: index,
      name: name,
      hostname: "host-" + name,
      ip: getRandIP(),
      core_time: new Date(),
      ver: "3.10.0-327.ali2008." + name + ".alios7.x86_64",
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

async function getVmcore(req, res, u) {
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

const genIssueList = (current, pageSize) => {
  const issueListDataSource = [];

  for (let i = 0; i < pageSize; i += 1) {
    const index = (current - 1) * 10 + i;
    issueListDataSource.push({
      id: index,
      calltrace: "ovl_cleanup$ovl_cleanup_whiteouts$ovl_clear_empty",
      crashkey: "310$ovl_cleanup$ovl_cleanup_whiteouts$ovl_clear_empty",
      solution:
        "这是一个很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长的解决方案，只是为了看看他能有多长,看看到底能够长的啥时候拐弯。",
    });
  }

  issueListDataSource.reverse();
  return issueListDataSource;
};

let issueListDataSource = genList(1, 100);

async function getSolution(req, res, u) {
  let realUrl = u;

  if (
    !realUrl ||
    Object.prototype.toString.call(realUrl) !== "[object String]"
  ) {
    realUrl = req.url;
  }

  const dataSource = {
    id: 1,
    created_at: new Date(),
    deleted_at: null,
    calltrace: "ovl_cleanup$ovl_cleanup_whiteouts$ovl_clear_empty",
    crashkey: "310$ovl_cleanup$ovl_cleanup_whiteouts$ovl_clear_empty",
    solution:
      "这是一个很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长的解决方案，只是为了看看他能有多长,看看到底能够长的啥时候拐弯。",
  };

  const result = {
    data: dataSource,
    success: true,
  };
  return res.json(result);
}

function postSolution(req, res, u, b) {
  let realUrl = u;

  if (
    !realUrl ||
    Object.prototype.toString.call(realUrl) !== "[object String]"
  ) {
    realUrl = req.url;
  }

  const body = (b && b.body) || req.body;
  const { method, solution, id } = body;

  switch (method) {
    /* eslint no-case-declarations:0 */
    case "delete":
      issueListDataSource = issueListDataSource.filter(
        (item) => key.indexOf(item.key) === -1
      );
      break;

    case "post":
      (() => {
        const i = Math.ceil(Math.random() * 10000);
        const newIssue = {
          id: 1,
          created_at: new Date(),
          deleted_at: null,
          calltrace: "ovl_cleanup$ovl_cleanup_whiteouts$ovl_clear_empty",
          crashkey: "310$ovl_cleanup$ovl_cleanup_whiteouts$ovl_clear_empty",
          solution:
            "这是一个很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长的解决方案，只是为了看看他能有多长,看看到底能够长的啥时候拐弯。",
        };
        issueListDataSource.unshift(newIssue);
        return res.json(newIssue);
      })();

      return;

    case "update":
      (() => {
        let newIssue = {};
        issueListDataSource = issueListDataSource.map((item) => {
          if (item.id === id) {
            newIssue = { ...item, solution };
            return { ...item, solution };
          }

          return item;
        });
        return res.json(newIssue);
      })();

      return;

    default:
      break;
  }

  const result = {
    success: true,
    list: issueListDataSource,
    pagination: {
      total: issueListDataSource.length,
    },
  };
  res.json(result);
}

async function getSimilarCrash(req, res, u) {
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

  if (params.similar_dmesg) {
    dataSource = dataSource.filter((data) =>
      data.ver.includes(params.similar_dmesg || "")
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

export default {
  "GET /api/vmcore": getVmcore,
  "GET /api/issue": getSolution,
  "POST /api/issue": postSolution,
  "POST /api/vmcore": getSimilarCrash,
};

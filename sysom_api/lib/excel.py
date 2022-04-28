import pandas as pd

class Excel:
    def __init__(self, file) -> None:
        self.file = file
        self.row_dict = {
            'host_password': '主机密码',
            'hostname': '主机别名',
            'ip': '主机地址',
            'port': '端口',
            'username': '登录用户',
            'cluster': '所属集群',
            'description': '简介',
            }
        self._file_io = None
        self.open()

    def open(self):
        if not self._file_io:
            self._file_io = pd.read_excel(self.file)

    def values(self):
        content = list()
        for _, row in self._file_io.iterrows():
            item = {}
            for k, v in self.row_dict.items():
                item[k] = row[v]
            content.append(item)
        return content
    
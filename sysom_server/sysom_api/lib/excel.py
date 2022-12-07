from io import BytesIO
import pandas as pd
from xlwt import Workbook
from django.http import StreamingHttpResponse, HttpResponse


class Excel:
    def __init__(self, file, row_dict: dict) -> None:
        self.file = file
        self.row_dict = row_dict
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

    @staticmethod
    def export(datalist: list = ..., sheetname: str = 'sheet1', excelname: str = 'host'):
        """
        Export excel
        Type xlsx
        """
        response = HttpResponse(content_type='application/vnd.ms-excel')
        response['Content-Disposition'] = 'attachment; filename=%s' % excelname+'.xlsx'

        workbook = Workbook(encoding='utf-8')
        sheet = workbook.add_sheet(sheetname)

        for i, k in enumerate([k for k in datalist[0].keys()]):
            sheet.write(0, i, k)

        for r, data in enumerate(datalist):
            for i, key in enumerate([k for k in data.keys()]):
                sheet.write(r+1, i, data[key])

        io = BytesIO()
        workbook.save(io)
        io.seek(0)

        response.write(io.getvalue())
        return response

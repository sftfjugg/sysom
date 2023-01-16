import os
from apps.hotfix.models import HotfixModel
"""
Function class
This class contains the support/tool function
"""
class FunctionClass():

    def delete_document(self, doc_path, doc_name):
        document = os.path.join(doc_path, doc_name)
        if os.path.exists(document):
            try:
                os.remove(document)
            except Exception as e:
                print(str(e))
                return None
        else:
            return None    

    
    def query_formal_hotfix_by_parameters(self, created_time, kernel_version, patch_name):
        if created_time is not None and len(created_time) <= 0:
            created_time=None
        if kernel_version is not None and len(kernel_version) == 0:
            kernel_version = None
        if patch_name is not None and len(patch_name) == 0:
            patch_name=None
        objects = HotfixModel.objects.all().filter(formal=1)
        if created_time is not None:
            objects = objects.filter(created_at__lt=created_time)
        if kernel_version is not None:
            objects = objects.filter(kernel_version=kernel_version)
        if patch_name is not None:
            objects = objects.filter(patch_name=patch_name)
        return objects

import os
import re
from loguru import logger
from lib.base_view import CommonModelViewSet

from apps.hotfix.models import HotfixModel, OSTypeModel, KernelVersionModel
"""
Function class
This class contains the support/tool function
"""
class FunctionClass():

    def __init__(self):
        self.cec = CommonModelViewSet()

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

    def query_formal_hotfix_by_parameters(self, created_time, kernel_version, patch_file, hotfix_name):
        if created_time is not None and len(created_time) <= 0:
            created_time=None
        if kernel_version is not None and len(kernel_version) == 0:
            kernel_version = None
        if patch_file is not None and len(patch_file) == 0:
            patch_file=None
        if hotfix_name is not None and len(hotfix_name) == 0:
            hotfix_name=None
        objects = HotfixModel.objects.all().filter(formal=1)
        if created_time is not None:
            objects = objects.filter(created_at__lt=created_time)
        if kernel_version is not None:
            objects = objects.filter(kernel_version=kernel_version)
        if patch_file is not None:
            objects = objects.filter(patch_file=patch_file)
        if hotfix_name is not None:
            objects = objects.filter(hotfix_name=hotfix_name)
        return objects

    def get_info_from_version(self, kernel_version, info="os_type"):
        try:
            version_object = KernelVersionModel.objects.all().filter(kernel_version=kernel_version).first()
            if version_object is None:
                logger.error("query kernel version from record failed")
                return None
            if info == "os_type":
                return version_object.os_type
            if info == "branch":
                return version_object.git_branch
            if info == "devel_link":
                return version_object.devel_link
            if info == "debuginfo_link":
                return version_object.debuginfo_link
        except Exception as e:
            logger.error(str(e))
            return None        

    def get_gitrepo_of_os(self, os_type):
        try:
            os_object = OSTypeModel.objects.all().filter(os_type=os_type).first()
            if os_object is None:
                return None
            return os_object.git_repo
        except Exception as e:
            logger.error(str(e))
            return None
      
    def get_image_of_os(self, os_type):
        try:
            os_object = OSTypeModel.objects.all().filter(os_type=os_type).first()
            if os_object is None:
                return None
            return os_object.image
        except Exception as e:
            logger.exception(e)
            return None
    
    # building status and formal is set to be 0 when creating a hotfix
    def create_hotfix_object_to_database(self, os_type, kernel_version, hotfix_name, patch_file, patch_path, hotfix_necessary, hotfix_risk, 
    log_file, arch):
        res = HotfixModel.objects.create(
            kernel_version = kernel_version,
            os_type=os_type,
            patch_file = patch_file,
            hotfix_name = hotfix_name,
            patch_path = patch_path,
            building_status = 0,
            hotfix_necessary = 0,
            hotfix_risk = 2,
            formal = 0,
            log_file = log_file,
            arch = arch
        )
        return res

    def create_message_to_cec(self, **kwargs):
        customize = kwargs['customize']
        cec_topic = kwargs['cec_topic']
        os_type = kwargs['os_type']
        hotfix_id = kwargs['hotfix_id']
        kernel_version= kwargs['kernel_version']
        patch_file = kwargs['patch_file']
        hotfix_name = kwargs['hotfix_name']
        patch_path = kwargs['patch_path']
        arch = kwargs['arch']
        log_file = kwargs['log_file']
        try:
            if not customize:
                if re.search('anolis', os_type):
                    self.cec.produce_event_to_cec(cec_topic, {
                            "hotfix_id" : hotfix_id,
                            "kernel_version" : kernel_version,
                            "patch_name" : patch_file,
                            "hotfix_name" : hotfix_name,
                            "patch_path" : patch_path,
                            "arch": arch,
                            "log_file" : log_file,
                            "os_type" : os_type,
                            "git_repo": "git@gitee.com:anolis/cloud-kernel.git",
                            "customize": 0
                        })
            else:
                # this is customize kernel
                git_repo = kwargs['git_repo']
                git_branch = kwargs['git_branch']
                devel_link = kwargs['devel_link']
                debuginfo_link = kwargs['debuginfo_link']
                image = kwargs['image']
                self.cec.produce_event_to_cec(cec_topic, {
                    "hotfix_id" : hotfix_id,
                    "kernel_version" : kernel_version,
                    "hotfix_name" : hotfix_name,
                    "patch_name" : patch_file,
                    "patch_path" : patch_path,
                    "arch": arch,
                    "log_file" : log_file,
                    "os_type" : os_type,
                    "customize": 1,
                    "git_repo": git_repo,
                    "git_branch": git_branch,
                    "devel_link": devel_link,
                    "debuginfo_link": debuginfo_link,
                    "image": image
                })
        except Exception as e:
            logger.exception(e)
            print(str(e))
            return -1

    

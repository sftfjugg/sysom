# -*- coding: utf-8 -*- #
"""
Time                2023/1/13 14:14
Author:             zhangque (ydjohn)
Email               ydzhang@linux.alibaba.com
File                builder.py
Description:        This is the main program of hotfix builder
"""
import os
from os import listdir
from loguru import logger
import threading
import requests
import json
import platform
import shutil
import re
import sys
import subprocess
import configparser
from cec_base.consumer import Consumer, dispatch_consumer
from cec_base.admin import dispatch_admin

class ServerConnector():

    def __init__(self, server_ip, username, password):
        self.server_ip = server_ip
        self.username = username
        self.password = password
        self.token = None

    def get_token(self):
        url = self.server_ip + "/api/v1/auth/"
        headers = {"Content-Type":"application/json"}
        cond = {"username":self.username, "password":self.password}
        resp = requests.post(url, data=json.dumps(cond), headers = headers)
        data = resp.json().get('data') ## it is a dict
        token = data.get("token")
        self.token = token
        return token

    def insert_log_to_server(self, hotfix_id, logs):
        url = self.server_ip + "/api/v1/hotfix/insert_building_log/"
        headers = {'Content-Type': "application/json", 'Authorization': self.token}
        cond = {"id":hotfix_id, "log" : logs}
        resp = requests.post(url, data = json.dumps(cond), headers = headers)
        if resp.status_code == 403:
            # signature has expired, reflash the token
            self.get_token()
            headers = {'content-type': "application/json", 'Authorization': self.token}
            resp = requests.post(url, data = json.dumps(cond), headers = headers)
        if resp.status_code != 200:
            logger.error("insert_log_to_server : can not connect to the server correctly..")

    def change_building_status(self, hotfix_id, status):
        url = self.server_ip + "/api/v1/hotfix/update_building_status/"
        headers = {'Content-Type': "application/json", 'Authorization': self.token}
        cond = {"id":hotfix_id, "status" : status}
        resp = requests.post(url, data = json.dumps(cond), headers = headers)
        if resp.status_code == 403:
            # signature has expired, reflash the token
            self.get_token()
            headers = {'Content-Type': "application/json", 'Authorization': self.token}
            resp = requests.post(url, data = json.dumps(cond), headers = headers)
        if resp.status_code != 200:
            logger.error("change_building_status : can not connect to the server correctly..")

    def sync_building_log(self, hotfix_id):
        url = self.server_ip + "/api/v1/hotfix/sync_building_log/"
        headers = {'Content-Type': "application/json", 'Authorization': self.token}
        cond = {"id":hotfix_id}
        resp = requests.post(url, data = json.dumps(cond), headers = headers)
        if resp.status_code == 403:
            # signature has expired, reflash the token
            self.get_token()
            headers = {'Content-Type': "application/json", 'Authorization': self.token}
            resp = requests.post(url, data = json.dumps(cond), headers = headers)
        if resp.status_code != 200:
            logger.error("sync_building_log : can not connect to the server correctly..")
        return resp

    def sync_rpm_name(self, hotfix_id, rpm_name):
        url = self.server_ip + "/api/v1/hotfix/update_hotfix_name/"
        headers = {'Content-Type': "application/json", 'Authorization': self.token}
        cond = {"id":hotfix_id, "rpm":rpm_name}
        resp = requests.post(url, data = json.dumps(cond), headers = headers)
        if resp.status_code == 403:
            # signature has expired, reflash the token
            self.get_token()
            headers = {'Content-Type': "application/json", 'Authorization': self.token}
            resp = requests.post(url, data = json.dumps(cond), headers = headers)
        if resp.status_code != 200:
            logger.error("sync_rpm_name : can not connect to the server correctly..")
        return resp

        
class HotfixBuilder():

    def __init__(self, nfs_dir_home, hotfix_base, cec_url, server_ip, username, password, packages_repo):
        self.nfs_dir_home = nfs_dir_home
        self.hotfix_base = hotfix_base
        self.cec_url = cec_url
        self.builder_hotfix_package_repo = packages_repo
        self.thread_runner = threading.Thread(target=self.build, name="hotfix_builder")
        self.cec_hotfix_topic = "hotfix_job"
        self.local_arch = os.uname().release.split(".")[-1]
        self.connector = ServerConnector(server_ip, username, password)
        self.tmpdir="/hotfix_tmpdir"
        self.src_rpm_tmpdir="/tmp/hotfix_src"
        self.hotfix_id = None
        self.fd = None
        self.token = self.connector.get_token()
        self.prepare_env()

        ##################################################################
        # Logging config
        ##################################################################
        from cec_base.log import LoggerHelper, LoggerLevel
        log_format = "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level}</level> | <cyan>{file.path}</cyan>:<cyan>{line}</cyan> | {message}"
        LoggerHelper.add(sys.stdout, level=LoggerLevel.LOGGER_LEVEL_INFO, format=log_format, colorize=True)
        LoggerHelper.add(sys.stderr, level=LoggerLevel.LOGGER_LEVEL_WARNING, format=log_format, colorize=True)

    def run(self):
        self.thread_runner.start()

    def change_building_status(self, status):
        self.connector.change_building_status(self.hotfix_id, status)

    def die(self, msg):
        self.fd.write("%s \n" % msg)
        self.change_building_status("failed")

    def prepare_env(self):
        # prepare kernel src and kaptch-build
        cmd = "chmod +x check_env.sh && ./check_env.sh -b %s -n %s" % (self.hotfix_base, self.nfs_dir_home)
        with os.popen(cmd) as process:
            output = process.read()

        # get the img_list image information and pull them based on machine's kernel arch
        image_config_file = open(os.path.join(os.getcwd(), "img_list.json"))
        config_data = json.load(image_config_file)
        machine_kernel = platform.uname().release
        arch = machine_kernel.split(".")[-1]
        for each_version in config_data[arch]:
            image = config_data[arch][each_version]
            os.system("docker pull {}".format(image))

        if not os.path.exists(self.hotfix_base):
            os.makedirs(self.hotfix_base)

        if not os.path.exists(self.tmpdir):
            os.makedirs(self.tmpdir)

        # checkout the log directory
        if not os.path.exists(os.path.join(self.nfs_dir_home, "log")):
            os.makedirs(os.path.join(self.nfs_dir_home, "log"))
        
        # checkout the rpm directory
        if not os.path.exists(os.path.join(self.nfs_dir_home, "rpm")):
            os.makedirs(os.path.join(self.nfs_dir_home, "rpm"))

        # directory to storage the devel-package\debuginfo\config\vmlinux
        if not os.path.exists(os.path.join(self.builder_hotfix_package_repo, "devel_pack")):
            os.makedirs(os.path.join(self.builder_hotfix_package_repo, "devel_pack"))

        if not os.path.exists(os.path.join(self.builder_hotfix_package_repo, "debuginfo_pack")):
            os.makedirs(os.path.join(self.builder_hotfix_package_repo, "debuginfo_pack"))
        
        if not os.path.exists(os.path.join(self.builder_hotfix_package_repo, "kernel_config")):
            os.makedirs(os.path.join(self.builder_hotfix_package_repo, "kernel_config"))
        
        if not os.path.exists(os.path.join(self.builder_hotfix_package_repo, "vmlinux")):
            os.makedirs(os.path.join(self.builder_hotfix_package_repo, "vmlinux"))

        if not os.path.exists(os.path.join(self.builder_hotfix_package_repo, "src_pack")):
            os.makedirs(os.path.join(self.builder_hotfix_package_repo, "src_pack"))

        # copy build_hotfix.sh to BASE
        if os.path.exists("./build_hotfix.sh"):
            shutil.copy("./build_hotfix.sh", self.hotfix_base)
        else:
            logger.error("ERROR: cannot find build_hotfix.sh")

        if os.path.exists("./build_rpm.sh"):
            shutil.copy("./build_rpm.sh", self.hotfix_base)
        else:
            logger.error("ERROR: cannot find build_rpm.sh")

    def clear_tmpdir(self):
        os.system("rm -rf {} && mkdir {} ".format(self.tmpdir, self.tmpdir))
        os.system("rm -rf {}/*patch".format(self.hotfix_base))

    def find_build_rpm(self):
        directory = "/hotfix_tmpdir"
        rpms = []
        for root, dirs, files in os.walk(directory):
            for eachfile in files:
                if re.search(".rpm", eachfile):
                    rpms.append(eachfile)
        return rpms

    def check_config(self, kernel_version):
        kernel_config_directory = os.path.join(self.builder_hotfix_package_repo, "kernel_config")
        if not os.path.exists(kernel_config_directory):
            os.makedirs(kernel_config_directory)
            return None
        config_name = "config-" + kernel_version
        if os.path.exists(os.path.join(kernel_config_directory, config_name)):
            return os.path.join(kernel_config_directory, config_name)
        else:
            return None

    def check_vmlinux(self, kernel_version):
        vmlinx_directory = os.path.join(self.builder_hotfix_package_repo, "vmlinux")
        if not os.path.exists(vmlinx_directory):
            os.makedirs(vmlinx_directory)
            return None
        vmlinux_name = "vmlinux-" + kernel_version
        if os.path.exists(os.path.join(vmlinx_directory, vmlinux_name)):
            return os.path.join(vmlinx_directory, vmlinux_name)
        else:
            return None

    def check_devel_package(self, devel_link, kernel_version):
        devel_package_directory = os.path.join(self.builder_hotfix_package_repo, "devel_pack")
        kernel_config_directory = os.path.join(self.builder_hotfix_package_repo, "kernel_config")

        if not os.path.exists(devel_package_directory):
            os.makedirs(devel_package_directory)

        devel_package = devel_link.split("/")[-1]
        if os.path.exists(os.path.join(devel_package_directory, devel_package)):
            # release devel package and storage config file
            os.system("cp {} /tmp/a.rpm".format(os.path.join(devel_package_directory, devel_package)))
            os.system("cd /tmp && rpm2cpio a.rpm | cpio -dim".format(kernel_version))
            os.system("cd /tmp && cp ./usr/src/kernels/{}/.config {}/config-{} && rm -rf ./usr && rm -rf a.rpm".format(kernel_version, kernel_config_directory, kernel_version))
        else:
            # download devel package,copy devel-package and config file to its own directory
            self.fd.write("Downloading devel package from {}...\n".format(devel_link))
            os.system("wget -P {} {}".format(devel_package_directory, devel_link))
            os.system("cp {} /tmp/a.rpm".format(os.path.join(devel_package_directory, devel_package)))
            os.system("cd /tmp && rpm2cpio a.rpm | cpio -dim".format(kernel_version))
            os.system("cd /tmp && cp ./usr/src/kernels/{}/.config {}/config-{} && rm -rf ./usr && rm -rf a.rpm".format(kernel_version, kernel_config_directory, kernel_version))
        config_name = "config-" + kernel_version
        config_name = os.path.join(kernel_config_directory, config_name)
        return config_name

    def check_debuginfo_package(self, debuginfo_link, kernel_version):
        debuginfo_package_directory = os.path.join(self.builder_hotfix_package_repo, "debuginfo_pack")
        vmlinux_directory = os.path.join(self.builder_hotfix_package_repo, "vmlinux")

        if not os.path.exists(debuginfo_package_directory):
            os.makedirs(debuginfo_package_directory)

        debuginfo_package = debuginfo_link.split("/")[-1]
        if os.path.exists(os.path.join(debuginfo_package_directory, debuginfo_package)):
            os.system("cp {} /tmp/b.rpm".format(os.path.join(debuginfo_package_directory, debuginfo_package)))
            os.system("cd /tmp && rpm2cpio b.rpm | cpio -dim".format(kernel_version))
            os.system("cd /tmp && cp ./usr/lib/debug/lib/modules/{}/vmlinux {}/vmlinux-{} && rm -rf ./usr && rm -rf b.rpm".format(kernel_version, vmlinux_directory, kernel_version))
        else:
            # download debuginfo package,copy debuginfo-package and vmlinx to its own directory
            self.fd.write("Downloading debuginfo package from {}...\n".format(debuginfo_link))
            os.system("wget -P {} {}".format(debuginfo_package_directory, debuginfo_link))
            os.system("cp {} /tmp/b.rpm".format(os.path.join(debuginfo_package_directory, debuginfo_package)))
            os.system("cd /tmp && rpm2cpio /tmp/b.rpm | cpio -dim ".format(os.path.join(debuginfo_package_directory, debuginfo_package), kernel_version))
            os.system("cd /tmp && cp ./usr/lib/debug/lib/modules/{}/vmlinux {}/vmlinux-{} && rm -rf ./usr && rm -rf b.rpm".format(kernel_version, vmlinux_directory, kernel_version))
        vmlinux_name = "vmlinux-" + kernel_version
        vmlinux_name = os.path.join(vmlinux_directory, vmlinux_name)
        return vmlinux_name

    def check_kernel_source(self, src_repo, source_code_repo, kernel_version, is_src_package):
        if not is_src_package:
            if not os.path.exists(os.path.join(self.hotfix_base, "kernel_repos", source_code_repo)):
                os.system("cd {} && git clone {}".format(os.path.join(self.hotfix_base, "kernel_repos"), src_repo)) # if the kernel source is not exist, clone the repo
            else:
                os.system("cd {} && git fetch && git pull".format(os.path.join(self.hotfix_base, "kernel_repos", source_code_repo))) # source_code_repo: cloud-kernel
        else:
            # use src package , source_code_repo is download link, download src.rpm
            src_name = source_code_repo.split("/")[-1]
            if not os.path.exists(os.path.join(self.builder_hotfix_package_repo, "src_pack", src_name)):
                os.system("cd {} && wget {} -O {}.src.rpm".format(os.path.join(self.builder_hotfix_package_repo, "src_pack"), source_code_repo, kernel_version))

    def get_building_image(self, kernel_version):
        arch = kernel_version.split(".")[-1]
        image_list_file = open('./img_list.json')
        images = json.load(image_list_file)
        return images[arch]['anolis']

    def extract_description_from_patch(self, local_patch):
        logger.info("+++++++ %s" % local_patch)
        return "hello world"

    """
    when using .src.rpm, input kernel_version, before this function, the src.rpm should be downloaded
    and stored in the src_pack repo
    this function is to convert rpm to source rpm into direcotry link git repo
    """
    def get_source_code_from_rpm(self, kernel_version):
        src_rpm_name = kernel_version + ".src.rpm"
        src_pack_dir = os.path.join(self.builder_hotfix_package_repo, "src_pack")
        if not os.path.exists(os.path.join(src_pack_dir, src_rpm_name)):
            return None
        os.system("rm -rf {} && mkdir {} ".format(self.src_rpm_tmpdir, self.src_rpm_tmpdir, self.src_rpm_tmpdir))
        shutil.copy(os.path.join(src_pack_dir, src_rpm_name), self.src_rpm_tmpdir)
        os.system("pushd {} && rpm2cpio {} | cpio -dmi".format(self.src_rpm_tmpdir, src_rpm_name))
        # walk the directory, find out the linux-{}.tar.xz file, release it, and the source code name is linux-{}
        src = None
        for each_file in listdir(self.src_rpm_tmpdir):
            if re.search(".tar.xz", each_file):
                src = each_file
                break
        if src is None:
            return None
        os.system("pushd {} && tar -xvf {}".format(self.src_rpm_tmpdir, src))
        src = src.replace(".tar.xz", "")
        # remove the source directory to hotfix tmpdir
        os.system("cp -a {} {}".format(os.path.join(self.src_rpm_tmpdir, src), self.tmpdir))
        return os.path.join(self.tmpdir, src)

    """
    build the supported kernel like : anolis
    """
    def build_supported_kernel(self, parameters):
        # get the hotfix building parametes 
        hotfix_id = parameters['hotfix_id']
        kernel_version = parameters['kernel_version']
        hotfix_name = parameters['hotfix_name']
        # find the patch_path in builder local
        patch_path = parameters['patch_path'].split("/")[-1]
        patch_path = os.path.join(self.nfs_dir_home, "patch", patch_path)
        log_file = parameters['log_file']
        git_repo = parameters['git_repo']
        is_src_package = False
        source_code_repo = git_repo.split("/")[-1].rstrip(".git") # findout the kernel repo name
        log = ""
        output = ""
        log_file_path = os.path.join(self.nfs_dir_home, "log", log_file)
        self.fd = open(log_file_path, "a")

        self.fd.write("=========================================================\n")
        self.fd.write("Created Hotfix Building Task ... \n")
        self.fd.write("Kernel Version: %s\n" % kernel_version)
        self.fd.write("Patch file: %s\n" % patch_path)
        self.fd.write("Hotfix name : %s\n" % hotfix_name)
        self.fd.write("=========================================================\n")

        self.connector.change_building_status(hotfix_id, "building")

        self.check_kernel_source(git_repo, source_code_repo, kernel_version, is_src_package)

        image = self.get_building_image(kernel_version)
        if image is None:
            raise Exception("No specify building image ... ")
            return None
        else:
            self.fd.write("Using Building Image : %s \n" % image)

        # move the patch to base
        try:
            local_patch = os.path.join(self.hotfix_base, parameters['patch_path'].split("/")[-1])
            logger.info("the local patch is : %s " % local_patch)
            shutil.copy(patch_path, local_patch)
        except Exception as e:
            self.fd.write(str(e))
            logger.error(str(e))
            # self.connector.change_building_status(hotfix_id, "failed")

        description = self.extract_description_from_patch(local_patch)
        # run the build hotfix script
        cmd = "docker run --rm -v {}:{} -v {}:{} -v {}:{} -v {}:{} --net=host {} sh {}/build_hotfix.sh -p {} -k {} -d {} -b {} -n {} -g {} -r {} -t NULL ".format(
            self.hotfix_base, self.hotfix_base, self.nfs_dir_home, self.nfs_dir_home, self.builder_hotfix_package_repo, self.builder_hotfix_package_repo, self.tmpdir, self.tmpdir, image,
            self.hotfix_base, local_patch, kernel_version, description, self.hotfix_base, hotfix_name, log_file_path, source_code_repo
        )
        self.fd.write(cmd+"\n")
        self.fd.close()
        logger.info(cmd)
        
        cmd += " 2>&1 >> %s" % log_file_path

        p=subprocess.Popen(cmd, shell=True)
        return_code=p.wait()
        logger.info("The return code is %d" % return_code)

        rpm_names = self.find_build_rpm()

        # when finished building, sync the build log
        #self.connector.sync_building_log(hotfix_id)

        # if rpm is more than one, upload it one by one
        for each_rpm in rpm_names:
            resp = self.connector.sync_rpm_name(hotfix_id, each_rpm)
            if resp.status_code != 200:
                self.connector.insert_log_to_server(hotfix_id, "cannot sync rpm package name %s" % each_rpm)

        # check the last output
        if return_code == 0:
            self.connector.change_building_status(hotfix_id, "success")
        else:
            os.system("echo \"BUILD FAILED\" >> %s" % log_file_path)
            self.connector.change_building_status(hotfix_id, "failed")

    """
    build the customize kernel from user defined
    """
    def build_customize_kernel(self, parameters):
        # get the hotfix building parameters
        hotfix_id = parameters['hotfix_id']
        kernel_version = parameters['kernel_version']
        hotfix_name = parameters['hotfix_name']
        devel_link = parameters['devel_link']
        debuginfo_link = parameters['debuginfo_link']
        src_repo = parameters['src_repo']    # if git, git_repo; if src, src download repo
        src_origin = parameters['src_origin']# if git, git tag/branch; if src, src download link
        # find the patch_path in builder local
        patch_path = parameters['patch_path'].split("/")[-1]
        patch_path = os.path.join(self.nfs_dir_home, "patch", patch_path)
        log_file = parameters['log_file']
        image = parameters['image']
        is_src_package = parameters['is_src_package']

        log = ""
        output = ""
        log_file_path = os.path.join(self.nfs_dir_home, "log", log_file)
        self.fd = open(log_file_path, "a")

        self.connector.change_building_status(hotfix_id, "building")

        self.fd.write("=========================================================\n")
        self.fd.write("Created Hotfix Building Task ... \n")
        self.fd.write("Kernel Version: %s\n" % kernel_version)
        self.fd.write("Patch file: %s\n" % patch_path)
        self.fd.write("Hotfix name : %s\n" % hotfix_name)
        self.fd.write("Using Building Image : %s \n" % image)
        self.fd.write("=========================================================\n")
        
        if not is_src_package:
            self.fd.write("Using the source repo...\n")
            source_code_repo = src_repo.split("/")[-1].rstrip(".git") # findout the kernel repo name: cloud-kernel
        else:
            self.fd.write("Using the src.rpm...\n")
            source_code_repo = src_origin # if use .src.rpm, source code is in src_pack directory, not a directory
            src_rpm_name = src_origin.split("/")[-1]  # Here, src_origin is the link to src.rpm

        if len(image) == 0:
            image = self.get_building_image(kernel_version)
        if image is None:
            raise Exception("No specify building image ... ")
            return None
        else:
            self.fd.write("Using Building Image : %s \n" % image)

        self.fd.write("Checking the source code...\n")
        self.check_kernel_source(src_repo, source_code_repo, kernel_version, is_src_package)

        if is_src_package:
            source_code_path = self.get_source_code_from_rpm(kernel_version)
            if source_code_path is None:
                logger.error("Get Source Code from Rpm Failed...")
                self.die("Get Source Code from Rpm Failed...\n")
                raise Exception('Get Source Code from .src.rpm failed...')
                return None

        self.fd.write("Checking the devel package for config file...\n")
        kernel_config = self.check_config(kernel_version)
        if kernel_config is None:
            self.fd.write("kernel_config is not found...Now check the buffer of kernel-devel...\n")
            kernel_config = self.check_devel_package(devel_link, kernel_version)
            if not os.path.exists(kernel_config):
                self.die("Get the kernel config file failed...\n")
                return None
            else:
                self.fd.write("Succeed in getting the kernel config from kernel-devel package...\n")

        self.fd.write("Checking the vmlinux...\n")
        vmlinux = self.check_vmlinux(kernel_version)
        if vmlinux is None:
            self.fd.write("vmlinux not found...Now checking the buffer of kernel-debuginfo...\n")
            vmlinux = self.check_debuginfo_package(debuginfo_link, kernel_version)
            if not os.path.exists(vmlinux):
                self.die("Get the kernel vmlinux failed...\n")
                return None
            else:
                self.fd.write("Succeed in getting vmlinux from debuginfo...\n")


        # move the patch to base
        try:
            local_patch = os.path.join(self.hotfix_base, parameters['patch_path'].split("/")[-1])
            shutil.copy(patch_path, local_patch)
        except Exception as e:
            self.die("Error when copying the source patch, may be this patch is not exist?")
            return None

        description = self.extract_description_from_patch(local_patch)
        
        # run the build hotfix script
        if is_src_package:
            cmd = "docker run --rm -v {}:{} -v {}:{} -v {}:{} -v {}:{} --net=host {} sh {}/build_hotfix.sh -p {} -k {} -d {} -b {} -n {} -g {} -c {} -v {} -r {} 2>&1 1 >> {} ".format(
                self.hotfix_base, self.hotfix_base, self.nfs_dir_home, self.nfs_dir_home, self.builder_hotfix_package_repo, self.builder_hotfix_package_repo, self.tmpdir, self.tmpdir, image,
                self.hotfix_base, local_patch, kernel_version, description, self.hotfix_base, hotfix_name, log_file_path, kernel_config, vmlinux, source_code_path, log_file_path
            )
        else:
            cmd = "docker run --rm -v {}:{} -v {}:{} -v {}:{} -v {}:{} --net=host {} sh {}/build_hotfix.sh -p {} -k {} -d {} -b {} -n {} -g {} -c {} -v {} -r {} -t {} 2>&1 1 >> {}".format(
                self.hotfix_base, self.hotfix_base, self.nfs_dir_home, self.nfs_dir_home, self.builder_hotfix_package_repo, self.builder_hotfix_package_repo, self.tmpdir, self.tmpdir, image,
                self.hotfix_base, local_patch, kernel_version, description, self.hotfix_base, hotfix_name, log_file_path, kernel_config, vmlinux, source_code_repo, git_branch, log_file_path
            )
        
        self.fd.write(cmd + "\n")
        self.fd.close()
        logger.info(cmd)

        p=subprocess.Popen(cmd, shell=True)
        return_code=p.wait()
        logger.info("The return code is %d" % return_code)

        rpm_names = self.find_build_rpm()

        # when finished building, sync the build log
        #self.connector.sync_building_log(hotfix_id)

        # if rpm is more than one, upload it one by one
        for each_rpm in rpm_names:
            resp = self.connector.sync_rpm_name(hotfix_id, each_rpm)
            if resp.status_code != 200:
                self.connector.insert_log_to_server(hotfix_id, "cannot sync rpm package name %s" % each_rpm)

        # check the last output
        if return_code == 0:
            self.connector.change_building_status(hotfix_id, "success")
        else:
            os.system("echo \"BUILD FAILED\" >> %s" % log_file_path)
            self.connector.change_building_status(hotfix_id, "failed")

    '''
    Each event is an object, the parameter is inside event.value
    event.value is a dictionary.

    For supported kernel, we use gitee for source code management.
    However, for customize kernel, user may have different ways for their 
    source code management. Therefore, we support git/.src.rpm for kernel source

    '''
    def build(self):
        with dispatch_admin(self.cec_url) as admin:
            if not admin.is_topic_exist(self.cec_hotfix_topic):
                admin.create_topic(self.cec_hotfix_topic)
        consumer_id = Consumer.generate_consumer_id()
        if self.local_arch == "x86_64":
            consumer = dispatch_consumer(self.cec_url, self.cec_hotfix_topic,
                                    consumer_id=consumer_id,
                                    group_id="hotfix_job_group_x86")
        else:
            consumer = dispatch_consumer(self.cec_url, self.cec_hotfix_topic,
                                    consumer_id=consumer_id,
                                    group_id="hotfix_job_group_arm")

        for event in consumer:
            try:
                parameters = event.value
                log_file = parameters['log_file']
                self.hotfix_id = parameters['hotfix_id']
                log_file_path = os.path.join(self.nfs_dir_home, "log", log_file)

                if parameters['arch'] == self.local_arch:
                    # this operation aims to clear the previous log if rebuild
                    with open(log_file_path, "w") as f:
                        f.write("=========================================================\n")
                        f.write("==========*******Sysom Hotfix Building System*******==============\n")
                        f.write("=========================================================\n")

                    self.connector.change_building_status(self.hotfix_id, "building")

                    # for each run, update the repo
                    cmd = "chmod +x check_env.sh && ./check_env.sh -b %s -n %s -l %s " % (self.hotfix_base, self.nfs_dir_home, log_file_path)
                    with os.popen(cmd) as process:
                        output = process.read()

                    customize = parameters['customize']
                    # before build one job, clear the tmpdir
                    self.clear_tmpdir()
                    if not customize:
                        self.build_supported_kernel(parameters)
                    else:
                        self.build_customize_kernel(parameters)
                    logger.info(log_file)
                    self.fd.close()
            except Exception as e:
                logger.error(str(e))
                self.connector.change_building_status(self.hotfix_id, "failed")
            finally:
                if self.fd is not None:
                    self.fd.close()
                consumer.ack(event)

        
if __name__ == "__main__":
    config_file = "builder.ini"
    
    con = configparser.ConfigParser()
    con.read(config_file, encoding='utf-8')

    # cec
    cec = dict(con.items('cec'))
    cec_url = cec['cec_url']
    
    # server config
    sysom_server = dict(con.items('sysom_server'))
    server_ip = sysom_server['server_ip']
    server_login_account = sysom_server['account']
    server_login_password = sysom_server['password']

    # builder config
    builder = dict(con.items('builder'))
    hotfix_base = builder['hotfix_base']
    nfs_dir_home = builder['nfs_dir_home']
    builder_hotfix_package_repo = builder['package_repo']

        
    # if this builder run in local, we should use the local repo directory instead of the nfs directory
    if re.search("127.0.0.1", server_ip):
        nfs_dir_home="/usr/local/sysom/server/builder/hotfix"
    
    hotfix_builder = HotfixBuilder(nfs_dir_home, hotfix_base, cec_url, server_ip, server_login_account, server_login_password, builder_hotfix_package_repo)
    hotfix_builder.run()
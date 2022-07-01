# -*- coding: utf-8 -*-
# @Author: lichen/zhilan

import os
import sys
import time
import subprocess
import re 
import sqlite3
import json
import traceback
import importlib
import argparse
import requests
import vmcore_const
import time
from datetime import datetime
import threading
import queue
queue = queue.Queue()

if sys.version[0] == '2':
    reload(sys)
    sys.setdefaultencoding('utf8')

# crashkey_type={
# 0:func_name
# 1:calltrace
# 2:crashkey
# 3:bugon_file
#}
nfs_root = '/usr/vmcore-nfs'
root_url = 'http://127.0.0.1:7001'
ltime_pattern = re.compile(r'^\[\s*([0-9]+)\..*\]')
rip_pattern = re.compile(r'\[\s*\S+\] RIP: 0010:.*\[<([0-9a-f]+)>\] (.+)')
rip_pattern_1 = re.compile(r'\[\s*\S+\] RIP: 0010:(\S+)')
rip_pattern_2 = re.compile(r'\[\s*\S+\] RIP .*\[<([0-9a-f]+)>\] (.+)')
ripmod_pattern = re.compile(r'\[\s*\S+\] RIP.* \[(\S+)\]$')
bugat_pattern = re.compile(r'.+\] kernel BUG at (\S+)!')
ver_pattern = re.compile(r'Comm: (\S*).*(Tainted:|Not tainted).* (\S+) #')
unload_pattern = re.compile(r'\[last unloaded: (\S+)\]')
title_pattern = re.compile(r'\[\s*\S+\] ((BUG:|Kernel panic|Bad pagetable:|divide error:|kernel BUG at|general protection fault:) .+)')
vertype_pattern = re.compile(r'(\d+)\.(\d+)\.')
last_strhost = ''

ignore_funcs = ["schedule","schedule_timeout","ret_from_fork","kthread",
        "do_syscall_64","entry_SYSCALL_64_after_swapgs","system_call_fastpath","fastpath",
        "entry_SYSCALL_64_after_hwframe",
        "page_fault","do_page_fault","_do_page_fault","worker_thread",
        "start_secondary","cpu_startup_entry","arch_cpu_idle","default_idle",
        "do_IRQ","common_interrupt","irq_exit","do_softirq",
        "__schedule","io_schedule_timeout","io_schedule","dump_stack",
        "exit_to_usermode_loop","stub_clone","schedule_preempt_disabled","oom_kill_process",
        "unwind_backtrace","dump_header","show_stack","dump_backtrace","panic","watchdog_timer_fn",
        "nmi_panic","watchdog_overflow_callback","__perf_event_overflow","perf_event_overflow","intel_pmu_handle_irq",
        "perf_event_nmi_handler","nmi_handle","do_nmi","end_repeat_nmi","watchdog",
        "__hrtimer_run_queues","hrtimer_interrupt","local_apic_timer_interrupt","smp_apic_timer_interrupt","apic_timer_interrupt",
		"__pv_queued_spin_lock_slowpath","queued_spin_lock_slowpath"
]

def get_column_value(column, line):
    match = rip_pattern.match(line)
    if match is None:
        match = rip_pattern_2.match(line)

    if column['func_name']=='NA' and match:
        column['rip']=match.group(1)
        column['func_name']=match.group(2).split('+')[0]
        column['func_name']=column['func_name'].split('.')[0]
        ripmod_match = ripmod_pattern.match(line.strip())
        if ripmod_match:
            column['ripmod']=ripmod_match.group(1)
    match = rip_pattern_1.match(line)
    if column['func_name']=='NA' and column.get('func_name_1','') =='NA' and match:
        column['func_name_1']=match.group(1).split('+')[0]
        column['func_name_1']=column['func_name_1'].split('.')[0]
        
    match = bugat_pattern.match(line)
    if match:
        column['bugat'] = match.group(1)
    idx = line.find('Comm:')
    if idx > 0:
        match = ver_pattern.match(line, idx)
        if match:
            column['comm'] = match.group(1)
            column['ver'] = match.group(3)
    idx = line.find('[last unloaded:')
    if idx > 0:
        match = unload_pattern.match(line, idx)
        if match:
            column['unload'] = match.group(1)
    match = title_pattern.match(line)
    if match and column['title'] == 'NA':
        column['title'] = match.group(1)
        if column['func_name'] != 'NA':
            column['tmp_func_name'] = column['func_name']
            column['tmp_rip'] = column['rip']
            column['tmp_ripmod'] = column['ripmod']
            column['func_name'] = ''
            column['rip'] = ''
            column['ripmod'] = ''

def get_stamp(line):
    match = ltime_pattern.match(line)
    if match:
        return int(match.group(1))
    return 0

def get_last_time(f):
    ret = 10
    try:
        f.seek(-512, os.SEEK_END)
    except:
        pass
    for line in f.readlines():
        ret = get_stamp(line)
        if ret > 0:
            break
    f.seek(0, os.SEEK_SET)
    return ret-10

def fix_func_name(column):
    if column['dmesg'].find('SysRq : Trigger a crash') > 0:
        column['func_name'] = 'sysrq_handle_crash'
        column['title'] = 'sysrq: SysRq : Trigger a crash'
        column['status'] = vmcore_const.STATUS_SYSRQ
        column['crashkey_type'] = 2
        column['crashkey'] = 'sysrq_handle_crash'
    if column['dmesg'].find('Kernel panic - not syncing: Fatal machine check') > 0:
        column['func_name'] = 'fatal_machine_check'
        column['title'] = 'Kernel panic - not syncing: Fatal machine check'
        column['status'] = vmcore_const.STATUS_HWERROR
        column['crashkey_type'] = 2
        column['crashkey'] = 'fatal_machine_check'
        column['panic_class'] = 'HardwareError'
    if column['dmesg'].find('Kernel panic - not syncing: Fatal hardware error') > 0:
        column['func_name'] = 'fatal_hardware_error'
        column['title'] = 'Kernel panic - not syncing: Fatal machine check'
        column['status'] = vmcore_const.STATUS_HWERROR
        column['crashkey_type'] = 2
        column['crashkey'] = 'fatal_hardware_error'
        column['panic_class'] = 'HardwareError'
    if column['dmesg'].find('Fatal local machine check') > 0:
        column['func_name'] = 'fatal_machine_check'
        column['title'] = 'Kernel panic - not syncing: Fatal local machine check'
        column['status'] = vmcore_const.STATUS_HWERROR
        column['crashkey_type'] = 2
        column['crashkey'] = 'fatal_machine_check'
        column['panic_class'] = 'HardwareError'
    if 'bugat' in column:
        column['bugon_file'] = column['bugat'].split(':')[0]
        column['crashkey_type'] = 3


def parse_rawdmesg(column):
    dmesgs = column['rawdmesg'].splitlines()
    column['rawdmesg'] = ''
    result = ''
    for line in dmesgs:
        if line.find('Modules linked in') >= 0:
            column['modules'] = line[line.find(':')+1:]
        result += line+'\n'
        get_column_value(column, line)
    column['dmesg'] = result
    fix_func_name(column)

def parse_file(name, column):
    f = open(name, 'r')
    result = ''
    for line in f.readlines():
        if line.find('Modules linked in') >= 0:
            column['modules'] = line[line.find(':')+1:]
        if len(column['modules']) >= 512:
            column['modules'] = column['modules'][:-512]
        result += line
        get_column_value(column, line)
    f.close()
    column['dmesg'] = result
    column['dmesg_file'] = name
    if 'tmp_func_name' in column and column['func_name'] == 'NA' and column['tmp_func_name'] != 'NA':
        column['func_name'] = column['tmp_func_name']
        column['rip'] = column['tmp_rip']
        column['ripmod'] = column['ripmod']
    fix_func_name(column)
    if column['ripmod'] != 'NA':
        if column['ripmod'] not in vmcore_const.BASEMODS:
            column['panic_class'] = 'Module(%s)'%(column['ripmod'])

line_pattern = re.compile(r'.+[0-9]+\].+\[.*\][? ]* (\S+)\+0x(\S+)/0x(\S+)')
line_pattern_1 = re.compile(r'.+[0-9]+\][? ]*(\S+)\+0x(\S+)/0x(\S+)')
def get_calltrace(column):
    meettitle = 0
    list1 = []
    lines = column['dmesg'].split('\n')
    modname = []
    tmplist = []
    workqueue = ''
    nocalltrace = True
    hung_flag = False
    if column['title'].find('unrecovered softlockup') >= 0:
        hung_flag = True

    invalidrip = False
    if (column['rip'] == 'NA'and  column['func_name'] == 'NA') or column['func_name'].startswith('0x'):
        invalidrip = True

    badrip = False
    if column['dmesg'].find('Code:  Bad RIP value.') >= 0:
        badrip = True

    question_continue = True
    question_count = 0

    for r in lines:
        if r.find(column['title']) >= 0:
            nocalltrace = True
            meettitle = 1
            tmplist.extend(list1)
            del list1[:]
            question_count = 0
            question_continue = True
            continue

        if r.find('Workqueue: events ') >= 0:
            idx = r.find('Workqueue: events ')
            workqueue = r[idx+18:]

        if r.find('EFLAGS: ') >= 0:
            idx = r.find('EFLAGS: ')
            eflags = r[idx+8:]
            #print 'eflags',eflags
            try:
                eflags = int(eflags,16)
                if (eflags >> 9) % 2 == 0:
                    badrip = True
            except:
                pass
        if r.find("<<EOE>>") >= 0:
            if column['func_name'] == 'NA':
                tmpline = lines[lines.index(r)-1]
                m = line_pattern.match(tmpline)
                if m:
                    column['func_name'] = m.group(1)
                else:
                    m = line_pattern_1.match(tmpline)
                    if m:
                        column['func_name'] = m.group(1)

        if r.find('<IRQ>') >= 0:
            badrip = True

        if hung_flag and r.find('<EOI>') >= 0:
            try:
                if r.find('> ') >= 0 and r.find(' <') >= 0:
                    idx = r.find(' <')
                    idx2 = r.rfind('> ',0)
                    r = r[0:idx] + r[idx2+1:]
            except:
                import traceback
                traceback.print_exc()
            del list1[:]
            question_count = 0
            question_continue = True

        if r.find("Call Trace:") > 0 or r.find("<<EOE>>") > 0 or r.find("<EOE>") > 0 or r.find("<IRQ>") >= 0:
            try:
                if r.find('> ') >= 0 and r.find(' <') >= 0:
                    idx = r.find(' <')
                    idx2 = r.rfind('> ',0)
                    r = r[0:idx] + r[idx2+1:]
            except:
                import traceback
                traceback.print_exc()
            del list1[:]
            question_count = 0
            question_continue = True
            modname = []

        if r.find('?') >= 0:
            if workqueue != '' and r.find(workqueue) >= 0:
                list1.append(workqueue)
            #print r
            #print invalidrip,badrip,question_continue
            if invalidrip and badrip and question_continue:
                 m2 = line_pattern.match(r)
                 if m2:
                     #print m2.group(1),m2.group(2),m2.group(3)
                     if m2.group(1).split('.')[0] == column['func_name']  or m2.group(1) in ignore_funcs:
                         continue
                     nocalltrace = False
                     if m2.group(2) != m2.group(3):
                         tmp = m2.group(1)
                         tmp = tmp.split('.')[0]
                         list1.append(tmp)
                         #print 'append: ',m2.group(1)
                         #print list1
                         question_count += 1
                 else:
                     m2 = line_pattern_1.match(r)
                     if m2:
                         #print m2.group(1),m2.group(2),m2.group(3)
                         if m2.group(1).split('.')[0] == column['func_name'] or m2.group(1) in ignore_funcs:
                             continue
                         nocalltrace = False
                         if m2.group(2) != m2.group(3):
                             tmp = m2.group(1)
                             tmp = tmp.split('.')[0]
                             list1.append(tmp)
                             #print 'append: ',m2.group(1)
                             #print list1
                             question_count += 1
            continue
        if question_count > 0:
            question_continue = False

        m = line_pattern.match(r)
        if m:
            nocalltrace = False
            if m.group(1).split('.')[0] == column['func_name'] or m.group(1) in ignore_funcs:
                continue
            if m.group(1) == 'panic':
                del list1[:]
                question_count = 0
                question_continue = True
                modname = []
                continue
            if len(list1) == 0 and m.group(1) in ignore_funcs:
                continue
            if len(modname) < 2:
                modname.append(r.strip())
            tmp = m.group(1)
            tmp = tmp.split('.')[0]
            list1.append(tmp)
            #print 'append: ',m.group(1)
            #print list1
        else:
            m = line_pattern_1.match(r)
            if m:
                nocalltrace = False
                if m.group(1).split('.')[0] == column['func_name'] or m.group(1) in ignore_funcs:
                    continue
                if m.group(1) == 'panic':
                    del list1[:]
                    question_count = 0
                    question_continue = True
                    modname = []
                    continue
                if len(list1) == 0 and m.group(1) in ignore_funcs:
                    continue
                if len(modname) < 2:
                    modname.append(r.strip())
                tmp = m.group(1)
                tmp = tmp.split('.')[0]
                list1.append(tmp)
                #print 'append: ',m.group(1)
                #print list1
            else:
                if len(list1) > 0 and meettitle == 1:
                    break
    if len(list1) == 0 and nocalltrace:
        list1 = tmplist

    if column['func_name'] == 'NA' and len(list1) > 0:
        column['func_name'] = list1[0]
        del list1[0]

    column['calltrace_list'] = []
    column['calltrace_list'].extend(list1)

    calltrace = column['func_name']
    if calltrace != '':
        calltrace = calltrace.split('+')[0]
    if len(list1) > 2:
        list1 = list1[0:2]
    for i in list1:
        calltrace = ''.join([calltrace,'$',i])
    column['calltrace'] = calltrace


def clarify_panic_type(column):
    column['panic_type'] = 0
    if column['title'].find('divide error') >= 0:
        column['panic_type'] = vmcore_const.PANIC_DIVIDEERROR
    elif column['bugon_file'] != 'NA':
        column['panic_type'] = vmcore_const.PANIC_BUGON
    elif column['title'].find('NULL pointer dereference') >= 0:
        column['panic_type'] = vmcore_const.PANIC_NULLPOINTER
    elif column['title'].find('Kernel stack is corrupted') >= 0:
        column['panic_type'] = vmcore_const.PANIC_STACKCORRUPTION
    elif column['title'].find('hard LOCKUP') >= 0:
        column['panic_type'] = vmcore_const.PANIC_HARDLOCKUP
    elif column['title'].find('hung_task') >= 0:
        column['panic_type'] = vmcore_const.PANIC_HUNGTASK
    elif column['title'].find('RCU Stall') >= 0:
        column['panic_type'] = vmcore_const.PANIC_RCUSTALL
    elif (column['title'].find('soft lockup') >= 0 or column['title'].find('softlockup') >= 0):
        column['panic_type'] = vmcore_const.PANIC_SOFTLOCKUP

def check_panic(column):
    if 'rawdmesg' not in column and os.path.isfile(column['dmesg_file']) == False:
        return False

    matched = False
    if 'rawdmesg' in column:
        parse_rawdmesg(column)
    else:
        parse_file(column['dmesg_file'], column)

    m = vertype_pattern.match(column['ver'])
    if m:
        column['vertype'] = int(m.group(1)) * 100 + int(m.group(2))

    get_calltrace(column)
    if column['calltrace'] == 'NA':
        column['crashkey_type'] = 0
    if column['crashkey_type'] == 0 and column['func_name'] != 'NA':
        column['crashkey'] = '%d$%s'%(column['vertype'],column['func_name'])
    elif column['crashkey_type'] == 1 and column['calltrace'] != 'NA':
        column['crashkey'] = '%d$%s'%(column['vertype'],column['calltrace'])
    elif column['crashkey_type'] == 2 and column['crashkey'] != 'NA':
        column['crashkey'] = '%d$%s'%(column['vertype'],column['crashkey'])
    elif column['crashkey_type'] == 3 and column['bugon_file'] != 'NA':
        column['crashkey'] = '%d$%s$%s'%(column['vertype'],column['bugon_file'],column['calltrace'])

    clarify_panic_type(column)
    #return False
    
    ip={'ip':column['ip']}
    host_url = root_url+"/api/v1/host/"
    res = requests.get(host_url,params=ip)
    if res.status_code != 200 or res.text == '[]':
        print("查询主机名失败")
        return False

    column['hostname'] = res.json()['data'][0]['hostname']
    vmcore_url = root_url+"/api/v1/vmcore/"
    data = json.dumps(column)
    headers = {'content-type': 'application/json'}
    res = requests.post(url=vmcore_url, data=data, headers=headers)
    print(res.json())
    if res.status_code == 200:
        print(f"add {column['name']} to db")
    else:
        print("插入失败")
        return False

    idx = 0
    for line in column['calltrace_list']:
        calltrace_info = {'name':column['name'], 'line':line, 'idx':idx}
        calltrace_url = root_url+"/api/v1/vmcore/"
        data = json.dumps(calltrace_info)
        headers = {'content-type': 'application/json'}
        res = requests.post(url=calltrace_url, data=data, headers=headers)
        if res.status_code != 200:
            print(f"{column['name']} 插入calltrace line失败")
            return False
        idx += 1
    print(f"add {column['name']} calltrace line to db")
    return True
def do_cmd(cmd):
    output = os.popen(cmd)
    ret = output.read().strip()
    output.close()
    return ret

def init_column(column):
    column['upload_time'] = int(time.time())
    column['vmcore_file'] = 'NA'
    column['dmesg_file'] = 'NA'
    column['rip'] = 'NA'
    column['ripmod'] = 'NA'
    column['comm'] = 'NA'
    column['ver'] = 'NA'
    column['vertype'] = 0
    column['func_name'] = 'NA'
    column['title'] = 'NA'
    column['status'] = 0
    column['calltrace'] = 'NA'
    column['bugon_file'] = 'NA'
    column['crashkey_type'] = 1
    column['crashkey'] = 'NA'
    column['modules'] = 'NA'
    column['panic_type'] = 0
    column['panic_class'] = 'BaseKernel'
    column['issue_id'] = 0

def parse_new_crash(crash_dir):
    try:
        column = {}
        column['name'] = crash_dir.split('/')[-1]
        core_time = column['name'].split('_')[0]
        core_time = datetime.strptime(core_time, "%Y%m%d%H%M%S")
        column['core_time'] = core_time.strftime("%Y-%m-%d %H:%M:%S")
        column['ip'] = column['name'].split('_')[1]
        column['hostname'] = column['name'].split('_')[1]
        init_column(column)
        column['dmesg_file'] = '%s/vmcore-dmesg.txt' % crash_dir
        column['vmcore_file'] = '%s/vmcore' % crash_dir
        ret = check_panic(column)
        if ret:
            with open('%s/.upload'%crash_dir,'w'):
                pass
    except:
        import traceback
        traceback.print_exc()

def main():
    global nfs_root
    if len(sys.argv) > 1:
        nfs_root = sys.argv[1]
    dirs_list = []
    #while True:
    files = os.listdir(nfs_root)
    files_path = [f'{nfs_root}/{file}' for file in files]
    for file in files_path:
        if os.path.isfile(file):
            continue
        dirs_list.append(file)
    dirs_list.sort(key=lambda fp: os.path.getmtime(fp),reverse=True)
    for dir in dirs_list:
        tmp = '%s/.upload' % dir
        if os.path.exists(tmp):
            break
        parse_new_crash(dir)
        #time.sleep(20)


if __name__ == "__main__":
    main()

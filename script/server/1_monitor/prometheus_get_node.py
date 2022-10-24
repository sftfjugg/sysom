#!/usr/bin/python3
import requests
import json
import sys
import os
import hashlib
import shutil

tfile=os.path.dirname(os.path.realpath(__file__))+"/node/node.json"
#print(tfile)

ofile="/tmp/sysom_node.json"
port = sys.argv[1]
host_api="http://localhost" + ":" + port + "/api/v1/host"

hostlist = requests.get(host_api)
res = hostlist.content

#print(res)
hosts = json.loads(res)

host_len = len(hosts["data"])
iplist=[]
fo = open(ofile,"w")
for i in range(0,host_len):
  iplist.append(hosts["data"][i]["ip"]+":9100")

target={"targets":iplist}
res="["+json.dumps(target)+"]"
#print(res)
fo.write(res)
fo.close()

if os.path.exists(tfile):
  with open(ofile, 'rb') as fp:
    data = fp.read()
    fp.close()

  amd5= hashlib.md5(data).hexdigest()

  with open(tfile, 'rb') as fp2:
    data2 = fp2.read()
    fp2.close()

  bmd5= hashlib.md5(data2).hexdigest()
  if amd5 != bmd5:
    shutil.move(ofile,tfile)
else:
  shutil.move(ofile,tfile)

#!/usr/bin/python3
import requests
import json
import sys

if len(sys.argv) < 2:
    fname="monitor/prometheus/node/node.json"
else:
    fname=sys.argv[1]+"/monitor/prometheus/node/node.json"

host_api="http://localhost/api/v1/host"

hostlist = requests.get(host_api)
res = hostlist.content

print(res)
hosts = json.loads(res)

host_len = len(hosts["data"])
iplist=[]
fo = open(fname,"w")
for i in range(0,host_len):
  iplist.append(hosts["data"][i]["ip"]+":9100")

target={"targets":iplist}
res="["+json.dumps(target)+"]"
print(res)
fo.write(res)
fo.close()

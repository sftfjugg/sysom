#!/usr/bin/python3
import requests
import json

fname="/usr/local/sysom/monitor/prometheus/node/node.json"
host_api="http://localhost/api/v1/host"

hostlist = requests.get(host_api)
res = hostlist.content

hosts = json.loads(res)

host_len = len(hosts["data"]["results"])
iplist=[]
fo = open(fname,"w")
for i in range(0,host_len):
  iplist.append(hosts["data"]["results"][i]["ip"]+":9100")

target={"targets":iplist}
res="["+json.dumps(target)+"]"
print(res)
fo.write(res)
fo.close()

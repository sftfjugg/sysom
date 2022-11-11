#!/bin/bash

echo "{
    'commands':[
        {
            'instance': '192.168.0.2',
            'cmd': 'ls /root'
        },
        {
            'instance': '192.168.0.3',
            'cmd': 'ls /root'
        }
    ],
    'taskid': 'xxxx'
}"

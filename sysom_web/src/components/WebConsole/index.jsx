import React, { useEffect, useRef } from 'react';
import 'xterm/css/xterm.css';
import { message } from 'antd';
import { PageContainer } from '@ant-design/pro-layout';
import { Terminal } from 'xterm';
import { WebLinksAddon } from 'xterm-addon-web-links';
import { FitAddon } from 'xterm-addon-fit';
import { AttachAddon } from 'xterm-addon-attach';
import styles from './index.less';

const WebConsole = (props) => {
  const container = useRef(null);
  let socket = null;

  const initTerminal = () => {
    const user_id = props.user_id
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    if (props.host_ip) {
      socket = new WebSocket(`${protocol}//${location.host}/ws/ssh/?user_id=${user_id}&host_ip=${props.host_ip}`);
    } else {
      const host_ip = '127.0.0.1'
      var start_obj = {
        "option": "vmcore_analyse",
        "kernel_version": `${props.kernel_version}`,
        "vmcore_file": `${props.vmcore_file}`
      };
      const start = JSON.stringify(start_obj);
      socket = new WebSocket(`${protocol}//${location.host}/ws/ssh/?user_id=${user_id}&host_ip=${host_ip}&start=${start}`)
    }
    socket.onopen = () => {
      terminal.focus();
    };
    socket.onerror = () => {
      message.error('连接出错')
    };
    const terminal = new Terminal({
      cursorBlink: true,
    });
    const webLinksAddon = new WebLinksAddon();
    const fitAddon = new FitAddon();
    const attachAddon = new AttachAddon(socket);
    terminal.loadAddon(webLinksAddon);
    terminal.loadAddon(fitAddon);
    terminal.loadAddon(attachAddon);
    terminal.open(container.current);
    fitAddon.fit();
    terminal.prompt = () => {
      terminal.write('\r\n');
    };
    terminal.prompt();
  };

  useEffect(() => {
    if (socket) {
      socket.close();
    }
    initTerminal();
  }, []);

  return (
    <PageContainer header={{title: props.title}}>
      <div className={styles.webconsole} ref={container} />
    </PageContainer>
  )
};

export default WebConsole
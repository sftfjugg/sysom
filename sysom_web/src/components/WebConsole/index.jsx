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
    socket = new WebSocket(`ws:${location.host}/ws/ssh/?user_id=${props.user_id}&host_ip=${props.host_ip}`);
    socket.onopen = () => {
      terminal.focus();
    };
    socket.onerror = () => {
      message.error('连接出错')
    };
    const terminal = new Terminal({
      // rendererType: 'canvas',
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
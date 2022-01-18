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
  const divRef = useRef(null);
  let socket = null;

  const initTerminal = () => {
    socket = new WebSocket(`ws://127.0.0.1:8001/ws/ssh/${props.id}/?user_id=${props.user_id}`);
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
    terminal.open(divRef.current);
    fitAddon.fit();
    terminal.prompt = () => {
      terminal.write('\r\n ');
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
    <PageContainer>
      <div className={styles.webconsole} ref={divRef} />
    </PageContainer>
  )
};

export default WebConsole
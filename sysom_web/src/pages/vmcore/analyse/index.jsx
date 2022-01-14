import React, { useEffect, useRef } from 'react';
import 'xterm/css/xterm.css';
import { message } from 'antd';
import { PageContainer } from '@ant-design/pro-layout';
import { Terminal } from 'xterm';
import { WebLinksAddon } from 'xterm-addon-web-links';
import { FitAddon } from 'xterm-addon-fit';
import { AttachAddon } from 'xterm-addon-attach';

const WebConsole = (props) => {
  const divRef = useRef(null);
  let socket = null;

  const initTerminal = () => {
    const terminal = new Terminal({
      cursorBlink: true,
    });
    socket = new WebSocket(`ws://127.0.0.1:8001/ws/ssh/2/?user_id=1`);
    socket.onopen = () => {
      terminal.focus();
    };
    socket.onerror = () => {
      message.error('连接出错')
    };
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
      <div style={{ marginTop: 10, width: 760, height: 500 }} ref={divRef} />;
    </PageContainer>
  )
};

export default WebConsole
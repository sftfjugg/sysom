import { useRef, useEffect } from 'react'

const GrafanaWrap = (props) => {
  const iframe = useRef(null);

  useEffect(() => {
    iframe.current.contentWindow.addEventListener('DOMContentLoaded', ev => {
      const new_style_element = document.createElement("style");
      new_style_element.textContent = "nav[data-testid='sidemenu'] { visibility: hidden; width:0 }"
      iframe.current.contentDocument.head.appendChild(new_style_element);
    }
    )}, []);

  return (
    <iframe
      src={props.match.url.match(/\/grafana.*/g)[0]}
      width="100%"
      frameBorder="0"
      ref={iframe}
      style={{height: "calc(100vh - 80px)" }}
    />
  )
}

export default GrafanaWrap;

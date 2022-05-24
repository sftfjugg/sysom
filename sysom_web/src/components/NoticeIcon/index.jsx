import { useEffect, useState, useRef } from 'react';
import { Tag, message } from 'antd';
import { groupBy } from 'lodash';
import moment from 'moment';
import lodash from 'lodash'
import { getNotices, changeAlarmIsReadHandler } from '@/pages/journal/service';
import NoticeIcon from './NoticeIcon';
import styles from './index.less';

const getNoticeData = (notices) => {
  if (!notices || notices.length === 0 || !Array.isArray(notices)) {
    return {};
  }

  const newNotices = notices.map((notice) => {
    const newNotice = { ...notice };

    if (newNotice.datetime) {
      newNotice.datetime = moment(notice.datetime).fromNow();
    }

    if (newNotice.id) {
      newNotice.key = newNotice.id;
    }

    if (newNotice.extra && newNotice.status) {
      const color = {
        todo: '',
        processing: 'blue',
        urgent: 'red',
        doing: 'gold',
      }[newNotice.status];
      newNotice.extra = (
        <Tag
          color={color}
          style={{
            marginRight: 0,
          }}
        >
          {newNotice.extra}
        </Tag>
      );
    }

    return newNotice;
  });
  return groupBy(newNotices, 'noticelcon_type');
};

const getUnreadData = (noticeData) => {
  const unreadMsg = {'sum': 0};
  Object.keys(noticeData).forEach((key) => {
    const value = noticeData[key];

    if (!unreadMsg[key]) {
      unreadMsg[key] = 0;
    }

    if (Array.isArray(value)) {
      const count = value.filter((item) => !item?.read).length;
      unreadMsg[key] = count;
      unreadMsg['sum'] += count;
    }
  });
  return unreadMsg;
};

const NoticeIconView = () => {
  const [socket, setSocket] = useState(null);
  const [notices, setNotices] = useState([]);
 
  const initWebSocker = () => {
    getNotices().then((res)=>{
      setNotices(res.data)
    }).catch((e) => {
      console.log(e)
    })
    const user_id = localStorage.getItem("userId")
    const con = new WebSocket(`ws:${location.host}/ws/noticelcon/?user_id=${user_id}`);
    setSocket(con)
  }
  useEffect(() => {
    if (socket) {socket.colse}
    initWebSocker()
  }, []);
  if (socket) {
    socket.onmessage = (e) => {
      const {data: response} = e
      const result = JSON.parse(response)
      const newNotices = lodash.cloneDeep(notices)
      newNotices.push(result.message)
      setNotices(newNotices)
    }
  }
  const noticeData = getNoticeData(notices);
  const unreadMsg = getUnreadData(noticeData || {});

  const changeReadState = (id) => {
    changeAlarmIsReadHandler(id, { is_read: true }).then((res)=>{
      setNotices(
        notices.map((item) => {
          const notice = { ...item };
          if (notice.id === id) {
            notice.read = true;
          }
          return notice;
        }),
      )
      return true
    }).catch((e) => {
      message.error(e)
      return false
    })
    
  };

  const clearReadState = (title, key) => {
    setNotices(
      notices.map((item, i) => {
        const notice = { ...item };
        if (notice.noticelcon_type === key) {
          changeAlarmIsReadHandler(notice.id, { is_read: true });
          notice.read = true;
        }
        return notice;
      }),
    );
    message.success(`${'清空了'} ${title}`);
  };

  return (
    <NoticeIcon
      className={styles.action}
      count = {unreadMsg.sum}
      onItemClick={(item) => {
        changeReadState(item.id);
      }}
      onClear={(title, key) => clearReadState(title, key)}
      loading={false}
      clearText="清空"
      viewMoreText={<a target="_blank" href={"/journal/alarm/"}>查看更多</a>}
      clearClose
    >
      <NoticeIcon.Tab
        tabKey="notification"
        count={unreadMsg.notification}
        list={noticeData.notification}
        title="通知"
        emptyText="你已查看所有通知"
        showViewMore
      />
      <NoticeIcon.Tab
        tabKey="warning"
        count={unreadMsg.warning}
        list={noticeData.warning}
        title="告警"
        emptyText="您已读完所有消息"
        showViewMore
      />
    </NoticeIcon>
  );
};

export default NoticeIconView;

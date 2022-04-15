import {  useRef ,useState} from 'react';
import { useIntl, FormattedMessage } from 'umi';
import ProCard from '@ant-design/pro-card';
import { PageContainer } from '@ant-design/pro-layout';
import Toptable from './Toptable'
import Cvetable from './Cvetable'
import './homelist.less'

const { Divider } = ProCard;
const Homelist=(props)=> {
   const id=props.match.params.id
  return (
    <PageContainer>
      <Divider/>
      <Toptable  id={id}/>
      <Divider/>
      <Cvetable  id={id}/>
    </PageContainer>
  );
}

export default Homelist;

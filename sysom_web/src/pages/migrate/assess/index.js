import React, {useRef, useState, useEffect} from 'react';
import {PageContainer} from '@ant-design/pro-layout';
import ProCard from '@ant-design/pro-card';
import "./index.less";
import StAssessmentForm from './components/StAssessmentForm/StAssessmentForm';
import AssessList from './components/AssessList/AssessList';
import {queryAssessList} from '../service';

const { Divider } = ProCard;

const assess = (props) => {
  const refAssessList = useRef();

  const [list,setList] = useState([]);

  const getAssessList = async() => {
    const {data} = await queryAssessList();
    setList(data?data:[]);
    console.log(data,'data')
  }

  return (
    <PageContainer>
      <StAssessmentForm success={getAssessList} />
      <Divider />
      <AssessList 
        headerTitle="评估记录"
        ref={refAssessList}
        getList={getAssessList}
        assessList={list}
      />
    </PageContainer>
   
  );
}

export default assess;

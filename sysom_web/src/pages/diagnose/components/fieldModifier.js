//fieldConfig: The Field's global config for an pannel.
//OrgValue: The Value we process now.
//OrgData: The whole Row include the OrgValue. we would get the row specials config.
//OrgDatas: In which we want to  calculate the max or min value.
const fieldModifier = (fieldConfig, OrgValue, OrgData, OrgDatas) => {
    let retValue;
    let retColor = OrgData.__color__ //We had row Color setting
  
    //console.log("enter fieldModifier", OrgData, "fieldConfig", fieldConfig)
    //mapping
    if (typeof OrgValue == "string") {
      //At present, we only support value.
      let options = fieldConfig?.mappings?.find((mapping) => mapping.type == "value")?.options
      retColor = options?.color || retColor
      retValue = options?.text || OrgValue
      //console.log(`mapping ${OrgValue} to value ${retValue} and color ${retColor}`)
    }
  
    //thresholds
    if (typeof OrgValue == "number") {
      let threshold = fieldConfig?.thresholds?.steps?.find((i) => OrgValue > i.value)
      retColor = threshold.color || retColor
      retValue = OrgValue
      //console.log(`touch threshold for value ${OrgValue} by raw:`, threshold)
    }
  
    //unit
    if (typeof OrgValue == "number") {
      retValue = OrgValue + (fieldConfig.unit || "")
    }
  
    return [retValue, retColor]
  }
  export default fieldModifier
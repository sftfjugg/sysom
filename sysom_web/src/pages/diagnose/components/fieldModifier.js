//fieldConfig: The Field's global config for an pannel.
//OrgValue: The Value we process now.
//OrgData: The whole Row include the OrgValue. we would get the row specials config.
//OrgDatas: In which we want to  calculate the max or min value.
const fieldModifier = (fieldConfig, OrgValue, OrgData, OrgDatas) => {
  let retValue;
  let retColor = OrgData.color //We had row Color setting
  
  //mapping
  if (typeof OrgValue == "string") {
    //At present, we only support value.
    let options = fieldConfig?.mappings?.find((mapping) => mapping.type == "value")?.options
    retColor = options && options[OrgValue]?.color || retColor
    retValue = options && options[OrgValue]?.text || OrgValue
  }

  //thresholds
  if (typeof OrgValue == "number") {
    let threshold = fieldConfig?.thresholds?.steps?.find((i) => OrgValue > i.value)
    retColor = threshold?.color || retColor
    retValue = OrgValue
  }

  //unit
  if (typeof OrgValue == "number") {
    retValue = OrgValue + (fieldConfig?.unit || "")
  }

  return [retValue, retColor]
}
export default fieldModifier
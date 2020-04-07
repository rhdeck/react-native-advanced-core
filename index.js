import { Platform, NativeModules, NativeEventEmitter } from "react-native";
//#region Code for object RNSRegistry
const { RNSRegistry, RNKRegistryModule } = NativeModules;
const setData = async (key, data) => {
  if (Platform.OS === "android")
    return await RNKRegistryModule.setData(key, data);
  return await NativeRNSRegistry.setData(key, data);
};
const saveData = async (key, data) => {
  if (Platform.OS === "android") throw "Not supported on android";
  return await NativeRNSRegistry.saveData(key, data);
};
const removeData = async (key) => {
  if (Platform.OS === "android") return await RNKRegistryModule.removeData(key);

  return await NativeRNSRegistry.removeData(key);
};
const getData = async (key) => {
  if (Platform.OS === "android") return await RNKRegistryModule.getData(key);
  return await NativeRNSRegistry.getData(key);
};
const addEvent = async (type, key = "RNAdvanced") => {
  if (Platform.OS === "android")
    return await RNKRegistryModule.addEvent(type, key);
  return await NativeRNSRegistry.addEvent(type, key);
};
const removeEvent = async (key, label = "RNAdvanced") => {
  if (Platform.OS === "android") RNKRegistryModule.removeEvent(key, label);
  return await NativeRNSRegistry.removeEvent(key);
};
//#endregion
//#region Exports
export { setData, saveData, removeData, getData, addEvent, removeEvent };
//#endregion

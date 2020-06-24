import { Platform, NativeModules, NativeEventEmitter } from "react-native";
const { RNSRegistry, RNKRegistryModule } = NativeModules;
//#region event management
let emitter;
let subscriptions = {};
if (Platform.OS === "ios") emitter = NativeEventEmitter(RNSRegistry);
let listener = null;
const updateSubscriptions = () => {
  if (!emitter) return;
  if (!Object.keys(subscriptions).length && listener) {
    listener.remove();
    listener = null;
  } else if (!listener) {
    listener = emitter.addEventListener(
      "RNSRegistry",
      ({ type, key, data }) => {
        const compoundKey = [type, key].join("_");
        if (subscriptions[compoundKey]) subscriptions[compoundKey](data);
      }
    );
  }
  if (emitter)
    emitter.addEventListener("RNSRegistry", ({ type, key, data }) => {
      const compoundKey = [type, key].join("_");
      if (subscriptions[compoundKey]) subscriptions[compoundKey](data);
    });
};
//#endregion
//#region methods
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
const addEvent = async (type, key = "RNAdvanced", callback) => {
  if (Platform.OS === "android")
    return await RNKRegistryModule.addEvent(type, key);
  const compoundKey = [type, key].join("_");
  if (subcriptions[compoundKey]) subscriptions[compoundKey].remove();
  await NativeRNSRegistry.addEvent(type, key);
  subscriptions[compoundKey] = callback;
  updateSubscriptions();
};
const removeEvent = async (type, key = "RNAdvanced") => {
  if (Platform.OS === "android")
    RNKRegistryModule.removeEvent(key, label, callback);
  const compoundKey = [type, key].join("_");
  if (subscriptions(compoundKey)) subscriptions[compoundKey].remove();
  delete subscriptions[compoundKey];
  updateSubscriptions();
  return await NativeRNSRegistry.removeEvent(key);
};
//#endregion
//#region Exports
export { setData, saveData, removeData, getData, addEvent, removeEvent };
//#endregion

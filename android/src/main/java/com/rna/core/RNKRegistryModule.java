package com.rna.core;


import androidx.annotation.NonNull;

import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.modules.core.DeviceEventManagerModule;

@ReactModule(name = RNKRegistryModule.MODULE_NAME)
public class RNKRegistryModule extends ReactContextBaseJavaModule  {
    protected ReactContext context;
    public static final String MODULE_NAME = "RNKRegistry";
    public RNKRegistryModule(ReactContext reactContext) {
        context = reactContext;
    }
    @NonNull
    @Override
    public String getName() {return MODULE_NAME; }
    @ReactMethod
    public void setValue(String key, String value) {
        RNKRegistry.getInstance().set(key, value);
    }
    @ReactMethod
    public void getValue(String key,  Promise promise) {
        Object value = RNKRegistry.getInstance().get(key);
        promise.resolve(value);
    }
    @ReactMethod
    public void addEvent(String key, String label) {
        RNKRegistry.getInstance().add(key, getName() + "_" + label,(Object o) -> {
            sendEvent(key, label, o );
            return true;
        });
    }
    @ReactMethod
    public void removeEvent(String key, String label) {
        RNKRegistry.getInstance().remove(key, getName()+ "_" + label);
    }
    @ReactMethod
    public void triggerEvent(String key) {
        RNKRegistry.getInstance().trigger(key);
    }
    private void sendEvent(String event, String label, Object o) {
        WritableMap params =  Arguments.createMap();
        params.putString("event", event);
        params.putString("label", label);
        context
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
            .emit(event, params);
    }
}
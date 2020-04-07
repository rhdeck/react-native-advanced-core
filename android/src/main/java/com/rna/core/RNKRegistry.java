package com.rna.core;

import java.util.HashMap;
import java.util.Map;

public class RNKRegistry {
    public static RNKRegistry instance = new RNKRegistry();
    public static RNKRegistry getInstance() { return instance; }
    Map<String, Object> data = new HashMap<String, Object>();
    Map<String, Map<String, RNKEventHandler>> events = new HashMap<String, Map<String, RNKEventHandler>>();
    public void registerPackage(RNKPackageInterface p) {
        p.createEventManagers(this);
    }
    public Object get(String key) {
        return data.get(key);
    }
    public void set(String key, Object value) {
        data.put(key, value);
    }
    protected Map<String, RNKEventHandler> getKeys(String event) {
        Map<String, RNKEventHandler> thisEvents = events.get(event);
        if(thisEvents == null) {
            thisEvents = new HashMap<String, RNKEventHandler>();
            events.put(event, thisEvents);
        }
        return thisEvents;
    }
    public void add(String event, String key, RNKEventHandler func) {
        Map<String, RNKEventHandler> thisEvents = getKeys(event);
        thisEvents.put(key, func);
    }
    public void remove(String event, String key) {
        Map<String, RNKEventHandler> thisEvents = getKeys(event);
        thisEvents.remove(key);
    }
    public Boolean trigger(String event, Object data) {
        Map<String, RNKEventHandler> thisEvents = getKeys(event);
        for(Map.Entry<String, RNKEventHandler> entry: thisEvents.entrySet()){
            boolean temp = entry.getValue().execute(data);
            if(temp == false) return false;
        }
        return true;
    }
    public Boolean trigger(String event) {
        return trigger(event, null);
    }

}
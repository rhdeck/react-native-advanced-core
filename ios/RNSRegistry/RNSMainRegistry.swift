import Foundation
public typealias cbtype = (Any) -> Bool
var events:[String: [String: cbtype]] = [:]
var data:[String: Any]?
var q = DispatchQueue(label: "RNSQueueEvents")
var dq = DispatchQueue(label: "RNSQueueData")
var savedData:[String: Any]?
public protocol RNSStartable {
    static func runOnStart(_ application:UIApplication)->Void
}
open class RNSMainRegistry {
    public class func addEvent(type: String, key: String, callback: @escaping cbtype) -> String {
        let newtype = type.lowercased()
        q.sync() {
            if events[newtype] == nil { events[newtype] = [:] }
            events[newtype]?[key] = callback
        }
        return key
    }
    public class func removeEvent(type: String, key: String) {
        let newtype = type.lowercased()
        let _ = q.sync() {
            events[newtype]?.removeValue(forKey: key)
        }
    }
    public class func removeEvent(key: String) {
        let newtype = key.lowercased()
        let _ = q.sync() {
            events.keys.forEach() { k in
                events[k]?.removeValue(forKey: newtype)
            }
        }
    }
    public class func removeEvents(type: String) {
        let newtype = type.lowercased()
        let _ = q.sync() {
            guard let e = events[newtype] else { return }
            e.keys.forEach() { k in
                events[newtype]?.removeValue(forKey: k)
            }
            events[type] = nil
        }
    }
    public class func triggerEventNoSync(type: String, data: Any) ->Bool {
        let newtype = type.lowercased()
        guard let es = events[newtype] else { return false }
        for thisKey:String in es.keys {
            guard let cb = es[thisKey] else { continue }
            if !cb(data) { return false }
        }
        return true
    }
    public class func triggerEvent(type: String, data: Any) -> Bool {
//        if(DispatchQueue.getSpecific(key:"label") === q.label) {
//            triggerEventNoSync(type: type, data: data)
//        } else {
        let newtype = type.lowercased()
        return q.sync() {
            triggerEventNoSync(type: newtype, data: data)
        }
    }
    public class func setData(key: String, value: Any) {
        let newkey = key.lowercased()
        let _ = dq.sync() {
            if(data == nil) { data = loadData()}
            data![newkey] = value
        }
    }
    public class func getData(key: String) -> Any? {
         let newkey = key.lowercased()
         return dq.sync() {
            if(data == nil) { data = loadData()}
            return data![newkey]
         }
    }
    public class func removeData(key: String) {
        let newkey = key.lowercased()
        let _ = dq.sync() {
            if(data == nil) { data = loadData()}
            data!.removeValue(forKey: newkey)
        }
    }
    public class func saveData(key: String, value: Any) {
        let newkey = key.lowercased()
        var d = loadData()
        d[newkey] = value
        savedData = d
        let _ = saveDataFile()
    }
    public class func removeSavedData(key: String) {
        let newkey = key.lowercased()
        var d = loadData()
        d.removeValue(forKey: newkey)
        savedData = d
        let _ = saveDataFile()
    }
    public class func flushData() {
        savedData = [:]
        let _ = saveDataFile()
    }
}
func getFileURL() -> URL? {
    guard let base =  FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first else { return nil }
    return base.appendingPathComponent("rnsmr.json")
}
func saveDataFile() -> Bool {
    guard
        let data = try? JSONSerialization.data(withJSONObject: loadData()),
        let fileURL = getFileURL()
    else { return false }
    guard let _ = try? data.write(to: fileURL) else { return false }
    return true
}
func loadData() -> [String:Any] {
    if let d = savedData { return d }
    guard let fileURL = getFileURL() else { return [:] }
    guard
        FileManager.default.fileExists(atPath: fileURL.path),
        let data:Data = try? Data(contentsOf: fileURL),
        let d:[String:Any] = try? JSONSerialization.jsonObject(with: data) as! [String : Any]
    else { savedData = [:] ; return savedData! }
    savedData = d
    return d
}

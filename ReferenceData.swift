import Foundation

struct GeometrySpec: Identifiable {
    let id = UUID()
    let name: String
    let hi: String
    let lo: String?
}

struct TorqueSpec: Identifiable {
    let id = UUID()
    let component: String
    let item: String
    let torque: String
    let note: String
    let source: String
    let sourceURL: String
}

struct BuildSpec: Identifiable {
    let id = UUID()
    let category: String
    let stock: String
    let current: String
}

struct ServiceSpec: Identifiable {
    let id = UUID()
    let item: String
    let value: String
    let note: String
}

enum ReferenceData {
    static let santaCruzURL = "https://www.santacruzbicycles.com/en-de/pages/product-support/bullit-4-my-26"
    static let fox38ManualURL = "https://tech.ridefox.com/bike/owners-manuals/3103/fork--2026-38mm"
    static let foxOilURL = "https://tech.ridefox.com/bike/service-procedures/3094/2026-bath-oil-volume-chart"
    static let foxPartsURL = "https://tech.ridefox.com/bike/parts-drawings/3047/38mm-or-38mm-e-bike-part-information"
    static let oneUpStemURL = "https://www.oneupcomponents.com/blogs/stems-service-install/handlebar-stem-install-instructions"
    static let sramTransmissionURL = "https://docs.sram.com/en-US/publications/5jblJ4SRpeHwjcuWG1vPy4"

    static let geometryLarge: [GeometrySpec] = [
        .init(name: "Reach", hi: "480 mm", lo: "477 mm"),
        .init(name: "Stack", hi: "640 mm", lo: "643 mm"),
        .init(name: "Head tube angle", hi: "63.6°", lo: "63.3°"),
        .init(name: "Head tube length", hi: "120 mm", lo: nil),
        .init(name: "Rear center", hi: "446 mm", lo: nil),
        .init(name: "Front center", hi: "834 mm", lo: nil),
        .init(name: "BB height", hi: "346 mm", lo: "342 mm"),
        .init(name: "BB drop — front", hi: "27 mm", lo: "31 mm"),
        .init(name: "BB drop — rear", hi: "9 mm", lo: "13 mm"),
        .init(name: "Wheelbase", hi: "1280 mm", lo: nil),
        .init(name: "Top tube length", hi: "617 mm", lo: nil),
        .init(name: "Seat tube length", hi: "420 mm", lo: nil),
        .init(name: "Seat tube angle", hi: "78.7°", lo: "78.4°"),
        .init(name: "Standover", hi: "738 mm", lo: "733 mm")
    ]

    static let modelSpecs: [ServiceSpec] = [
        .init(item: "Frame", value: "2026 Bullit 4 GX AXS — Large", note: "Carbon C, MX, 170 mm rear travel"),
        .init(item: "Wheel size", value: "29 / 27.5 MX", note: "Mixed wheel platform"),
        .init(item: "Fork offset", value: "44 mm", note: "Santa Cruz recommended"),
        .init(item: "Shock size", value: "205 × 65 mm", note: "Trunnion upper, 8×30 lower"),
        .init(item: "Rear spacing", value: "148 mm", note: "Boost"),
        .init(item: "Rear brake mount", value: "200 PM", note: "Santa Cruz lists max rotor 220 mm"),
        .init(item: "Max chainring", value: "36T", note: "UDH compatible"),
        .init(item: "Battery", value: "Bosch PowerTube 600 Wh", note: "Performance Line CX BDU38")
    ]

    static let buildSpecs: [BuildSpec] = [
        .init(category: "Fork", stock: "FOX 38 Performance Elite GRIP X2, 170 mm", current: "FOX 38 GRIP X2, 170 mm"),
        .init(category: "Shock", stock: "FOX Float X Performance Elite, 205×65", current: "2026 FOX Float X2, Bullit-specific tune"),
        .init(category: "Brakes", stock: "SRAM Maven Bronze", current: "Shimano Saint"),
        .init(category: "Rotors", stock: "SRAM HS2 200 / 200", current: "TRP 223 / 223"),
        .init(category: "Pads", stock: "SRAM", current: "TRP blue resin"),
        .init(category: "Bars", stock: "OneUp aluminum 35×800, 35 mm rise", current: "OneUp carbon"),
        .init(category: "Grips", stock: "Santa Cruz House", current: "ODI half-waffle"),
        .init(category: "Rear hub", stock: "E13 SL E-Spec", current: "DT Swiss + anti-pedal-kickback system, 20°"),
        .init(category: "Front tire", stock: "Maxxis Assegai 29×2.5", current: "Schwalbe Magic Mary Radial Gravity Pro"),
        .init(category: "Rear tire", stock: "Maxxis DHRII 27.5×2.5", current: "Schwalbe Tacky Chan Radial Gravity Pro Super Soft"),
        .init(category: "Cranks", stock: "SRAM GX Eagle 155 mm", current: "SRAM GX Eagle 155 mm"),
        .init(category: "Drive unit", stock: "Bosch Performance Line CX BDU38", current: "Bosch Performance Line CX BDU38")
    ]

    static let torqueSpecs: [TorqueSpec] = [
        .init(component: "Frame", item: "Pivot axle M15×91", torque: "20 Nm", note: "Loctite 242 on threads; grease shaft", source: "Santa Cruz Bullit 4 MY26", sourceURL: santaCruzURL),
        .init(component: "Frame", item: "Pivot axle M15×80.5", torque: "20 Nm", note: "Loctite 242 on threads; grease shaft", source: "Santa Cruz Bullit 4 MY26", sourceURL: santaCruzURL),
        .init(component: "Shock", item: "Trunnion screws M10×10", torque: "16 Nm", note: "Loctite 242 on threads; grease shaft", source: "Santa Cruz Bullit 4 MY26", sourceURL: santaCruzURL),
        .init(component: "Shock", item: "Lower shock / flip-chip M8×45", torque: "15.6 Nm", note: "Loctite 242 on threads", source: "Santa Cruz Bullit 4 MY26", sourceURL: santaCruzURL),
        .init(component: "Linkage", item: "M10×20 bolts", torque: "16 Nm", note: "Loctite 242", source: "Santa Cruz Bullit 4 MY26", sourceURL: santaCruzURL),
        .init(component: "Linkage", item: "M6×20 SHCS", torque: "9 Nm", note: "Loctite 242", source: "Santa Cruz Bullit 4 MY26", sourceURL: santaCruzURL),
        .init(component: "Rear triangle", item: "M10×26 bolts", torque: "16 Nm", note: "Loctite 242 on threads; grease shaft", source: "Santa Cruz Bullit 4 MY26", sourceURL: santaCruzURL),
        .init(component: "Drivetrain", item: "UDH screw", torque: "20 Nm", note: "Reverse thread", source: "Santa Cruz Bullit 4 MY26", sourceURL: santaCruzURL),
        .init(component: "Rear axle", item: "12×173.7 axle", torque: "Not published", note: "Santa Cruz specifies grease on shaft and threads; use axle marking/current SC manual", source: "Santa Cruz Bullit 4 MY26", sourceURL: santaCruzURL),
        .init(component: "Fork", item: "FOX 38 axle pinch bolt", torque: "5.1 Nm", note: "After settling lowers; KaboltX axle torque is etched on axle head", source: "FOX 2026 38 manual", sourceURL: fox38ManualURL),
        .init(component: "Cockpit", item: "OneUp stem — steerer bolts", torque: "9 Nm", note: "OneUp stem instruction", source: "OneUp", sourceURL: oneUpStemURL),
        .init(component: "Cockpit", item: "OneUp stem — faceplate", torque: "6 Nm", note: "No-gap top; torque faceplate bolts to 6 Nm", source: "OneUp", sourceURL: oneUpStemURL),
        .init(component: "Cockpit", item: "Headset top cap", torque: "2–4 Nm", note: "Preload only, then torque stem", source: "OneUp", sourceURL: oneUpStemURL),
        .init(component: "Cranks", item: "SRAM ISIS crankarm bolt", torque: "54 Nm", note: "8 mm hex; each crankarm", source: "SRAM Eagle Transmission", sourceURL: sramTransmissionURL),
        .init(component: "Brakes", item: "Shimano Saint caliper / adapter fixing", torque: "6–8 Nm", note: "Verify adapter/bolt arrangement when servicing", source: "Shimano disc brake dealer manual", sourceURL: "https://si.shimano.com")
    ]

    static let forkLowerService: [ServiceSpec] = [
        .init(item: "Air-side bath", value: "20 cc — FOX 20 WT Gold", note: "38 FLOAT NA2"),
        .init(item: "Air chamber", value: "3 cc — FOX 20 WT Gold", note: "FOX also lists Slick Honey/Slickoleum for air chamber application"),
        .init(item: "Damper-side bath", value: "40 cc — FOX 4 WT", note: "GRIP / GRIP X2"),
        .init(item: "Air-side bottom nut", value: "5.7 Nm", note: "50 in-lb"),
        .init(item: "GRIP X2 bottom nut", value: "12.4 Nm", note: "110 in-lb"),
        .init(item: "Air-spring topcap", value: "24.8 Nm", note: "220 in-lb, 32 mm chamferless socket on 38 NA2"),
        .init(item: "Fork axle pinch bolt", value: "5.1 Nm", note: "45 in-lb"),
        .init(item: "Full service interval", value: "125 hours", note: "FOX notes e-MTB / hard use may require earlier maintenance")
    ]
}

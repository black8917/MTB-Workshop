import Foundation
import SwiftData

@Model
final class RideEntry {
    var date: Date
    var location: String
    var trail: String
    var conditions: String
    var rideTimeMinutes: Int
    var elevationFeet: Int

    var forkPressure: Double
    var forkTravel: Int
    var forkVolumeSpacers: Int
    var forkLSC: Int
    var forkHSC: Int
    var forkLSR: Int
    var forkHSR: Int

    var shockPressure: Double
    var shockMode: String
    var shockLSC: Int
    var shockHSC: Int
    var shockLSR: Int
    var shockHSR: Int
    var shockSagPercent: Double

    var frontTirePSI: Double
    var rearTirePSI: Double

    var overallFeel: String
    var forkTravelUsedMM: Int
    var shockTravelUsedMM: Int
    var bottomOutNotes: String
    var gripSupportChatter: String
    var whatWorked: String
    var whatDidnt: String
    var nextTest: String
    var notes: String

    init(
        date: Date = .now,
        location: String = "",
        trail: String = "",
        conditions: String = "",
        rideTimeMinutes: Int = 0,
        elevationFeet: Int = 0,
        forkPressure: Double = 99,
        forkTravel: Int = 170,
        forkVolumeSpacers: Int = 1,
        forkLSC: Int = 10,
        forkHSC: Int = 8,
        forkLSR: Int = 6,
        forkHSR: Int = 6,
        shockPressure: Double = 200,
        shockMode: String = "HI",
        shockLSC: Int = 5,
        shockHSC: Int = 4,
        shockLSR: Int = 11,
        shockHSR: Int = 3,
        shockSagPercent: Double = 0,
        frontTirePSI: Double = 27,
        rearTirePSI: Double = 30,
        overallFeel: String = "",
        forkTravelUsedMM: Int = 0,
        shockTravelUsedMM: Int = 0,
        bottomOutNotes: String = "",
        gripSupportChatter: String = "",
        whatWorked: String = "",
        whatDidnt: String = "",
        nextTest: String = "",
        notes: String = ""
    ) {
        self.date = date
        self.location = location
        self.trail = trail
        self.conditions = conditions
        self.rideTimeMinutes = rideTimeMinutes
        self.elevationFeet = elevationFeet
        self.forkPressure = forkPressure
        self.forkTravel = forkTravel
        self.forkVolumeSpacers = forkVolumeSpacers
        self.forkLSC = forkLSC
        self.forkHSC = forkHSC
        self.forkLSR = forkLSR
        self.forkHSR = forkHSR
        self.shockPressure = shockPressure
        self.shockMode = shockMode
        self.shockLSC = shockLSC
        self.shockHSC = shockHSC
        self.shockLSR = shockLSR
        self.shockHSR = shockHSR
        self.shockSagPercent = shockSagPercent
        self.frontTirePSI = frontTirePSI
        self.rearTirePSI = rearTirePSI
        self.overallFeel = overallFeel
        self.forkTravelUsedMM = forkTravelUsedMM
        self.shockTravelUsedMM = shockTravelUsedMM
        self.bottomOutNotes = bottomOutNotes
        self.gripSupportChatter = gripSupportChatter
        self.whatWorked = whatWorked
        self.whatDidnt = whatDidnt
        self.nextTest = nextTest
        self.notes = notes
    }
}

@Model
final class TodoItem {
    var title: String
    var notes: String
    var isDone: Bool
    var sortOrder: Int
    var createdAt: Date

    init(title: String, notes: String = "", isDone: Bool = false, sortOrder: Int = 0, createdAt: Date = .now) {
        self.title = title
        self.notes = notes
        self.isDone = isDone
        self.sortOrder = sortOrder
        self.createdAt = createdAt
    }
}

@Model
final class MaintenanceEntry {
    var date: Date
    var title: String
    var notes: String

    init(date: Date = .now, title: String, notes: String = "") {
        self.date = date
        self.title = title
        self.notes = notes
    }
}

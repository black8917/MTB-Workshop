import Foundation
import SwiftData

enum SeedData {
    static func seedIfNeeded(in context: ModelContext) {
        let rideFetch = FetchDescriptor<RideEntry>()
        let todoFetch = FetchDescriptor<TodoItem>()
        let maintenanceFetch = FetchDescriptor<MaintenanceEntry>()

        if (try? context.fetchCount(rideFetch)) == 0 { seedRides(context) }
        if (try? context.fetchCount(todoFetch)) == 0 { seedTodos(context) }
        if (try? context.fetchCount(maintenanceFetch)) == 0 { seedMaintenance(context) }
        try? context.save()
    }

    private static func date(_ string: String) -> Date {
        let formatter = DateFormatter()
        formatter.dateFormat = "M-d-yyyy"
        formatter.locale = Locale(identifier: "en_US_POSIX")
        return formatter.date(from: string) ?? .now
    }

    private static func seedRides(_ context: ModelContext) {
        context.insert(RideEntry(
            date: date("9-30-2026"),
            forkPressure: 99, forkTravel: 170, forkVolumeSpacers: 1,
            forkLSC: 10, forkHSC: 8, forkLSR: 6, forkHSR: 6,
            shockPressure: 200, shockMode: "HI", shockLSC: 5, shockHSC: 4, shockLSR: 11, shockHSR: 3,
            frontTirePSI: 27, rearTirePSI: 30,
            notes: "Current baseline imported from Bullit setup notes. Shock LSC was blank in the 9/30 note; 5 was carried forward from 9/9 and should be confirmed."
        ))

        context.insert(RideEntry(
            date: date("9-9-2026"),
            forkPressure: 99, forkTravel: 170, forkVolumeSpacers: 1,
            forkLSC: 10, forkHSC: 8, forkLSR: 6, forkHSR: 6,
            shockPressure: 200, shockMode: "HI", shockLSC: 5, shockHSC: 4, shockLSR: 11, shockHSR: 3,
            frontTirePSI: 27, rearTirePSI: 30
        ))

        context.insert(RideEntry(
            date: date("7-1-2026"),
            forkPressure: 99, forkTravel: 170, forkVolumeSpacers: 1,
            forkLSC: 10, forkHSC: 8, forkLSR: 6, forkHSR: 6,
            shockPressure: 205, shockMode: "LO", shockLSC: 5, shockHSC: 4, shockLSR: 11, shockHSR: 3,
            frontTirePSI: 27, rearTirePSI: 30
        ))

        context.insert(RideEntry(
            date: date("6-30-2026"),
            forkPressure: 99, forkTravel: 170, forkVolumeSpacers: 1,
            forkLSC: 10, forkHSC: 5, forkLSR: 6, forkHSR: 6,
            shockPressure: 205, shockMode: "LO", shockLSC: 8, shockHSC: 5, shockLSR: 8, shockHSR: 3,
            frontTirePSI: 27, rearTirePSI: 30
        ))

        context.insert(RideEntry(
            date: date("8-18-2025"),
            location: "Whistler", trail: "Mayday", conditions: "Dry",
            forkPressure: 85, forkTravel: 180, forkVolumeSpacers: 2,
            forkLSC: 8, forkHSC: 7, forkLSR: 8, forkHSR: 7,
            shockPressure: 185, shockMode: "LO", shockLSC: 4, shockHSC: 4, shockLSR: 4, shockHSR: 4,
            frontTirePSI: 27, rearTirePSI: 30,
            overallFeel: "Felt good in Mayday",
            notes: "Switched back to LO shock progressive mode."
        ))
    }

    private static func seedTodos(_ context: ModelContext) {
        let items = [
            "Check sag",
            "Cable rattle?",
            "Chain noise in 7th gear?",
            "Stem creaking / rattle",
            "Rear tire check",
            "Update software",
            "Tighten dropper",
            "Verify current shock LSC"
        ]
        for (index, title) in items.enumerated() {
            context.insert(TodoItem(title: title, sortOrder: index))
        }
    }

    private static func seedMaintenance(_ context: ModelContext) {
        context.insert(MaintenanceEntry(date: date("6-22-2025"), title: "Handlebar swap", notes: "Swapped carbon OneUp e-bike bars off Rail."))
        context.insert(MaintenanceEntry(date: date("6-22-2025"), title: "Initial Bullit setup", notes: "Started suspension setup log and baseline testing."))
    }
}

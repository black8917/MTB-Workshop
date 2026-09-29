import SwiftUI
import SwiftData

@main
struct BikeWorkshopApp: App {
    var sharedModelContainer: ModelContainer = {
        let schema = Schema([
            RideEntry.self,
            TodoItem.self,
            MaintenanceEntry.self
        ])
        let configuration = ModelConfiguration(schema: schema, isStoredInMemoryOnly: false)
        do {
            return try ModelContainer(for: schema, configurations: [configuration])
        } catch {
            fatalError("Could not create SwiftData container: \(error)")
        }
    }()

    var body: some Scene {
        WindowGroup {
            MainTabView()
                .preferredColorScheme(.dark)
                .task { SeedData.seedIfNeeded(in: sharedModelContainer.mainContext) }
        }
        .modelContainer(sharedModelContainer)
    }
}

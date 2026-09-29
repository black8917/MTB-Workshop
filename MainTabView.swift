import SwiftUI

struct MainTabView: View {
    @State private var selectedTab = 0

    var body: some View {
        TabView(selection: $selectedTab) {
            NavigationStack {
                DashboardView(openRideLog: { selectedTab = 1 }, openService: { selectedTab = 2 }, openSetup: { selectedTab = 3 })
            }
            .tabItem { Label("Dashboard", systemImage: "rectangle.grid.2x2.fill") }
            .tag(0)

            NavigationStack { RideLogView() }
                .tabItem { Label("Ride Log", systemImage: "figure.mountain.biking") }
                .tag(1)

            NavigationStack { ServiceView() }
                .tabItem { Label("Service", systemImage: "wrench.and.screwdriver.fill") }
                .tag(2)

            NavigationStack { SetupView() }
                .tabItem { Label("Setup", systemImage: "slider.horizontal.3") }
                .tag(3)

            NavigationStack { SpecsView() }
                .tabItem { Label("Specs", systemImage: "list.bullet.rectangle.portrait.fill") }
                .tag(4)
        }
        .tint(AppTheme.accent)
    }
}

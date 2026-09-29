import SwiftUI
import SwiftData

struct DashboardView: View {
    @Query(sort: \RideEntry.date, order: .reverse) private var rides: [RideEntry]
    @Query(filter: #Predicate<TodoItem> { !$0.isDone }) private var todos: [TodoItem]

    let openRideLog: () -> Void
    let openService: () -> Void
    let openSetup: () -> Void

    private var current: RideEntry? { rides.first }

    var body: some View {
        ZStack {
            AppTheme.page.ignoresSafeArea()
            ScrollView {
                VStack(spacing: 16) {
                    bikeHeader
                    currentSetup
                    quickActions
                    lastRide
                    statusCard
                }
                .padding()
            }
        }
        .navigationTitle("Bullit")
        .navigationBarTitleDisplayMode(.inline)
    }

    private var bikeHeader: some View {
        HStack(spacing: 14) {
            ZStack {
                Circle().fill(AppTheme.cardRaised).frame(width: 62, height: 62)
                Image(systemName: "bicycle").font(.system(size: 29, weight: .semibold)).foregroundStyle(AppTheme.accent)
            }
            VStack(alignment: .leading, spacing: 3) {
                Text("2026 Santa Cruz Bullit GX")
                    .font(.title3.bold())
                Text("Large • MX • 170 / 170 mm")
                    .font(.subheadline)
                    .foregroundStyle(AppTheme.secondary)
                Text("Anti-pedal kickback — 20°")
                    .font(.caption)
                    .foregroundStyle(AppTheme.secondary)
            }
            Spacer()
            Menu {
                Button("Bullit", action: {})
                Button("Supreme V5 — Coming Soon", action: {})
                    .disabled(true)
                Button("Nomad — Coming Soon", action: {})
                    .disabled(true)
            } label: {
                Image(systemName: "chevron.down.circle.fill")
                    .font(.title2)
            }
        }
        .appCard()
    }

    @ViewBuilder private var currentSetup: some View {
        if let ride = current {
            VStack(spacing: 14) {
                SectionHeader(title: "Current Setup", subtitle: "Complete setup in one place • clicks OUT from closed")

                VStack(alignment: .leading, spacing: 10) {
                    HStack {
                        Label("Fork", systemImage: "arrow.up.and.down")
                            .font(.headline)
                        Spacer()
                        Text("\(Int(ride.forkPressure)) psi • \(ride.forkVolumeSpacers) vol spacer")
                            .font(.subheadline.monospacedDigit())
                    }
                    DampingGrid(hsc: ride.forkHSC, lsc: ride.forkLSC, hsr: ride.forkHSR, lsr: ride.forkLSR, fork: true)
                }

                Divider().overlay(Color.white.opacity(0.08))

                VStack(alignment: .leading, spacing: 10) {
                    HStack {
                        Label("Shock", systemImage: "waveform.path")
                            .font(.headline)
                        Spacer()
                        Text("\(Int(ride.shockPressure)) psi • \(ride.shockMode) progressive")
                            .font(.subheadline.monospacedDigit())
                    }
                    DampingGrid(hsc: ride.shockHSC, lsc: ride.shockLSC, hsr: ride.shockHSR, lsr: ride.shockLSR)
                }

                Divider().overlay(Color.white.opacity(0.08))

                HStack(spacing: 10) {
                    MetricPill(label: "Front tire", value: "\(Int(ride.frontTirePSI)) psi")
                    MetricPill(label: "Rear tire", value: "\(Int(ride.rearTirePSI)) psi")
                }
            }
            .appCard()
        }
    }

    private var quickActions: some View {
        HStack(spacing: 10) {
            Button(action: openRideLog) {
                Label("New Ride", systemImage: "plus.circle.fill")
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
            }
            .buttonStyle(.borderedProminent)

            Button(action: openSetup) {
                Label("Compare", systemImage: "chart.bar.xaxis")
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
            }
            .buttonStyle(.bordered)
        }
    }

    @ViewBuilder private var lastRide: some View {
        if let ride = current {
            VStack(alignment: .leading, spacing: 10) {
                SectionHeader(title: "Latest Entry")
                HStack {
                    Text(ride.date.formatted(date: .abbreviated, time: .omitted)).font(.headline)
                    Spacer()
                    if !ride.location.isEmpty { Text(ride.location).foregroundStyle(AppTheme.secondary) }
                }
                let summary = [ride.overallFeel, ride.nextTest, ride.notes].first { !$0.isEmpty }
                Text(summary ?? "No after-ride notes yet.")
                    .font(.subheadline)
                    .foregroundStyle(summary == nil ? AppTheme.secondary : .primary)
                    .lineLimit(3)
            }
            .appCard()
        }
    }

    private var statusCard: some View {
        Button(action: openService) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Bike Status").font(.headline).foregroundStyle(.primary)
                    Text("\(todos.count) open To Do items")
                        .font(.subheadline)
                        .foregroundStyle(AppTheme.secondary)
                }
                Spacer()
                Image(systemName: "chevron.right").foregroundStyle(AppTheme.secondary)
            }
            .appCard()
        }
        .buttonStyle(.plain)
    }
}

import SwiftUI
import SwiftData

private enum BaselineChoice: String, CaseIterable { case fox = "FOX", santaCruz = "Santa Cruz" }

struct SetupView: View {
    @Query(sort: \RideEntry.date, order: .reverse) private var rides: [RideEntry]
    @State private var baseline: BaselineChoice = .fox

    private var current: RideEntry? { rides.first }

    var body: some View {
        ZStack {
            AppTheme.page.ignoresSafeArea()
            ScrollView {
                VStack(spacing: 16) {
                    Picker("Baseline", selection: $baseline) {
                        ForEach(BaselineChoice.allCases, id: \.self) { Text($0.rawValue).tag($0) }
                    }
                    .pickerStyle(.segmented)

                    if let current {
                        summary(current)
                        forkComparison(current)
                        shockComparison(current)
                    }
                    conventionCard
                }
                .padding()
            }
        }
        .navigationTitle("Setup")
    }

    private func summary(_ ride: RideEntry) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            SectionHeader(title: "Baseline Comparison", subtitle: "Your current setup vs \(baseline.rawValue)")
            HStack(spacing: 10) {
                MetricPill(label: "Fork", value: "\(Int(ride.forkPressure)) psi")
                MetricPill(label: "Shock", value: "\(Int(ride.shockPressure)) psi")
            }
        }.appCard()
    }

    private func forkComparison(_ ride: RideEntry) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionHeader(title: "Fork — FOX 38 GRIP X2")
            if baseline == .fox {
                baselineRow("Pressure", current: ride.forkPressure, baseline: 102, unit: "psi", scale: 20, note: "FOX 170–180 lb FLOAT E-Bike+ starting pressure. Standard FLOAT table is 93 psi.")
                baselineRow("LSC", current: Double(ride.forkLSC), baseline: 10, unit: " clicks", scale: 8, note: deltaNote(current: ride.forkLSC, baseline: 10))
                baselineRow("HSC", current: Double(ride.forkHSC), baseline: 5, unit: " clicks", scale: 6, note: deltaNote(current: ride.forkHSC, baseline: 5))
                baselineRow("LSR", current: Double(ride.forkLSR), baseline: 7, unit: " clicks", scale: 7, note: "FOX 170–180 lb GRIP X2 starting point")
                baselineRow("HSR", current: Double(ride.forkHSR), baseline: 5, unit: " clicks", scale: 5, note: "FOX 170–180 lb GRIP X2 starting point")
                Text("FOX sag target: 15–20% = 25–34 mm at 170 mm travel.")
                    .font(.footnote).foregroundStyle(AppTheme.secondary)
                SourceLink(title: "FOX 2026 38 manual", url: ReferenceData.fox38ManualURL)
            } else {
                Text("Santa Cruz / your setup note records fork sag at 15–20%. No Santa Cruz fork-pressure value is stored, so the app does not invent one.")
                    .font(.subheadline)
                Text("Use measured sag as the Santa Cruz fork baseline.")
                    .font(.footnote).foregroundStyle(AppTheme.secondary)
            }
        }.appCard()
    }

    private func shockComparison(_ ride: RideEntry) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionHeader(title: "Shock — FOX Float X2")
            if baseline == .santaCruz {
                baselineRow("Pressure", current: ride.shockPressure, baseline: 195, unit: "psi", scale: 30, note: "Santa Cruz / setup-note starting point")
                if ride.shockSagPercent > 0 {
                    baselineRow("Sag", current: ride.shockSagPercent, baseline: 28, unit: "%", scale: 8, note: "Target 28% • about 18.2 mm on 65 mm stroke")
                } else {
                    HStack { Text("Sag"); Spacer(); Text("Target 28% • current not entered").foregroundStyle(AppTheme.secondary) }
                }
                Text("Shock damping is tune-specific. v0.1 keeps your values visible but does not invent a generic FOX X2 click baseline.")
                    .font(.footnote).foregroundStyle(AppTheme.secondary)
            } else {
                Text("FOX pressure and damping starting points for the rear shock depend on the exact shock tune / ID. v0.1 intentionally avoids a generic X2 baseline.")
                    .font(.subheadline)
            }
        }.appCard()
    }

    private var conventionCard: some View {
        VStack(alignment: .leading, spacing: 6) {
            SectionHeader(title: "Click Convention")
            Text("0 = fully closed. Turn fully clockwise to closed, then count clicks counterclockwise OUT/open.")
                .font(.subheadline)
        }.appCard()
    }

    private func deltaNote(current: Int, baseline: Int) -> String {
        let d = current - baseline
        if d == 0 { return "Matches baseline" }
        return d > 0 ? "\(d) clicks more open" : "\(-d) clicks more closed"
    }

    private func baselineRow(_ name: String, current: Double, baseline: Double, unit: String, scale: Double, note: String) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text(name).font(.subheadline.weight(.semibold))
                Spacer()
                Text("Mine \(value(current))\(unit)").font(.caption.monospacedDigit())
                Text("•").foregroundStyle(AppTheme.secondary)
                Text("Base \(value(baseline))\(unit)").font(.caption.monospacedDigit()).foregroundStyle(AppTheme.secondary)
            }
            ComparisonBar(current: current, baseline: baseline, scale: scale)
            Text(note).font(.caption).foregroundStyle(AppTheme.secondary)
        }
    }

    private func value(_ d: Double) -> String { d.rounded() == d ? String(Int(d)) : String(format: "%.1f", d) }
}

private struct ComparisonBar: View {
    let current: Double
    let baseline: Double
    let scale: Double

    var body: some View {
        GeometryReader { geo in
            let width = geo.size.width
            let center = width / 2
            let delta = max(-scale, min(scale, current - baseline))
            let x = center + (delta / scale) * (width * 0.43)
            ZStack(alignment: .leading) {
                Capsule().fill(AppTheme.cardRaised).frame(height: 8)
                Rectangle().fill(AppTheme.secondary.opacity(0.8)).frame(width: 2, height: 18).offset(x: center - 1, y: -5)
                Circle().fill(AppTheme.accent).frame(width: 14, height: 14).offset(x: x - 7, y: -3)
            }
        }
        .frame(height: 16)
    }
}

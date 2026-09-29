import SwiftUI

struct SectionHeader: View {
    let title: String
    var subtitle: String? = nil

    var body: some View {
        VStack(alignment: .leading, spacing: 3) {
            Text(title)
                .font(.title3.bold())
            if let subtitle {
                Text(subtitle)
                    .font(.footnote)
                    .foregroundStyle(AppTheme.secondary)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

struct MetricPill: View {
    let label: String
    let value: String

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(value)
                .font(.system(size: 21, weight: .semibold, design: .rounded))
            Text(label)
                .font(.caption)
                .foregroundStyle(AppTheme.secondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(12)
        .background(AppTheme.cardRaised)
        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
    }
}

struct DampingGrid: View {
    let hsc: Int
    let lsc: Int
    let hsr: Int
    let lsr: Int
    var fork: Bool = false

    var body: some View {
        Grid(horizontalSpacing: 10, verticalSpacing: 8) {
            GridRow {
                cell("HSC", hsc, fork ? 11 : nil)
                cell("LSC", lsc, fork ? 18 : nil)
            }
            GridRow {
                cell("HSR", hsr, fork ? 8 : nil)
                cell("LSR", lsr, fork ? 15 : nil)
            }
        }
    }

    @ViewBuilder private func cell(_ label: String, _ value: Int, _ total: Int?) -> some View {
        VStack(spacing: 2) {
            Text(total == nil ? "\(value)" : "\(value)/\(total!)")
                .font(.headline.monospacedDigit())
            Text(label)
                .font(.caption2)
                .foregroundStyle(AppTheme.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 10)
        .background(AppTheme.cardRaised)
        .clipShape(RoundedRectangle(cornerRadius: 10))
    }
}

struct StepperRow: View {
    let title: String
    @Binding var value: Int
    let range: ClosedRange<Int>
    var suffix: String = ""
    var total: Int? = nil

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text(title).font(.subheadline.weight(.medium))
                if title.contains("SC") || title.contains("SR") {
                    Text("Clicks OUT from fully closed")
                        .font(.caption2)
                        .foregroundStyle(AppTheme.secondary)
                }
            }
            Spacer()
            Button { value = max(range.lowerBound, value - 1) } label: {
                Image(systemName: "minus")
                    .frame(width: 34, height: 34)
                    .background(AppTheme.cardRaised)
                    .clipShape(Circle())
            }
            .buttonStyle(.plain)
            Text(total == nil ? "\(value)\(suffix)" : "\(value)/\(total!)\(suffix)")
                .font(.headline.monospacedDigit())
                .frame(minWidth: 58)
            Button { value = min(range.upperBound, value + 1) } label: {
                Image(systemName: "plus")
                    .frame(width: 34, height: 34)
                    .background(AppTheme.cardRaised)
                    .clipShape(Circle())
            }
            .buttonStyle(.plain)
        }
        .padding(.vertical, 4)
    }
}

struct DoubleStepperRow: View {
    let title: String
    @Binding var value: Double
    let range: ClosedRange<Double>
    var step: Double = 1
    var suffix: String = ""

    var body: some View {
        HStack {
            Text(title).font(.subheadline.weight(.medium))
            Spacer()
            Button { value = max(range.lowerBound, value - step) } label: {
                Image(systemName: "minus").frame(width: 34, height: 34).background(AppTheme.cardRaised).clipShape(Circle())
            }
            .buttonStyle(.plain)
            Text(format(value) + suffix)
                .font(.headline.monospacedDigit())
                .frame(minWidth: 68)
            Button { value = min(range.upperBound, value + step) } label: {
                Image(systemName: "plus").frame(width: 34, height: 34).background(AppTheme.cardRaised).clipShape(Circle())
            }
            .buttonStyle(.plain)
        }
        .padding(.vertical, 4)
    }

    private func format(_ n: Double) -> String {
        n.rounded() == n ? String(Int(n)) : String(format: "%.1f", n)
    }
}

struct SourceLink: View {
    let title: String
    let url: String

    var body: some View {
        if let target = URL(string: url) {
            Link(destination: target) {
                Label(title, systemImage: "arrow.up.right.square")
                    .font(.footnote.weight(.medium))
            }
        }
    }
}

struct EmptyComingSoon: View {
    let bike: String
    var body: some View {
        ContentUnavailableView("\(bike) coming next", systemImage: "bicycle", description: Text("Bullit is the template for v0.1. Once the workflow is locked, this bike will use the same structure."))
    }
}

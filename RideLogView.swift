import SwiftUI
import SwiftData

struct RideLogView: View {
    @Query(sort: \RideEntry.date, order: .reverse) private var rides: [RideEntry]
    @State private var showNewRide = false

    var body: some View {
        ZStack {
            AppTheme.page.ignoresSafeArea()
            List {
                ForEach(rides) { ride in
                    NavigationLink {
                        RideDetailView(ride: ride)
                    } label: {
                        VStack(alignment: .leading, spacing: 6) {
                            HStack {
                                Text(ride.date.formatted(date: .abbreviated, time: .omitted)).font(.headline)
                                Spacer()
                                Text("F \(Int(ride.forkPressure)) • R \(Int(ride.shockPressure)) psi")
                                    .font(.subheadline.monospacedDigit())
                                    .foregroundStyle(AppTheme.secondary)
                            }
                            if !ride.location.isEmpty || !ride.trail.isEmpty {
                                Text([ride.location, ride.trail].filter { !$0.isEmpty }.joined(separator: " • "))
                                    .font(.subheadline)
                            }
                            let note = [ride.overallFeel, ride.notes].first { !$0.isEmpty }
                            if let note {
                                Text(note).font(.caption).foregroundStyle(AppTheme.secondary).lineLimit(2)
                            }
                        }
                        .padding(.vertical, 5)
                    }
                    .listRowBackground(AppTheme.card)
                }
            }
            .scrollContentBackground(.hidden)
        }
        .navigationTitle("Ride Log")
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button { showNewRide = true } label: { Image(systemName: "plus") }
            }
        }
        .safeAreaInset(edge: .bottom) {
            Button { showNewRide = true } label: {
                Label("New Ride", systemImage: "plus.circle.fill")
                    .font(.headline)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 13)
            }
            .buttonStyle(.borderedProminent)
            .padding(.horizontal)
            .padding(.bottom, 4)
            .background(.ultraThinMaterial)
        }
        .sheet(isPresented: $showNewRide) {
            NewRideView(template: rides.first)
        }
    }
}

struct RideDetailView: View {
    let ride: RideEntry

    var body: some View {
        ZStack {
            AppTheme.page.ignoresSafeArea()
            ScrollView {
                VStack(spacing: 14) {
                    VStack(alignment: .leading, spacing: 8) {
                        Text(ride.date.formatted(date: .long, time: .omitted)).font(.title2.bold())
                        Text([ride.location, ride.trail, ride.conditions].filter { !$0.isEmpty }.joined(separator: " • "))
                            .foregroundStyle(AppTheme.secondary)
                    }.frame(maxWidth: .infinity, alignment: .leading).appCard()

                    VStack(alignment: .leading, spacing: 10) {
                        SectionHeader(title: "Fork")
                        Text("\(Int(ride.forkPressure)) psi • \(ride.forkTravel) mm • \(ride.forkVolumeSpacers) volume spacer")
                        DampingGrid(hsc: ride.forkHSC, lsc: ride.forkLSC, hsr: ride.forkHSR, lsr: ride.forkLSR, fork: true)
                    }.appCard()

                    VStack(alignment: .leading, spacing: 10) {
                        SectionHeader(title: "Shock")
                        Text("\(Int(ride.shockPressure)) psi • \(ride.shockMode) progressive")
                        DampingGrid(hsc: ride.shockHSC, lsc: ride.shockLSC, hsr: ride.shockHSR, lsr: ride.shockLSR)
                    }.appCard()

                    VStack(alignment: .leading, spacing: 10) {
                        SectionHeader(title: "After Ride")
                        detail("Overall feel", ride.overallFeel)
                        detail("Bottom-out / travel", ride.bottomOutNotes)
                        detail("Grip / support / chatter", ride.gripSupportChatter)
                        detail("What worked", ride.whatWorked)
                        detail("What didn't", ride.whatDidnt)
                        detail("Next test", ride.nextTest)
                        detail("Notes", ride.notes)
                    }.appCard()
                }.padding()
            }
        }
        .navigationTitle("Ride")
        .navigationBarTitleDisplayMode(.inline)
    }

    @ViewBuilder private func detail(_ label: String, _ value: String) -> some View {
        if !value.isEmpty {
            VStack(alignment: .leading, spacing: 2) {
                Text(label).font(.caption).foregroundStyle(AppTheme.secondary)
                Text(value)
            }
        }
    }
}

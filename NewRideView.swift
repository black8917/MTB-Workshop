import SwiftUI
import SwiftData

struct NewRideView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.modelContext) private var modelContext

    private let template: RideEntry?

    @State private var date = Date.now
    @State private var location = ""
    @State private var trail = ""
    @State private var conditions = ""
    @State private var rideTime = 0
    @State private var elevation = 0

    @State private var forkPressure = 99.0
    @State private var forkTravel = 170
    @State private var forkVolume = 1
    @State private var forkLSC = 10
    @State private var forkHSC = 8
    @State private var forkLSR = 6
    @State private var forkHSR = 6

    @State private var shockPressure = 200.0
    @State private var shockMode = "HI"
    @State private var shockLSC = 5
    @State private var shockHSC = 4
    @State private var shockLSR = 11
    @State private var shockHSR = 3
    @State private var shockSag = 0.0

    @State private var frontPSI = 27.0
    @State private var rearPSI = 30.0

    @State private var overallFeel = ""
    @State private var forkTravelUsed = 0
    @State private var shockTravelUsed = 0
    @State private var bottomOut = ""
    @State private var chatter = ""
    @State private var worked = ""
    @State private var didnt = ""
    @State private var nextTest = ""
    @State private var notes = ""

    init(template: RideEntry?) {
        self.template = template
    }

    var body: some View {
        NavigationStack {
            ZStack {
                AppTheme.page.ignoresSafeArea()
                ScrollView {
                    VStack(spacing: 16) {
                        rideInfo
                        tireSetup
                        forkSetup
                        shockSetup
                        afterRide
                    }
                    .padding()
                }
            }
            .navigationTitle("New Ride")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) { Button("Save") { save() }.fontWeight(.semibold) }
            }
            .onAppear(perform: loadTemplate)
        }
    }

    private var rideInfo: some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionHeader(title: "Ride")
            DatePicker("Date", selection: $date, displayedComponents: .date)
            TextField("Location", text: $location).textFieldStyle(.roundedBorder)
            TextField("Trail / route", text: $trail).textFieldStyle(.roundedBorder)
            TextField("Conditions", text: $conditions).textFieldStyle(.roundedBorder)
            HStack {
                TextField("Ride time (min)", value: $rideTime, format: .number).keyboardType(.numberPad).textFieldStyle(.roundedBorder)
                TextField("Elevation ft", value: $elevation, format: .number).keyboardType(.numberPad).textFieldStyle(.roundedBorder)
            }
        }.appCard()
    }

    private var tireSetup: some View {
        VStack(alignment: .leading, spacing: 8) {
            SectionHeader(title: "Tires")
            DoubleStepperRow(title: "Front", value: $frontPSI, range: 10...50, step: 0.5, suffix: " psi")
            DoubleStepperRow(title: "Rear", value: $rearPSI, range: 10...50, step: 0.5, suffix: " psi")
        }.appCard()
    }

    private var forkSetup: some View {
        VStack(alignment: .leading, spacing: 8) {
            SectionHeader(title: "FOX 38 GRIP X2", subtitle: "170 mm • clicks OUT from fully closed")
            DoubleStepperRow(title: "Pressure", value: $forkPressure, range: 40...140, suffix: " psi")
            StepperRow(title: "Volume spacers", value: $forkVolume, range: 0...6)
            StepperRow(title: "HSC", value: $forkHSC, range: 0...11, total: 11)
            StepperRow(title: "LSC", value: $forkLSC, range: 0...18, total: 18)
            StepperRow(title: "HSR", value: $forkHSR, range: 0...8, total: 8)
            StepperRow(title: "LSR", value: $forkLSR, range: 0...15, total: 15)
        }.appCard()
    }

    private var shockSetup: some View {
        VStack(alignment: .leading, spacing: 8) {
            SectionHeader(title: "FOX Float X2", subtitle: "Bullit-specific tune • clicks OUT from fully closed")
            DoubleStepperRow(title: "Pressure", value: $shockPressure, range: 100...350, suffix: " psi")
            Picker("Progressive mode", selection: $shockMode) {
                Text("HI").tag("HI")
                Text("LO").tag("LO")
            }.pickerStyle(.segmented)
            StepperRow(title: "HSC", value: $shockHSC, range: 0...24)
            StepperRow(title: "LSC", value: $shockLSC, range: 0...24)
            StepperRow(title: "HSR", value: $shockHSR, range: 0...24)
            StepperRow(title: "LSR", value: $shockLSR, range: 0...24)
            DoubleStepperRow(title: "Sag", value: $shockSag, range: 0...40, step: 0.5, suffix: "%")
        }.appCard()
    }

    private var afterRide: some View {
        VStack(alignment: .leading, spacing: 10) {
            SectionHeader(title: "After Ride", subtitle: "Setup → ride impression → next test")
            TextField("Overall feel", text: $overallFeel, axis: .vertical).textFieldStyle(.roundedBorder)
            HStack {
                TextField("Fork travel used mm", value: $forkTravelUsed, format: .number).keyboardType(.numberPad).textFieldStyle(.roundedBorder)
                TextField("Shock travel used mm", value: $shockTravelUsed, format: .number).keyboardType(.numberPad).textFieldStyle(.roundedBorder)
            }
            TextField("Bottom-out / travel observations", text: $bottomOut, axis: .vertical).textFieldStyle(.roundedBorder)
            TextField("Grip / support / chatter", text: $chatter, axis: .vertical).textFieldStyle(.roundedBorder)
            TextField("What worked", text: $worked, axis: .vertical).textFieldStyle(.roundedBorder)
            TextField("What didn't", text: $didnt, axis: .vertical).textFieldStyle(.roundedBorder)
            TextField("Next change / test", text: $nextTest, axis: .vertical).textFieldStyle(.roundedBorder)
            TextField("Freeform notes", text: $notes, axis: .vertical).textFieldStyle(.roundedBorder)
        }.appCard()
    }

    private func loadTemplate() {
        guard let t = template else { return }
        forkPressure = t.forkPressure
        forkTravel = t.forkTravel
        forkVolume = t.forkVolumeSpacers
        forkLSC = t.forkLSC
        forkHSC = t.forkHSC
        forkLSR = t.forkLSR
        forkHSR = t.forkHSR
        shockPressure = t.shockPressure
        shockMode = t.shockMode
        shockLSC = t.shockLSC
        shockHSC = t.shockHSC
        shockLSR = t.shockLSR
        shockHSR = t.shockHSR
        shockSag = t.shockSagPercent
        frontPSI = t.frontTirePSI
        rearPSI = t.rearTirePSI
    }

    private func save() {
        modelContext.insert(RideEntry(
            date: date, location: location, trail: trail, conditions: conditions, rideTimeMinutes: rideTime, elevationFeet: elevation,
            forkPressure: forkPressure, forkTravel: forkTravel, forkVolumeSpacers: forkVolume, forkLSC: forkLSC, forkHSC: forkHSC, forkLSR: forkLSR, forkHSR: forkHSR,
            shockPressure: shockPressure, shockMode: shockMode, shockLSC: shockLSC, shockHSC: shockHSC, shockLSR: shockLSR, shockHSR: shockHSR, shockSagPercent: shockSag,
            frontTirePSI: frontPSI, rearTirePSI: rearPSI,
            overallFeel: overallFeel, forkTravelUsedMM: forkTravelUsed, shockTravelUsedMM: shockTravelUsed, bottomOutNotes: bottomOut,
            gripSupportChatter: chatter, whatWorked: worked, whatDidnt: didnt, nextTest: nextTest, notes: notes
        ))
        try? modelContext.save()
        dismiss()
    }
}

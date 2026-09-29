import SwiftUI

private enum SpecsSection: String, CaseIterable { case build = "Build", geometry = "Geometry", torque = "Torque", components = "Components" }

struct SpecsView: View {
    @State private var section: SpecsSection = .build
    @State private var torqueSearch = ""

    var body: some View {
        ZStack {
            AppTheme.page.ignoresSafeArea()
            ScrollView {
                VStack(spacing: 16) {
                    Picker("Section", selection: $section) {
                        ForEach(SpecsSection.allCases, id: \.self) { Text($0.rawValue).tag($0) }
                    }
                    .pickerStyle(.segmented)

                    switch section {
                    case .build: buildView
                    case .geometry: geometryView
                    case .torque: torqueView
                    case .components: componentsView
                    }
                }
                .padding()
            }
        }
        .navigationTitle("Specs")
    }

    private var buildView: some View {
        VStack(spacing: 14) {
            VStack(alignment: .leading, spacing: 10) {
                SectionHeader(title: "2026 Bullit GX — Large", subtitle: "Factory platform")
                ForEach(ReferenceData.modelSpecs) { spec in
                    specLine(spec.item, spec.value, detail: spec.note)
                }
                SourceLink(title: "Santa Cruz Bullit 4 MY26", url: ReferenceData.santaCruzURL)
            }.appCard()

            VStack(alignment: .leading, spacing: 10) {
                SectionHeader(title: "Current Build", subtitle: "Stock GX compared with your installed parts")
                ForEach(ReferenceData.buildSpecs) { item in
                    VStack(alignment: .leading, spacing: 3) {
                        Text(item.category).font(.headline)
                        Text("Current: \(item.current)").font(.subheadline)
                        Text("Stock GX: \(item.stock)").font(.caption).foregroundStyle(AppTheme.secondary)
                    }
                    if item.id != ReferenceData.buildSpecs.last?.id { Divider().overlay(Color.white.opacity(0.08)) }
                }
            }.appCard()
        }
    }

    private var geometryView: some View {
        VStack(alignment: .leading, spacing: 10) {
            SectionHeader(title: "Large Geometry", subtitle: "Official 2026 Santa Cruz Bullit 4 • Hi / Lo")
            HStack {
                Text("Measurement").font(.caption.bold()).foregroundStyle(AppTheme.secondary)
                Spacer(); Text("HI").font(.caption.bold()).foregroundStyle(AppTheme.secondary).frame(width: 70, alignment: .trailing)
                Text("LO").font(.caption.bold()).foregroundStyle(AppTheme.secondary).frame(width: 70, alignment: .trailing)
            }
            ForEach(ReferenceData.geometryLarge) { item in
                HStack {
                    Text(item.name).font(.subheadline)
                    Spacer()
                    Text(item.hi).font(.subheadline.monospacedDigit()).frame(width: 70, alignment: .trailing)
                    Text(item.lo ?? "—").font(.subheadline.monospacedDigit()).foregroundStyle(item.lo == nil ? AppTheme.secondary : .primary).frame(width: 70, alignment: .trailing)
                }
                Divider().overlay(Color.white.opacity(0.06))
            }
            SourceLink(title: "Santa Cruz geometry source", url: ReferenceData.santaCruzURL)
        }.appCard()
    }

    private var torqueView: some View {
        VStack(spacing: 12) {
            TextField("Search axle, shock, stem, crank…", text: $torqueSearch)
                .textFieldStyle(.roundedBorder)
            ForEach(filteredTorque) { item in
                VStack(alignment: .leading, spacing: 6) {
                    HStack(alignment: .firstTextBaseline) {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(item.item).font(.headline)
                            Text(item.component).font(.caption).foregroundStyle(AppTheme.secondary)
                        }
                        Spacer()
                        Text(item.torque).font(.title3.bold().monospacedDigit()).foregroundStyle(item.torque == "Not published" ? AppTheme.warning : AppTheme.accent)
                    }
                    Text(item.note).font(.subheadline).foregroundStyle(AppTheme.secondary)
                    SourceLink(title: item.source, url: item.sourceURL)
                }.appCard()
            }
        }
    }

    private var componentsView: some View {
        VStack(spacing: 12) {
            NavigationLink {
                ForkServiceView()
            } label: {
                componentCard("FOX 38 GRIP X2", subtitle: "Lower service oil, volumes, torque & intervals", icon: "arrow.up.and.down")
            }.buttonStyle(.plain)

            componentCard("FOX Float X2", subtitle: "Bullit-specific 205×65 tune • service data next", icon: "waveform.path")
            componentCard("Shimano Saint + TRP", subtitle: "Saint calipers • TRP 223 rotors • blue resin pads", icon: "circle.circle")
            componentCard("Cockpit", subtitle: "OneUp carbon bar • OneUp stem • ODI half-waffle", icon: "handlebars")
            componentCard("Wheels & tires", subtitle: "29 / 27.5 MX • Magic Mary / Tacky Chan", icon: "circle.dashed")
            componentCard("Bosch + drivetrain", subtitle: "CX BDU38 • GX Eagle • anti-pedal kickback 20°", icon: "bolt.fill")
        }
    }

    private var filteredTorque: [TorqueSpec] {
        if torqueSearch.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty { return ReferenceData.torqueSpecs }
        return ReferenceData.torqueSpecs.filter {
            ($0.component + " " + $0.item + " " + $0.note).localizedCaseInsensitiveContains(torqueSearch)
        }
    }

    @ViewBuilder private func specLine(_ name: String, _ value: String, detail: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            HStack { Text(name).foregroundStyle(AppTheme.secondary); Spacer(); Text(value).fontWeight(.semibold).multilineTextAlignment(.trailing) }
            Text(detail).font(.caption).foregroundStyle(AppTheme.secondary)
        }
        Divider().overlay(Color.white.opacity(0.06))
    }

    private func componentCard(_ title: String, subtitle: String, icon: String) -> some View {
        HStack(spacing: 14) {
            Image(systemName: icon).font(.title2).foregroundStyle(AppTheme.accent).frame(width: 34)
            VStack(alignment: .leading, spacing: 3) {
                Text(title).font(.headline).foregroundStyle(.primary)
                Text(subtitle).font(.subheadline).foregroundStyle(AppTheme.secondary)
            }
            Spacer()
            Image(systemName: "chevron.right").foregroundStyle(AppTheme.secondary)
        }.appCard()
    }
}

struct ForkServiceView: View {
    var body: some View {
        ZStack {
            AppTheme.page.ignoresSafeArea()
            ScrollView {
                VStack(spacing: 16) {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("FOX 38 GRIP X2").font(.title2.bold())
                        Text("170 mm • 38 FLOAT NA2 • lower-service quick reference")
                            .foregroundStyle(AppTheme.secondary)
                    }.frame(maxWidth: .infinity, alignment: .leading).appCard()

                    VStack(alignment: .leading, spacing: 10) {
                        SectionHeader(title: "Lower Service")
                        ForEach(ReferenceData.forkLowerService) { item in
                            VStack(alignment: .leading, spacing: 2) {
                                HStack { Text(item.item); Spacer(); Text(item.value).fontWeight(.semibold).multilineTextAlignment(.trailing) }
                                Text(item.note).font(.caption).foregroundStyle(AppTheme.secondary)
                            }
                            Divider().overlay(Color.white.opacity(0.06))
                        }
                    }.appCard()

                    VStack(alignment: .leading, spacing: 8) {
                        SectionHeader(title: "Official References")
                        SourceLink(title: "FOX 2026 bath-oil chart", url: ReferenceData.foxOilURL)
                        SourceLink(title: "FOX 38 parts / service information", url: ReferenceData.foxPartsURL)
                        SourceLink(title: "FOX 2026 38 owner's manual", url: ReferenceData.fox38ManualURL)
                    }.appCard()

                    Text("Use the exact component serial / tune ID when a FOX procedure varies by model revision. This quick reference intentionally omits any value not verified for this fork family.")
                        .font(.footnote)
                        .foregroundStyle(AppTheme.secondary)
                        .padding(.horizontal)
                }.padding()
            }
        }
        .navigationTitle("Fork Service")
        .navigationBarTitleDisplayMode(.inline)
    }
}

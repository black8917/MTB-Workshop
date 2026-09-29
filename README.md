# BikeWorkshop — iPhone prototype v0.1

Native SwiftUI + SwiftData prototype for the user's 2026 Santa Cruz Bullit GX (Large). The Bullit is the template bike; Supreme V5 and Nomad are intentionally not implemented yet.

## Requirements
- Xcode 16 or newer recommended
- iOS 17.0+ (SwiftData)
- An Apple developer signing team to install on a physical iPhone

## Run on iPhone
1. Open `BikeWorkshop.xcodeproj` in Xcode.
2. Select the **BikeWorkshop** target → **Signing & Capabilities**.
3. Choose your Apple ID / Team and, if Xcode asks, change the bundle identifier to something unique.
4. Connect the iPhone, select it as the run destination, and press Run.
5. If prompted on the phone, enable Developer Mode / trust the developer certificate.

## v0.1 included
- Garmin-inspired dark, glanceable dashboard
- Unified Current Setup: fork + shock + tires + full HSC/LSC/HSR/LSR
- Ride log with New Ride prefilled from previous setup
- Dedicated After Ride notes and next-test fields
- FOX / Santa Cruz baseline comparison bars
- To Do + Maintenance
- Official 2026 Bullit Large geometry
- Searchable torque reference
- Component reference area
- FOX 38 GRIP X2 lower-service quick reference
- Local/offline persistence using SwiftData

## Important data notes
- Suspension clicks are stored as **clicks OUT from fully closed**: close clockwise, then count counterclockwise.
- The 9/30/2026 source note has a blank rear-shock LSC field. v0.1 carries forward LSC 5 from 9/9/2026 and flags it for confirmation.
- Santa Cruz publishes no rear-axle torque in the Bullit MY26 exploded table; v0.1 says “Not published” rather than guessing.
- Santa Cruz lists a 220 mm maximum rotor for the frame, while the current bike data records TRP 223 mm rotors. The app preserves both facts instead of silently reconciling them.

## Sources
See `SOURCES.md`. Manufacturer/service values were checked against official Santa Cruz, FOX, OneUp and SRAM pages on 2026-09-29. Shimano caliper mounting is shown as 6–8 Nm and should still be verified against the exact adapter/bolt arrangement during service.

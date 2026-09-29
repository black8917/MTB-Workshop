import SwiftUI

enum AppTheme {
    static let page = Color(red: 0.035, green: 0.047, blue: 0.065)
    static let card = Color(red: 0.075, green: 0.090, blue: 0.115)
    static let cardRaised = Color(red: 0.105, green: 0.122, blue: 0.150)
    static let accent = Color(red: 0.18, green: 0.72, blue: 0.98)
    static let secondary = Color(red: 0.63, green: 0.68, blue: 0.75)
    static let positive = Color(red: 0.35, green: 0.82, blue: 0.55)
    static let warning = Color(red: 1.0, green: 0.71, blue: 0.26)

    static let corner: CGFloat = 18
}

struct CardModifier: ViewModifier {
    func body(content: Content) -> some View {
        content
            .padding(16)
            .background(AppTheme.card)
            .clipShape(RoundedRectangle(cornerRadius: AppTheme.corner, style: .continuous))
    }
}

extension View {
    func appCard() -> some View { modifier(CardModifier()) }
}

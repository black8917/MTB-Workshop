import SwiftUI
import SwiftData

private enum ServiceSection: String, CaseIterable { case todo = "To Do", maintenance = "Maintenance" }

struct ServiceView: View {
    @Environment(\.modelContext) private var modelContext
    @Query(sort: \TodoItem.sortOrder) private var todos: [TodoItem]
    @Query(sort: \MaintenanceEntry.date, order: .reverse) private var maintenance: [MaintenanceEntry]
    @State private var section: ServiceSection = .todo
    @State private var addTodo = false
    @State private var addMaintenance = false

    var body: some View {
        ZStack {
            AppTheme.page.ignoresSafeArea()
            VStack {
                Picker("Section", selection: $section) {
                    ForEach(ServiceSection.allCases, id: \.self) { Text($0.rawValue).tag($0) }
                }
                .pickerStyle(.segmented)
                .padding(.horizontal)

                List {
                    if section == .todo {
                        ForEach(todos) { item in
                            HStack(spacing: 12) {
                                Button {
                                    item.isDone.toggle()
                                    try? modelContext.save()
                                } label: {
                                    Image(systemName: item.isDone ? "checkmark.circle.fill" : "circle")
                                        .foregroundStyle(item.isDone ? AppTheme.positive : AppTheme.secondary)
                                }
                                .buttonStyle(.plain)
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(item.title).strikethrough(item.isDone)
                                    if !item.notes.isEmpty { Text(item.notes).font(.caption).foregroundStyle(AppTheme.secondary) }
                                }
                            }
                            .listRowBackground(AppTheme.card)
                        }
                        .onDelete { indexSet in
                            for i in indexSet { modelContext.delete(todos[i]) }
                        }
                    } else {
                        ForEach(maintenance) { item in
                            VStack(alignment: .leading, spacing: 4) {
                                HStack { Text(item.title).font(.headline); Spacer(); Text(item.date.formatted(date: .abbreviated, time: .omitted)).font(.caption).foregroundStyle(AppTheme.secondary) }
                                if !item.notes.isEmpty { Text(item.notes).font(.subheadline).foregroundStyle(AppTheme.secondary) }
                            }
                            .listRowBackground(AppTheme.card)
                        }
                    }
                }
                .scrollContentBackground(.hidden)
            }
        }
        .navigationTitle("Service")
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    section == .todo ? (addTodo = true) : (addMaintenance = true)
                } label: { Image(systemName: "plus") }
            }
        }
        .sheet(isPresented: $addTodo) { AddTodoSheet() }
        .sheet(isPresented: $addMaintenance) { AddMaintenanceSheet() }
    }
}

private struct AddTodoSheet: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.modelContext) private var modelContext
    @State private var title = ""
    @State private var notes = ""
    var body: some View {
        NavigationStack {
            Form {
                TextField("Item", text: $title)
                TextField("Notes", text: $notes, axis: .vertical)
            }
            .navigationTitle("Add To Do")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Add") {
                        modelContext.insert(TodoItem(title: title, notes: notes, sortOrder: Int(Date().timeIntervalSince1970)))
                        try? modelContext.save(); dismiss()
                    }.disabled(title.isEmpty)
                }
            }
        }
    }
}

private struct AddMaintenanceSheet: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.modelContext) private var modelContext
    @State private var date = Date.now
    @State private var title = ""
    @State private var notes = ""
    var body: some View {
        NavigationStack {
            Form {
                DatePicker("Date", selection: $date, displayedComponents: .date)
                TextField("Work performed", text: $title)
                TextField("Notes", text: $notes, axis: .vertical)
            }
            .navigationTitle("Maintenance")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        modelContext.insert(MaintenanceEntry(date: date, title: title, notes: notes))
                        try? modelContext.save(); dismiss()
                    }.disabled(title.isEmpty)
                }
            }
        }
    }
}

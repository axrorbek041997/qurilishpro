import * as XLSX from 'xlsx'
import { Expense, Worker, AttendanceRecord, MaterialTransaction, Material, EXPENSE_CATEGORIES } from '../types'
import { format } from 'date-fns'

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('uz-UZ').format(amount) + ' UZS'
}

export function exportToExcel(params: {
  expenses: Expense[]
  workers: Worker[]
  attendance: AttendanceRecord[]
  transactions: MaterialTransaction[]
  materials: Material[]
  dateRange: { from: string; to: string }
  projectName: string
}) {
  const { expenses, workers, attendance, transactions, materials, dateRange, projectName } = params

  const wb = XLSX.utils.book_new()

  // --- Expenses Sheet ---
  const expenseRows = expenses.map((e) => ({
    Date: format(new Date(e.date), 'dd/MM/yyyy'),
    Category: EXPENSE_CATEGORIES[e.category]?.label ?? e.category,
    Amount: e.amount,
    'Amount (formatted)': formatCurrency(e.amount),
    Note: e.note ?? '',
  }))
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)
  expenseRows.push({
    Date: '',
    Category: 'TOTAL',
    Amount: totalExpenses,
    'Amount (formatted)': formatCurrency(totalExpenses),
    Note: '',
  })
  const wsExpenses = XLSX.utils.json_to_sheet(expenseRows)
  wsExpenses['!cols'] = [{ wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 20 }, { wch: 40 }]
  XLSX.utils.book_append_sheet(wb, wsExpenses, 'Expenses')

  // --- Workers Attendance Sheet ---
  const dates = [...new Set(attendance.map((a) => a.date))].sort()
  const workerRows = workers.map((w) => {
    const row: Record<string, string | number> = {
      Name: w.name,
      Role: w.role,
      'Daily Wage': w.dailyWage,
    }
    let daysPresent = 0
    dates.forEach((d) => {
      const rec = attendance.find((a) => a.workerId === w.id && a.date === d)
      const present = rec?.present ?? false
      row[format(new Date(d), 'dd/MM')] = present ? 'P' : 'A'
      if (present) daysPresent++
    })
    row['Days Present'] = daysPresent
    row['Total Earned'] = w.dailyWage * daysPresent
    row['Total Earned (formatted)'] = formatCurrency(w.dailyWage * daysPresent)
    return row
  })
  const wsWorkers = XLSX.utils.json_to_sheet(workerRows)
  wsWorkers['!cols'] = [{ wch: 24 }, { wch: 16 }, { wch: 14 }, ...dates.map(() => ({ wch: 7 })), { wch: 14 }, { wch: 14 }, { wch: 24 }]
  XLSX.utils.book_append_sheet(wb, wsWorkers, 'Workers')

  // --- Materials Sheet ---
  const materialStock: Record<string, { in: number; out: number }> = {}
  materials.forEach((m) => {
    materialStock[m.id] = { in: 0, out: 0 }
  })
  transactions.forEach((t) => {
    if (!materialStock[t.materialId]) materialStock[t.materialId] = { in: 0, out: 0 }
    if (t.type === 'in') materialStock[t.materialId].in += t.quantity
    else materialStock[t.materialId].out += t.quantity
  })
  const materialRows = materials.map((m) => ({
    Material: m.name,
    Unit: m.unit,
    'Total IN': materialStock[m.id]?.in ?? 0,
    'Total OUT': materialStock[m.id]?.out ?? 0,
    'Current Stock': (materialStock[m.id]?.in ?? 0) - (materialStock[m.id]?.out ?? 0),
    'Min Stock': m.minStock ?? '-',
  }))
  const wsMaterials = XLSX.utils.json_to_sheet(materialRows)
  wsMaterials['!cols'] = [{ wch: 20 }, { wch: 8 }, { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 12 }]
  XLSX.utils.book_append_sheet(wb, wsMaterials, 'Materials')

  // --- Transactions Sheet ---
  const txRows = transactions.map((t) => {
    const material = materials.find((m) => m.id === t.materialId)
    return {
      Date: format(new Date(t.date), 'dd/MM/yyyy'),
      Material: material?.name ?? t.materialId,
      Unit: material?.unit ?? '',
      Type: t.type.toUpperCase(),
      Quantity: t.quantity,
      Note: t.note ?? '',
    }
  })
  const wsTx = XLSX.utils.json_to_sheet(txRows)
  wsTx['!cols'] = [{ wch: 12 }, { wch: 20 }, { wch: 8 }, { wch: 8 }, { wch: 10 }, { wch: 40 }]
  XLSX.utils.book_append_sheet(wb, wsTx, 'Material Transactions')

  const fileName = `${projectName.replace(/\s+/g, '_')}_Report_${dateRange.from}_${dateRange.to}.xlsx`
  XLSX.writeFile(wb, fileName)
}

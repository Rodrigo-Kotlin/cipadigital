export interface CsvVoterRow {
  line: number
  name: string
  cpf: string
  department: string | null
  role: string | null
  registrationNumber: string | null
  error?: string
}

function splitCsvLine(line: string): string[] {
  const cells: string[] = []
  let cell = ''
  let quoted = false

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]
    if (char === '"') quoted = !quoted
    else if (char === ',' && !quoted) {
      cells.push(cell.trim().replace(/^"|"$/g, ''))
      cell = ''
    } else cell += char
  }
  cells.push(cell.trim().replace(/^"|"$/g, ''))
  return cells
}

export function parseVoterCsv(csv: string): CsvVoterRow[] {
  const lines = csv.trim().split(/\r?\n/).filter(Boolean)
  if (lines.length < 2) return []

  return lines.slice(1).map((line, index) => {
    const [name = '', cpf = '', department = '', role = '', registrationNumber = ''] =
      splitCsvLine(line)
    return {
      line: index + 2,
      name,
      cpf,
      department: department || null,
      role: role || null,
      registrationNumber: registrationNumber || null,
      error: !name ? 'Nome obrigatório.' : !cpf ? 'CPF obrigatório.' : undefined,
    }
  })
}

// Простой парсер markdown для описаний статусов
// Поддерживает: **жирный**, *курсив*, \n перенос строки, таблицы
export function parseMarkdown(text) {
  if (!text) return null;

  // Проверяем, есть ли таблица в тексте
  const tableMatch = text.match(/\n?\|(.+)\|\n?\|(.+)\|\n((?:\|.+\|\n?)+)/);

  if (tableMatch) {
    const beforeTable = text.split(tableMatch[0])[0];
    const tableContent = tableMatch[0];
    const afterTable = text.split(tableMatch[0])[1] || "";

    return (
      <>
        {beforeTable && parseMarkdown(beforeTable.trim())}
        {parseTable(tableContent)}
        {afterTable && parseMarkdown(afterTable.trim())}
      </>
    );
  }

  return text.split("\n").map((line, index) => {
    // Пропускаем строки таблицы
    if (line.trim().startsWith("|")) {
      return null;
    }

    // Разбиваем строку на части с форматированием
    const parts = line.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);

    return (
      <span key={index} className="status-description-line">
        {parts.map((part, i) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return <strong key={i}>{part.slice(2, -2)}</strong>;
          } else if (part.startsWith("*") && part.endsWith("*")) {
            return <em key={i}>{part.slice(1, -1)}</em>;
          }
          return part;
        })}
      </span>
    );
  });
}

// Парсер таблиц markdown
function parseTable(tableText) {
  const rows = tableText
    .trim()
    .split("\n")
    .filter((row) => row.trim());
  const headerRow = rows[0];
  const separatorRow = rows[1];
  const dataRows = rows.slice(2);

  const parseRow = (rowText) => {
    return rowText
      .split("|")
      .filter((cell, i) => i > 0 && i < rowText.split("|").length - 1)
      .map((cell) => cell.trim());
  };

  const headers = parseRow(headerRow);
  const data = dataRows.map((row) => parseRow(row));

  return (
    <table>
      <thead>
        <tr>
          {headers.map((header, i) => (
            <th key={i}>{parseMarkdown(header)}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {row.map((cell, cellIndex) => (
              <td key={cellIndex}>{parseMarkdown(cell)}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

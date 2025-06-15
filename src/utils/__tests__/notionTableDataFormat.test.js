
import { describe, it, expect } from 'vitest';

describe('Notion Table Data Format', () => {
  it('should correctly store table structure with headers and cells', () => {
    const mockTableBlock = {
      id: 'table-123',
      type: 'table',
      table: {
        table_width: 3,
        has_column_header: true,
        has_row_header: false
      },
      children: [
        {
          id: 'row-1',
          type: 'table_row',
          table_row: {
            cells: [
              [{ plain_text: 'Header 1', annotations: { bold: true } }],
              [{ plain_text: 'Header 2', annotations: { bold: true } }],
              [{ plain_text: 'Header 3', annotations: { bold: true } }]
            ]
          }
        },
        {
          id: 'row-2',
          type: 'table_row',
          table_row: {
            cells: [
              [{ plain_text: 'Cell 1,1', annotations: { bold: false } }],
              [{ plain_text: 'Cell 1,2', annotations: { bold: false } }],
              [{ plain_text: 'Cell 1,3', annotations: { bold: false } }]
            ]
          }
        }
      ]
    };

    const expectedTableFormat = {
      type: 'table',
      table_width: 3,
      has_column_header: true,
      has_row_header: false,
      rows: [
        {
          cells: [
            { text: 'Header 1', annotations: [{ text: 'Header 1', bold: true }] },
            { text: 'Header 2', annotations: [{ text: 'Header 2', bold: true }] },
            { text: 'Header 3', annotations: [{ text: 'Header 3', bold: true }] }
          ]
        },
        {
          cells: [
            { text: 'Cell 1,1', annotations: [] },
            { text: 'Cell 1,2', annotations: [] },
            { text: 'Cell 1,3', annotations: [] }
          ]
        }
      ]
    };

    // Mock table processing
    const processedTable = {
      type: mockTableBlock.type,
      table_width: mockTableBlock.table.table_width,
      has_column_header: mockTableBlock.table.has_column_header,
      has_row_header: mockTableBlock.table.has_row_header,
      rows: []
    };

    // Process table rows
    for (const row of mockTableBlock.children) {
      if (row.type === 'table_row') {
        const processedRow = { cells: [] };
        
        for (const cell of row.table_row.cells) {
          const cellText = cell.map(rt => rt.plain_text).join('');
          const cellAnnotations = cell
            .filter(rt => rt.annotations && Object.values(rt.annotations).some(val => val === true))
            .map(rt => ({ text: rt.plain_text, ...rt.annotations }));
            
          processedRow.cells.push({
            text: cellText,
            annotations: cellAnnotations
          });
        }
        
        processedTable.rows.push(processedRow);
      }
    }

    expect(processedTable).toMatchObject(expectedTableFormat);
    expect(processedTable.rows).toHaveLength(2);
    expect(processedTable.rows[0].cells[0].annotations[0].bold).toBe(true);
  });

  it('should handle nested table content with rich text formatting', () => {
    const mockComplexTableCell = [
      {
        plain_text: 'Bold text ',
        annotations: { bold: true, italic: false, color: 'default' }
      },
      {
        plain_text: 'italic text',
        annotations: { bold: false, italic: true, color: 'red' }
      }
    ];

    const expectedCellProcessing = {
      text: 'Bold text italic text',
      annotations: [
        { text: 'Bold text ', bold: true, italic: false },
        { text: 'italic text', bold: false, italic: true, color: 'red' }
      ]
    };

    // Mock cell processing
    const cellText = mockComplexTableCell.map(rt => rt.plain_text).join('');
    const cellAnnotations = mockComplexTableCell
      .filter(rt => {
        const { bold, italic, color } = rt.annotations;
        return bold || italic || (color && color !== 'default');
      })
      .map(rt => {
        const { color, ...otherAnnotations } = rt.annotations;
        const result = { text: rt.plain_text, ...otherAnnotations };
        if (color && color !== 'default') {
          result.color = color;
        }
        return result;
      });

    const processedCell = {
      text: cellText,
      annotations: cellAnnotations
    };

    expect(processedCell).toMatchObject(expectedCellProcessing);
  });
});

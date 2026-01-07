import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  forwardRef
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Subject } from 'rxjs';

@Component({
  selector: 'v6-expandable-row-table',
  template: `
    <v6-table
      style="width: 100%; height: 300px"
      [tableConfig]="v6TableOptions"
      (gridReady)="onGridReady()">
    </v6-table>
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => V6ExpandableRowTableControl),
      multi: true
    }
  ]
})
export class V6ExpandableRowTableControl
  implements OnInit, OnDestroy, ControlValueAccessor {

  /* -------------------------------
   * INPUT FORM JSON
   * ------------------------------- */
  @Input() config!: any;

  /* -------------------------------
   * GRID STATE
   * ------------------------------- */
  v6TableOptions: any;
  rowData: any[] = [];

  private destroy$ = new Subject<void>();

  /* -------------------------------
   * CVA (minimal – write only)
   * ------------------------------- */
  private onChange = (_: any) => {};
  private onTouched = () => {};

  writeValue(_: any): void {}
  registerOnChange(fn: any): void { this.onChange = fn; }
  registerOnTouched(fn: any): void { this.onTouched = fn; }
  setDisabledState(_: boolean): void {}

  /* -------------------------------
   * LIFECYCLE
   * ------------------------------- */
  ngOnInit(): void {
    // Step 1: Load data (mock for now)
    const backendResponse = this.getMockBackendResponse();

    // Step 2: Build tree rows
    this.rowData = this.buildTreeRowsFromBackend(backendResponse);

    // Step 3: Build grid
    this.buildGrid();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onGridReady(): void {
    // nothing special needed
  }

  /* =====================================================
   * CORE LOGIC
   * ===================================================== */

  /**
   * Converts backend response into TREE ROWS
   * This is the most important function
   */
  private buildTreeRowsFromBackend(response: any[]): any[] {
    const rows: any[] = [];

    response.forEach((item: any) => {
      const accountNumber = item.values.ACCOUNT;

      // MASTER ROW (Account)
      rows.push({
        ACCT_NUMBER: accountNumber,
        __path: [accountNumber]
      });

      // DETAIL ROWS
      (item.values.details ?? []).forEach(
        (detail: any, index: number) => {
          rows.push({
            PRCS_TYPE: detail.PRCS_TYPE,
            ADRS_TYPE: detail.ADRS_TYPE,
            ADRS_DATA: detail.ADRS_DATA,
            __path: [accountNumber, `detail-${index}`]
          });
        }
      );
    });

    return rows;
  }

  /**
   * Grid configuration
   */
  private buildGrid(): void {
    this.v6TableOptions = {
      options: {
        rowData: this.rowData,

        treeData: true,
        getDataPath: (row: any) => row.__path,

        autoGroupColumnDef: {
          headerName: 'Account Number',
          field: 'ACCT_NUMBER',
          cellRendererParams: {
            suppressCount: true
          }
        },

        columnDefs: [
          { field: 'ACCT_NUMBER', hide: true },
          { field: 'PRCS_TYPE', headerName: 'Process Type' },
          { field: 'ADRS_TYPE', headerName: 'Address Type' },
          { field: 'ADRS_DATA', headerName: 'Address Data' }
        ],

        defaultColDef: {
          flex: 1,
          sortable: true,
          filter: true,
          resizable: true
        },

        groupDefaultExpanded: 0,   // collapsed by default
        animateRows: true
      }
    };
  }

  /* =====================================================
   * MOCK BACKEND (TEMP)
   * ===================================================== */

  private getMockBackendResponse(): any[] {
    return [
      {
        tableName: 'TAM307_ACCT',
        values: {
          ACCOUNT: '2124253',
          details: [
            {
              PRCS_TYPE: 'ABC',
              ADRS_TYPE: 'FGH',
              ADRS_DATA: 'SDF'
            },
            {
              PRCS_TYPE: 'SDF',
              ADRS_TYPE: 'WER',
              ADRS_DATA: 'TYU'
            }
          ]
        },
        childRows: []
      },
      {
        tableName: 'TAM307_ACCT',
        values: {
          ACCOUNT: '2323234',
          details: [
            {
              PRCS_TYPE: 'XYZ',
              ADRS_TYPE: 'BIC',
              ADRS_DATA: 'DATA1'
            }
          ]
        },
        childRows: []
      }
    ];
  }
}

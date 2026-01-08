import {
  Component,
  forwardRef,
  Input,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { startWith } from 'rxjs/operators';
import { GridApi, GridReadyEvent } from 'ag-grid-community';

import {
  V6TableFactory,
  V6TableModule
} from '@v6/v6-table';

import { ReactiveFormsService } from '../../services/reactive-forms.service';

@Component({
  selector: 'app-v6-expandable-row-table',
  standalone: true,
  templateUrl: './v6-expandable-row-table.control.html',
  styleUrls: ['./v6-expandable-row-table.control.scss'],
  imports: [V6TableModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => V6ExpandableRowTableControl),
      multi: true
    }
  ]
})
export class V6ExpandableRowTableControl
  implements ControlValueAccessor, OnChanges {

  @Input() config!: any;

  gridApi!: GridApi;
  v6TableOptions: any;

  private masterFormData: any[] = [];
  private onChange = (_: any) => {};
  private onTouched = () => {};

  constructor(private formService: ReactiveFormsService) {}

  // --------------------------------------------------
  // Lifecycle
  // --------------------------------------------------

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['config'] && this.config) {
      this.subscribeToMasterFormData();
      this.buildGrid(); // build ONCE
    }
  }

  // --------------------------------------------------
  // Master form data subscription
  // --------------------------------------------------

  private subscribeToMasterFormData(): void {
    const source = this.config.masterDataSource;

    if (source?.type !== 'FORM') {
      this.masterFormData = [];
      this.updateGridData();
      return;
    }

    this.formService
      .getFieldValueChanges(source.formSource.fieldName)
      .pipe(
        startWith(
          this.formService.getFieldValue(source.formSource.fieldName)
        )
      )
      .subscribe((data: any[]) => {
        if (!Array.isArray(data)) {
          this.masterFormData = [];
          this.updateGridData();
          return;
        }

        const filter = source.formSource.filter;
        this.masterFormData = filter
          ? data.filter(
              row => row[filter.field] === filter.value
            )
          : data;

        this.updateGridData();
      });
  }

  // --------------------------------------------------
  // Grid configuration (ONLY ONCE)
  // --------------------------------------------------

  private buildGrid(): void {
    if (!this.config?.tableHeaders) return;

    const columnDefs = this.config.tableHeaders.map((h: any) => ({
      headerName: h.headerName,
      field: h.field,
      sortable: true,
      filter: true,
      resizable: true,
      cellRenderer:
        h.cellRenderer === 'group'
          ? 'agGroupCellRenderer'
          : undefined
    }));

    this.v6TableOptions = {
      options: {
        ...V6TableFactory.defaultClientSideGridOptions(),

        treeData: true,
        getDataPath: (data: any) => data.__path, // ✅ REQUIRED

        columnDefs,

        autoGroupColumnDef: {
          headerName: 'Account Number',
          field: 'ACCT_NUMBER', // ✅ MATCHES ROW DATA
          cellRendererParams: {
            suppressCount: true
          }
        },

        defaultColDef: {
          sortable: true,
          filter: true,
          resizable: true
        },

        animateRows: true
      }
    };
  }

  // --------------------------------------------------
  // Update grid data dynamically
  // --------------------------------------------------

  private updateGridData(): void {
    if (!this.gridApi) return;

    const rowData = this.flattenTreeRows();
    this.gridApi.setRowData(rowData);
  }

  // --------------------------------------------------
  // Tree row builder
  // --------------------------------------------------

  private flattenTreeRows(): any[] {
    const rows: any[] = [];

    const mockDetails = [
      { PRCS_TYPE: 'ABC', ADRS_TYPE: 'FGH', ADRS_DATA: 'SDF' },
      { PRCS_TYPE: 'ABC', ADRS_TYPE: 'FGH', ADRS_DATA: 'SDF' },
      { PRCS_TYPE: 'ABC', ADRS_TYPE: 'FGH', ADRS_DATA: 'SDF' }
    ];

    this.masterFormData.forEach((acct: any) => {
      const accountNumber = acct.AcctNumber;

      // MASTER ROW
      rows.push({
        ACCT_NUMBER: accountNumber,
        __path: [accountNumber]
      });

      // CHILD ROWS
      mockDetails.forEach((detail: any, index: number) => {
        rows.push({
          PRCS_TYPE: detail.PRCS_TYPE,
          ADRS_TYPE: detail.ADRS_TYPE,
          ADRS_DATA: detail.ADRS_DATA,
          __path: [accountNumber, `detail-${index}`]
        });
      });
    });

    return rows;
  }

  // --------------------------------------------------
  // ControlValueAccessor
  // --------------------------------------------------

  writeValue(_: any): void {}

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(_: boolean): void {}

  // --------------------------------------------------
  // Grid events
  // --------------------------------------------------

  onGridReady(params: GridReadyEvent): void {
    this.gridApi = params.api;
    this.updateGridData();
  }

  onFirstDataRendered(): void {
    if (!this.gridApi) return;

    const rootNodes: any[] = [];

    this.gridApi.forEachNode((node: any) => {
      if (node.level === 0) {
        rootNodes.push(node);
      }
    });

    // Auto expand if only one account
    if (rootNodes.length === 1) {
      rootNodes[0].setExpanded(true);
    }
  }
}

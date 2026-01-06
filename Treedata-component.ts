import { Component, Input, OnInit } from '@angular/core';
import { ReactiveFormService } from '../services/reactive-form.service';
import { V6TableFactory } from '../v6-table/v6-table.factory';

@Component({
  selector: 'v6-expandable-row-table',
  templateUrl: './v6-expandable-row-table.control.html'
})
export class V6ExpandableRowTableControl implements OnInit {

  @Input() config!: any;

  v6TableOptions: any;

  private masterData: any[] = [];

  constructor(private formService: ReactiveFormService) {}

  ngOnInit(): void {
    this.loadMasterDataFromForm();
  }

  // --------------------------------------------------
  // STEP 1: READ MASTER DATA FROM CENTRAL FORM
  // --------------------------------------------------
  private loadMasterDataFromForm(): void {
    const source = this.config.masterDataSource;

    this.formService
      .getValueChanges(source.formSource.fieldName)
      .subscribe((data: any[]) => {

        if (!Array.isArray(data)) {
          this.masterData = [];
          this.buildGrid();
          return;
        }

        const filter = source.formSource.filter;

        this.masterData = filter
          ? data.filter(d => d[filter.field] === filter.value)
          : data;

        this.buildGrid();
      });
  }

  // --------------------------------------------------
  // STEP 2: BUILD GRID CONFIG (TREE DATA)
  // --------------------------------------------------
  private buildGrid(): void {
    const columnDefs = this.config.masterRowHeaders.map((h: any) => ({
      headerName: h.headerName,
      field: h.field,
      cellRenderer: h.cellRenderer === 'group'
        ? 'agGroupCellRenderer'
        : undefined
    }));

    this.v6TableOptions = {
      options: {
        ...V6TableFactory.defaultClientSideGridOptions(),

        treeData: true,

        columnDefs,

        autoGroupColumnDef: {
          headerName: 'Account Number',
          field: 'ACCT_NUMBER',
          cellRendererParams: {
            suppressCount: true
          }
        },

        getDataPath: (data: any) => data.__path,

        rowData: this.flattenTreeRows(),

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
  // STEP 3: FLATTEN MASTER → CHILD ROWS
  // --------------------------------------------------
  private flattenTreeRows(): any[] {
    const rows: any[] = [];

    this.masterData.forEach((acct: any) => {
      // MASTER ROW
      rows.push({
        ACCT_NUMBER: acct.acctNumber ?? acct.ACCT_NUMBER,
        __path: [acct.acctNumber ?? acct.ACCT_NUMBER]
      });

      // DETAIL ROWS (EMPTY FOR NOW – UI ONLY)
      // later this will come from API
      (acct.details ?? []).forEach((detail: any, index: number) => {
        rows.push({
          PRCS_TYPE: detail.PRCS_TYPE,
          ADRS_TYPE: detail.ADRS_TYPE,
          ADRS_DATA: detail.ADRS_DATA,
          __path: [
            acct.acctNumber ?? acct.ACCT_NUMBER,
            `detail-${index}`
          ]
        });
      });
    });

    return rows;
  }

  // --------------------------------------------------
  // OPTIONAL EVENTS
  // --------------------------------------------------
  onGridReady(_: any) {}
  onFirstDataRendered() {}
}

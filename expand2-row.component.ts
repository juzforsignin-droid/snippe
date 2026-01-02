import { Component, Input, OnInit } from '@angular/core';
import { GridApi, GridReadyEvent, ColDef } from 'ag-grid-community';
import { ExpandableRowTableService } from './expandable-row-table.service';
import { ReactiveFormService } from '../services/reactive-form.service';

@Component({
  selector: 'app-expandable-row-table',
  templateUrl: './expandable-row-table.component.html'
})
export class ExpandableRowTableComponent implements OnInit {

  @Input() config!: any; // JSON config only

  gridApi!: GridApi;

  rowData: any[] = [];
  masterColumnDefs: ColDef[] = [];
  detailCellRendererParams!: any;

  detailDataMap = new Map<string, any[]>();

  defaultColDef: ColDef = {
    flex: 1,
    sortable: true,
    filter: true
  };

  constructor(
    private formService: ReactiveFormService,
    private tableService: ExpandableRowTableService
  ) {}

  // ------------------------------------------------------

  ngOnInit(): void {
    this.buildMasterColumns();
    this.buildDetailGrid();
    this.loadAccountsFromForm();
    this.callApiWithOpenAccounts();
  }

  onGridReady(params: GridReadyEvent) {
    this.gridApi = params.api;
  }

  onFirstDataRendered() {
    if (
      this.config.expandBehavior?.expandByDefaultIfSingleRow &&
      this.rowData.length === 1
    ) {
      this.gridApi.forEachNode(node => node.setExpanded(true));
    }
  }

  // ------------------------------------------------------
  // STEP A — BUILD MASTER COLUMNS FROM JSON
  // ------------------------------------------------------

  private buildMasterColumns() {
    this.masterColumnDefs = this.config.masterRowHeaders.map((h: any) => ({
      headerName: h.headerName,
      field: h.field,
      cellRenderer: h.cellRenderer === 'group'
        ? 'agGroupCellRenderer'
        : undefined
    }));
  }

  // ------------------------------------------------------
  // STEP B — BUILD DETAIL GRID FROM JSON
  // ------------------------------------------------------

  private buildDetailGrid() {
    this.detailCellRendererParams = {
      detailGridOptions: {
        columnDefs: this.config.detailRowHeaders.map((h: any) => ({
          headerName: h.headerName,
          field: h.field,
          flex: 1
        })),
        defaultColDef: { flex: 1 }
      },
      getDetailRowData: (params: any) => {
        const acct = params.data.ACCT_NUMBER;
        params.successCallback(this.detailDataMap.get(acct) || []);
      }
    };
  }

  // ------------------------------------------------------
  // STEP C — READ DATA FROM CENTRALIZED FORM
  // ------------------------------------------------------

  private loadAccountsFromForm() {
    const accounts = this.formService.getValue('accounts') || [];

    const openAccounts = accounts.filter(
      (acc: any) => acc.status === 'OPEN'
    );

    this.rowData = openAccounts.map((acc: any) => ({
      ACCT_NUMBER: acc.acctNumber,
    //   LONG_TITLE: acc.longTitle,
    //   SHORT_TITLE: acc.shortTitle
    }));
  }

  // ------------------------------------------------------
  // STEP D — CALL API WITH OPEN ACCOUNT NUMBERS
  // ------------------------------------------------------

  private callApiWithOpenAccounts() {
    if (!this.rowData.length) return;

    const accountNumbers = this.rowData.map(r => r.ACCT_NUMBER);

    const payload = {
      accountNumbers
    };

    this.tableService.callApi(
      this.config.dataSource.url,
      this.config.dataSource.method,
      payload
    ).subscribe(response => {
      response.forEach((item: any) => {
        this.detailDataMap.set(
          item.ACCT_NUMBER,
          item[this.config.dataSource.responseMapping.detailArrayField]
        );
      });
    });
  }
}

import { Component, Input, OnInit } from '@angular/core';
import { ReactiveFormService } from '../services/reactive-form.service';
import { V6TableFactory } from '../v6-table/v6-table.factory';

@Component({
  selector: 'v6-expandable-row-table',
  templateUrl: './v6-expandable-row-table.control.html'
})
export class V6ExpandableRowTableControl implements OnInit {

  @Input() config!: any; // form JSON

  v6TableOptions: any;
  masterColumnDefs: any[] = [];
  detailColumnDefs: any[] = [];
  rowData: any[] = [];

  constructor(
    private formService: ReactiveFormService
  ) {}

  ngOnInit(): void {
    this.buildMasterHeaders();
    this.buildDetailHeaders();
    this.loadMasterDataFromForm();
    this.buildV6TableOptions();
  }

  // --------------------------------------------------
  // STEP 1: MASTER HEADERS FROM FORM JSON
  // --------------------------------------------------
  private buildMasterHeaders(): void {
    this.masterColumnDefs = this.config.masterRowHeaders.map((h: any) => ({
      headerName: h.headerName,
      field: h.field,
      sortable: h.sortable,
      filter: h.filter,
      enableRowGroup: h.enableRowGroup,
      cellRenderer: h.cellRenderer === 'group' ? 'group' : undefined
    }));
  }

  // --------------------------------------------------
  // STEP 2: DETAIL HEADERS FROM FORM JSON
  // --------------------------------------------------
  private buildDetailHeaders(): void {
    this.detailColumnDefs = this.config.detailRowHeaders.map((h: any) => ({
      headerName: h.headerName,
      field: h.field,
      filter: h.filter
    }));
  }

  // --------------------------------------------------
  // STEP 3: MASTER DATA FROM CENTRAL FORM
  // --------------------------------------------------
  private loadMasterDataFromForm(): void {
    const source = this.config.masterDataSource;

    if (source?.type !== 'FORM') {
      this.rowData = [];
      return;
    }

    const rawData =
      this.formService.getValue(source.formSource.fieldName) ?? [];

    // optional filtering (config-driven)
    const filter = source.formSource.filter;

    this.rowData = filter
      ? rawData.filter((row: any) => row[filter.field] === filter.value)
      : rawData;
  }

  // --------------------------------------------------
  // STEP 4: BUILD v6 GRID CONFIG
  // --------------------------------------------------
  private buildV6TableOptions(): void {
    this.v6TableOptions = {
      options: {
        ...V6TableFactory.defaultClientSideGridOptions(),

        masterDetail: true,
        rowData: this.rowData,
        columnDefs: this.masterColumnDefs,

        detailCellRendererParams: {
          detailGridOptions: {
            columnDefs: this.detailColumnDefs,
            defaultColDef: {
              sortable: true,
              filter: true,
              resizable: true
            }
          },
          // TEMP: no detail data yet
          getDetailRowData: (params: any) => {
            params.successCallback([]);
          }
        },

        defaultColDef: {
          sortable: true,
          filter: true,
          resizable: true
        },

        autoSizeStrategy: {
          type: 'fitGridWidth'
        }
      }
    };
  }

  // --------------------------------------------------
  // v6 GRID EVENTS (OPTIONAL)
  // --------------------------------------------------
  onGridReady(event: any): void {}

  onFirstDataRendered(): void {}
}

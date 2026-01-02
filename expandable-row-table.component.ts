import { Component, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { GridApi, GridReadyEvent, ColDef } from 'ag-grid-community';
import { ExpandableRowTableService } from './expandable-row-table.service';

@Component({
  selector: 'app-expandable-row-table',
  templateUrl: './expandable-row-table.component.html'
})
export class ExpandableRowTableComponent implements OnInit {

  @Input() config!: any;          // JSON config
  @Input() parentForm!: FormGroup;

  gridApi!: GridApi;

  rowData: any[] = [];
  detailDataMap = new Map<any, any[]>();

  masterColumnDefs: ColDef[] = [];
  detailCellRendererParams!: any;

  defaultColDef: ColDef = {
    flex: 1,
    sortable: true,
    filter: true
  };

  constructor(private tableService: ExpandableRowTableService) {}

  ngOnInit(): void {
    this.buildMasterColumns();
    this.buildDetailGrid();
    this.loadMasterRows();
    this.callApiAndCacheData();
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

  // ------------------ BUILD MASTER COLUMNS ------------------

  private buildMasterColumns() {
    this.masterColumnDefs = this.config.masterRowHeaders.map((h: any) => ({
      headerName: h.headerName,
      field: h.field,
      sortable: h.sortable,
      filter: h.filter,
      enableRowGroup: h.enableRowGroup,
      cellRenderer: h.cellRenderer === 'group'
        ? 'agGroupCellRenderer'
        : undefined
    }));
  }

  // ------------------ BUILD DETAIL GRID ------------------

  private buildDetailGrid() {
    this.detailCellRendererParams = {
      detailGridOptions: {
        columnDefs: this.config.detailRowHeaders.map((h: any) => ({
          headerName: h.headerName,
          field: h.field,
          filter: h.filter,
          flex: 1
        })),
        defaultColDef: { flex: 1 }
      },
      getDetailRowData: (params: any) => {
        const keyField = this.config.dataSource.responseMapping.groupBy;
        const key = params.data[keyField];
        params.successCallback(this.detailDataMap.get(key) || []);
      }
    };
  }

  // ------------------ MASTER ROW DATA ------------------

  private loadMasterRows() {
    const groupByField = this.config.dataSource.responseMapping.groupBy;
    const values = this.parentForm.get(groupByField)?.value || [];

    this.rowData = values.map((v: any) => ({
      [groupByField]: v
    }));
  }

  // ------------------ API CALL & CACHE ------------------

  private callApiAndCacheData() {
    if (this.config.dataSource.loadStrategy !== 'eager') return;

    const payload = this.buildPayloadFromForm();

    this.tableService.callApi(
      this.config.dataSource.url,
      this.config.dataSource.method,
      payload
    ).subscribe(response => {
      response.forEach((item: any) => {
        const key = item[this.config.dataSource.responseMapping.groupBy];
        this.detailDataMap.set(
          key,
          item[this.config.dataSource.responseMapping.detailArrayField]
        );
      });
    });
  }

  // ------------------ PAYLOAD BUILDER ------------------

  private buildPayloadFromForm(): any {
    const payload: any = {};

    Object.entries(this.config.dataSource.request.payloadMapping)
      .forEach(([payloadKey, map]: any) => {
        payload[payloadKey] = this.parentForm.get(map.formField)?.value;
      });

    return payload;
  }
}

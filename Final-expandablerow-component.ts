import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  forwardRef
} from '@angular/core';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR
} from '@angular/forms';
import { GridApi, GridReadyEvent, ColDef } from 'ag-grid-community';
import { ExpandableRowTableService } from './expandable-row-table.service';
import { ReactiveFormService } from '../services/reactive-form.service';
import { Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

@Component({
  selector: 'app-expandable-row-table',
  templateUrl: './expandable-row-table.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ExpandableRowTableComponent),
      multi: true
    }
  ]
})
export class ExpandableRowTableComponent
  implements OnInit, OnDestroy, ControlValueAccessor {

  @Input() config!: any;

  gridApi!: GridApi;

  rowData: any[] = [];
  masterColumnDefs: ColDef[] = [];
  detailCellRendererParams!: any;

  // masterKeyValue -> values object
  detailDataMap = new Map<any, any>();

  // ---- Error boundary & state ----
  isLoading = false;
  errorMessage?: string;

  defaultColDef: ColDef = {
    flex: 1,
    sortable: true,
    filter: true
  };

  // ---- CVA (emit-only) ----
  private onChange: (_: any) => void = () => {};
  private onTouched: () => void = () => {};

  // ---- subscriptions ----
  private formSub?: Subscription;

  constructor(
    private formService: ReactiveFormService,
    private tableService: ExpandableRowTableService
  ) {}

  // ------------------------------------------------------
  // CVA (NO-OP writeValue)
  // ------------------------------------------------------

  writeValue(_: any): void {}

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  // ------------------------------------------------------
  // LIFECYCLE
  // ------------------------------------------------------

  ngOnInit(): void {
    this.buildMasterColumns();
    this.buildDetailGrid();
    this.loadMasterRows();
    this.registerDebouncedRefresh();
  }

  ngOnDestroy(): void {
    this.formSub?.unsubscribe();
  }

  onGridReady(params: GridReadyEvent) {
    this.gridApi = params.api;
  }

  onFirstDataRendered() {
    if (
      this.config.expandBehavior?.expandByDefaultIfSingleRow &&
      this.rowData.length === 1
    ) {
      this.gridApi.forEachNode(n => n.setExpanded(true));
    }
  }

  // ------------------------------------------------------
  // STEP A — MASTER COLUMNS
  // ------------------------------------------------------

  private buildMasterColumns() {
    this.masterColumnDefs = this.config.masterRowHeaders.map((h: any) => ({
      headerName: h.headerName,
      field: h.field,
      sortable: h.sortable,
      filter: h.filter,
      cellRenderer: h.cellRenderer === 'group'
        ? 'agGroupCellRenderer'
        : undefined
    }));
  }

  // ------------------------------------------------------
  // STEP B — DETAIL GRID
  // ------------------------------------------------------

  private buildDetailGrid() {
    const masterKey =
      this.config.service.responseMapping.masterKeyField;

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
        const key = params.data[masterKey];
        const values = this.detailDataMap.get(key);
        params.successCallback(values ? [values] : []);
      }
    };
  }

  // ------------------------------------------------------
  // STEP C — LOAD MASTER ROWS
  // ------------------------------------------------------

  private loadMasterRows() {
    const source = this.config.masterDataSource;
    if (!source?.type) return;

    if (source.type === 'FORM') {
      this.loadFromForm(source);
    }

    if (source.type === 'API') {
      this.loadFromApi(source);
    }
  }

  private loadFromForm(source: any) {
    const masterKey =
      this.config.service.responseMapping.masterKeyField;

    let rows =
      this.formService.getValue(source.formSource.fieldName) || [];

    const filter = source.formSource.filter;
    if (filter?.operator === 'EQUALS') {
      rows = rows.filter((r: any) => r[filter.field] === filter.value);
    }

    this.rowData = rows.map((r: any) => ({
      [masterKey]: r[masterKey]
    }));

    this.loadDetailDelta();
  }

  private loadFromApi(source: any) {
    const masterKey =
      this.config.service.responseMapping.masterKeyField;

    this.isLoading = true;
    this.errorMessage = undefined;

    this.tableService.callApi(source.url, source.method)
      .subscribe({
        next: res => {
          const records =
            res[source.responseMapping.recordsField] || [];

          this.rowData = records.map((r: any) => ({
            [masterKey]: r[source.responseMapping.masterKeyField]
          }));

          this.isLoading = false;
          this.loadDetailDelta();
        },
        error: () => {
          this.isLoading = false;
          this.errorMessage = 'Failed to load master rows';
        }
      });
  }

  // ------------------------------------------------------
  // STEP D — PARTIAL RELOAD (DELTA FETCH)
  // ------------------------------------------------------

  private loadDetailDelta() {
    const masterKey =
      this.config.service.responseMapping.masterKeyField;

    const currentKeys = this.rowData.map(r => r[masterKey]);
    const existingKeys = Array.from(this.detailDataMap.keys());

    const newKeys = currentKeys.filter(
      k => !existingKeys.includes(k)
    );

    if (!newKeys.length) return;

    this.fetchDetail(newKeys);
  }

  // ------------------------------------------------------
  // STEP E — DETAIL API CALL (ERROR BOUNDARY)
  // ------------------------------------------------------

  private fetchDetail(keys: any[]) {
    this.isLoading = true;
    this.errorMessage = undefined;

    const payload = {
      [this.config.service.columnValue]: keys
    };

    this.tableService.callApi(
      this.config.service.url,
      this.config.service.method,
      payload
    ).subscribe({
      next: (response: any[]) => {
        const masterKey =
          this.config.service.responseMapping.masterKeyField;

        response.forEach(r => {
          const values =
            r[this.config.service.responseMapping.valuesField];
          const key = values?.[masterKey];
          if (key !== undefined) {
            this.detailDataMap.set(key, values);
          }
        });

        this.isLoading = false;
        this.onChange(this.detailDataMap);
        this.onTouched();
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'Failed to load detail data';
      }
    });
  }

  // ------------------------------------------------------
  // STEP F — DEBOUNCED REFRESH
  // ------------------------------------------------------

  private registerDebouncedRefresh() {
    const source = this.config.masterDataSource;
    if (source?.type !== 'FORM') return;

    this.formSub = this.formService
      .valueChanges(source.formSource.fieldName)
      .pipe(debounceTime(300))
      .subscribe(() => {
        this.loadMasterRows();
      });
  }

  // ------------------------------------------------------
  // RETRY (ERROR BOUNDARY)
  // ------------------------------------------------------

  retry() {
    this.errorMessage = undefined;
    this.loadMasterRows();
  }
}

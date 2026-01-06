import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  forwardRef
} from '@angular/core';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR
} from '@angular/forms';
import { ReactiveFormService } from '../services/reactive-form.service';
import { V6TableFactory } from '../v6-table/v6-table.factory';

@Component({
  selector: 'v6-expandable-row-table',
  templateUrl: './v6-expandable-row-table.control.html',
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

  /* ----------------------------------------------------
   * INPUT FROM DYNAMIC FORM ENGINE
   * ---------------------------------------------------- */
  @Input() config!: any;

  /* ----------------------------------------------------
   * v6 GRID CONFIG OBJECT
   * ---------------------------------------------------- */
  v6TableOptions: any;

  /* ----------------------------------------------------
   * INTERNAL STATE
   * ---------------------------------------------------- */
  private masterFormData: any[] = [];

  /* ----------------------------------------------------
   * CVA CALLBACKS (REQUIRED BY ANGULAR)
   * ---------------------------------------------------- */
  private onChange = (_: any) => {};
  private onTouched = () => {};

  constructor(
    private formService: ReactiveFormService
  ) {}

  /* ----------------------------------------------------
   * ANGULAR LIFECYCLE
   * ---------------------------------------------------- */

  ngOnChanges(changes: SimpleChanges): void {
    // Config arrives asynchronously from dynamic form
    if (changes['config'] && this.config) {
      this.initializeFromConfig();
    }
  }

  /* ----------------------------------------------------
   * STEP 1: INITIALIZE WHEN CONFIG ARRIVES
   * ---------------------------------------------------- */
  private initializeFromConfig(): void {
    this.subscribeToMasterFormData();
  }

  /* ----------------------------------------------------
   * STEP 2: READ MASTER DATA FROM CENTRAL FORM
   * ---------------------------------------------------- */
  private subscribeToMasterFormData(): void {
    const source = this.config.masterDataSource;

    if (source?.type !== 'FORM') {
      this.masterFormData = [];
      this.buildGrid();
      return;
    }

    this.formService
      .getValueChanges(source.formSource.fieldName)
      .subscribe((data: any[]) => {

        if (!Array.isArray(data)) {
          this.masterFormData = [];
          this.buildGrid();
          return;
        }

        // optional filter from JSON
        const filter = source.formSource.filter;

        this.masterFormData = filter
          ? data.filter(row => row[filter.field] === filter.value)
          : data;

        this.buildGrid();
      });
  }

  /* ----------------------------------------------------
   * STEP 3: BUILD v6 GRID CONFIG (TREE DATA)
   * ---------------------------------------------------- */
  private buildGrid(): void {
    if (!this.config?.masterRowHeaders) {
      return;
    }

    const columnDefs = this.config.masterRowHeaders.map((h: any) => ({
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

        /* ---- TREE MODE (single header row) ---- */
        treeData: true,
        getDataPath: (row: any) => row.__path,

        /* ---- COLUMNS ---- */
        columnDefs,

        autoGroupColumnDef: {
          headerName: 'Account Number',
          field: 'ACCT_NUMBER',
          cellRendererParams: {
            suppressCount: true
          }
        },

        /* ---- DATA ---- */
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

  /* ----------------------------------------------------
   * STEP 4: FLATTEN MASTER + DETAIL ROWS
   * ---------------------------------------------------- */
  private flattenTreeRows(): any[] {
    const rows: any[] = [];

    this.masterFormData.forEach((acct: any) => {
      const accountNumber = acct.acctNumber ?? acct.ACCT_NUMBER;

      // MASTER ROW
      rows.push({
        ACCT_NUMBER: accountNumber,
        __path: [accountNumber]
      });

      // DETAIL ROWS (empty for now – UI only)
      (acct.details ?? []).forEach((detail: any, index: number) => {
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

  /* ----------------------------------------------------
   * CONTROL VALUE ACCESSOR (MINIMAL, SAFE)
   * ---------------------------------------------------- */
  writeValue(_: any): void {
    // intentionally empty – this control is read-only for now
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(_: boolean): void {}

  /* ----------------------------------------------------
   * OPTIONAL GRID EVENTS
   * ---------------------------------------------------- */
  onGridReady(_: any) {}
  onFirstDataRendered() {}
}

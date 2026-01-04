export class ExpandableRowTableConfig {

  // ---------------- Basic metadata ----------------
  fieldName!: string;
  fieldId!: string;
  fieldType!: string;
  dataDestination?: string;
  prePopulateData?: boolean;

  // ---------------- Expand behavior ----------------
  expandBehavior!: {
    expandByDefaultIfSingleRow: boolean;
    allowMultipleExpanded: boolean;
  };

  // ---------------- Master grid headers ----------------
  masterRowHeaders!: Array<{
    headerName: string;
    field: string;
    enableRowGroup?: boolean;
    sortable?: boolean;
    filter?: boolean;
    cellRenderer?: string;
  }>;

  // ---------------- Detail grid headers ----------------
  detailRowHeaders!: Array<{
    headerName: string;
    field: string;
    filter?: boolean;
  }>;

  // ---------------- Service configuration ----------------
  service!: {
    clientIdentifier?: string;
    target?: string;
    virtualTableName?: string;
    columnName?: string;
    columnValue?: string;

    selectColumns?: string[];

    method: 'GET' | 'POST';
    url: string;

    responseMapping: {
      tableNameField: string;
      valuesField: string;
      childRowsField: string;
    };
  };

  // ---------------- Constructor ----------------
  constructor(config: any) {

    // basic metadata
    this.fieldName = config.fieldName;
    this.fieldId = config.fieldId;
    this.fieldType = config.fieldType;
    this.dataDestination = config.dataDestination;
    this.prePopulateData = config.prePopulateData;

    // expand behavior
    this.expandBehavior = config.expandBehavior;

    // grid headers
    this.masterRowHeaders = config.masterRowHeaders || [];
    this.detailRowHeaders = config.detailRowHeaders || [];

    // service configuration
    this.service = {
      clientIdentifier: config.service?.clientIdentifier,
      target: config.service?.target,
      virtualTableName: config.service?.virtualTableName,
      columnName: config.service?.columnName,
      columnValue: config.service?.columnValue,
      selectColumns: config.service?.selectColumns || [],
      method: config.service?.method,
      url: config.service?.url,
      responseMapping: {
        tableNameField: config.service?.responseMapping?.tableNameField,
        valuesField: config.service?.responseMapping?.valuesField,
        childRowsField: config.service?.responseMapping?.childRowsField
      }
    };
  }
}

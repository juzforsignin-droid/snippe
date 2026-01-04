export class ExpandableRowTableConfig {

  fieldName!: string;
  fieldId!: string;
  fieldType!: string;

  expandBehavior!: {
    expandByDefaultIfSingleRow?: boolean;
    allowMultipleExpanded?: boolean;
  };

  masterDataSource!: {
    type: 'FORM' | 'API';
    formSource?: {
      fieldName: string;
      filter?: {
        field: string;
        operator: string;
        value: any;
      };
    };
    url?: string;
    method?: string;
    responseMapping?: {
      recordsField?: string;
      masterKeyField?: string;
    };
  };

  masterRowHeaders!: Array<{
    headerName: string;
    field: string;
    enableRowGroup?: boolean;
    sortable?: boolean;
    filter?: boolean;
    cellRenderer?: string;
  }>;

  detailRowHeaders!: Array<{
    headerName: string;
    field: string;
    filter?: boolean;
  }>;

  service!: {
    clientIdentifier?: string;
    target?: string;
    virtualTableName?: string;
    columnName?: string;
    columnValue: string;
    selectColumns?: string[];
    method: string;
    url: string;
    responseMapping: {
      masterKeyField: string;
      valuesField: string;
      childRowsField?: string;
    };
  };

  constructor(config: any) {
    this.fieldName = config.fieldName;
    this.fieldId = config.fieldId;
    this.fieldType = config.fieldType;

    this.expandBehavior = config.expandBehavior ?? {};

    this.masterDataSource = config.masterDataSource;

    this.masterRowHeaders = config.masterRowHeaders ?? [];
    this.detailRowHeaders = config.detailRowHeaders ?? [];

    this.service = config.service;
  }
}

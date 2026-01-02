export class ExpandableRowTableConfig {

  expandBehavior: {
    expandByDefaultIfSingleRow: boolean;
  };

  dataSource: {
    url: string;
    method: 'GET' | 'POST';
    responseMapping: {
      detailArrayField: string;
    };
  };

  masterRowHeaders: Array<{
    headerName: string;
    field: string;
    cellRenderer?: string;
  }>;

  detailRowHeaders: Array<{
    headerName: string;
    field: string;
  }>;

  constructor(config: {
    expandBehavior: {
      expandByDefaultIfSingleRow: boolean;
    };
    dataSource: {
      url: string;
      method: 'GET' | 'POST';
      responseMapping: {
        detailArrayField: string;
      };
    };
    masterRowHeaders: Array<{
      headerName: string;
      field: string;
      cellRenderer?: string;
    }>;
    detailRowHeaders: Array<{
      headerName: string;
      field: string;
    }>;
  }) {
    this.expandBehavior = config.expandBehavior;
    this.dataSource = config.dataSource;
    this.masterRowHeaders = config.masterRowHeaders;
    this.detailRowHeaders = config.detailRowHeaders;
  }
}

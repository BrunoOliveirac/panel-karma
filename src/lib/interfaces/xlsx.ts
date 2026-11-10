export interface IExportParams {
  locale: string;
  t: (key: string) => string;
}

export interface ExportCurrentPageParams<T> extends IExportParams {
  data: T[];
}

export interface ExportSelectedParams extends IExportParams {
  dataIds: string[];
}

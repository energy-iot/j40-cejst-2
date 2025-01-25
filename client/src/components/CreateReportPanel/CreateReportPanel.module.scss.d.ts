declare namespace CreateReportPanelNamespace {
    export interface ICreateReportPanelScss {
      createReportButton: string;
      createReportContainer: string;
      startOver: string;
      tractListContainer: string;
      tractListItem: string;
      tractListItemDelete: string;
      tractListItemHighlight: string;
    }
  }

declare const CreateReportPanelScssModule: CreateReportPanelNamespace.ICreateReportPanelScss & {
    /** WARNING: Only available when `css-loader` is used without `style-loader` or `mini-css-extract-plugin` */
    locals: CreateReportPanelNamespace.ICreateReportPanelScss;
  };

  export = CreateReportPanelScssModule;

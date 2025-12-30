sap.ui.define([
    "sap/ui/core/Control"
], (Control) => {
    "use strict";

    return Control.extend("zpmchecklist.control.Table02", {
        metadata: {
            properties: {
                title: { type: "string", defaultValue: "Default Title" },
                showTitle: { type: "boolean", defaultValue: false }
            },
            aggregations: {
                headerToolbar: { type: "sap.m.Toolbar", multiple: false },
                column: { type: "sap.m.HBox", multiple: false },
                rows: { type: "sap.m.HBox", multiple: true, singularName: "row" }
            },
            defaultAggregation: "rows"
        },
        init: function () {
            Control.prototype.init.apply(this, arguments);
        },
        renderer: function (oRM, oControl) {
            oRM.write("<div class='bordered'");
            oRM.writeControlData(oControl);
            oRM.writeClasses();
            oRM.write(">");

            if (oControl.getHeaderToolbar()) {
                oRM.renderControl(oControl.getHeaderToolbar());
            } else if (oControl.getShowTitle()) {
                oRM.write("<div class='header-row bordered sapUiTinyMarginTopBottom'>");
                oRM.writeEscaped(oControl.getTitle());
                oRM.write("</div>");
            }
            // render Column
            const oColumn = oControl.getColumn();
            oRM.renderControl(oColumn);

            // // Render table header
            // oRM.write("<div class='table-row header-row'>");
            // var aColumns = oControl.getColumns();
            // // aColumns.forEach(function (oColumn) {
            // for (let oColumn of aColumns) {
            //     let iSpan = oColumn.getColSpan();
            //     let sHasSubcol = oColumn.getHasSubcol();
            //     let sIsSubcol = oColumn.getIsSubcol();
            //     if (iSpan > 1) {
            //         if (sHasSubcol == 'X') {
            //             oRM.write("<div class='header-sub-container'");
            //             oRM.writeAttribute("style", "flex:" + iSpan + ";");
            //             oRM.write(">");
            //             oRM.write("<div class='row-cell'>");
            //             oRM.renderControl(oColumn);
            //             oRM.write("</div>");
            //             oRM.write("<div class='col-sub-container'>");
            //             oControl._lastSpan = iSpan + 1;
            //             oControl._isSubColumn = true;
            //             continue;
            //         } else {
            //             oRM.write("<div class='row-cell'");
            //             oRM.writeAttribute("style", "flex:" + iSpan + ";");
            //             oRM.write(">");
            //             oRM.renderControl(oColumn);
            //             oRM.write("</div>");
            //             oControl._skipNextColumn = iSpan - 1;
            //         }
            //     } else {
            //         if (oControl._skipNextColumn > 0) {
            //             oControl._skipNextColumn -= 1;
            //         } else {
            //             oRM.write("<div class='row-cell'>");
            //             oRM.renderControl(oColumn);
            //             oRM.write("</div>");
            //         }
            //         if (sIsSubcol) {
            //             oControl._lastSpan -= 1;  
            //         }
            //         if (oControl._lastSpan == 1) {
            //             oRM.write("</div>"); // Close col-sub-container
            //             oRM.write("</div>"); // Close header-sub-container
            //             oControl._isSubColumn = false;
            //         }
            //     }
            // };
            // oRM.write("</div>");

            // Render table body
            // oRM.renderControl(oControl.getAggregation("rows"));
            var aRows = oControl.getRows();
            aRows.forEach(function (oRow) {
                oRM.renderControl(oRow);
            });

            oRM.write("</div>");
        }

        // _lastSpan: 0,
        // _isSubColumn: false,
        // _skipNextColumn: 0

    });
});
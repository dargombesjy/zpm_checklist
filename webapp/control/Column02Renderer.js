sap.ui.define([], function () {
    "use strict";

    var Column02Renderer = {
        apiVersion: 2,
        render: function (oRM, oControl) {
            // oRM.write("<div class='table-row'");
            // oRM.writeAttribute("role", "button");
            // oRM.writeControlData(oControl);
            // oRM.addClass("test");
            // oRM.writeClasses();
            // oRM.write(">")

            // oControl.getCells().forEach(function (oCell) {
            //     oRM.write("<div class='row-cell'>");
            //     oRM.renderControl(oCell);
            //     oRM.write("</div>");
            // });

            // oRM.write("</div>");
            // oRM.write("<div class='row-cell'>");
            // oRM.renderControl(oControl.getHeader());
            // oRM.write("</div>");
            // const aItems = oControl.getItems();
            // for (let oCell of aItems) {
            //     oRM.renderControl(oCell);
            // };
            oRM.renderControl(oControl.getAggregation("items"));
        }

    }

    return Column02Renderer;
});
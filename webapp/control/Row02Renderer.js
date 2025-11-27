sap.ui.define([], function () {
    "use strict";

    var Row02Renderer = {
        apiVersion: 2,
        render: function (oRM, oControl) {
            // oRM.write("<div class='table-row'");
            // // oRM.writeAttribute("role", "button");
            // // oRM.writeControlData(oControl);
            // // oRM.addClass("row01");
            // // oRM.writeClasses();
            // oRM.write(">")

            // const aItems = oControl.getItems();
            // for (let oCell of aItems) {
            //     oRM.renderControl(oCell);
            // };
            oRM.renderControl(oControl.getAggregation("items"));

            // oRM.write("</div>");
        }
        
    }

    return Row02Renderer;
});
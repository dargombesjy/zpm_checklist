sap.ui.define([
    "sap/m/HBox",
    // "sap/ui/core/Control",
    "zpmchecklist/control/Row02Renderer"
],(HBox, Row02Renderer) => {
    "use strict";

    return HBox.extend("zpmchecklist.control.Row02", {
        metadata: {
            properties: {
                flexBasis: { type: "sap.ui.core.CSSSize" },
                flexFrow: { type: "float" }
            },
            // aggregations: {
            //     cells: { type: "sap.ui.core.Control", multiple: true, singularName: "cell" }
            // },
            init: function () {
                HBox.prototype.init.apply(this, arguments);
                // this.addAggregation("items");
            },
            onBeforeRendering: function () {

            },
            onAfterRendering: {

            },
            onExit: function () {

            },
            renderer: Row02Renderer
        }
    });

});
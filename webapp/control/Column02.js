sap.ui.define([
    "sap/m/HBox",
    // "sap/ui/core/Control",
    "zpmchecklist/control/Column02Renderer"
],(HBox, Column02Renderer) => {
    "use strict";

    return HBox.extend("zpmchecklist.control.Column02", {
        metadata: {
            properties: {
                colSpan: { type: "int", defaultValue: 1 },
                hasSubcol: { type: "string", defaultValue: "" },
                isSubcol: { type: "string", defaultValue: "" }
            },
            // aggregations: {
            //     header: { type: "sap.ui.core.Control", multiple: false }
            // },
            init: function () {
                HBox.prototype.init.apply(this, arguments);
            },
            renderer: Column02Renderer
        }
    });

});